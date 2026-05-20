// functions/conditioning/calibration/run.js
//
// Calibration harness for the Conditioning Light scorer (v2).
//
// What it does:
//   1. Loads hand-labeled fixtures from ./fixtures.js (+ optional realism set)
//   2. Runs the live AI scorer against each transcript
//   3. Runs the engine to get the final result + mode + stakes
//   4. Compares result + per-condition scores + stakes + courage signals
//      to the expected labels
//   5. Prints an agreement report:
//        - Result agreement (pass/notYet/invalid)
//        - Per-condition exact-match rate
//        - Per-condition off-by-one rate
//        - Strong-rep agreement
//        - Per-stakes-band result agreement (low/moderate/high)
//        - Courage-signal precision / recall (RED only)
//        - Per-fixture detail for any disagreements
//
// Usage:
//   GEMINI_API_KEY=...  node functions/conditioning/calibration/run.js
//   node functions/conditioning/calibration/run.js --rr=DRF
//   node functions/conditioning/calibration/run.js --id=red-strong-01
//   node functions/conditioning/calibration/run.js --realism      # add realism set
//   node functions/conditioning/calibration/run.js --realism-only # only realism
//
// Exit code: 0 if calibration passes, else 1. Use this in CI.
//
// Thresholds (v2):
//   RESULT_FLOOR     = 0.95  (was 1.00 — allow rare model misses)
//   EXACT_MATCH_FLOOR = 0.80 (unchanged — tighten to 0.85 once fixtures grow)
//   STAKES_FLOOR     = 0.75  (per-fixture stakes agreement)

'use strict';

const path = require('path');

// Load .env.local from repo root if present (for local dev keys)
try {
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });
} catch (_) {
  // dotenv is optional; env vars may already be set
}

const { FIXTURES } = require('./fixtures');
const { REALISM_FIXTURES } = require('./realism');
const { scoreTranscript } = require('../scorer');
const { evaluateRep } = require('../engine');
const { COURAGE_SIGNALS, normalizeStakes } = require('../rrConfig');

const RESULT_FLOOR = 0.95;
const EXACT_MATCH_FLOOR = 0.8;
const STAKES_FLOOR = 0.75;

const args = process.argv.slice(2).reduce((acc, a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) acc[m[1]] = m[2] === undefined ? true : m[2];
  return acc;
}, {});

let pool = FIXTURES;
if (args['realism-only']) pool = REALISM_FIXTURES;
else if (args.realism) pool = [...FIXTURES, ...REALISM_FIXTURES];

const filtered = pool.filter((f) => {
  if (args.rr && f.rrType !== String(args.rr).toUpperCase()) return false;
  if (args.id && f.id !== args.id) return false;
  return true;
});

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey && !anthropicApiKey) {
  console.error(
    'No AI API key found. Set GEMINI_API_KEY or ANTHROPIC_API_KEY before running.'
  );
  process.exit(2);
}

const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const main = async () => {
  console.log(cyan(`\nCalibration run (v2) — ${filtered.length} fixtures\n`));

  const stats = {
    total: filtered.length,
    resultAgree: 0,
    strongAgree: 0,
    conditionExact: 0,
    conditionOffByOne: 0,
    conditionTotal: 0,
    stakesAgree: 0,
    stakesTotal: 0,
    perRr: {},
    perStakes: { low: { total: 0, resultAgree: 0 }, moderate: { total: 0, resultAgree: 0 }, high: { total: 0, resultAgree: 0 } },
    courage: { tp: 0, fp: 0, fn: 0, tn: 0 }, // per (fixture, signal) pair
    failures: [],
  };

  for (const fx of filtered) {
    const ai = await scoreTranscript({
      rrType: fx.rrType,
      transcript: fx.transcript,
      apiKey,
      anthropicApiKey,
    });

    const evalOut = evaluateRep({
      rrType: fx.rrType,
      transcript: fx.transcript,
      scores: ai.scores,
      lowConfidence: ai.lowConfidence,
      stakes: ai.stakes,
      courageSignals: ai.courageSignals,
      recentReps: [],
    });

    // Result label
    const actualResult =
      evalOut.validity === 'invalid' ? 'invalid' : evalOut.result;
    const resultMatch = actualResult === fx.expectedResult;
    if (resultMatch) stats.resultAgree += 1;

    // Strong rep
    const actualStrong = evalOut.case === 'strong';
    const strongMatch = actualStrong === !!fx.expectedStrong;
    if (strongMatch) stats.strongAgree += 1;

    // Per-condition agreement
    const condReport = [];
    for (const [cond, expected] of Object.entries(fx.expected)) {
      const actual = ai.scores?.[cond] ?? 0;
      const diff = Math.abs(actual - expected);
      stats.conditionTotal += 1;
      if (diff === 0) stats.conditionExact += 1;
      if (diff <= 1) stats.conditionOffByOne += 1;
      condReport.push({ cond, expected, actual, diff });
    }

    // Stakes (v2): only count fixtures with an EXPLICIT expectedStakes label.
    // Legacy fixtures predate the stakes field and would unfairly drag the metric.
    const hasStakesLabel = typeof fx.expectedStakes === 'string';
    const expectedStakes = normalizeStakes(fx.expectedStakes);
    const actualStakes = normalizeStakes(ai.stakes);
    if (hasStakesLabel) {
      stats.stakesTotal += 1;
      if (expectedStakes === actualStakes) stats.stakesAgree += 1;
    }

    // Per-RR
    if (!stats.perRr[fx.rrType]) stats.perRr[fx.rrType] = { total: 0, resultAgree: 0 };
    stats.perRr[fx.rrType].total += 1;
    if (resultMatch) stats.perRr[fx.rrType].resultAgree += 1;

    // Per-stakes-band (only labeled fixtures)
    if (hasStakesLabel) {
      stats.perStakes[expectedStakes].total += 1;
      if (resultMatch) stats.perStakes[expectedStakes].resultAgree += 1;
    }

    // Courage signals (RED only) — confusion matrix at per-signal granularity
    let courageReport = null;
    if (fx.rrType === 'RED') {
      const expectedSigs = fx.expectedCourageSignals || {};
      const actualSigs = ai.courageSignals || {};
      courageReport = [];
      for (const sig of COURAGE_SIGNALS) {
        const exp = !!expectedSigs[sig];
        const act = !!actualSigs[sig];
        if (exp && act) stats.courage.tp += 1;
        else if (!exp && act) stats.courage.fp += 1;
        else if (exp && !act) stats.courage.fn += 1;
        else stats.courage.tn += 1;
        if (exp || act) courageReport.push({ sig, exp, act });
      }
    }

    const tag = resultMatch ? green('PASS') : red('FAIL');
    const stakesTag =
      expectedStakes === actualStakes
        ? dim(`stakes=${actualStakes}`)
        : yellow(`stakes=${actualStakes}≠${expectedStakes}`);
    console.log(
      `${tag} ${fx.rrType.padEnd(3)} ${fx.id.padEnd(34)} ` +
        `expected=${fx.expectedResult.padEnd(7)} actual=${actualResult.padEnd(7)} ${stakesTag}`
    );

    const anyCondDrift = condReport.some((c) => c.diff > 0);
    const anyCourageDrift = courageReport && courageReport.some((c) => c.exp !== c.act);
    if (!resultMatch || anyCondDrift || anyCourageDrift) {
      stats.failures.push({ fx, ai, evalOut, condReport, actualResult });
      for (const c of condReport) {
        const marker = c.diff === 0 ? green('  =') : c.diff === 1 ? yellow('  ~') : red('  X');
        console.log(
          `${marker} ${c.cond.padEnd(20)} expected=${c.expected} actual=${c.actual} ` +
            dim(`note=${(ai.evidenceNotes?.[c.cond] || '').slice(0, 80)}`)
        );
      }
      if (courageReport) {
        for (const c of courageReport) {
          const marker = c.exp === c.act ? green('  =') : red('  X');
          console.log(`${marker} courage:${c.sig.padEnd(28)} expected=${c.exp} actual=${c.act}`);
        }
      }
    }
  }

  const exactRate = stats.conditionExact / Math.max(1, stats.conditionTotal);
  const offByOneRate = stats.conditionOffByOne / Math.max(1, stats.conditionTotal);
  const resultRate = stats.resultAgree / Math.max(1, stats.total);
  const strongRate = stats.strongAgree / Math.max(1, stats.total);
  const stakesRate = stats.stakesAgree / Math.max(1, stats.stakesTotal);

  console.log(cyan('\n— Summary —'));
  console.log(`  Result agreement:        ${(resultRate * 100).toFixed(1)}%  (${stats.resultAgree}/${stats.total})`);
  console.log(`  Strong-rep agreement:    ${(strongRate * 100).toFixed(1)}%  (${stats.strongAgree}/${stats.total})`);
  console.log(`  Condition exact match:   ${(exactRate * 100).toFixed(1)}%  (${stats.conditionExact}/${stats.conditionTotal})`);
  console.log(`  Condition off-by-one:    ${(offByOneRate * 100).toFixed(1)}%  (${stats.conditionOffByOne}/${stats.conditionTotal})`);
  console.log(`  Stakes agreement:        ${(stakesRate * 100).toFixed(1)}%  (${stats.stakesAgree}/${stats.stakesTotal})`);

  console.log(cyan('\n— Per RR —'));
  for (const [rr, v] of Object.entries(stats.perRr)) {
    const pct = (v.resultAgree / v.total) * 100;
    console.log(`  ${rr}: ${pct.toFixed(1)}%  (${v.resultAgree}/${v.total})`);
  }

  console.log(cyan('\n— Per Stakes Band (expected) —'));
  for (const [band, v] of Object.entries(stats.perStakes)) {
    if (v.total === 0) { console.log(`  ${band}: n/a`); continue; }
    const pct = (v.resultAgree / v.total) * 100;
    console.log(`  ${band.padEnd(8)}: ${pct.toFixed(1)}%  (${v.resultAgree}/${v.total})`);
  }

  console.log(cyan('\n— Courage Signals (RED) —'));
  const { tp, fp, fn } = stats.courage;
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  console.log(`  Precision: ${(precision * 100).toFixed(1)}%   Recall: ${(recall * 100).toFixed(1)}%   (tp=${tp} fp=${fp} fn=${fn})`);

  const passed =
    resultRate >= RESULT_FLOOR &&
    exactRate >= EXACT_MATCH_FLOOR &&
    stakesRate >= STAKES_FLOOR;
  console.log(
    `\n${passed ? green('CALIBRATION PASSED') : red('CALIBRATION FAILED')} ` +
      dim(`(result>=${(RESULT_FLOOR * 100).toFixed(0)}%, condition exact>=${(EXACT_MATCH_FLOOR * 100).toFixed(0)}%, stakes>=${(STAKES_FLOOR * 100).toFixed(0)}%)`)
  );

  process.exit(passed ? 0 : 1);
};

main().catch((err) => {
  console.error(red('Calibration run failed:'), err);
  process.exit(2);
});
