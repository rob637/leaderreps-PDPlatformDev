// src/services/assessmentScoring.js
// Single source of truth for the Leadership Skills Baseline question catalog,
// scoring, and growth/diff helpers. Used by the assessment form, dashboard
// widgets, history/compare views, and admin reports.

// ---------------------------------------------------------------------------
// Question catalog — versioned so future wording changes don't silently
// invalidate historical comparisons.
// ---------------------------------------------------------------------------

export const CURRENT_QUESTION_VERSION = 'v1';

const V1_FREQUENCY_QUESTIONS = [
  { id: 'q1', text: 'I clearly defined the criteria for success when I assigned work.', category: 'Clarity' },
  { id: 'q2', text: 'I explicitly named ownership of the outcome and confirmed that my direct accepted it.', category: 'Ownership' },
  { id: 'q3', text: 'I gave reinforcing (positive) feedback tied to a specific behavior and impact.', category: 'Feedback' },
  { id: 'q4', text: 'I gave redirecting (correcting) feedback when behavior missed the standard.', category: 'Feedback' },
  { id: 'q5', text: 'I followed up on work rather than assuming it was on track.', category: 'Follow-Through' },
  { id: 'q6', text: 'I modeled vulnerability by acknowledging a mistake, gap, or miss of my own.', category: 'Vulnerability' },
  { id: 'q7', text: 'I intentionally checked after giving feedback to confirm whether the behavior changed.', category: 'Follow-Through' },
  { id: 'q8', text: 'I noticed patterns early rather than waiting until issues escalated.', category: 'Awareness' },
  { id: 'q9', text: 'I asked my direct report for their plan when progress stalled or mistakes happened on their assigned work.', category: 'Ownership' },
  { id: 'q10', text: 'I adjusted my approach when I met resistance during feedback.', category: 'Adaptability' },
];

const V1_AGREEMENT_QUESTIONS = [
  { id: 'q11', text: 'I have a clear intention for how I want to show up when navigating a difficult leadership moment.', category: 'Intentionality' },
  { id: 'q12', text: 'I have practical tools to handle difficult conversations with my direct report(s).', category: 'Tools' },
  { id: 'q13', text: 'I hold regular one-on-ones with my direct report(s) and allow them to set the agenda.', category: 'Structure' },
];

const V1_OPEN_TEXT_QUESTION = {
  id: 'q14',
  text: 'What leadership situation is currently challenging or frustrating for you?',
  category: 'Reflection',
};

const V1_MULTI_SELECT_QUESTION = {
  id: 'q15',
  text: 'Which important leadership moments do you tend to delay, soften, or avoid?',
  subtitle: 'Check all that apply. There are no "right" or "wrong" answers.',
  category: 'Self-Awareness',
  options: [
    'Redirecting poor performance.',
    'Clarifying expectations when things feel awkward.',
    'Holding someone who is well-liked accountable.',
    'Letting someone struggle instead of stepping in.',
    'Following up when I expect resistance.',
    'I rarely avoid these moments. I tend to act quickly.',
  ],
};

export const QUESTION_VERSIONS = {
  v1: {
    frequencyQuestions: V1_FREQUENCY_QUESTIONS,
    agreementQuestions: V1_AGREEMENT_QUESTIONS,
    openTextQuestion: V1_OPEN_TEXT_QUESTION,
    multiSelectQuestion: V1_MULTI_SELECT_QUESTION,
    scoredQuestions: [...V1_FREQUENCY_QUESTIONS, ...V1_AGREEMENT_QUESTIONS],
    scaleMax: 4,
    standard: 3, // anything below this is treated as a gap
  },
};

// Convenience re-exports for the current version (used by the form today).
export const FREQUENCY_QUESTIONS = V1_FREQUENCY_QUESTIONS;
export const AGREEMENT_QUESTIONS = V1_AGREEMENT_QUESTIONS;
export const OPEN_TEXT_QUESTION = V1_OPEN_TEXT_QUESTION;
export const MULTI_SELECT_QUESTION = V1_MULTI_SELECT_QUESTION;
export const ALL_SCORED_QUESTIONS = QUESTION_VERSIONS.v1.scoredQuestions;
export const TOTAL_REQUIRED = ALL_SCORED_QUESTIONS.length + 2; // +open text +multi-select

export function getQuestionSet(version = CURRENT_QUESTION_VERSION) {
  return QUESTION_VERSIONS[version] || QUESTION_VERSIONS[CURRENT_QUESTION_VERSION];
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Compute aggregate scores from raw answers.
 * Returns numeric averages on the 1–4 scale plus counts.
 */
export function computeScores(answers, version = CURRENT_QUESTION_VERSION) {
  const set = getQuestionSet(version);
  const empty = {
    version,
    overall: 0,
    answeredCount: 0,
    gapCount: 0,
    completeness: 0,
    byCategory: {},
  };
  if (!answers || typeof answers !== 'object') return empty;

  const byCategory = {};
  let sum = 0;
  let answered = 0;
  let gaps = 0;

  set.scoredQuestions.forEach((q) => {
    const raw = Number(answers[q.id]);
    if (!Number.isFinite(raw) || raw <= 0) return;
    answered += 1;
    sum += raw;
    if (raw < set.standard) gaps += 1;
    if (!byCategory[q.category]) byCategory[q.category] = { sum: 0, count: 0 };
    byCategory[q.category].sum += raw;
    byCategory[q.category].count += 1;
  });

  Object.keys(byCategory).forEach((k) => {
    const { sum: s, count } = byCategory[k];
    byCategory[k] = { avg: round2(s / count), count };
  });

  const hasOpenText = typeof answers.q14 === 'string' && answers.q14.trim().length > 0;
  const hasMultiSelect = Array.isArray(answers.q15) && answers.q15.length > 0;
  const completeness = Math.round(
    ((answered + (hasOpenText ? 1 : 0) + (hasMultiSelect ? 1 : 0)) / TOTAL_REQUIRED) * 100
  );

  return {
    version,
    overall: answered > 0 ? round2(sum / answered) : 0,
    answeredCount: answered,
    gapCount: gaps,
    completeness,
    byCategory,
  };
}

/**
 * Returns the assessment with `id`, `version`, and `scores` fields filled in
 * when missing. Safe to call on legacy records read from Firestore.
 */
export function enrichAssessment(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const version = raw.version || CURRENT_QUESTION_VERSION;
  const scores = raw.scores || computeScores(raw.answers, version);
  const id = raw.id || (raw.date ? `ba_${new Date(raw.date).getTime()}` : `ba_${Date.now()}`);
  return { ...raw, id, version, scores };
}

// ---------------------------------------------------------------------------
// Comparison / growth
// ---------------------------------------------------------------------------

const deltaEntry = (from, to) => ({
  from: round2(from),
  to: round2(to),
  delta: round2(to - from),
});

/**
 * Diff two assessments. Categories are intersected so cross-version diffs
 * (when question wording changes) only compare overlapping categories.
 * Returns null if either input is missing.
 */
export function diffAssessments(prev, next) {
  if (!prev || !next) return null;
  const a = enrichAssessment(prev);
  const b = enrichAssessment(next);

  const overall = deltaEntry(a.scores.overall, b.scores.overall);

  const cats = new Set([
    ...Object.keys(a.scores.byCategory || {}),
    ...Object.keys(b.scores.byCategory || {}),
  ]);
  const byCategory = {};
  cats.forEach((cat) => {
    const fromAvg = a.scores.byCategory?.[cat]?.avg ?? 0;
    const toAvg = b.scores.byCategory?.[cat]?.avg ?? 0;
    byCategory[cat] = deltaEntry(fromAvg, toAvg);
  });

  return {
    fromId: a.id,
    toId: b.id,
    fromDate: a.date,
    toDate: b.date,
    sameVersion: a.version === b.version,
    overall,
    byCategory,
  };
}

/**
 * Build a small summary suitable for mirroring on the user/dev-plan doc for
 * fast widget reads without scanning the full history array.
 */
export function buildLatestSummary(assessment) {
  if (!assessment) return null;
  const enriched = enrichAssessment(assessment);
  return {
    id: enriched.id,
    date: enriched.date,
    cycle: enriched.cycle ?? null,
    version: enriched.version,
    scores: enriched.scores,
  };
}

// ---------------------------------------------------------------------------
// Retake cooldown
// ---------------------------------------------------------------------------

// Minimum days between assessments. Guards against noisy short-interval data
// without preventing genuine end-of-program or milestone retakes.
export const RETAKE_COOLDOWN_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Determine whether the user may take the assessment again.
 * Returns `{ allowed, daysRemaining, lastDate }`. The first take is always allowed.
 */
export function canRetake(history, now = new Date(), cooldownDays = RETAKE_COOLDOWN_DAYS) {
  if (!Array.isArray(history) || history.length === 0) {
    return { allowed: true, daysRemaining: 0, lastDate: null };
  }
  // History may be unsorted; find the most recent valid date.
  let latestTs = 0;
  history.forEach((a) => {
    const t = a?.date ? new Date(a.date).getTime() : 0;
    if (Number.isFinite(t) && t > latestTs) latestTs = t;
  });
  if (latestTs === 0) {
    return { allowed: true, daysRemaining: 0, lastDate: null };
  }
  const nowTs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const elapsedDays = (nowTs - latestTs) / MS_PER_DAY;
  const daysRemaining = Math.max(0, Math.ceil(cooldownDays - elapsedDays));
  return {
    allowed: daysRemaining === 0,
    daysRemaining,
    lastDate: new Date(latestTs).toISOString(),
  };
}
