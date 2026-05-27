/**
 * functions/nudgeModeration.js
 *
 * Canonical moderation logic for the anonymous Constructive Nudges product.
 *
 * Same Gemini-primary / Anthropic-fallback strategy as kudosModeration.js,
 * but the prompt is tuned for *constructive* feedback rather than warm
 * kudos — the failure modes are very different.
 *
 * Exports:
 *   - NUDGE_MODERATION_PROMPT  — prompt template with {{INPUT}} placeholder
 *   - NUDGE_SYSTEM_INSTRUCTION — system message for the LLM
 *   - moderateNudgeText(rawText, { geminiKey, anthropicKey, model? })
 *       → { decision, reason, rewritten, concerns,
 *           deAnonymizationRisk, tone, _provider, _model }
 *
 * Used by:
 *   - functions/index.js → exports.moderateNudge + exports.sendNudge
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

const DEFAULT_MODEL = 'gemini-2.0-flash';
const CLAUDE_FALLBACK_MODEL = 'claude-haiku-4-5';

const NUDGE_SYSTEM_INSTRUCTION =
  'You are a strict, terse JSON-only moderator for an anonymous constructive ' +
  'leadership-feedback product. Always return valid JSON matching the requested ' +
  'schema. Never include markdown fences or commentary.';

const NUDGE_MODERATION_PROMPT = `You are the safety and quality layer for an anonymous
"Constructive Leadership Nudge" tool. A direct report has written a private,
anonymous note for their manager describing one or more behavior patterns and
suggesting improvements. Your job is to decide whether to ACCEPT, REWRITE, or
REJECT the message, and return strict JSON.

The product norm is professional, behavior-focused, future-oriented feedback —
NOT a venting channel, NOT an anonymous attack channel, NOT a complaint.

HARD REJECT (always reject, never rewrite) — if ANY of these are present:
  a. Personal attacks, insults, slurs, mockery, or contempt
     ("you're a terrible boss", "incompetent", "narcissist", name-calling).
  b. Diagnosing the recipient ("you're a narcissist", "you have anger issues",
     "you're insecure"). Behaviors are fair game; armchair psychology is not.
  c. Threats, ultimatums, or coercive language ("fix this or I'm quitting",
     "the whole team will leave", "we'll go to HR").
  d. Accusations of illegal conduct (harassment, discrimination, retaliation,
     fraud). These belong with HR or legal, not in an anonymous nudge.
     Reject and surface in "concerns" as "hr-escalation".
  e. Identifying details that would unmask the sender:
     - specific 1:1 quotes the sender alone witnessed
     - specific projects only one person is on
     - "as your senior engineer", "as the only PM on your team"
     - dates of private conversations
     If salvageable, REWRITE to strip them. If the whole message depends on
     those details, REJECT.
  f. Naming third parties ("Sarah said you...", "the rest of the team thinks").
     Strip names; if the message has no value without the naming, REJECT.
  g. Sarcasm, passive-aggression, or backhanded "feedback"
     ("must be nice to never have to make a decision").
  h. Profanity directed at the recipient. Mild general profanity in a venting
     phrase ("this is frustrating as hell") can be rewritten; profanity AT the
     person cannot.
  i. Pure complaint with no actionable improvement
     ("you suck at meetings" with no suggestion). Constructive nudges require a
     specific, actionable direction. If no improvement is implied, REJECT.

REWRITE (preferred when salvageable):
  - Heated or absolute language → measured, behavior-specific.
    "you NEVER listen" → "in 1:1s I've noticed responses sometimes start before
    I finish a thought".
  - "Everyone thinks..." → drop the appeal to consensus; speak from one
    perspective without claiming to represent others.
  - Identifying specifics → generalize ("a recent project" rather than name).
  - Long rants → tighten to: observable behavior, impact, suggested change.
  - Apologetic hedging that buries the point → keep the directness, remove the
    hedging.

VOICE PRESERVATION (for accept and rewrite):
  - Keep the sender's directness and specificity about BEHAVIOR.
  - Do not soften into corporate HR fluff. A clear, honest, professional voice
    is the goal — not bland.
  - Change as little as possible. Only fix what fires a rule above.

ACCEPT VERBATIM only when:
  - Tone is professional and behavior-focused.
  - No identifying details, no third-party naming, no diagnoses, no ultimatums.
  - At least one actionable improvement is present (explicit or strongly
    implied).
  - Sender's voice is intact and respectful.

LAUNDERING TEST (most important rule):
  Before rewriting, ask: "If I clean this up, am I representing what the sender
  actually meant, or am I writing a new, nicer message they didn't write?"
  If the latter — REJECT. Never put constructive words in a venter's mouth.

OUTPUT FORMAT — return ONLY this JSON, no markdown fences, no commentary:

{
  "decision": "accept" | "rewrite" | "reject",
  "reason": "<one short sentence explaining the decision>",
  "rewritten": "<the final message to send, or empty string if rejected>",
  "concerns": ["<short tag>", ...],
  "deAnonymizationRisk": "none" | "low" | "medium" | "high",
  "tone": "constructive" | "neutral" | "heated" | "attacking"
}

Concerns vocabulary (use any that apply):
  "identifying", "third-party-named", "personal-attack", "diagnosis",
  "ultimatum", "hr-escalation", "no-action", "sarcasm", "passive-aggressive",
  "profanity-at-recipient", "absolutism", "venting", "generic", "too-long",
  "laundering-risk", "ok".

Rules:
  - If decision is "accept", "rewritten" must equal the original message verbatim.
  - If decision is "rewrite", "rewritten" must be the cleaned-up version.
  - If decision is "reject", "rewritten" must be "".

MESSAGE TO MODERATE:
"""
{{INPUT}}
"""`;

const MAX_INPUT_LENGTH = 2000;

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
 * Moderate a raw constructive-nudge message.
 *
 * @param {string} rawText
 * @param {object} opts
 * @param {string} [opts.geminiKey]
 * @param {string} [opts.anthropicKey]
 * @param {string} [opts.model]
 * @returns {Promise<object>}
 * @throws {Error} on hard failure
 */
async function moderateNudgeText(rawText, opts = {}) {
  const text = String(rawText || '').trim();
  if (!text) {
    const err = new Error('Empty nudge message');
    err.code = 'empty';
    throw err;
  }
  if (text.length > MAX_INPUT_LENGTH) {
    const err = new Error(`Nudge message too long (max ${MAX_INPUT_LENGTH} chars)`);
    err.code = 'too-long';
    throw err;
  }

  const {
    geminiKey = process.env.GEMINI_API_KEY,
    anthropicKey = process.env.ANTHROPIC_API_KEY,
    model = DEFAULT_MODEL,
  } = opts;

  if (!geminiKey && !anthropicKey) {
    const err = new Error('No AI provider configured');
    err.code = 'no-provider';
    throw err;
  }

  const prompt = NUDGE_MODERATION_PROMPT.replace('{{INPUT}}', text);
  let rawResponse = '';
  let provider = null;
  let usedModel = null;
  let geminiError = null;

  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const genModel = genAI.getGenerativeModel({
        model,
        systemInstruction: NUDGE_SYSTEM_INSTRUCTION,
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

  if (!rawResponse && anthropicKey) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: CLAUDE_FALLBACK_MODEL,
      max_tokens: 1024,
      system: NUDGE_SYSTEM_INSTRUCTION,
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

  const decision = String(parsed.decision).toLowerCase();
  if (!['accept', 'rewrite', 'reject'].includes(decision)) {
    const err = new Error(`Invalid decision value: ${decision}`);
    err.code = 'invalid-decision';
    throw err;
  }

  // Belt-and-suspenders: enforce verbatim-on-accept.
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
    tone: String(parsed.tone || 'neutral'),
    _provider: provider,
    _model: usedModel,
  };
}

module.exports = {
  NUDGE_MODERATION_PROMPT,
  NUDGE_SYSTEM_INSTRUCTION,
  moderateNudgeText,
  MAX_INPUT_LENGTH,
};
