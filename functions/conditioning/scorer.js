// functions/conditioning/scorer.js
//
// AI scorer: takes a free-form transcript + RR type and produces a strict
// JSON object of condition scores (0-3) plus a low-confidence flag.
//
// Per spec §4 + §5 + §14:
//   - AI may interpret structure but may NOT invent missing elements.
//   - Vague input → low confidence, NOT inferred Adequate scores.
//   - "No Inference Rule" — if evidence is missing, score it 0.

'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const { getRrConfig, getConditionDefsForRr } = require('./rrConfig');

// Try Gemini models in order; if one is quota-exhausted (429), fall back to
// the next. If all Gemini models fail, fall back to Anthropic Claude.
const SCORER_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const MAX_SCORER_ATTEMPTS = 2;
const BASE_RETRY_DELAY_MS = 700;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableGeminiError = (error) => {
  const status = error && typeof error.status === 'number' ? error.status : null;
  return status === 429 || status === 500 || status === 503;
};

const buildSystemInstruction = () => `
You are a STRICT scorer for a leadership behavior conditioning system. Your
ONLY job is to extract evidence from a leader's description of a real-world
interaction and score predefined conditions.

ABSOLUTE RULES:
1. NEVER invent or infer evidence that is not explicitly present.
2. NEVER soften scores out of kindness. Vague language is NOT Adequate.
3. NEVER explain frameworks, give coaching, or suggest improvements.
4. Output ONLY valid JSON matching the schema requested. No prose.
5. Generic praise without specifics is NOT a Pass.
6. Implied standards do NOT count as Set Expectations.
7. Collaboration without an explicit ask is NOT a Request.

SCORING SCALE per condition:
  0 = Missing      — no evidence at all
  1 = Weak         — referenced but vague, generic, or implicit
  2 = Adequate     — present and specific enough to be useful
  3 = Strong       — explicit, observable, and unambiguous

LOW-CONFIDENCE FLAG:
  Set "lowConfidence": true if the input is too vague, too short, or lacks
  any clear structure to evaluate. When this flag is true, the system will
  treat the rep as Invalid and ask the leader for clarification — DO NOT
  try to score in that case (still output zeros).

OUTPUT SCHEMA (JSON):
  {
    "scores": { "<ConditionName>": 0|1|2|3, ... },
    "lowConfidence": boolean,
    "evidenceNotes": { "<ConditionName>": "short quote or brief note", ... }
  }

Return ONLY the JSON object. No markdown fences, no commentary.
`;

const buildUserPrompt = (rrType, transcript) => {
  const cfg = getRrConfig(rrType);
  const defs = getConditionDefsForRr(rrType);

  // Render each condition with its definition + 4-tier anchors.
  // Anchors give the model concrete decision rules instead of asking it
  // to interpret a generic 0-3 scale.
  const conditionBlocks = defs
    .map((d) => {
      const tag = d.critical ? ' [CRITICAL]' : '';
      const anchorLines = [3, 2, 1, 0]
        .map((tier) => {
          const a = d.anchors?.[tier];
          if (!a) return null;
          const label =
            tier === 3 ? 'Strong'
            : tier === 2 ? 'Adequate'
            : tier === 1 ? 'Weak'
            : 'Missing';
          return `    ${tier} = ${label}: ${a.criterion}\n        e.g. ${a.example}`;
        })
        .filter(Boolean)
        .join('\n');
      return `- ${d.name}${tag}\n    Definition: ${d.definition}\n${anchorLines}`;
    })
    .join('\n\n');

  return `
RR Type: ${cfg.code} (${cfg.name})
Rubric version: ${cfg.version || 'unversioned'}

Conditions to score (apply each anchor strictly):

${conditionBlocks}

Leader transcript:
"""
${transcript}
"""

For each condition, find the BEST evidence in the transcript and assign
the tier whose criterion is met. If no evidence, score 0.
Do NOT let an example tempt you into a tier when the transcript doesn't
actually meet that tier's criterion. The examples are illustrative only.

Set lowConfidence=true ONLY if the transcript is too short or too vague
to contain any scorable evidence at all. Otherwise score and return JSON.
`;
};

/**
 * Strip markdown fences and parse JSON, or return null.
 */
const safeJsonParse = (raw) => {
  if (typeof raw !== 'string') return null;
  let cleaned = raw.trim();
  // Remove ```json ... ``` fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

/**
 * Coerce/clamp scorer output into the strict shape the engine expects.
 * Anti-drift: any missing or invalid score becomes 0 (Missing).
 */
const normalizeScorerOutput = (rrType, raw) => {
  const cfg = getRrConfig(rrType);
  const scores = {};
  const evidenceNotes = {};
  const rawScores = (raw && raw.scores) || {};
  const rawNotes = (raw && raw.evidenceNotes) || {};
  for (const cond of cfg.conditions) {
    const v = rawScores[cond];
    scores[cond] =
      typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0;
    evidenceNotes[cond] =
      typeof rawNotes[cond] === 'string' ? rawNotes[cond] : '';
  }
  const lowConfidence = !!(raw && raw.lowConfidence);
  return { scores, evidenceNotes, lowConfidence };
};

/**
 * Score a transcript ONCE for a given RR type using Gemini, falling back
 * to Anthropic Claude if all Gemini models fail (e.g. quota exhausted).
 * Returns { scores, evidenceNotes, lowConfidence, rawText, rubricVersion }.
 *
 * For higher reliability use `scoreTranscript({ samples: 3 })` which calls
 * this multiple times and takes the median per condition.
 */
const scoreTranscriptOnce = async ({ rrType, transcript, apiKey, anthropicApiKey }) => {
  if (!apiKey && !anthropicApiKey) {
    throw new Error('No AI API key configured (need GEMINI_API_KEY or ANTHROPIC_API_KEY)');
  }
  const systemInstruction = buildSystemInstruction();
  const userPrompt = buildUserPrompt(rrType, transcript);
  let text = '';
  let lastError = null;

  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    outer: for (const modelName of SCORER_MODELS) {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          temperature: 0.2, // strict / deterministic
          responseMimeType: 'application/json',
        },
      });

      for (let attempt = 1; attempt <= MAX_SCORER_ATTEMPTS; attempt += 1) {
        try {
          const result = await model.generateContent(userPrompt);
          const response = await result.response;
          text = response.text();
          lastError = null;
          break outer;
        } catch (error) {
          lastError = error;
          // On 429, immediately try the next model (don't burn retries on the same exhausted quota).
          if (error && error.status === 429) {
            break;
          }
          if (!isRetryableGeminiError(error) || attempt === MAX_SCORER_ATTEMPTS) {
            // Non-retryable or out of attempts on this model — try next model.
            break;
          }
          await sleep(BASE_RETRY_DELAY_MS * attempt);
        }
      }
    }
  }

  // If Gemini didn't produce text, try Anthropic Claude as ultimate fallback.
  if (!text && anthropicApiKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        temperature: 0.2,
        system: systemInstruction,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const block = response && response.content && response.content[0];
      text = block && block.type === 'text' ? block.text : '';
      if (text) {
        lastError = null;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!text && lastError) {
    throw lastError;
  }

  const parsed = safeJsonParse(text);
  const cfg = getRrConfig(rrType);
  const rubricVersion = cfg.version || null;
  // If JSON parsing failed, treat as low-confidence so the engine returns
  // an Invalid result rather than scoring 0s as if they were extracted.
  if (!parsed) {
    return {
      scores: {},
      evidenceNotes: {},
      lowConfidence: true,
      rawText: text,
      rubricVersion,
    };
  }
  const normalized = normalizeScorerOutput(rrType, parsed);
  return { ...normalized, rawText: text, rubricVersion };
};

/**
 * Median of an array of integers (rounded down on ties).
 * Used by self-consistency consensus.
 */
const median = (nums) => {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.floor((sorted[mid - 1] + sorted[mid]) / 2);
};

/**
 * Combine N independent scoring runs into one consensus result.
 * - scores       : per-condition median across runs
 * - lowConfidence: majority of runs flagged it
 * - evidenceNotes: from the run whose scores are closest to the median
 *
 * Exposed for tests.
 */
const combineRuns = (rrType, runs) => {
  if (!runs.length) {
    return { scores: {}, evidenceNotes: {}, lowConfidence: true, rawText: '', rubricVersion: null };
  }
  const cfg = getRrConfig(rrType);
  const consensusScores = {};
  for (const cond of cfg.conditions) {
    consensusScores[cond] = median(runs.map((r) => r.scores?.[cond] ?? 0));
  }
  const lowConfidenceVotes = runs.filter((r) => r.lowConfidence).length;
  const lowConfidence = lowConfidenceVotes > runs.length / 2;

  // Pick the run whose total absolute deviation from the median is smallest;
  // its evidenceNotes are the most representative.
  let bestRun = runs[0];
  let bestDeviation = Infinity;
  for (const run of runs) {
    let dev = 0;
    for (const cond of cfg.conditions) {
      dev += Math.abs((run.scores?.[cond] ?? 0) - consensusScores[cond]);
    }
    if (dev < bestDeviation) {
      bestDeviation = dev;
      bestRun = run;
    }
  }

  return {
    scores: consensusScores,
    evidenceNotes: bestRun.evidenceNotes || {},
    lowConfidence,
    rawText: bestRun.rawText || '',
    rubricVersion: bestRun.rubricVersion || (cfg.version || null),
    samples: runs.length,
    lowConfidenceVotes,
  };
};

/**
 * Public scoring entry point. Optionally runs the scorer N times in parallel
 * and returns the median per condition (self-consistency).
 *
 * @param {object} args
 * @param {string} args.rrType
 * @param {string} args.transcript
 * @param {string} [args.apiKey]
 * @param {string} [args.anthropicApiKey]
 * @param {number} [args.samples=1]  Number of independent runs to combine.
 *                                    Use 3 for high-reliability scoring at
 *                                    3x AI cost. Use 1 for legacy behaviour.
 */
const scoreTranscript = async (args) => {
  const samples = Math.max(1, Math.floor(args.samples || 1));
  if (samples === 1) {
    return scoreTranscriptOnce(args);
  }
  // Run N independent scoring passes in parallel. Each pass uses the
  // same prompt at temperature 0.2 — the small remaining randomness is
  // exactly what self-consistency exploits to surface unstable scores.
  const runs = await Promise.all(
    Array.from({ length: samples }, () => scoreTranscriptOnce(args))
  );
  return combineRuns(args.rrType, runs);
};

module.exports = {
  scoreTranscript,
  scoreTranscriptOnce,
  combineRuns,
  median,
  // exposed for tests
  buildSystemInstruction,
  buildUserPrompt,
  safeJsonParse,
  normalizeScorerOutput,
};
