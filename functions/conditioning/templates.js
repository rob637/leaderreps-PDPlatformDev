// functions/conditioning/templates.js
//
// Template-based language system for the Conditioning Light engine.
// Per spec §9 + §17: controlled variation, never freeform.
//
// Tone: direct, concise, neutral. Max 1-2 sentences per observation.
// Selection: random within set; caller is responsible for avoiding repeats
// within the user's last 2-3 reps (see selectTemplate below).

'use strict';

// ---------------------------------------------------------------------------
// OBSERVATION TEMPLATES
// Keyed by `${rrType}.${condition}.${tier}` where tier is one of:
//   'fail'      → critical condition missing or weak; rep failed on this gap
//   'gap'       → condition Adequate or below but not the failure point
//   'pattern'   → recurring weakness across recent reps
//   'strong'    → reinforcing observation for a Strong Rep
// ---------------------------------------------------------------------------

const OBSERVATIONS = {
  // ============================ DRF ============================
  'DRF.Behavior.fail': [
    'The behavior you described is too general — a peer wouldn\'t know exactly what they did right.',
    'You named the outcome but not the action. The leader needs to hear the specific behavior to repeat it.',
    'The feedback could apply to almost anyone. Reinforcement only sticks when the behavior is observable.',
  ],
  'DRF.Behavior.gap': [
    'The behavior is described but could be sharper — what would a camera have captured?',
    'Get one level more specific on the behavior so the leader knows precisely what to repeat.',
  ],
  'DRF.Impact.gap': [
    'The impact is implied but not named. Make it explicit so the reinforcement carries weight.',
    'Connect the behavior to a clear outcome — without it the praise feels generic.',
  ],
  'DRF.Reinforcement.gap': [
    'The reinforcement is present but soft. Be direct about wanting more of this behavior.',
    'Make the ask explicit: "do this again" lands harder than "nice job."',
  ],
  'DRF.Behavior.strong': [
    'Sharp, specific behavior call-out — that\'s what makes reinforcement repeatable.',
    'You captured the exact action and tied it to impact. Model rep.',
  ],

  // ============================ RED ============================
  'RED.Behavior.fail': [
    'The behavior is described too broadly — without specifics, the redirect can\'t land.',
    'The leader can\'t change what they can\'t see. Name the specific action.',
  ],
  'RED.Request.fail': [
    'You stopped short of asking for a change. Without a clear request, this is just commentary.',
    'There\'s no explicit ask. The leader needs to know exactly what to do differently.',
    'Collaboration without a defined ask isn\'t a redirect — it\'s a conversation.',
  ],
  'RED.Impact.fail': [
    'You named the behavior but not why it matters. Impact is what makes a redirect stick.',
  ],
  'RED.Behavior.gap': [
    'Behavior is identified but could be more observable.',
  ],
  'RED.Request.gap': [
    'The request is present but soft. Be direct about what should change next time.',
  ],
  'RED.Impact.gap': [
    'Impact is named but not specific enough — what changed because of this?',
  ],
  'RED.DirectDelivery.gap': [
    'The delivery is indirect. A redirect lands harder when you own it as your standard.',
  ],
  'RED.Behavior.strong': [
    'Specific, observable, and tied to clear impact — that\'s a clean redirect.',
    'You stayed direct without losing the relationship. That\'s the rep.',
  ],

  // ============================ FUW ============================
  'FUW.WorkAnchored.fail': [
    'Your follow-up isn\'t anchored to a specific piece of work — there\'s nothing for the leader to point to.',
    'Without naming the work, this becomes a check-in instead of a follow-up.',
  ],
  'FUW.WorkAnchored.gap': [
    'You referenced the work but loosely. Name it specifically so progress is traceable.',
  ],
  'FUW.ProgressVisibility.gap': [
    'You\'re not making progress visible. What\'s the current state versus the expected state?',
  ],
  'FUW.Ownership.gap': [
    'Ownership is unclear — who is moving this forward, and by when?',
  ],
  'FUW.WorkAnchored.strong': [
    'Anchored to specific work with clear ownership — that\'s how follow-up creates accountability.',
  ],

  // ============================ SCE ============================
  'SCE.Expectation.fail': [
    'The expectation isn\'t stated specifically enough for someone to act on.',
    'You described a desire, not an expectation. What exactly should happen, by when?',
  ],
  'SCE.Success.fail': [
    'There\'s no definition of success. The leader can meet your words but miss your intent.',
    'Without success criteria, you and the leader can both feel "done" with different results.',
  ],
  'SCE.Expectation.gap': [
    'The expectation is set but could be more concrete.',
  ],
  'SCE.Success.gap': [
    'Success criteria are present but soft — what does "good" look like, exactly?',
  ],
  'SCE.Understanding.gap': [
    'You set the expectation but didn\'t check for understanding. Confirm the leader heard what you meant.',
  ],
  'SCE.Ownership.gap': [
    'Ownership is implied, not assigned. Name who owns the next step.',
  ],
  'SCE.Expectation.strong': [
    'Specific, time-bound, and confirmed — the leader knows exactly what good looks like.',
  ],

  // ============================ PATTERN ============================
  // Generic pattern observations (used when same condition is lowest in 3 of 5)
  'pattern.Behavior': [
    'You consistently describe behavior broadly. What would a camera capture next time?',
    'A pattern: behavior stays general across reps. One level more specific changes everything.',
  ],
  'pattern.Impact': [
    'A pattern: you tend to skip impact. Without it, your feedback lands as opinion.',
  ],
  'pattern.Request': [
    'You consistently stop short of an explicit request. What specifically will be different next time?',
    'A pattern: collaboration without definition. Make the ask.',
  ],
  'pattern.Expectation': [
    'A pattern: expectations stay implicit. Lead with the expectation, then explain the why.',
  ],
  'pattern.Success': [
    'You repeatedly skip defining success. What does "done well" look like, in concrete terms?',
  ],
  'pattern.WorkAnchored': [
    'A pattern: follow-ups drift away from the actual work. Anchor each one to a specific deliverable.',
  ],
  'pattern.Ownership': [
    'Ownership keeps blurring across your reps. Be explicit about who owns the next step.',
  ],
};

// ---------------------------------------------------------------------------
// QUESTION TEMPLATES
// Grouped by gap type. Used for Case 2 (pass-not-sharp) and Case 3 (not yet).
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
    'What\'s the standard you\'re holding to here?',
  ],
  Success: [
    'What does "done well" look like, concretely?',
    'How will you both know it\'s done right?',
    'What are the two or three measurable signals of success?',
  ],
  Ownership: [
    'Who owns the next step, and by when?',
    'Whose name is on this?',
    'What does the leader own, and what do you own?',
  ],
  Reinforcement: [
    'How will the leader know you want more of this?',
    'What\'s the explicit "do this again" message?',
  ],
  WorkAnchored: [
    'Which specific piece of work are you following up on?',
    'What\'s the deliverable this follow-up is tied to?',
  ],
  ProgressVisibility: [
    'Where are we now versus where we should be?',
    'What\'s the visible progress signal?',
  ],
  Understanding: [
    'How did you confirm the leader heard what you meant?',
    'What did the leader say back to you?',
  ],
  DirectDelivery: [
    'How could you own this as your standard, not as a suggestion?',
  ],
  // Used for Case 3 fallback when input is too vague to extract anything
  Clarity: [
    'This is too general to evaluate. What specifically did you say or do?',
    'Walk me through the actual moment — what were the exact words?',
  ],
};

// ---------------------------------------------------------------------------
// SELECTION
// Caller passes recently-used template strings (e.g. last 5 reps' observation
// + question text) so we don't repeat. Falls back to first item if nothing
// fresh remains.
// ---------------------------------------------------------------------------

/**
 * Pick a template from the bank, avoiding any in `recentlyUsed`.
 * @param {string[]} bank - Array of candidate template strings
 * @param {string[]} [recentlyUsed=[]] - Strings to avoid if possible
 * @param {() => number} [rand=Math.random] - Injectable PRNG (for tests)
 * @returns {string|null} Selected template, or null if bank is empty
 */
const selectTemplate = (bank, recentlyUsed = [], rand = Math.random) => {
  if (!Array.isArray(bank) || bank.length === 0) return null;
  const fresh = bank.filter((t) => !recentlyUsed.includes(t));
  const pool = fresh.length > 0 ? fresh : bank;
  const idx = Math.floor(rand() * pool.length);
  return pool[idx];
};

/**
 * Look up an observation bank by key. Returns [] if not found so callers
 * can fall back gracefully.
 * @param {string} key - e.g. "DRF.Behavior.fail"
 * @returns {string[]}
 */
const getObservationBank = (key) => OBSERVATIONS[key] || [];

/**
 * Look up a question bank by gap type.
 * @param {string} gapType - e.g. "Behavior"
 * @returns {string[]}
 */
const getQuestionBank = (gapType) => QUESTIONS[gapType] || [];

module.exports = {
  OBSERVATIONS,
  QUESTIONS,
  selectTemplate,
  getObservationBank,
  getQuestionBank,
};
