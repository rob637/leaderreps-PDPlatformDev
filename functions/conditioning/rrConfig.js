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

const RR_CONFIG = Object.freeze({
  DRF: {
    code: 'DRF',
    name: 'Reinforcing Feedback',
    conditions: ['Behavior', 'Impact', 'Reinforcement'],
    critical: ['Behavior'],
    passThreshold: 5,
    // Per-condition fail rule: returns null if OK, or { reason } if fail.
    failRules: [
      (scores) =>
        scores.Behavior <= SCORE.WEAK
          ? { reason: 'Behavior not specific or observable enough.' }
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
    conditions: [
      'Behavior',
      'Impact',
      'Request',
      'DirectDelivery',
      'DeliveryDiscipline',
    ],
    critical: ['Behavior', 'Impact', 'Request'],
    passThreshold: 9,
    failRules: [
      (scores) =>
        scores.Behavior <= SCORE.WEAK
          ? { reason: 'Behavior not specific enough to redirect.' }
          : null,
      (scores) =>
        scores.Request <= SCORE.WEAK
          ? { reason: 'No clear request for what should change.' }
          : null,
      (scores) =>
        scores.Impact === SCORE.MISSING
          ? { reason: 'Impact missing — leader did not name why this matters.' }
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
    conditions: ['WorkAnchored', 'ProgressVisibility', 'Ownership'],
    critical: ['WorkAnchored'],
    passThreshold: 5,
    failRules: [
      (scores) =>
        scores.WorkAnchored <= SCORE.WEAK
          ? { reason: 'Follow-up not anchored to a specific piece of work.' }
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
    conditions: ['Expectation', 'Success', 'Understanding', 'Ownership'],
    critical: ['Expectation', 'Success'],
    passThreshold: 6,
    failRules: [
      (scores) =>
        scores.Expectation <= SCORE.WEAK
          ? { reason: 'Expectation not stated specifically.' }
          : null,
      (scores) =>
        scores.Success <= SCORE.WEAK
          ? { reason: 'Success criteria not defined.' }
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

module.exports = {
  SCORE,
  SCORE_LABEL,
  RR_CONFIG,
  isValidRrType,
  getRrConfig,
};
