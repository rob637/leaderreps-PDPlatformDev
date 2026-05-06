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
const { getRrConfig } = require('./rrConfig');

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
  return `
RR Type: ${cfg.code} (${cfg.name})
Conditions to score: ${cfg.conditions.join(', ')}
Critical conditions (treat strictly): ${cfg.critical.join(', ')}

Leader transcript:
"""
${transcript}
"""

Score each condition 0-3 per the rules. Set lowConfidence=true if the input
is too vague to evaluate. Return JSON only.
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
 * Score a transcript for a given RR type using Gemini, falling back to
 * Anthropic Claude if all Gemini models fail (e.g. quota exhausted).
 * Returns { scores, evidenceNotes, lowConfidence, rawText }.
 */
const scoreTranscript = async ({ rrType, transcript, apiKey, anthropicApiKey }) => {
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
  // If JSON parsing failed, treat as low-confidence so the engine returns
  // an Invalid result rather than scoring 0s as if they were extracted.
  if (!parsed) {
    return {
      scores: {},
      evidenceNotes: {},
      lowConfidence: true,
      rawText: text,
    };
  }
  const normalized = normalizeScorerOutput(rrType, parsed);
  return { ...normalized, rawText: text };
};

module.exports = {
  scoreTranscript,
  // exposed for tests
  buildSystemInstruction,
  buildUserPrompt,
  safeJsonParse,
  normalizeScorerOutput,
};
