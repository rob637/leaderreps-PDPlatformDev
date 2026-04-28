// functions/conditioning/engine.js
//
// Universal evaluation engine for Conditioning Light reps.
//
// Strict execution order (Implementation Rules Addendum §1):
//   1. Validate Rep
//   2. Parse & Extract Evidence (caller responsibility — provided as `scores`)
//   3. Score Conditions (0-3 each) — scores object passed in
//   4. Apply Fail Logic (IMMEDIATE OVERRIDE)
//   5. Determine Result (Pass / Not Yet)
//   6. Check Pattern Triggers (skipped if fail)
//   7. Generate Output (template-based observation + question)
//
// Anti-drift defaults: stricter interpretation always wins. The engine never
// "helps" a rep pass; it only enforces what the AI scorer extracted.

'use strict';

const { SCORE, SCORE_LABEL, getRrConfig } = require('./rrConfig');
const { detectPattern } = require('./patternDetection');
const {
  selectTemplate,
  getObservationBank,
  getQuestionBank,
} = require('./templates');

// ---------------------------------------------------------------------------
// STEP 1 — VALIDATE
// ---------------------------------------------------------------------------

const validateRep = ({ rrType, transcript, scores, lowConfidence }) => {
  if (!rrType) return { valid: false, reason: 'Missing rrType' };
  let cfg;
  try {
    cfg = getRrConfig(rrType);
  } catch {
    return { valid: false, reason: `Unknown rrType: ${rrType}` };
  }
  if (typeof transcript !== 'string' || transcript.trim().length === 0) {
    return { valid: false, reason: 'Empty transcript' };
  }
  if (!scores || typeof scores !== 'object') {
    return { valid: false, reason: 'No scores provided' };
  }
  // Every required condition must have a numeric score 0-3
  for (const cond of cfg.conditions) {
    const s = scores[cond];
    if (typeof s !== 'number' || s < 0 || s > 3 || !Number.isInteger(s)) {
      return {
        valid: false,
        reason: `Invalid score for condition ${cond}`,
      };
    }
  }
  // Low-confidence flag from scorer makes the rep invalid (per spec §5
  // Voice Input Confidence Rule).
  if (lowConfidence) {
    return { valid: false, reason: 'Input too vague to evaluate reliably' };
  }
  return { valid: true };
};

// ---------------------------------------------------------------------------
// STEP 4 — FAIL LOGIC
// ---------------------------------------------------------------------------

const checkFail = (rrType, scores) => {
  const cfg = getRrConfig(rrType);

  // Critical condition rule: any critical <= 1 → fail
  for (const cond of cfg.critical) {
    if ((scores[cond] ?? 0) <= SCORE.WEAK) {
      return {
        failed: true,
        reason: `Critical condition "${cond}" too weak.`,
        condition: cond,
      };
    }
  }

  // RR-specific fail rules
  for (const rule of cfg.failRules) {
    const result = rule(scores);
    if (result) {
      return {
        failed: true,
        reason: result.reason,
        condition: result.condition || null,
      };
    }
  }

  return { failed: false };
};

// ---------------------------------------------------------------------------
// STEP 5 — RESULT
// ---------------------------------------------------------------------------

const totalScore = (scores) =>
  Object.values(scores).reduce((sum, s) => sum + (s || 0), 0);

const determineResult = (rrType, scores, fail) => {
  if (fail.failed) return 'notYet';
  const cfg = getRrConfig(rrType);
  const total = totalScore(scores);
  return total >= cfg.passThreshold ? 'pass' : 'notYet';
};

// ---------------------------------------------------------------------------
// STEP 7 — OUTPUT GENERATION
// ---------------------------------------------------------------------------

/**
 * Identify which condition has the lowest score (highest leverage gap).
 * Critical conditions take precedence over non-critical ties.
 */
const findCoachingTarget = (rrType, scores) => {
  const cfg = getRrConfig(rrType);
  const entries = Object.entries(scores);
  // Sort: critical first, then lowest score, then alphabetical
  entries.sort(([aName, aScore], [bName, bScore]) => {
    const aCrit = cfg.critical.includes(aName) ? 0 : 1;
    const bCrit = cfg.critical.includes(bName) ? 0 : 1;
    if (aCrit !== bCrit) return aCrit - bCrit;
    if (aScore !== bScore) return aScore - bScore;
    return aName.localeCompare(bName);
  });
  return entries[0]?.[0] || null;
};

/**
 * Build the user-facing Quick Read object — labels only, no numbers.
 */
const buildQuickRead = (rrType, scores) => {
  const cfg = getRrConfig(rrType);
  const out = {};
  for (const cond of cfg.conditions) {
    out[cond] = SCORE_LABEL[scores[cond] ?? 0];
  }
  return out;
};

/**
 * Determine if this rep qualifies as a Strong Rep (suppress question).
 * Per Implementation Rules Addendum §4.
 */
const isStrongRep = (rrType, scores, fail) => {
  if (fail.failed) return false;
  const cfg = getRrConfig(rrType);
  // Global eligibility
  if (Object.values(scores).some((s) => s === SCORE.MISSING)) return false;
  for (const cond of cfg.critical) {
    if ((scores[cond] ?? 0) < SCORE.ADEQUATE) return false;
  }
  // RR-specific extra rule
  return cfg.strongRepRule(scores);
};

/**
 * Generate the user-facing output payload.
 *
 * @param {object} args
 * @param {string} args.rrType
 * @param {object} args.scores
 * @param {object} args.fail        - result of checkFail()
 * @param {string} args.result      - 'pass' | 'notYet'
 * @param {object|null} args.pattern - detectPattern result (or null)
 * @param {string[]} args.recentlyUsedTemplates - last few templates to avoid
 * @param {() => number} [args.rand=Math.random]
 */
const generateOutput = ({
  rrType,
  scores,
  fail,
  result,
  pattern,
  recentlyUsedTemplates = [],
  rand = Math.random,
}) => {
  const quickRead = buildQuickRead(rrType, scores);
  const strong = !fail.failed && result === 'pass' && isStrongRep(rrType, scores, fail);

  // ---------- FAIL CASE (Case 3) ----------
  // Per spec §12: 1 clear failure observation + 1 question targeting failure.
  // No reinforcement, no pattern messaging.
  if (fail.failed) {
    const failCondition = fail.condition;
    const obsKey = failCondition
      ? `${rrType}.${failCondition}.fail`
      : null;
    const obsBank = obsKey ? getObservationBank(obsKey) : [];
    const observation =
      selectTemplate(obsBank, recentlyUsedTemplates, rand) || fail.reason;
    const questionBank = failCondition
      ? getQuestionBank(failCondition)
      : getQuestionBank('Clarity');
    const question =
      selectTemplate(questionBank, recentlyUsedTemplates, rand) ||
      'What would be different next time?';
    return {
      result: 'notYet',
      quickRead,
      observation,
      question,
      patternKey: null,
      coachingTarget: failCondition,
      case: 'fail',
    };
  }

  // ---------- STRONG REP (Case 1) ----------
  // 1 reinforcing observation, NO question.
  if (strong) {
    // Find the strongest critical condition for the reinforcing message
    const cfg = getRrConfig(rrType);
    const target =
      cfg.critical.find((c) => (scores[c] ?? 0) >= SCORE.STRONG) ||
      cfg.critical[0];
    const obsKey = `${rrType}.${target}.strong`;
    const obsBank = getObservationBank(obsKey);
    const observation =
      selectTemplate(obsBank, recentlyUsedTemplates, rand) ||
      'Clean rep — keep that bar.';
    return {
      result: 'pass',
      quickRead,
      observation,
      question: null,
      patternKey: null,
      coachingTarget: target,
      case: 'strong',
    };
  }

  // ---------- PATTERN OVERRIDE ----------
  // Per spec §10: pattern observation REPLACES standard observation, includes
  // a question. Does NOT stack with other insights.
  if (pattern) {
    const obsKey = `pattern.${pattern.condition}`;
    const obsBank = getObservationBank(obsKey);
    const observation =
      selectTemplate(obsBank, recentlyUsedTemplates, rand) ||
      `A pattern: ${pattern.condition} keeps coming in low.`;
    const questionBank = getQuestionBank(pattern.condition);
    const question =
      selectTemplate(questionBank, recentlyUsedTemplates, rand) ||
      'What would change that next time?';
    return {
      result,
      quickRead,
      observation,
      question,
      patternKey: pattern.key,
      coachingTarget: pattern.condition,
      case: 'pattern',
    };
  }

  // ---------- PASS, NOT SHARP (Case 2) ----------
  // 1 observation + 1 question on the highest-leverage gap.
  const target = findCoachingTarget(rrType, scores);
  const obsKey = `${rrType}.${target}.gap`;
  const obsBank = getObservationBank(obsKey);
  const observation =
    selectTemplate(obsBank, recentlyUsedTemplates, rand) ||
    `${target} could be sharper.`;
  const questionBank = getQuestionBank(target);
  const question =
    selectTemplate(questionBank, recentlyUsedTemplates, rand) ||
    'What would make that more specific next time?';
  return {
    result,
    quickRead,
    observation,
    question,
    patternKey: null,
    coachingTarget: target,
    case: 'gap',
  };
};

// ---------------------------------------------------------------------------
// PUBLIC ENTRY POINT
// ---------------------------------------------------------------------------

/**
 * Evaluate a single rep. Pure function — no IO. The Cloud Function wrapper
 * is responsible for AI scoring (transcript → scores), Firestore reads
 * (recent reps), and Firestore writes (storing the result).
 *
 * @param {object} args
 * @param {string} args.rrType
 * @param {string} args.transcript          - Raw user input
 * @param {object} args.scores              - { [condition]: 0-3 } from AI scorer
 * @param {boolean} [args.lowConfidence]    - AI scorer's confidence flag
 * @param {Array}  [args.recentReps]        - Newest-first array of prior reps
 * @param {string[]} [args.recentlyUsedTemplates]
 * @param {() => number} [args.rand]
 * @returns {object} Full evaluation result (see test cases for shape)
 */
const evaluateRep = (args) => {
  // STEP 1: Validate
  const validation = validateRep(args);
  if (!validation.valid) {
    // Per spec §12 (Valid vs Invalid): UX-collapsed to Not Yet, but tracked
    // as `validity: 'invalid'` internally.
    const cfg = (() => {
      try { return getRrConfig(args.rrType); } catch { return null; }
    })();
    const quickRead = cfg
      ? cfg.conditions.reduce((acc, c) => {
        acc[c] = 'Missing';
        return acc;
      }, {})
      : {};
    return {
      validity: 'invalid',
      result: 'notYet',
      quickRead,
      observation: 'This is too general to evaluate.',
      question: 'What specifically did you say or do?',
      patternKey: null,
      coachingTarget: null,
      case: 'invalid',
      failReason: validation.reason,
      conditionScores: args.scores || {},
      totalScore: 0,
    };
  }

  const { rrType, scores, recentReps = [], recentlyUsedTemplates = [], rand } = args;

  // STEP 4: Fail logic (immediate override)
  const fail = checkFail(rrType, scores);

  // STEP 5: Result
  const result = determineResult(rrType, scores, fail);

  // STEP 6: Pattern detection — SKIPPED if fail
  let pattern = null;
  if (!fail.failed) {
    pattern = detectPattern(
      { rrType, conditionScores: scores, result },
      recentReps
    );
  }

  // STEP 7: Generate output
  const output = generateOutput({
    rrType,
    scores,
    fail,
    result,
    pattern,
    recentlyUsedTemplates,
    rand,
  });

  return {
    validity: 'valid',
    ...output,
    failReason: fail.failed ? fail.reason : null,
    conditionScores: scores,
    totalScore: totalScore(scores),
  };
};

module.exports = {
  evaluateRep,
  // exposed for tests
  validateRep,
  checkFail,
  determineResult,
  isStrongRep,
  findCoachingTarget,
  buildQuickRead,
  totalScore,
};
