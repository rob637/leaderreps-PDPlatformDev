// Unit tests for src/services/assessmentScoring.js
import { describe, it, expect } from 'vitest';
import {
  computeScores,
  diffAssessments,
  enrichAssessment,
  buildLatestSummary,
  canRetake,
  RETAKE_COOLDOWN_DAYS,
  ALL_SCORED_QUESTIONS,
  CURRENT_QUESTION_VERSION,
  TOTAL_REQUIRED,
} from '../services/assessmentScoring';

const makeAnswers = (value, extras = {}) => {
  const a = {};
  ALL_SCORED_QUESTIONS.forEach((q) => { a[q.id] = value; });
  return { ...a, q14: 'reflection', q15: ['Redirecting poor performance.'], ...extras };
};

describe('computeScores', () => {
  it('returns zeroed result for missing input', () => {
    const r = computeScores(null);
    expect(r.overall).toBe(0);
    expect(r.answeredCount).toBe(0);
    expect(r.gapCount).toBe(0);
    expect(r.completeness).toBe(0);
    expect(r.byCategory).toEqual({});
  });

  it('computes overall average across all scored questions', () => {
    const r = computeScores(makeAnswers(3));
    expect(r.overall).toBe(3);
    expect(r.answeredCount).toBe(ALL_SCORED_QUESTIONS.length);
    expect(r.gapCount).toBe(0); // 3 == standard, not a gap
  });

  it('counts answers below standard as gaps', () => {
    const r = computeScores(makeAnswers(2));
    expect(r.overall).toBe(2);
    expect(r.gapCount).toBe(ALL_SCORED_QUESTIONS.length);
  });

  it('aggregates by category', () => {
    const r = computeScores(makeAnswers(4));
    // Feedback has 2 questions (q3, q4) — avg should still be 4
    expect(r.byCategory.Feedback.avg).toBe(4);
    expect(r.byCategory.Feedback.count).toBe(2);
    expect(r.byCategory.Clarity.count).toBe(1);
  });

  it('reports 100% completeness when scored + open + multi-select are all present', () => {
    const r = computeScores(makeAnswers(3));
    expect(r.completeness).toBe(100);
  });

  it('ignores invalid answer values', () => {
    const r = computeScores({ q1: 'not-a-number', q2: 0, q3: 4 });
    expect(r.answeredCount).toBe(1);
    expect(r.overall).toBe(4);
  });
});

describe('enrichAssessment', () => {
  it('fills in id, version, and scores when missing', () => {
    const raw = { date: '2026-01-01T00:00:00.000Z', answers: makeAnswers(3), cycle: 1 };
    const e = enrichAssessment(raw);
    expect(e.id).toMatch(/^ba_/);
    expect(e.version).toBe(CURRENT_QUESTION_VERSION);
    expect(e.scores.overall).toBe(3);
  });

  it('preserves existing scores', () => {
    const raw = { id: 'ba_existing', version: 'v1', scores: { overall: 2.5, byCategory: {} }, answers: {} };
    const e = enrichAssessment(raw);
    expect(e.id).toBe('ba_existing');
    expect(e.scores.overall).toBe(2.5);
  });
});

describe('diffAssessments', () => {
  it('returns null when either side is missing', () => {
    expect(diffAssessments(null, { answers: {} })).toBeNull();
    expect(diffAssessments({ answers: {} }, null)).toBeNull();
  });

  it('computes per-category and overall deltas', () => {
    const prev = { date: 'd1', answers: makeAnswers(2) };
    const next = { date: 'd2', answers: makeAnswers(4) };
    const d = diffAssessments(prev, next);
    expect(d.overall.from).toBe(2);
    expect(d.overall.to).toBe(4);
    expect(d.overall.delta).toBe(2);
    expect(d.byCategory.Clarity.delta).toBe(2);
    expect(d.sameVersion).toBe(true);
  });

  it('flags cross-version diffs', () => {
    const prev = { date: 'd1', version: 'v1', answers: makeAnswers(3) };
    const next = { date: 'd2', version: 'v2', answers: makeAnswers(3) };
    const d = diffAssessments(prev, next);
    expect(d.sameVersion).toBe(false);
  });
});

describe('buildLatestSummary', () => {
  it('returns a compact mirror of the latest assessment', () => {
    const a = { date: '2026-01-01T00:00:00.000Z', cycle: 2, answers: makeAnswers(3) };
    const s = buildLatestSummary(a);
    expect(s.cycle).toBe(2);
    expect(s.version).toBe(CURRENT_QUESTION_VERSION);
    expect(s.scores.overall).toBe(3);
    expect(s.id).toMatch(/^ba_/);
  });

  it('returns null for missing input', () => {
    expect(buildLatestSummary(null)).toBeNull();
  });
});

describe('TOTAL_REQUIRED', () => {
  it('matches scored questions + open text + multi-select', () => {
    expect(TOTAL_REQUIRED).toBe(ALL_SCORED_QUESTIONS.length + 2);
  });
});

describe('canRetake', () => {
  const daysAgoISO = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  it('allows the first take when history is empty', () => {
    expect(canRetake([])).toEqual({ allowed: true, daysRemaining: 0, lastDate: null });
    expect(canRetake(null).allowed).toBe(true);
  });

  it('blocks when within the cooldown window', () => {
    const r = canRetake([{ date: daysAgoISO(1) }]);
    expect(r.allowed).toBe(false);
    expect(r.daysRemaining).toBeGreaterThan(0);
    expect(r.daysRemaining).toBeLessThanOrEqual(RETAKE_COOLDOWN_DAYS);
  });

  it('allows once cooldown has elapsed', () => {
    const r = canRetake([{ date: daysAgoISO(RETAKE_COOLDOWN_DAYS + 1) }]);
    expect(r.allowed).toBe(true);
    expect(r.daysRemaining).toBe(0);
  });

  it('uses the most recent date regardless of array order', () => {
    const r = canRetake([
      { date: daysAgoISO(100) },
      { date: daysAgoISO(1) }, // most recent
      { date: daysAgoISO(50) },
    ]);
    expect(r.allowed).toBe(false);
  });

  it('honors a custom cooldown', () => {
    const r = canRetake([{ date: daysAgoISO(3) }], new Date(), 1);
    expect(r.allowed).toBe(true);
  });
});
