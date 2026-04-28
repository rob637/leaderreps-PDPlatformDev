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
const { getRrConfig } = require('./rrConfig');

const SCORER_MODEL = 'gemini-2.0-flash';

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
 * Score a transcript for a given RR type using Gemini.
 * Returns { scores, evidenceNotes, lowConfidence, rawText }.
 */
const scoreTranscript = async ({ rrType, transcript, apiKey }) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: SCORER_MODEL,
    systemInstruction: buildSystemInstruction(),
    generationConfig: {
      temperature: 0.2, // strict / deterministic
      responseMimeType: 'application/json',
    },
  });
  const result = await model.generateContent(buildUserPrompt(rrType, transcript));
  const response = await result.response;
  const text = response.text();
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
