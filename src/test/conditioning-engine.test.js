// src/test/conditioning-engine.test.js
//
// Vitest suite for the Conditioning Light evaluation engine.
// Covers REVAMP-PLAN.md §6 (RR rules) + §10 (patterns) + §12 (output cases).
//
// The engine modules live under `functions/conditioning/` and are CommonJS.
// Vitest loads them via standard interop. These are pure functions — no IO,
// no Firebase — so we can test them directly with crafted score objects.

import { describe, it, expect } from 'vitest';

// eslint-disable-next-line import/no-relative-packages
import {
  evaluateRep,
  checkFail,
  determineResult,
  isStrongRep,
  buildQuickRead,
  totalScore,
} from '../../functions/conditioning/engine.js';
// eslint-disable-next-line import/no-relative-packages
import { detectPattern, findLowestCondition } from '../../functions/conditioning/patternDetection.js';
// eslint-disable-next-line import/no-relative-packages
import { SCORE, getRrConfig } from '../../functions/conditioning/rrConfig.js';

const transcript = 'I told Alex that the way they framed the trade-off was sharp.';

const baseArgs = (overrides = {}) => ({
  rrType: 'DRF',
  transcript,
  scores: { Behavior: 2, Impact: 2, Reinforcement: 2 },
  recentReps: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Validity / invalid path
// ---------------------------------------------------------------------------
describe('evaluateRep — validity', () => {
  it('marks empty transcript as invalid → notYet, validity=invalid', () => {
    const out = evaluateRep(baseArgs({ transcript: '' }));
    expect(out.validity).toBe('invalid');
    expect(out.result).toBe('notYet');
    expect(out.case).toBe('invalid');
  });

  it('marks unknown rrType as invalid', () => {
    const out = evaluateRep(baseArgs({ rrType: 'XXX' }));
    expect(out.validity).toBe('invalid');
    expect(out.case).toBe('invalid');
  });

  it('marks lowConfidence as invalid even with full scores', () => {
    const out = evaluateRep(
      baseArgs({
        scores: { Behavior: 3, Impact: 3, Reinforcement: 3 },
        lowConfidence: true,
      })
    );
    expect(out.validity).toBe('invalid');
    expect(out.result).toBe('notYet');
  });

  it('rejects non-integer / out-of-range scores as invalid', () => {
    const out = evaluateRep(baseArgs({ scores: { Behavior: 4, Impact: 2, Reinforcement: 2 } }));
    expect(out.validity).toBe('invalid');
  });

  it('rejects missing condition score as invalid', () => {
    const out = evaluateRep(baseArgs({ scores: { Behavior: 2, Impact: 2 } }));
    expect(out.validity).toBe('invalid');
  });
});

// ---------------------------------------------------------------------------
// DRF — Reinforcing Feedback
// ---------------------------------------------------------------------------
describe('DRF — Reinforcing Feedback', () => {
  it('fails when Behavior is Weak (critical condition rule)', () => {
    const fail = checkFail('DRF', { Behavior: 1, Impact: 3, Reinforcement: 3 });
    expect(fail.failed).toBe(true);
    expect(fail.condition).toBe('Behavior');
  });

  it('passes when total >= 5 and no fail', () => {
    expect(determineResult('DRF', { Behavior: 2, Impact: 2, Reinforcement: 2 }, { failed: false })).toBe('pass');
  });

  it('does not pass when total < 5', () => {
    expect(determineResult('DRF', { Behavior: 2, Impact: 1, Reinforcement: 1 }, { failed: false })).toBe('notYet');
  });

  it('fail rule overrides high total (Behavior=1 + Impact=3 + Reinforcement=3 = 7)', () => {
    const out = evaluateRep(baseArgs({ scores: { Behavior: 1, Impact: 3, Reinforcement: 3 } }));
    expect(out.result).toBe('notYet');
    expect(out.case).toBe('fail');
    expect(out.coachingTarget).toBe('Behavior');
  });

  it('strong rep when all critical >= Adequate AND ≥2 conditions Strong', () => {
    expect(isStrongRep('DRF', { Behavior: 3, Impact: 3, Reinforcement: 2 }, { failed: false })).toBe(true);
  });

  it('NOT a strong rep when only 1 condition is Strong', () => {
    expect(isStrongRep('DRF', { Behavior: 3, Impact: 2, Reinforcement: 2 }, { failed: false })).toBe(false);
  });

  it('NOT a strong rep if any condition is Missing', () => {
    expect(isStrongRep('DRF', { Behavior: 3, Impact: 3, Reinforcement: 0 }, { failed: false })).toBe(false);
  });

  it('strong rep suppresses the coaching question', () => {
    const out = evaluateRep(baseArgs({ scores: { Behavior: 3, Impact: 3, Reinforcement: 2 } }));
    expect(out.case).toBe('strong');
    expect(out.question).toBeNull();
  });

  it('fails when Impact is Missing (new fail rule — reinforcement without impact = praise)', () => {
    const out = evaluateRep(baseArgs({ scores: { Behavior: 3, Impact: 0, Reinforcement: 3 } }));
    expect(out.case).toBe('fail');
    expect(out.coachingTarget).toBe('Impact');
  });
});

// ---------------------------------------------------------------------------
// RED — Redirecting Feedback
// ---------------------------------------------------------------------------
describe('RED — Redirecting Feedback', () => {
  const redArgs = (overrides = {}) =>
    baseArgs({
      rrType: 'RED',
      scores: {
        Behavior: 2, Impact: 2, Request: 2, DirectDelivery: 2, DeliveryDiscipline: 2,
      },
      ...overrides,
    });

  it('fails when Behavior <= Weak', () => {
    const out = evaluateRep(redArgs({ scores: { Behavior: 1, Impact: 3, Request: 3, DirectDelivery: 3, DeliveryDiscipline: 3 } }));
    expect(out.case).toBe('fail');
    expect(out.coachingTarget).toBe('Behavior');
  });

  it('fails when Request <= Weak', () => {
    const out = evaluateRep(redArgs({ scores: { Behavior: 3, Impact: 3, Request: 1, DirectDelivery: 3, DeliveryDiscipline: 3 } }));
    expect(out.case).toBe('fail');
    expect(out.coachingTarget).toBe('Request');
  });

  it('fails when Impact is Missing (0)', () => {
    const out = evaluateRep(redArgs({ scores: { Behavior: 3, Impact: 0, Request: 3, DirectDelivery: 3, DeliveryDiscipline: 3 } }));
    expect(out.case).toBe('fail');
  });

  it('passes only when total >= 9 with no fail', () => {
    expect(determineResult('RED', { Behavior: 2, Impact: 2, Request: 2, DirectDelivery: 2, DeliveryDiscipline: 2 }, { failed: false })).toBe('pass');
    expect(determineResult('RED', { Behavior: 2, Impact: 2, Request: 2, DirectDelivery: 1, DeliveryDiscipline: 1 }, { failed: false })).toBe('notYet');
  });

  it('strong rep requires Strong on Behavior + Request, Adequate on Impact', () => {
    expect(isStrongRep('RED', { Behavior: 3, Impact: 2, Request: 3, DirectDelivery: 2, DeliveryDiscipline: 2 }, { failed: false })).toBe(true);
    expect(isStrongRep('RED', { Behavior: 3, Impact: 2, Request: 2, DirectDelivery: 3, DeliveryDiscipline: 3 }, { failed: false })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FUW — Follow-Up on Work
// ---------------------------------------------------------------------------
describe('FUW — Follow-Up on Work', () => {
  it('fails when WorkAnchored <= Weak', () => {
    const out = evaluateRep(
      baseArgs({
        rrType: 'FUW',
        scores: { WorkAnchored: 1, ProgressVisibility: 3, Ownership: 3 },
      })
    );
    expect(out.case).toBe('fail');
    expect(out.coachingTarget).toBe('WorkAnchored');
  });

  it('passes when total >= 5 and WorkAnchored is OK', () => {
    expect(determineResult('FUW', { WorkAnchored: 2, ProgressVisibility: 2, Ownership: 2 }, { failed: false })).toBe('pass');
  });

  it('strong rep requires WorkAnchored Strong + others ≥ Adequate', () => {
    expect(isStrongRep('FUW', { WorkAnchored: 3, ProgressVisibility: 2, Ownership: 2 }, { failed: false })).toBe(true);
    expect(isStrongRep('FUW', { WorkAnchored: 2, ProgressVisibility: 3, Ownership: 3 }, { failed: false })).toBe(false);
  });

  it('fails when Ownership <= Weak (new fail rule — follow-up without owner = drift)', () => {
    const out = evaluateRep(
      baseArgs({
        rrType: 'FUW',
        scores: { WorkAnchored: 3, ProgressVisibility: 3, Ownership: 1 },
      })
    );
    expect(out.case).toBe('fail');
    expect(out.coachingTarget).toBe('Ownership');
  });
});

// ---------------------------------------------------------------------------
// SCE — Set Clear Expectations
// ---------------------------------------------------------------------------
describe('SCE — Set Clear Expectations', () => {
  const sceArgs = (overrides = {}) =>
    baseArgs({
      rrType: 'SCE',
      scores: { Expectation: 2, Success: 2, Understanding: 2, Ownership: 2 },
      ...overrides,
    });

  it('fails when Expectation <= Weak', () => {
    const out = evaluateRep(sceArgs({ scores: { Expectation: 1, Success: 3, Understanding: 3, Ownership: 3 } }));
    expect(out.case).toBe('fail');
    expect(out.coachingTarget).toBe('Expectation');
  });

  it('fails when Success <= Weak', () => {
    const out = evaluateRep(sceArgs({ scores: { Expectation: 3, Success: 1, Understanding: 3, Ownership: 3 } }));
    expect(out.case).toBe('fail');
  });

  it('passes when total >= 6', () => {
    expect(determineResult('SCE', { Expectation: 2, Success: 2, Understanding: 1, Ownership: 1 }, { failed: false })).toBe('pass');
    expect(determineResult('SCE', { Expectation: 2, Success: 2, Understanding: 0, Ownership: 1 }, { failed: false })).toBe('notYet');
  });

  it('strong rep needs both critical Strong + Ownership Adequate', () => {
    expect(isStrongRep('SCE', { Expectation: 3, Success: 3, Understanding: 2, Ownership: 2 }, { failed: false })).toBe(true);
    expect(isStrongRep('SCE', { Expectation: 3, Success: 3, Understanding: 2, Ownership: 1 }, { failed: false })).toBe(false);
  });

  it('fails when Understanding is Missing (new fail rule — expectation never landed)', () => {
    const out = evaluateRep(
      sceArgs({ scores: { Expectation: 3, Success: 3, Understanding: 0, Ownership: 3 } })
    );
    expect(out.case).toBe('fail');
    expect(out.coachingTarget).toBe('Understanding');
  });
});

// ---------------------------------------------------------------------------
// Quick Read labels
// ---------------------------------------------------------------------------
describe('buildQuickRead', () => {
  it('returns spec-compliant labels (Missing/Weak/Adequate/Strong) per condition', () => {
    const qr = buildQuickRead('DRF', { Behavior: 0, Impact: 1, Reinforcement: 3 });
    expect(qr).toEqual({ Behavior: 'Missing', Impact: 'Weak', Reinforcement: 'Strong' });
  });

  it('uses raw camelCase condition names as keys (UI is responsible for prettifying)', () => {
    const qr = buildQuickRead('FUW', { WorkAnchored: 2, ProgressVisibility: 3, Ownership: 1 });
    expect(Object.keys(qr).sort()).toEqual(['Ownership', 'ProgressVisibility', 'WorkAnchored']);
  });
});

// ---------------------------------------------------------------------------
// Pattern detection
// ---------------------------------------------------------------------------
describe('detectPattern', () => {
  const drfRep = (scores, patternKey = null) => ({
    rrType: 'DRF',
    conditionScores: scores,
    result: 'pass',
    patternKey,
  });

  it('findLowestCondition returns alphabetical winner on ties', () => {
    expect(findLowestCondition({ Behavior: 1, Impact: 1, Reinforcement: 3 })).toBe('Behavior');
  });

  it('short-window pattern fires when same condition is lowest in 3 of last 5 (incl current)', () => {
    // No Behavior=Strong in prior reps (would reset). All have Behavior as the lowest.
    const recent = [
      drfRep({ Behavior: 1, Impact: 3, Reinforcement: 3 }),
      drfRep({ Behavior: 1, Impact: 2, Reinforcement: 2 }),
      drfRep({ Behavior: 2, Impact: 2, Reinforcement: 2 }),
    ];
    const current = { rrType: 'DRF', conditionScores: { Behavior: 1, Impact: 3, Reinforcement: 3 }, result: 'notYet' };
    const p = detectPattern(current, recent);
    expect(p).not.toBeNull();
    expect(p.condition).toBe('Behavior');
    expect(['short', 'escalation']).toContain(p.kind);
  });

  it('escalation pattern fires when condition never Strong across 6 reps', () => {
    const recent = Array.from({ length: 6 }, () =>
      drfRep({ Behavior: 2, Impact: 2, Reinforcement: 2 })
    );
    const current = { rrType: 'DRF', conditionScores: { Behavior: 2, Impact: 2, Reinforcement: 2 }, result: 'pass' };
    const p = detectPattern(current, recent);
    expect(p).not.toBeNull();
  });

  it('RED-Request pattern fires when Request <= 2 in 3 of last 5 RED reps', () => {
    const redRep = (request) => ({
      rrType: 'RED',
      conditionScores: { Behavior: 3, Impact: 3, Request: request, DirectDelivery: 3, DeliveryDiscipline: 3 },
      result: 'pass',
    });
    // Keep all prior Request scores <= 2 (Strong would reset the pattern).
    const recent = [redRep(2), redRep(1), redRep(2), redRep(2)];
    const current = { rrType: 'RED', conditionScores: { Behavior: 3, Impact: 3, Request: 2, DirectDelivery: 3, DeliveryDiscipline: 3 }, result: 'pass' };
    const p = detectPattern(current, recent);
    expect(p).not.toBeNull();
    expect(p.condition).toBe('Request');
    expect(p.key).toBe('red-request');
  });

  it('pattern resets when condition hits Strong in a subsequent rep', () => {
    // recentReps newest-first; if any has condition = STRONG, the pattern is reset
    const recent = [
      drfRep({ Behavior: 3, Impact: 3, Reinforcement: 3 }), // resets Behavior
      drfRep({ Behavior: 1, Impact: 3, Reinforcement: 3 }),
      drfRep({ Behavior: 1, Impact: 3, Reinforcement: 3 }),
    ];
    const current = { rrType: 'DRF', conditionScores: { Behavior: 1, Impact: 3, Reinforcement: 3 }, result: 'notYet' };
    const p = detectPattern(current, recent);
    // Behavior pattern should have reset; RED-request not applicable; expect null
    expect(p).toBeNull();
  });

  it('pattern is suppressed if same key fired in last 3 reps', () => {
    const recent = [
      drfRep({ Behavior: 1, Impact: 3, Reinforcement: 3 }, 'short:Behavior'),
      drfRep({ Behavior: 1, Impact: 3, Reinforcement: 3 }),
      drfRep({ Behavior: 1, Impact: 3, Reinforcement: 3 }),
    ];
    const current = { rrType: 'DRF', conditionScores: { Behavior: 1, Impact: 3, Reinforcement: 3 }, result: 'notYet' };
    const p = detectPattern(current, recent);
    expect(p).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Pattern integration with evaluateRep — pattern is SKIPPED on fail
// ---------------------------------------------------------------------------
describe('evaluateRep — pattern interaction', () => {
  const drfRep = (scores) => ({
    rrType: 'DRF',
    conditionScores: scores,
    result: 'pass',
  });

  it('does NOT surface a pattern when the current rep fails', () => {
    const recent = [
      drfRep({ Behavior: 1, Impact: 3, Reinforcement: 3 }),
      drfRep({ Behavior: 1, Impact: 3, Reinforcement: 3 }),
    ];
    const out = evaluateRep(
      baseArgs({
        scores: { Behavior: 1, Impact: 3, Reinforcement: 3 },
        recentReps: recent,
      })
    );
    expect(out.case).toBe('fail');
    expect(out.patternKey).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Output shape sanity
// ---------------------------------------------------------------------------
describe('evaluateRep — output shape', () => {
  it('returns required keys for a normal pass', () => {
    const out = evaluateRep(baseArgs());
    expect(out).toMatchObject({
      validity: 'valid',
      result: expect.stringMatching(/^(pass|notYet)$/),
      quickRead: expect.any(Object),
      observation: expect.any(String),
      conditionScores: expect.any(Object),
      totalScore: expect.any(Number),
    });
  });

  it('totalScore matches sum of conditionScores', () => {
    const scores = { Behavior: 2, Impact: 3, Reinforcement: 1 };
    expect(totalScore(scores)).toBe(6);
    const out = evaluateRep(baseArgs({ scores }));
    expect(out.totalScore).toBe(6);
  });

  it('uses spec-correct RR display names', () => {
    expect(getRrConfig('DRF').name).toBe('Reinforcing Feedback');
    expect(getRrConfig('RED').name).toBe('Redirecting Feedback');
    expect(getRrConfig('FUW').name).toBe('Follow-Up on Work');
    expect(getRrConfig('SCE').name).toBe('Set Clear Expectations');
  });

  it('SCORE constants align with label map', () => {
    expect(SCORE.MISSING).toBe(0);
    expect(SCORE.STRONG).toBe(3);
  });
});
