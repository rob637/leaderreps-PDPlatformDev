// functions/conditioning/templates.js
//
// Template-based language system for the Conditioning Light engine (v2).
//
// Tone guardrails (Phase 8):
//   - No therapy language, no academic framework explanations.
//   - reinforce → 1 sentence + name the repeatable behavior.
//   - sharpen   → 1 observation + caller adds 1 specific question.
//   - challenge → 1 sentence that names the real issue.
//   - pattern   → identity language, 1–2 sentences. Never numeric.
//
// A lint test in src/test/conditioning-engine.test.js enforces a max word
// count and a list of banned phrases (see BANNED_PHRASES / MAX_WORDS below).
// Update the lint constants here whenever copy guardrails change.

'use strict';

// ---------------------------------------------------------------------------
// OBSERVATION TEMPLATES — keyed by `${rrType}.${condition}.${mode}` where
// mode is one of:
//   'reinforce' → strong rep, name the repeatable behavior
//   'sharpen'   → pass with a gap worth surfacing
//   'challenge' → fail, name the real issue
//
// Legacy keys ('fail', 'gap', 'strong') remain available as aliases so the
// engine and any old fixtures keep working during rollout.
// Pattern keys ('pattern.<condition>') sit alongside in identity voice.
// RED courage signals use `RED.Courage.<signalName>` (Phase 4).
// ---------------------------------------------------------------------------

const MODE_OBSERVATIONS = {
  // ============================ DRF ============================
  'DRF.Behavior.reinforce': [
    'You named the exact action — that is what makes it repeatable.',
    'Sharp behavior call-out. The leader knows precisely what to do again.',
  ],
  'DRF.Behavior.sharpen': [
    'The behavior is there, but not specific enough to easily repeat.',
    'Get one level more concrete on the behavior so the leader can run it back.',
  ],
  'DRF.Behavior.challenge': [
    'The behavior is too general — a peer would not know what they did right.',
    'You named an outcome, not an action. Reinforcement only sticks on observable behavior.',
    'This could apply to almost anyone. Without a specific behavior, the leader cannot repeat it.',
  ],
  'DRF.Impact.reinforce': [
    'You tied the behavior to a concrete effect — that is what makes the reinforcement land.',
  ],
  'DRF.Impact.sharpen': [
    'The impact is implied. Name it so the reinforcement carries weight.',
    'Connect the behavior to a clear outcome so the praise is not generic.',
  ],
  'DRF.Impact.challenge': [
    'You named the behavior but not the impact. Without impact, this is praise, not reinforcement.',
    'Reinforcement only sticks when the leader knows what changed because of them.',
  ],
  'DRF.Reinforcement.reinforce': [
    'You made the "do this again" message explicit. That is the bar.',
  ],
  'DRF.Reinforcement.sharpen': [
    'The reinforcement is soft. Be direct about wanting more of this behavior.',
    'Make the ask explicit — "do this again" lands harder than vague praise.',
  ],
  'DRF.Reinforcement.challenge': [
    'There is no "do it again" signal. Without it, this is acknowledgment, not reinforcement.',
  ],

  // ============================ RED ============================
  'RED.Behavior.reinforce': [
    'You named the action with enough detail that the leader cannot dispute it.',
  ],
  'RED.Behavior.sharpen': [
    'The behavior is identified but could be more observable.',
    'Tighten the behavior to a single instance — what would a camera have seen?',
  ],
  'RED.Behavior.challenge': [
    'The behavior is too broad to redirect. Name the specific action.',
    'The leader cannot change what they cannot see. Make the behavior observable.',
  ],
  'RED.Impact.reinforce': [
    'You named a real, visible cost — that is what gives the redirect its weight.',
  ],
  'RED.Impact.sharpen': [
    'The impact is named but not specific enough. What changed because of this?',
  ],
  'RED.Impact.challenge': [
    'You named the behavior but not why it matters. Impact is what makes a redirect stick.',
  ],
  'RED.Request.reinforce': [
    'The ask is clear and actionable. The leader knows exactly what to do tomorrow.',
  ],
  'RED.Request.sharpen': [
    'The request is present but soft. Be direct about what should change next time.',
  ],
  'RED.Request.challenge': [
    'You stopped short of asking for a change. Without an explicit ask, this is commentary.',
    'There is no clear request. The leader needs to know exactly what to do differently.',
    'Collaboration without a defined ask is not a redirect — it is a conversation.',
  ],
  'RED.DirectDelivery.sharpen': [
    'The delivery is indirect. A redirect lands harder when you own it as your standard.',
  ],
  'RED.DirectDelivery.challenge': [
    'You routed this through a third party. A redirect only counts when you deliver it yourself.',
  ],
  'RED.DeliveryDiscipline.sharpen': [
    'The point was there but you wrapped it in over-explanation. Land it once and let it sit.',
  ],
  'RED.DeliveryDiscipline.challenge': [
    'You drifted from the point. A redirect is one clear message, not three stacked on top of each other.',
  ],

  // RED courage signals (Phase 4) — fired regardless of pass/fail when the
  // scorer flags a retreat pattern. Forces the rep into a `gap` case.
  'RED.Courage.retreatedToDiscussion': [
    'The conversation shifted toward discussion rather than holding the standard.',
    'You opened a debate instead of making the ask. Lead with the request, then discuss.',
  ],
  'RED.Courage.softenedUnderTension': [
    'You walked the standard back when the moment got tense. Hold the line; the discomfort is the work.',
    'The request softened mid-conversation. The leader needs to hear the same standard at the end as at the start.',
  ],
  'RED.Courage.indirectAccountability': [
    'You routed accountability through "we" instead of naming the person. Direct ownership is what makes it stick.',
  ],
  'RED.Courage.overCollaboration': [
    'You moved into problem-solving before the standard was clear. Set the bar first, then build the plan together.',
  ],
  'RED.Courage.backedOffAfterDefensiveness': [
    'The request shrank after pushback. The redirect only works if you hold it through resistance.',
  ],

  // ============================ FUW ============================
  'FUW.WorkAnchored.reinforce': [
    'You anchored the follow-up to a specific deliverable — that is what makes the next step traceable.',
  ],
  'FUW.WorkAnchored.sharpen': [
    'You referenced the work but loosely. Name it specifically so progress is traceable.',
  ],
  'FUW.WorkAnchored.challenge': [
    'The follow-up is not anchored to specific work — there is nothing for the leader to point to.',
    'Without naming the work, this is a check-in, not a follow-up.',
  ],
  'FUW.ProgressVisibility.reinforce': [
    'You surfaced real status — what is done, what is blocked, what is next. That is the rep.',
  ],
  'FUW.ProgressVisibility.sharpen': [
    'You are not making progress visible. What is the current state versus the expected state?',
  ],
  'FUW.ProgressVisibility.challenge': [
    'You took feelings about status as status. Surface the actual state of the work.',
  ],
  'FUW.Ownership.reinforce': [
    'You named the next owner and the next move. That is how follow-up builds accountability.',
  ],
  'FUW.Ownership.sharpen': [
    'Ownership is unclear — who is moving this forward, and by when?',
  ],
  'FUW.Ownership.challenge': [
    'No clear next owner. Follow-up without ownership trains the team to expect drift.',
    'You surfaced status but left ownership floating. Name who owns the next step before you close the loop.',
  ],

  // ============================ SCE ============================
  'SCE.Expectation.reinforce': [
    'The expectation is concrete enough that a peer could repeat it back. That is the bar.',
  ],
  'SCE.Expectation.sharpen': [
    'The expectation is set but could be more concrete.',
  ],
  'SCE.Expectation.challenge': [
    'The expectation is not specific enough for someone to act on.',
    'You described a desire, not an expectation. What exactly should happen, by when?',
  ],
  'SCE.Success.reinforce': [
    'You defined success in observable terms — both of you will know when it is done right.',
  ],
  'SCE.Success.sharpen': [
    'Success criteria are present but soft — what does "good" look like, exactly?',
  ],
  'SCE.Success.challenge': [
    'There is no definition of success. The leader can meet your words but miss your intent.',
  ],
  'SCE.Understanding.reinforce': [
    'You surfaced their interpretation — that is the difference between setting an expectation and landing one.',
  ],
  'SCE.Understanding.sharpen': [
    'You set the expectation but did not check for understanding. Confirm the leader heard what you meant.',
  ],
  'SCE.Understanding.challenge': [
    'You delivered the expectation but never confirmed it landed. Setting is not the same as receiving.',
    'Without surfacing their interpretation, you are assuming alignment that may not exist.',
  ],
  'SCE.Ownership.reinforce': [
    'You named the owner and the cadence — the work has somewhere to live now.',
  ],
  'SCE.Ownership.sharpen': [
    'Ownership is implied, not assigned. Name who owns the next step.',
  ],
  'SCE.Ownership.challenge': [
    'There is no named owner. An unowned expectation will not survive the week.',
  ],
};

// ---------------------------------------------------------------------------
// PATTERN OBSERVATIONS — identity voice (Phase 5).
// Never numeric, never "X of Y reps." Names the tendency.
// ---------------------------------------------------------------------------

const PATTERN_OBSERVATIONS = {
  'pattern.Behavior': [
    'You consistently describe behavior in broad strokes. The leaders you coach will only repeat what you can point to.',
    'You tend to stop one level above the actual behavior. The specific action is where the lesson lives.',
  ],
  'pattern.Impact': [
    'You consistently skip the impact. Without it, your feedback reads as opinion rather than coaching.',
  ],
  'pattern.Request': [
    'You consistently stop short of an explicit request. The standard does not exist until you name it.',
    'You tend to invite collaboration before you define the ask. The redirect needs the ask first.',
  ],
  'pattern.Expectation': [
    'You tend to leave expectations implicit. Lead with the expectation; the why comes after.',
  ],
  'pattern.Success': [
    'You consistently skip defining what success looks like. Without it, you and the leader can both feel done with different results.',
  ],
  'pattern.WorkAnchored': [
    'Your follow-ups consistently drift away from the actual work. Anchor each one to a specific deliverable.',
  ],
  'pattern.Ownership': [
    'You consistently let ownership stay shared. Be explicit about who owns the next step.',
  ],
  'pattern.Understanding': [
    'You consistently set the expectation and stop. The leader receiving it is the rep — surface their interpretation.',
  ],
  'pattern.DirectDelivery': [
    'You consistently route hard messages through softer channels. The hard channel is the rep.',
  ],
  'pattern.DeliveryDiscipline': [
    'You tend to wrap the point in extra context. One clear message, then silence.',
  ],
  'pattern.ProgressVisibility': [
    'You consistently take sentiment as status. Make the actual state of the work visible.',
  ],
};

// ---------------------------------------------------------------------------
// QUESTION TEMPLATES — grouped by condition / gap type.
// Per spec §8: exactly 1 question, no teaching inside it.
// ---------------------------------------------------------------------------

const QUESTIONS = {
  Behavior: [
    'What specifically did the leader do — what would a camera have captured?',
    'In one sentence, what was the observable action?',
    'Strip the interpretation: what did you actually see or hear?',
  ],
  Impact: [
    'What changed because of that behavior?',
    'Who or what was affected, and how?',
    'What was different in the work or the room as a result?',
  ],
  Request: [
    'What specifically do you want to be different next time?',
    'What is the explicit ask?',
    'What would "yes" look like from the leader?',
  ],
  Expectation: [
    'What exactly should happen, by when?',
    'How would you describe the expectation in one sentence?',
    'What is the standard you are holding to here?',
  ],
  Success: [
    'What does "done well" look like, concretely?',
    'How will you both know it is done right?',
    'What are the two or three observable signals of success?',
  ],
  Ownership: [
    'Who owns the next step, and by when?',
    'Whose name is on this?',
    'What does the leader own, and what do you own?',
  ],
  Reinforcement: [
    'How will the leader know you want more of this?',
    'What is the explicit "do this again" message?',
  ],
  WorkAnchored: [
    'Which specific piece of work are you following up on?',
    'What is the deliverable this follow-up is tied to?',
  ],
  ProgressVisibility: [
    'Where are we now versus where we should be?',
    'What is the visible progress signal?',
  ],
  Understanding: [
    'How did you confirm the leader heard what you meant?',
    'What did the leader say back to you?',
  ],
  DirectDelivery: [
    'How could you own this as your standard, not as a suggestion?',
  ],
  DeliveryDiscipline: [
    'What would it look like to land the point once and let it sit?',
  ],
  Clarity: [
    'This is too general to evaluate. What specifically did you say or do?',
    'Walk me through the actual moment — what were the exact words?',
  ],
};

// ---------------------------------------------------------------------------
// LEGACY ALIAS LAYER — keys 'fail' / 'gap' / 'strong' map to v2 modes.
// Keeps engine fallback paths working during rollout and lets older test
// fixtures still resolve to a real bank.
// ---------------------------------------------------------------------------

const MODE_ALIASES = {
  fail: 'challenge',
  gap: 'sharpen',
  strong: 'reinforce',
};

const buildLegacyAliasBank = () => {
  const out = {};
  for (const [key, bank] of Object.entries(MODE_OBSERVATIONS)) {
    const lastDot = key.lastIndexOf('.');
    const prefix = key.slice(0, lastDot);
    const mode = key.slice(lastDot + 1);
    for (const [legacy, canonical] of Object.entries(MODE_ALIASES)) {
      if (mode === canonical) {
        out[`${prefix}.${legacy}`] = bank;
      }
    }
  }
  return out;
};

const OBSERVATIONS = Object.freeze({
  ...MODE_OBSERVATIONS,
  ...PATTERN_OBSERVATIONS,
  ...buildLegacyAliasBank(),
});

// ---------------------------------------------------------------------------
// SELECTION
// ---------------------------------------------------------------------------

const selectTemplate = (bank, recentlyUsed = [], rand = Math.random) => {
  if (!Array.isArray(bank) || bank.length === 0) return null;
  const fresh = bank.filter((t) => !recentlyUsed.includes(t));
  const pool = fresh.length > 0 ? fresh : bank;
  const idx = Math.floor(rand() * pool.length);
  return pool[idx];
};

const getObservationBank = (key) => OBSERVATIONS[key] || [];

const getQuestionBank = (gapType) => QUESTIONS[gapType] || [];

// ---------------------------------------------------------------------------
// VOICE / TONE LINT CONSTANTS (Phase 8)
// Exposed so a Vitest spec can enforce them.
// ---------------------------------------------------------------------------

const MAX_WORDS = 35;

const BANNED_PHRASES = Object.freeze([
  'great job',
  'remember to',
  'you should try to',
  'nice job',
  'awesome',
  'amazing',
  'good luck',
  'just',
]);

// Bans any "N of M reps" / "X of Y" numeric phrasing in pattern templates.
const NUMERIC_PATTERN_RE = /\b\d+\s+of\s+\d+\b/i;

module.exports = {
  OBSERVATIONS,
  MODE_OBSERVATIONS,
  PATTERN_OBSERVATIONS,
  QUESTIONS,
  MODE_ALIASES,
  MAX_WORDS,
  BANNED_PHRASES,
  NUMERIC_PATTERN_RE,
  selectTemplate,
  getObservationBank,
  getQuestionBank,
};
