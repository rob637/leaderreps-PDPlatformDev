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
const { getRrConfig, getConditionDefsForRr, COURAGE_SIGNALS, COURAGE_SIGNAL_HINTS, normalizeStakes, VALID_STAKES } = require('./rrConfig');

// Try Gemini models in order; if one is quota-exhausted (429), fall back to
// the next. If all Gemini models fail, fall back to Anthropic Claude.
// Note: gemini-1.5-flash was retired in early 2026 and now returns 404.
const SCORER_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
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

STAKES (hidden, internal):
  Infer a stakes band that reflects how high-leverage this interaction
  was. This is NEVER shown to the user; it tunes coaching intensity only.
    low      — quick appreciation, minor follow-up, routine touch.
    moderate — standard coaching, baseline accountability moment.
    high     — accountability breakdown, repeated issue, strategic,
               high-visibility, behavioral standards, executive context.
  Provide a short "stakesRationale" (one phrase, internal only).

OUTPUT SCHEMA (JSON):
  {
    "scores": { "<ConditionName>": 0|1|2|3, ... },
    "lowConfidence": boolean,
    "stakes": "low" | "moderate" | "high",
    "stakesRationale": "short internal phrase",
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

  // RED-only: courage signals (Phase 4). Hidden behind-the-scenes flags
  // that surface retreat / softening / over-collaboration patterns and
  // force the engine into a sharpen (gap) case.
  const courageBlock =
    rrType === 'RED'
      ? `\n\nCOURAGE SIGNALS (RED only, internal — boolean per signal):\n` +
        COURAGE_SIGNALS.map(
          (s) => `  - ${s}: ${COURAGE_SIGNAL_HINTS[s]}`
        ).join('\n') +
        `\n\nRULES FOR COURAGE SIGNALS:\n` +
        `  1. DEFAULT is false for every signal. Most reps will have ALL signals false.\n` +
        `  2. A signal fires ONLY when the transcript literally shows BOTH halves of its\n` +
        `     definition (the triggering moment AND the leader's response).\n` +
        `  3. If the leader was direct, named the behavior, and held the standard —\n` +
        `     ALL signals stay false, regardless of how the conversation ended.\n` +
        `  4. A polite, measured, or empathetic tone is NOT a courage signal.\n` +
        `  5. A weak score on Behavior, Request, or Impact is NOT itself a courage\n` +
        `     signal — those are already captured by the condition scores.\n` +
        `  6. When uncertain, the signal is false.\n\n` +
        `Add a "courageSignals" object to the JSON output with each signal as a\n` +
        `boolean. Add a "courageEvidence" object mapping each FLAGGED signal to a\n` +
        `short verbatim phrase from the transcript that proves BOTH halves of the\n` +
        `definition. If you cannot produce that verbatim evidence, the signal is false.`
      : '';

  return `
RR Type: ${cfg.code} (${cfg.name})
Rubric version: ${cfg.version || 'unversioned'}

Conditions to score (apply each anchor strictly):

${conditionBlocks}
${courageBlock}

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

Also infer "stakes" (low | moderate | high) and a short "stakesRationale"
based on how high-leverage this interaction was (see system instruction).
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

  // Stakes (Phase 1)
  const stakes = normalizeStakes(raw && raw.stakes);
  const stakesRationale =
    raw && typeof raw.stakesRationale === 'string' ? raw.stakesRationale : '';

  // Courage signals (Phase 4 — RED only)
  let courageSignals = null;
  let courageEvidence = null;
  if (rrType === 'RED') {
    const rawCS = (raw && raw.courageSignals) || {};
    const rawCE = (raw && raw.courageEvidence) || {};
    courageSignals = {};
    courageEvidence = {};
    for (const s of COURAGE_SIGNALS) {
      courageSignals[s] = !!rawCS[s];
      courageEvidence[s] = typeof rawCE[s] === 'string' ? rawCE[s] : '';
    }
  }

  return {
    scores,
    evidenceNotes,
    lowConfidence,
    stakes,
    stakesRationale,
    courageSignals,
    courageEvidence,
  };
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
      stakes: 'moderate',
      stakesRationale: '',
      courageSignals: rrType === 'RED' ? Object.fromEntries(COURAGE_SIGNALS.map((s) => [s, false])) : null,
      courageEvidence: rrType === 'RED' ? Object.fromEntries(COURAGE_SIGNALS.map((s) => [s, ''])) : null,
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
    return {
      scores: {},
      evidenceNotes: {},
      lowConfidence: true,
      stakes: 'moderate',
      stakesRationale: '',
      courageSignals: rrType === 'RED' ? Object.fromEntries(COURAGE_SIGNALS.map((s) => [s, false])) : null,
      courageEvidence: rrType === 'RED' ? Object.fromEntries(COURAGE_SIGNALS.map((s) => [s, ''])) : null,
      rawText: '',
      rubricVersion: null,
    };
  }
  const cfg = getRrConfig(rrType);
  const consensusScores = {};
  for (const cond of cfg.conditions) {
    consensusScores[cond] = median(runs.map((r) => r.scores?.[cond] ?? 0));
  }
  const lowConfidenceVotes = runs.filter((r) => r.lowConfidence).length;
  const lowConfidence = lowConfidenceVotes > runs.length / 2;

  // Stakes consensus: majority vote, ties broken upward (high > moderate > low)
  // so that the engine errs toward stricter coaching when the model is split.
  const stakesCounts = { low: 0, moderate: 0, high: 0 };
  for (const r of runs) stakesCounts[normalizeStakes(r.stakes)] += 1;
  let consensusStakes = 'moderate';
  let bestCount = -1;
  for (const s of ['low', 'moderate', 'high']) {
    if (stakesCounts[s] >= bestCount) {
      bestCount = stakesCounts[s];
      consensusStakes = s;
    }
  }

  // Courage signals (RED): a signal fires if a STRICT majority of runs flagged it.
  let consensusCourage = null;
  let consensusCourageEvidence = null;
  if (rrType === 'RED') {
    consensusCourage = {};
    consensusCourageEvidence = {};
    for (const s of COURAGE_SIGNALS) {
      const votes = runs.filter((r) => r.courageSignals?.[s]).length;
      consensusCourage[s] = votes > runs.length / 2;
      const ev = runs.find((r) => r.courageSignals?.[s] && r.courageEvidence?.[s]);
      consensusCourageEvidence[s] = ev ? ev.courageEvidence[s] : '';
    }
  }

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
    stakes: consensusStakes,
    stakesRationale: bestRun.stakesRationale || '',
    courageSignals: consensusCourage,
    courageEvidence: consensusCourageEvidence,
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
