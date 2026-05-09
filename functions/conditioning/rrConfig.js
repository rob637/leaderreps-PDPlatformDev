// functions/conditioning/rrConfig.js
//
// RR-specific configuration for the Conditioning Light evaluation engine.
// Encodes the v1 spec from REVAMP-PLAN.md §6 EXACTLY. Do not soften without
// updating the spec doc and the test suite simultaneously.
//
// Score scale (per condition): 0 = Missing, 1 = Weak, 2 = Adequate, 3 = Strong
//
// Critical conditions: if ANY critical condition score <= 1 → fail.
// Pass threshold: total score across conditions must be >= passThreshold AND
//   no fail rule may have triggered.
//
// Strong rep eligibility (suppress coaching question):
//   - No fail conditions
//   - All critical conditions >= Adequate (2)
//   - No condition === 0
//   - Plus RR-specific extra requirements (see strongRepRule below)

'use strict';

const SCORE = Object.freeze({
  MISSING: 0,
  WEAK: 1,
  ADEQUATE: 2,
  STRONG: 3,
});

const SCORE_LABEL = Object.freeze({
  0: 'Missing',
  1: 'Weak',
  2: 'Adequate',
  3: 'Strong',
});

// Helper used inside strongRepRule callbacks
const countAtLeast = (scores, threshold) =>
  Object.values(scores).filter((s) => s >= threshold).length;

// ---------------------------------------------------------------------------
// CONDITION DEFINITIONS — anchored rubrics
//
// Every condition has a one-line `definition` and a 4-tier `anchors` map.
// Each tier names its `criterion` (the rule the scorer must apply) and an
// `example` phrase showing what that tier sounds like in a real transcript.
//
// These anchors are rendered into the AI scorer prompt so the model is
// grounded in concrete decision rules instead of interpreting a generic
// 0-3 scale. This is the primary lever for inter-rater reliability.
//
// IMPORTANT: examples are illustrative only. The scorer must extract
// evidence from the actual transcript; it must NEVER assume an example
// applies just because the wording is similar.
// ---------------------------------------------------------------------------

const CONDITION_DEFS = Object.freeze({
  // ============================ DRF ============================
  'DRF.Behavior': {
    definition:
      'A specific, observable action the person took that the leader wants repeated.',
    anchors: {
      3: {
        criterion:
          'Names a single discrete action with enough detail another observer could recognize it (who, what, when/where).',
        example:
          '"In the standup, you re-scoped the ticket after Maya pushed back on the estimate."',
      },
      2: {
        criterion: 'Names an action but missing some specifics (time, place, or exact wording).',
        example: '"You pushed back on the timeline last week."',
      },
      1: {
        criterion: 'Names a category, trait, or pattern — not a discrete instance.',
        example: '"You\'ve been more proactive lately."',
      },
      0: {
        criterion: 'No behavior referenced; only feelings, traits, or outcomes.',
        example: '"You\'re crushing it."',
      },
    },
  },
  'DRF.Impact': {
    definition: 'The concrete consequence or value the behavior produced.',
    anchors: {
      3: {
        criterion: 'Quantified or vivid downstream effect (saved hours, unblocked X, shifted Y\'s view).',
        example: '"That saved the team a full sprint of rework."',
      },
      2: {
        criterion: 'Effect named but general.',
        example: '"It helped the team move faster."',
      },
      1: {
        criterion: 'Vague positive framing without a clear effect.',
        example: '"It was really helpful."',
      },
      0: { criterion: 'No impact mentioned.', example: '(silence on impact)' },
    },
  },
  'DRF.Reinforcement': {
    definition: 'An explicit signal that this is a behavior the leader wants repeated.',
    anchors: {
      3: {
        criterion:
          'Direct ask to do it again, naming it as a strength to lean into, or committing to notice it.',
        example: '"Keep doing that — it\'s the bar I want from you in every review."',
      },
      2: {
        criterion: 'Clear positive framing that signals "more of this."',
        example: '"That\'s exactly the kind of move I\'m looking for."',
      },
      1: {
        criterion: 'Generic praise without a "do it again" signal.',
        example: '"Nice work."',
      },
      0: { criterion: 'No reinforcing language.', example: '(no signal to repeat)' },
    },
  },

  // ============================ RED ============================
  'RED.Behavior': {
    definition: 'A specific, observable action the person took that needs to change.',
    anchors: {
      3: {
        criterion: 'A single concrete instance with enough detail to be undeniable.',
        example:
          '"In Tuesday\'s exec review you cut Priya off twice when she was answering Aman\'s question."',
      },
      2: {
        criterion: 'Instance named but missing specifics (time, place, or exact action).',
        example: '"You interrupted her in the meeting."',
      },
      1: {
        criterion: 'A trait or pattern label, not a clear instance.',
        example: '"You can be dismissive in meetings."',
      },
      0: {
        criterion: 'No behavior; only feelings, accusations, or judgments about the person.',
        example: '"You don\'t respect the team."',
      },
    },
  },
  'RED.Impact': {
    definition: 'The concrete cost or consequence of the behavior.',
    anchors: {
      3: {
        criterion: 'Quantified or vivid cost (delayed launch, eroded trust, lost X).',
        example: '"Priya stopped contributing for the rest of the meeting."',
      },
      2: { criterion: 'Cost named but general.', example: '"It made the conversation harder."' },
      1: { criterion: 'Vague concern.', example: '"It\'s a problem."' },
      0: { criterion: 'No impact stated.', example: '(no cost named)' },
    },
  },
  'RED.Request': {
    definition: 'An explicit, specific ask for what should change.',
    anchors: {
      3: {
        criterion: 'Clear, concrete ask the person can act on tomorrow.',
        example: '"In the next exec review, let people finish before you respond."',
      },
      2: {
        criterion: 'Direction stated but somewhat general.',
        example: '"I need you to give people more space to talk."',
      },
      1: {
        criterion: 'Implied ask, or a question instead of a request.',
        example: '"Could you maybe try not to do that?"',
      },
      0: {
        criterion: 'No request — only observation or complaint.',
        example: '(no ask for change)',
      },
    },
  },
  'RED.DirectDelivery': {
    definition: 'The leader spoke to the person directly, in a real-time channel.',
    anchors: {
      3: { criterion: '1:1 conversation, in person or sync video/voice.', example: '"I pulled them into a 15-minute 1:1."' },
      2: { criterion: 'Real-time but in a group context.', example: '"I named it in the team retro."' },
      1: { criterion: 'Async channel (Slack, email, written comment).', example: '"I sent them a Slack DM."' },
      0: { criterion: 'Through a third party, or not delivered.', example: '"I asked their manager to pass it on."' },
    },
  },
  'RED.DeliveryDiscipline': {
    definition:
      'The leader stayed on the point without softening, hedging, piling on unrelated issues, or apologizing for the feedback.',
    anchors: {
      3: { criterion: 'Clean, concise, on point; held the line under pushback.', example: '"I made the request once, clearly, and waited."' },
      2: { criterion: 'Clear but with some softening or extra justification.', example: '"I said it, then over-explained why."' },
      1: { criterion: 'Rambling, hedging, or stacking unrelated issues.', example: '"I brought up three other things while I was at it."' },
      0: { criterion: 'Avoided the point, withdrew, or attacked.', example: '"I lost my nerve and changed the subject."' },
    },
  },

  // ============================ FUW ============================
  'FUW.WorkAnchored': {
    definition: 'The follow-up is tied to a specific piece of work, not a generic check-in.',
    anchors: {
      3: { criterion: 'Names the specific deliverable, decision, or ticket.', example: '"I asked about the Q2 pricing memo."' },
      2: { criterion: 'References the work but generally.', example: '"I asked how the pricing project was going."' },
      1: { criterion: 'General "how\'s it going" framing.', example: '"How are things?"' },
      0: { criterion: 'No work referenced.', example: '(no work mentioned)' },
    },
  },
  'FUW.ProgressVisibility': {
    definition: 'The leader surfaced actual status — not feelings about status.',
    anchors: {
      3: { criterion: 'Concrete signals of progress: what\'s done, what\'s blocked, what\'s next.', example: '"Draft is done, legal review is the blocker, finance reviews Friday."' },
      2: { criterion: 'Some progress markers mixed with vague status.', example: '"Most of it is done, a few things still open."' },
      1: { criterion: 'Sentiment-based status without evidence.', example: '"On track."' },
      0: { criterion: 'No status surfaced.', example: '(no progress info)' },
    },
  },
  'FUW.Ownership': {
    definition: 'Next steps and owners are made explicit.',
    anchors: {
      3: { criterion: 'Specific named owner + next action + when.', example: '"Sam owns the legal follow-up by Thursday."' },
      2: { criterion: 'Owner clear but next step or timing fuzzy.', example: '"Sam\'s on it."' },
      1: { criterion: 'Implied or shared ownership.', example: '"We\'ll figure it out."' },
      0: { criterion: 'No owner; "we\'ll see."', example: '(no owner)' },
    },
  },

  // ============================ SCE ============================
  'SCE.Expectation': {
    definition: 'What is being asked for, stated specifically.',
    anchors: {
      3: { criterion: 'Concrete, observable expectation a peer could repeat back.', example: '"I need a one-page memo with the recommendation, three options, and the trade-offs."' },
      2: { criterion: 'Expectation stated but with ambiguity.', example: '"I need a write-up on the options."' },
      1: { criterion: 'General direction.', example: '"Do better at communicating up."' },
      0: { criterion: 'No expectation stated.', example: '(no clear ask)' },
    },
  },
  'SCE.Success': {
    definition: 'What "done" or "good" looks like, defined observably.',
    anchors: {
      3: { criterion: 'Observable success criteria — what someone would see, hear, or measure.', example: '"Done means the CFO can read it once and approve without follow-up questions."' },
      2: { criterion: 'Success described but partial.', example: '"It should be clear enough for the CFO to act on."' },
      1: { criterion: 'Vague quality bar.', example: '"Make it high quality."' },
      0: { criterion: 'No success criteria.', example: '(no bar set)' },
    },
  },
  'SCE.Understanding': {
    definition: 'Confirmed the expectation landed — the other person\'s interpretation surfaced.',
    anchors: {
      3: { criterion: 'Explicit check — asked them to play it back, raised obstacles, aligned on interpretation.', example: '"I asked her to walk me through how she\'d approach it."' },
      2: { criterion: 'Brief confirmation ("does that make sense?") with a real response.', example: '"She said \'got it, I\'ll have it Thursday.\'"' },
      1: { criterion: 'Assumed understanding from silence or a nod.', example: '"She nodded so I moved on."' },
      0: { criterion: 'No check.', example: '(no confirmation)' },
    },
  },
  'SCE.Ownership': {
    definition: 'Who owns delivery, confirmed.',
    anchors: {
      3: { criterion: 'Named owner + commitment + cadence.', example: '"She owns it; we sync Wednesday at 4."' },
      2: { criterion: 'Owner clear but commitment soft.', example: '"She\'s got it."' },
      1: { criterion: 'Implied ownership.', example: '"The team will handle it."' },
      0: { criterion: 'No owner named.', example: '(no owner)' },
    },
  },
});

const RR_CONFIG = Object.freeze({
  DRF: {
    code: 'DRF',
    name: 'Reinforcing Feedback',
    version: '2026-05-09',
    conditions: ['Behavior', 'Impact', 'Reinforcement'],
    critical: ['Behavior'],
    passThreshold: 5,
    // Per-condition fail rule: returns null if OK, or { reason } if fail.
    failRules: [
      (scores) =>
        scores.Behavior <= SCORE.WEAK
          ? { reason: 'Behavior not specific or observable enough.', condition: 'Behavior' }
          : null,
      // Reinforcement without impact is just praise — name why this matters.
      (scores) =>
        scores.Impact === SCORE.MISSING
          ? { reason: 'Impact missing — without it, reinforcement reads as generic praise.', condition: 'Impact' }
          : null,
    ],
    // Strong rep rule: returns true if eligible to suppress coaching question.
    strongRepRule: (scores) =>
      scores.Behavior >= SCORE.ADEQUATE &&
      scores.Impact >= SCORE.ADEQUATE &&
      scores.Reinforcement >= SCORE.ADEQUATE &&
      countAtLeast(scores, SCORE.STRONG) >= 2,
  },

  RED: {
    code: 'RED',
    name: 'Redirecting Feedback',
    version: '2026-05-09',
    conditions: [
      'Behavior',
      'Impact',
      'Request',
      'DirectDelivery',
      'DeliveryDiscipline',
    ],
    critical: ['Behavior', 'Impact', 'Request'],
    // Threshold raised from 9 → 10 so a Pass requires at least one
    // non-critical condition to also clear Adequate. Prevents "3 criticals
    // at the floor + nothing else" from passing.
    passThreshold: 10,
    failRules: [
      (scores) =>
        scores.Behavior <= SCORE.WEAK
          ? { reason: 'Behavior not specific enough to redirect.', condition: 'Behavior' }
          : null,
      (scores) =>
        scores.Request <= SCORE.WEAK
          ? { reason: 'No clear request for what should change.', condition: 'Request' }
          : null,
      (scores) =>
        scores.Impact === SCORE.MISSING
          ? { reason: 'Impact missing — leader did not name why this matters.', condition: 'Impact' }
          : null,
    ],
    // RED is stricter: requires Strong on Behavior + Request, Adequate on Impact
    strongRepRule: (scores) =>
      scores.Behavior >= SCORE.STRONG &&
      scores.Request >= SCORE.STRONG &&
      scores.Impact >= SCORE.ADEQUATE,
  },

  FUW: {
    code: 'FUW',
    name: 'Follow-Up on Work',
    version: '2026-05-09',
    conditions: ['WorkAnchored', 'ProgressVisibility', 'Ownership'],
    critical: ['WorkAnchored'],
    passThreshold: 5,
    failRules: [
      (scores) =>
        scores.WorkAnchored <= SCORE.WEAK
          ? { reason: 'Follow-up not anchored to a specific piece of work.', condition: 'WorkAnchored' }
          : null,
      // Follow-up that leaves no clear next owner trains the wrong habit.
      (scores) =>
        scores.Ownership <= SCORE.WEAK
          ? { reason: 'Follow-up left no clear next owner — accountability evaporates.', condition: 'Ownership' }
          : null,
    ],
    strongRepRule: (scores) =>
      scores.WorkAnchored >= SCORE.STRONG &&
      scores.ProgressVisibility >= SCORE.ADEQUATE &&
      scores.Ownership >= SCORE.ADEQUATE,
  },

  SCE: {
    code: 'SCE',
    name: 'Set Clear Expectations',
    version: '2026-05-09',
    conditions: ['Expectation', 'Success', 'Understanding', 'Ownership'],
    critical: ['Expectation', 'Success'],
    passThreshold: 6,
    failRules: [
      (scores) =>
        scores.Expectation <= SCORE.WEAK
          ? { reason: 'Expectation not stated specifically.', condition: 'Expectation' }
          : null,
      (scores) =>
        scores.Success <= SCORE.WEAK
          ? { reason: 'Success criteria not defined.', condition: 'Success' }
          : null,
      // The whole point of SCE is the other person knowing what's expected.
      // Zero check for understanding = expectation didn't actually land.
      (scores) =>
        scores.Understanding === SCORE.MISSING
          ? { reason: 'No check that the expectation landed — the other person\'s understanding never surfaced.', condition: 'Understanding' }
          : null,
    ],
    strongRepRule: (scores) =>
      scores.Expectation >= SCORE.STRONG &&
      scores.Success >= SCORE.STRONG &&
      scores.Ownership >= SCORE.ADEQUATE,
  },
});

const isValidRrType = (rrType) =>
  Object.prototype.hasOwnProperty.call(RR_CONFIG, rrType);

const getRrConfig = (rrType) => {
  if (!isValidRrType(rrType)) {
    throw new Error(`Unknown RR type: ${rrType}`);
  }
  return RR_CONFIG[rrType];
};

/**
 * Look up the anchored definition for `${rrType}.${condition}`.
 * Returns null if no definition exists (engine fall back to score-only).
 */
const getConditionDef = (rrType, condition) =>
  CONDITION_DEFS[`${rrType}.${condition}`] || null;

/**
 * Get all condition definitions for a given RR type, in declared order.
 * Used by the AI scorer to render anchored prompts.
 */
const getConditionDefsForRr = (rrType) => {
  const cfg = getRrConfig(rrType);
  return cfg.conditions.map((c) => ({
    name: c,
    critical: cfg.critical.includes(c),
    ...(getConditionDef(rrType, c) || { definition: '', anchors: {} }),
  }));
};

module.exports = {
  SCORE,
  SCORE_LABEL,
  RR_CONFIG,
  CONDITION_DEFS,
  isValidRrType,
  getRrConfig,
  getConditionDef,
  getConditionDefsForRr,
};
