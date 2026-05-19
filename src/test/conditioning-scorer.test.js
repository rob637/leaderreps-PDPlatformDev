// src/test/conditioning-scorer.test.js
//
// Unit tests for the AI scorer module's pure helpers.
// These do NOT call any LLM \u2014 they exercise:
//   - buildUserPrompt: that anchored rubric definitions are rendered
//     into the prompt for every condition (so the model is grounded
//     in concrete decision rules, not generic 0\u20133 interpretation).
//   - normalizeScorerOutput: anti-drift coercion of model output.
//   - median + combineRuns: self-consistency consensus math.
//
// Why this exists:
// Prompt regressions are the #1 silent failure mode for LLM scorers.
// These assertions catch a future refactor that accidentally drops the
// definition or anchor lines from the prompt.

import { describe, it, expect } from 'vitest';

// eslint-disable-next-line import/no-relative-packages
import {
  buildUserPrompt,
  buildSystemInstruction,
  normalizeScorerOutput,
  median,
  combineRuns,
} from '../../functions/conditioning/scorer.js';
// eslint-disable-next-line import/no-relative-packages
import { getRrConfig, getConditionDef } from '../../functions/conditioning/rrConfig.js';

describe('buildUserPrompt \u2014 anchored rubric rendering', () => {
  for (const rr of ['DRF', 'RED', 'FUW', 'SCE']) {
    const cfg = getRrConfig(rr);

    it(`${rr}: includes the rubric version`, () => {
      const prompt = buildUserPrompt(rr, 'test transcript');
      expect(prompt).toContain(`Rubric version: ${cfg.version}`);
    });

    it(`${rr}: every condition appears in the prompt`, () => {
      const prompt = buildUserPrompt(rr, 'test transcript');
      for (const cond of cfg.conditions) {
        expect(prompt).toContain(`- ${cond}`);
      }
    });

    it(`${rr}: every critical condition is tagged [CRITICAL]`, () => {
      const prompt = buildUserPrompt(rr, 'test transcript');
      for (const cond of cfg.critical) {
        // Only the critical conditions should have the [CRITICAL] tag on
        // their header line.
        const re = new RegExp(`- ${cond} \\[CRITICAL\\]`);
        expect(prompt).toMatch(re);
      }
    });

    it(`${rr}: every condition has its definition rendered`, () => {
      const prompt = buildUserPrompt(rr, 'test transcript');
      for (const cond of cfg.conditions) {
        const def = getConditionDef(rr, cond);
        if (def) {
          expect(prompt).toContain(def.definition);
        }
      }
    });

    it(`${rr}: every condition has all 4 anchor tiers (Strong/Adequate/Weak/Missing)`, () => {
      const prompt = buildUserPrompt(rr, 'test transcript');
      for (const cond of cfg.conditions) {
        const def = getConditionDef(rr, cond);
        if (!def) continue;
        // The anchor block uses "    3 = Strong:" pattern.
        // Confirm the criterion text is present for every tier.
        for (const tier of [3, 2, 1, 0]) {
          expect(prompt).toContain(def.anchors[tier].criterion);
        }
      }
    });

    it(`${rr}: includes the transcript verbatim`, () => {
      const transcript = 'A unique transcript marker xyz123';
      const prompt = buildUserPrompt(rr, transcript);
      expect(prompt).toContain(transcript);
    });
  }

  it('system instruction documents the strict scoring scale', () => {
    const sys = buildSystemInstruction();
    expect(sys).toContain('Missing');
    expect(sys).toContain('Weak');
    expect(sys).toContain('Adequate');
    expect(sys).toContain('Strong');
    expect(sys).toContain('NEVER invent');
  });
});

// ---------------------------------------------------------------------------
// Anti-drift: normalizeScorerOutput must clamp/coerce malformed model output.
// ---------------------------------------------------------------------------
describe('normalizeScorerOutput \u2014 anti-drift', () => {
  it('coerces missing condition scores to 0 (Missing)', () => {
    const out = normalizeScorerOutput('DRF', { scores: { Behavior: 3 } });
    expect(out.scores).toEqual({ Behavior: 3, Impact: 0, Reinforcement: 0 });
  });

  it('coerces non-integer scores to 0', () => {
    const out = normalizeScorerOutput('DRF', {
      scores: { Behavior: 2.5, Impact: '3', Reinforcement: 2 },
    });
    expect(out.scores.Behavior).toBe(0);
    expect(out.scores.Impact).toBe(0);
    expect(out.scores.Reinforcement).toBe(2);
  });

  it('coerces out-of-range scores to 0', () => {
    const out = normalizeScorerOutput('DRF', {
      scores: { Behavior: 4, Impact: -1, Reinforcement: 99 },
    });
    expect(out.scores).toEqual({ Behavior: 0, Impact: 0, Reinforcement: 0 });
  });

  it('preserves valid evidenceNotes and drops non-string ones', () => {
    const out = normalizeScorerOutput('DRF', {
      scores: { Behavior: 2, Impact: 2, Reinforcement: 2 },
      evidenceNotes: { Behavior: 'quoted phrase', Impact: 42, Reinforcement: null },
    });
    expect(out.evidenceNotes.Behavior).toBe('quoted phrase');
    expect(out.evidenceNotes.Impact).toBe('');
    expect(out.evidenceNotes.Reinforcement).toBe('');
  });

  it('passes lowConfidence through truthily', () => {
    expect(normalizeScorerOutput('DRF', { scores: {}, lowConfidence: true }).lowConfidence).toBe(true);
    expect(normalizeScorerOutput('DRF', { scores: {} }).lowConfidence).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Self-consistency consensus
// ---------------------------------------------------------------------------
describe('median', () => {
  it('handles odd-length arrays', () => {
    expect(median([0, 1, 2])).toBe(1);
    expect(median([3, 0, 2, 2, 3])).toBe(2);
  });
  it('handles even-length arrays (rounded down)', () => {
    expect(median([1, 3])).toBe(2);
    expect(median([2, 3])).toBe(2);
  });
  it('returns 0 for empty array', () => {
    expect(median([])).toBe(0);
  });
});

describe('combineRuns \u2014 self-consistency', () => {
  const baseRun = (overrides = {}) => ({
    scores: { Behavior: 2, Impact: 2, Reinforcement: 2 },
    evidenceNotes: { Behavior: 'note A', Impact: 'note B', Reinforcement: 'note C' },
    lowConfidence: false,
    rawText: 'raw',
    rubricVersion: '2026-05-09',
    ...overrides,
  });

  it('takes per-condition median across runs', () => {
    const out = combineRuns('DRF', [
      baseRun({ scores: { Behavior: 3, Impact: 2, Reinforcement: 1 } }),
      baseRun({ scores: { Behavior: 2, Impact: 2, Reinforcement: 2 } }),
      baseRun({ scores: { Behavior: 2, Impact: 3, Reinforcement: 2 } }),
    ]);
    expect(out.scores).toEqual({ Behavior: 2, Impact: 2, Reinforcement: 2 });
  });

  it('flags lowConfidence only if a strict majority of runs flagged it', () => {
    const out = combineRuns('DRF', [
      baseRun({ lowConfidence: true }),
      baseRun({ lowConfidence: false }),
      baseRun({ lowConfidence: false }),
    ]);
    expect(out.lowConfidence).toBe(false);

    const out2 = combineRuns('DRF', [
      baseRun({ lowConfidence: true }),
      baseRun({ lowConfidence: true }),
      baseRun({ lowConfidence: false }),
    ]);
    expect(out2.lowConfidence).toBe(true);
  });

  it('picks the evidenceNotes from the run closest to the consensus', () => {
    const out = combineRuns('DRF', [
      // Outlier
      baseRun({ scores: { Behavior: 0, Impact: 0, Reinforcement: 0 }, evidenceNotes: { Behavior: 'wrong' } }),
      // Consensus-aligned
      baseRun({ scores: { Behavior: 2, Impact: 2, Reinforcement: 2 }, evidenceNotes: { Behavior: 'right' } }),
      baseRun({ scores: { Behavior: 2, Impact: 2, Reinforcement: 2 }, evidenceNotes: { Behavior: 'right' } }),
    ]);
    expect(out.evidenceNotes.Behavior).toBe('right');
  });

  it('reports samples and lowConfidenceVotes for telemetry', () => {
    const out = combineRuns('DRF', [
      baseRun({ lowConfidence: true }),
      baseRun({ lowConfidence: false }),
      baseRun({ lowConfidence: true }),
    ]);
    expect(out.samples).toBe(3);
    expect(out.lowConfidenceVotes).toBe(2);
  });

  it('returns a safe invalid-shaped result for empty runs', () => {
    const out = combineRuns('DRF', []);
    expect(out.lowConfidence).toBe(true);
    expect(out.scores).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Ablation: when a condition's evidence is removed, the consensus score for
// that condition should drop relative to the full-evidence run.
// We simulate this at the consensus layer (no LLM): each "ablated" run is
// just a hand-crafted score set. This guarantees the engine treats the
// ablation correctly even if the scorer prompt drifts.
// ---------------------------------------------------------------------------
describe('ablation \u2014 dropping a condition lowers its score', () => {
  const fullEvidenceRuns = [
    { scores: { Behavior: 3, Impact: 3, Reinforcement: 3 }, evidenceNotes: {}, lowConfidence: false },
    { scores: { Behavior: 3, Impact: 3, Reinforcement: 3 }, evidenceNotes: {}, lowConfidence: false },
    { scores: { Behavior: 3, Impact: 3, Reinforcement: 3 }, evidenceNotes: {}, lowConfidence: false },
  ];
  const impactAblatedRuns = [
    { scores: { Behavior: 3, Impact: 0, Reinforcement: 3 }, evidenceNotes: {}, lowConfidence: false },
    { scores: { Behavior: 3, Impact: 1, Reinforcement: 3 }, evidenceNotes: {}, lowConfidence: false },
    { scores: { Behavior: 3, Impact: 0, Reinforcement: 3 }, evidenceNotes: {}, lowConfidence: false },
  ];

  it('Impact median drops when Impact evidence is removed', () => {
    const full = combineRuns('DRF', fullEvidenceRuns);
    const ablated = combineRuns('DRF', impactAblatedRuns);
    expect(ablated.scores.Impact).toBeLessThan(full.scores.Impact);
    // Behavior + Reinforcement should stay the same (independence).
    expect(ablated.scores.Behavior).toBe(full.scores.Behavior);
    expect(ablated.scores.Reinforcement).toBe(full.scores.Reinforcement);
  });
});

// ---------------------------------------------------------------------------
// V2 — stakes + courage signals
// ---------------------------------------------------------------------------
describe('v2 — stakes & courage signals', () => {
  it('system instruction documents stakes inference', () => {
    const sys = buildSystemInstruction();
    expect(sys).toContain('STAKES');
    expect(sys).toContain('low');
    expect(sys).toContain('moderate');
    expect(sys).toContain('high');
  });

  it('RED prompt includes courage signals block; others do not', () => {
    const redPrompt = buildUserPrompt('RED', 'test');
    const drfPrompt = buildUserPrompt('DRF', 'test');
    expect(redPrompt).toContain('COURAGE SIGNALS');
    expect(redPrompt).toContain('retreatedToDiscussion');
    expect(drfPrompt).not.toContain('COURAGE SIGNALS');
  });

  it('normalizeScorerOutput clamps stakes to a valid band', () => {
    expect(normalizeScorerOutput('DRF', { scores: {}, stakes: 'nuclear' }).stakes).toBe('moderate');
    expect(normalizeScorerOutput('DRF', { scores: {}, stakes: 'high' }).stakes).toBe('high');
    expect(normalizeScorerOutput('DRF', { scores: {} }).stakes).toBe('moderate');
  });

  it('normalizeScorerOutput coerces RED courage signals to booleans', () => {
    const out = normalizeScorerOutput('RED', {
      scores: {},
      courageSignals: { retreatedToDiscussion: 1, softenedUnderTension: 'yes', backedOffAfterDefensiveness: false },
    });
    expect(out.courageSignals.retreatedToDiscussion).toBe(true);
    expect(out.courageSignals.softenedUnderTension).toBe(true);
    expect(out.courageSignals.backedOffAfterDefensiveness).toBe(false);
    // Any unspecified signal defaults to false
    expect(out.courageSignals.overCollaboration).toBe(false);
  });

  it('non-RED rrTypes get null courageSignals', () => {
    const out = normalizeScorerOutput('DRF', { scores: {} });
    expect(out.courageSignals).toBeNull();
  });

  it('combineRuns majority-votes stakes', () => {
    const baseRun = (stakes) => ({
      scores: { Behavior: 2, Impact: 2, Reinforcement: 2 },
      evidenceNotes: {},
      lowConfidence: false,
      stakes,
    });
    expect(combineRuns('DRF', [baseRun('low'), baseRun('low'), baseRun('moderate')]).stakes).toBe('low');
    expect(combineRuns('DRF', [baseRun('high'), baseRun('high'), baseRun('moderate')]).stakes).toBe('high');
  });

  it('combineRuns majority-votes courage signals (RED)', () => {
    const baseRun = (sigs) => ({
      scores: { Behavior: 2, Impact: 2, Request: 2, DirectDelivery: 2, DeliveryDiscipline: 2 },
      evidenceNotes: {},
      lowConfidence: false,
      stakes: 'moderate',
      courageSignals: sigs,
    });
    const out = combineRuns('RED', [
      baseRun({ retreatedToDiscussion: true }),
      baseRun({ retreatedToDiscussion: true }),
      baseRun({ retreatedToDiscussion: false }),
    ]);
    expect(out.courageSignals.retreatedToDiscussion).toBe(true);

    const out2 = combineRuns('RED', [
      baseRun({ retreatedToDiscussion: true }),
      baseRun({ retreatedToDiscussion: false }),
      baseRun({ retreatedToDiscussion: false }),
    ]);
    expect(out2.courageSignals.retreatedToDiscussion).toBe(false);
  });
});
