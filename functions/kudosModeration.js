/**
 * functions/kudosModeration.js
 *
 * Canonical moderation logic for the anonymous Kudos product.
 *
 * Exports:
 *   - KUDOS_MODERATION_PROMPT  — the prompt template ({{INPUT}} placeholder)
 *   - KUDOS_SYSTEM_INSTRUCTION — system message for the LLM
 *   - moderateKudosText(rawText, { geminiKey, anthropicKey, model? })
 *       → returns parsed { decision, reason, rewritten, concerns,
 *                          deAnonymizationRisk, sentiment, _provider, _model }
 *
 * Strategy: Gemini primary, Anthropic Claude fallback — same pattern as
 * the existing `geminiProxy` Cloud Function. JSON-only output, with a
 * tolerant parser that strips accidental markdown fences.
 *
 * This module is used by:
 *   - functions/index.js → exports.moderateKudos Cloud Function
 *   - scripts/prototype-kudos-moderation.mjs (read-only, for prompt iteration)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

const DEFAULT_MODEL = 'gemini-2.0-flash';
const CLAUDE_FALLBACK_MODEL = 'claude-haiku-4-5';

const KUDOS_SYSTEM_INSTRUCTION =
  'You are a strict, terse JSON-only moderator for an anonymous kudos ' +
  'product. Always return valid JSON matching the requested schema. Never ' +
  'include markdown fences or commentary.';

const KUDOS_MODERATION_PROMPT = `You are the safety and quality layer for an anonymous kudos
application. A sender has written a short anonymous positive message for a
recipient. Your job is to decide whether to ACCEPT, REWRITE, or REJECT it,
and to return a strict JSON response.

HARD REJECT (always reject, never rewrite) — if ANY of these are present:
  a. Surveillance, obsession, or romantic/sexual fixation
     (e.g. "I watch you", "think about you all day", "you're perfect").
  b. Any request or ask of the recipient — meetings, contact, replies,
     coffee, lunch, follow-ups ("we should grab coffee", "hit me back",
     "reply to this"). Anonymous kudos are one-way.
  c. Any hint that the sender wants to be identified or expects the
     recipient to guess who they are.
  d. Statements ABOUT how other people treat or fail the recipient
     ("the people around you don't deserve you", "after all you've been
     through", "despite how they treat you"). These weaponize the message.
  e. Time-loaded framings that imply prior disappointment:
     "finally", "at last", "after all this time", "for once",
     "now that you actually". Rewriting these strips the meaning.
  f. Sarcasm, backhanded compliments, mockery, guilt trips, or
     passive aggression. If the cleaned-up version would be a generic
     positive sentence the sender did not actually mean, REJECT instead
     of laundering it.
  g. Threats, slurs, sexual content, harassment, doxxing.

IDENTIFIER HANDLING (rewrite if salvageable, reject if not):
  - Specific shared events, projects, places, dates → strip and keep the
     warmth.
  - Stated relationship to the recipient ("as your manager", "your
     sister here") → strip the role.
  - Inside jokes or references only one person would know → if the
     message has meaning without them, REWRITE; if it has no meaning
     without them, REJECT.
  - Generic facts about the recipient's life (they have a kid, a job,
     a pet) are NOT identifying — accept those.

VOICE PRESERVATION (for accept and rewrite):
  - Preserve the sender's tone, warmth, specificity, and word choice as
     much as possible. Mild profanity ("damn good human") in clearly
     warm context is OK — accept it.
  - Do NOT sanitize a real human message into corporate HR fluff.
  - When rewriting, change as little as possible. Only remove the
     identifying or unsafe part.

DECISION PRIORITY:
  1. If any HARD REJECT rule fires → reject.
  2. Else if identifying details that can be stripped → rewrite.
  3. Else if minor cleanup needed → rewrite.
  4. Else → accept (verbatim).

LAUNDERING TEST (the most important rule):
  Before rewriting, ask: "If I remove the problematic part, is there a
  genuine positive message left, or am I inventing a new one?" If you
  are inventing — REJECT. Never put words in the sender's mouth.

OUTPUT FORMAT — return ONLY this JSON, no markdown fences, no commentary:

{
  "decision": "accept" | "rewrite" | "reject",
  "reason": "<one short sentence explaining the decision>",
  "rewritten": "<the final message to send, or empty string if rejected>",
  "concerns": ["<short tag>", ...],
  "deAnonymizationRisk": "none" | "low" | "medium" | "high",
  "sentiment": "warm" | "neutral" | "negative"
}

Concerns vocabulary (use any that apply): "identifying", "sarcasm",
"backhanded", "harassment", "sexual", "vague", "generic", "too-long",
"profanity", "guilt-trip", "passive-aggressive", "negative-framing",
"surveillance", "boundary-violation", "laundering-risk", "ok".

If decision is "accept", "rewritten" must equal the original message verbatim.
If decision is "rewrite", "rewritten" must be the cleaned-up version.
If decision is "reject", "rewritten" must be "".

MESSAGE TO MODERATE:
"""
{{INPUT}}
"""`;

const MAX_INPUT_LENGTH = 1500;

function stripFences(text) {
  if (!text) return '';
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function safeParse(text) {
  const cleaned = stripFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Moderate a raw kudos message.
 *
 * @param {string} rawText      User-supplied kudos message.
 * @param {object} opts
 * @param {string} [opts.geminiKey]    Gemini API key (process.env.GEMINI_API_KEY)
 * @param {string} [opts.anthropicKey] Anthropic API key (fallback)
 * @param {string} [opts.model]        Gemini model id (defaults gemini-2.0-flash)
 * @returns {Promise<object>} Parsed moderation result with _provider/_model.
 * @throws  {Error} on hard failure (no providers configured, both failed,
 *                   model returned unparseable JSON).
 */
async function moderateKudosText(rawText, opts = {}) {
  const text = String(rawText || '').trim();
  if (!text) {
    const err = new Error('Empty kudos message');
    err.code = 'empty';
    throw err;
  }
  if (text.length > MAX_INPUT_LENGTH) {
    const err = new Error(`Kudos message too long (max ${MAX_INPUT_LENGTH} chars)`);
    err.code = 'too-long';
    throw err;
  }

  const {
    geminiKey = process.env.GEMINI_API_KEY,
    anthropicKey = process.env.ANTHROPIC_API_KEY,
    model = DEFAULT_MODEL,
  } = opts;

  if (!geminiKey && !anthropicKey) {
    const err = new Error('No AI provider configured (need GEMINI_API_KEY or ANTHROPIC_API_KEY)');
    err.code = 'no-provider';
    throw err;
  }

  const prompt = KUDOS_MODERATION_PROMPT.replace('{{INPUT}}', text);
  let rawResponse = '';
  let provider = null;
  let usedModel = null;
  let geminiError = null;

  // Primary: Gemini
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const genModel = genAI.getGenerativeModel({
        model,
        systemInstruction: KUDOS_SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });
      const result = await genModel.generateContent(prompt);
      rawResponse = (await result.response).text() || '';
      if (rawResponse) {
        provider = 'gemini';
        usedModel = model;
      }
    } catch (err) {
      geminiError = err;
    }
  }

  // Fallback: Anthropic Claude
  if (!rawResponse && anthropicKey) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: CLAUDE_FALLBACK_MODEL,
      max_tokens: 1024,
      system: KUDOS_SYSTEM_INSTRUCTION,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response && response.content && response.content[0];
    rawResponse = block && block.type === 'text' ? block.text : '';
    provider = 'anthropic';
    usedModel = CLAUDE_FALLBACK_MODEL;
  }

  if (!rawResponse) {
    const err = new Error(
      `Moderation failed: ${geminiError ? geminiError.message : 'no response'}`
    );
    err.code = 'no-response';
    throw err;
  }

  const parsed = safeParse(rawResponse);
  if (!parsed || !parsed.decision) {
    const err = new Error('Moderator returned unparseable JSON');
    err.code = 'unparseable';
    err.raw = rawResponse;
    throw err;
  }

  // Normalize and validate.
  const decision = String(parsed.decision).toLowerCase();
  if (!['accept', 'rewrite', 'reject'].includes(decision)) {
    const err = new Error(`Invalid decision value: ${decision}`);
    err.code = 'invalid-decision';
    throw err;
  }

  // Belt-and-suspenders: enforce the verbatim-on-accept rule. If the model
  // claims "accept" but rewrote the text, downgrade to "rewrite".
  let normalizedDecision = decision;
  let rewritten = String(parsed.rewritten || '');
  if (decision === 'accept' && rewritten && rewritten !== text) {
    normalizedDecision = 'rewrite';
  }
  if (decision === 'accept' && !rewritten) {
    rewritten = text;
  }
  if (decision === 'reject') {
    rewritten = '';
  }

  return {
    decision: normalizedDecision,
    reason: String(parsed.reason || ''),
    rewritten,
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns.map(String) : [],
    deAnonymizationRisk: String(parsed.deAnonymizationRisk || 'none'),
    sentiment: String(parsed.sentiment || 'neutral'),
    _provider: provider,
    _model: usedModel,
  };
}

module.exports = {
  KUDOS_MODERATION_PROMPT,
  KUDOS_SYSTEM_INSTRUCTION,
  moderateKudosText,
  MAX_INPUT_LENGTH,
};
