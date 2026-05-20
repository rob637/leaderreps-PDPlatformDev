// functions/conditioning/engine.js
//
// Universal evaluation engine for Conditioning Light reps (v2).
//
// Strict execution order:
//   1. Validate Rep
//   2. Parse & Extract Evidence (caller responsibility — provided as `scores`)
//   3. Score Conditions (0-3 each)
//   4. Apply Fail Logic (IMMEDIATE OVERRIDE) — critical-condition rules
//      ALWAYS apply regardless of stakes (Phase 6 audit invariant).
//   5. Determine Result (Pass / Not Yet)
//   6. Check Pattern Triggers (skipped if fail)
//   7. Determine Mode (reinforce | sharpen | challenge | suppressed)
//      using the hidden stakes band + courage signals (RED).
//   8. Generate Output (template-based observation + question)
//
// Anti-drift defaults: stricter interpretation always wins. The engine never
// "helps" a rep pass; it only enforces what the AI scorer extracted.

'use strict';

const {
  SCORE,
  getRrConfig,
  getConditionLabel,
  STAKES_MODIFIERS,
  normalizeStakes,
  COURAGE_SIGNALS,
} = require('./rrConfig');
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
  for (const cond of cfg.conditions) {
    const s = scores[cond];
    if (typeof s !== 'number' || s < 0 || s > 3 || !Number.isInteger(s)) {
      return {
        valid: false,
        reason: `Invalid score for condition ${cond}`,
      };
    }
  }
  if (lowConfidence) {
    return { valid: false, reason: 'Input too vague to evaluate reliably' };
  }
  return { valid: true };
};

// ---------------------------------------------------------------------------
// STEP 4 — FAIL LOGIC (stakes never softens critical conditions — Phase 6)
// ---------------------------------------------------------------------------

const checkFail = (rrType, scores) => {
  const cfg = getRrConfig(rrType);

  for (const cond of cfg.critical) {
    if ((scores[cond] ?? 0) <= SCORE.WEAK) {
      return {
        failed: true,
        reason: `Critical condition "${cond}" too weak.`,
        condition: cond,
      };
    }
  }

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
// COURAGE SIGNALS (RED only — Phase 4)
// ---------------------------------------------------------------------------

const normalizeCourageSignals = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const k of COURAGE_SIGNALS) {
    out[k] = !!raw[k];
  }
  return out;
};

const firedCourageSignals = (signals) =>
  Object.entries(signals).filter(([, v]) => v).map(([k]) => k);

// ---------------------------------------------------------------------------
// COACHING TARGET
// ---------------------------------------------------------------------------

const findCoachingTarget = (rrType, scores) => {
  const cfg = getRrConfig(rrType);
  const entries = Object.entries(scores);
  entries.sort(([aName, aScore], [bName, bScore]) => {
    const aCrit = cfg.critical.includes(aName) ? 0 : 1;
    const bCrit = cfg.critical.includes(bName) ? 0 : 1;
    if (aCrit !== bCrit) return aCrit - bCrit;
    if (aScore !== bScore) return aScore - bScore;
    return aName.localeCompare(bName);
  });
  return entries[0]?.[0] || null;
};

// ---------------------------------------------------------------------------
// QUICK READ — per-condition v2 labels (Phase 2)
// ---------------------------------------------------------------------------

const buildQuickRead = (rrType, scores) => {
  const cfg = getRrConfig(rrType);
  const out = {};
  for (const cond of cfg.conditions) {
    out[cond] = getConditionLabel(rrType, cond, scores[cond] ?? 0);
  }
  return out;
};

// ---------------------------------------------------------------------------
// STRONG REP (with stakes modifier — Phase 1)
// ---------------------------------------------------------------------------

const isStrongRep = (rrType, scores, fail, stakes = 'moderate') => {
  if (fail.failed) return false;
  const cfg = getRrConfig(rrType);
  if (Object.values(scores).some((s) => s === SCORE.MISSING)) return false;
  for (const cond of cfg.critical) {
    if ((scores[cond] ?? 0) < SCORE.ADEQUATE) return false;
  }
  if (!cfg.strongRepRule(scores)) return false;

  // High-stakes tightening
  const mod = STAKES_MODIFIERS[normalizeStakes(stakes)];
  if (mod && mod.extraStrongRule && mod.extraStrongRule[rrType]) {
    if (!mod.extraStrongRule[rrType](scores)) return false;
  }
  return true;
};

// ---------------------------------------------------------------------------
// STEP 7 + 8 — MODE SELECTION + OUTPUT GENERATION
// ---------------------------------------------------------------------------

const generateOutput = ({
  rrType,
  scores,
  fail,
  result,
  pattern,
  stakes = 'moderate',
  courageSignals = {},
  recentlyUsedTemplates = [],
  rand = Math.random,
}) => {
  const quickRead = buildQuickRead(rrType, scores);
  const safeStakes = normalizeStakes(stakes);
  const mod = STAKES_MODIFIERS[safeStakes];
  const strong = !fail.failed && result === 'pass' && isStrongRep(rrType, scores, fail, safeStakes);

  // ---------- FAIL → CHALLENGE ----------
  if (fail.failed) {
    const failCondition = fail.condition;
    const obsKey = failCondition ? `${rrType}.${failCondition}.challenge` : null;
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
      mode: 'challenge',
      stakes: safeStakes,
    };
  }

  // ---------- RED COURAGE SIGNAL → forced sharpen ----------
  // Fires regardless of strong/gap on Pass. Per Phase 4: force `gap` case
  // with a RED.Courage.<signalName> observation. Only applies on Pass.
  if (rrType === 'RED' && result === 'pass') {
    const fired = firedCourageSignals(courageSignals);
    if (fired.length > 0) {
      const signal = fired[0]; // first fired wins; order is stable
      const obsBank = getObservationBank(`RED.Courage.${signal}`);
      const observation =
        selectTemplate(obsBank, recentlyUsedTemplates, rand) ||
        'The conversation drifted from holding the standard.';
      const question =
        selectTemplate(getQuestionBank('Request'), recentlyUsedTemplates, rand) ||
        'What would it look like to hold the standard next time?';
      return {
        result,
        quickRead,
        observation,
        question,
        patternKey: null,
        coachingTarget: 'Request',
        case: 'gap',
        mode: 'sharpen',
        stakes: safeStakes,
        courageSignal: signal,
      };
    }
  }

  // ---------- STRONG REP → REINFORCE ----------
  if (strong) {
    const cfg = getRrConfig(rrType);
    const target =
      cfg.critical.find((c) => (scores[c] ?? 0) >= SCORE.STRONG) ||
      cfg.critical[0];
    const obsKey = `${rrType}.${target}.reinforce`;
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
      mode: 'reinforce',
      stakes: safeStakes,
    };
  }

  // ---------- PATTERN OVERRIDE ----------
  // Pattern replaces standard observation and adds a question.
  // Low-stakes guard: suppress non-critical patterns when patternRequiresCritical.
  if (pattern) {
    const cfg = getRrConfig(rrType);
    const patternIsCritical = cfg.critical.includes(pattern.condition);
    const allowPattern = !mod.patternRequiresCritical || patternIsCritical;
    if (allowPattern) {
      const obsKey = `pattern.${pattern.condition}`;
      const obsBank = getObservationBank(obsKey);
      const observation =
        selectTemplate(obsBank, recentlyUsedTemplates, rand) ||
        'You keep landing on the same gap — name it and rep against it.';
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
        mode: 'sharpen',
        stakes: safeStakes,
      };
    }
  }

  // ---------- PASS, NOT SHARP ----------
  // Low stakes → suppress the gap question/observation (reinforce only).
  if (mod.suppressGapOnPass && result === 'pass') {
    const cfg = getRrConfig(rrType);
    const target =
      cfg.critical.find((c) => (scores[c] ?? 0) >= SCORE.ADEQUATE) ||
      cfg.critical[0];
    const obsKey = `${rrType}.${target}.reinforce`;
    const obsBank = getObservationBank(obsKey);
    const observation =
      selectTemplate(obsBank, recentlyUsedTemplates, rand) ||
      'You held the bar on the part that matters most here.';
    return {
      result,
      quickRead,
      observation,
      question: null,
      patternKey: null,
      coachingTarget: target,
      case: 'gap',
      mode: 'suppressed',
      stakes: safeStakes,
    };
  }

  const target = findCoachingTarget(rrType, scores);
  const obsKey = `${rrType}.${target}.sharpen`;
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
    mode: 'sharpen',
    stakes: safeStakes,
  };
};

// ---------------------------------------------------------------------------
// PUBLIC ENTRY POINT
// ---------------------------------------------------------------------------

const evaluateRep = (args) => {
  const validation = validateRep(args);
  if (!validation.valid) {
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
      mode: 'challenge',
      stakes: normalizeStakes(args.stakes),
      failReason: validation.reason,
      conditionScores: args.scores || {},
      totalScore: 0,
    };
  }

  const {
    rrType,
    scores,
    stakes,
    courageSignals: rawCourage,
    recentReps = [],
    recentlyUsedTemplates = [],
    rand,
  } = args;

  const courageSignals =
    rrType === 'RED' ? normalizeCourageSignals(rawCourage) : {};

  const fail = checkFail(rrType, scores);
  const result = determineResult(rrType, scores, fail);

  let pattern = null;
  if (!fail.failed) {
    pattern = detectPattern(
      { rrType, conditionScores: scores, result },
      recentReps
    );
  }

  const output = generateOutput({
    rrType,
    scores,
    fail,
    result,
    pattern,
    stakes,
    courageSignals,
    recentlyUsedTemplates,
    rand,
  });

  return {
    validity: 'valid',
    ...output,
    courageSignals: rrType === 'RED' ? courageSignals : null,
    failReason: fail.failed ? fail.reason : null,
    conditionScores: scores,
    totalScore: totalScore(scores),
  };
};

module.exports = {
  evaluateRep,
  validateRep,
  checkFail,
  determineResult,
  isStrongRep,
  findCoachingTarget,
  buildQuickRead,
  totalScore,
  normalizeCourageSignals,
  firedCourageSignals,
};
