// functions/conditioning/calibration/run.js
//
// Calibration harness for the Conditioning Light scorer.
//
// What it does:
//   1. Loads hand-labeled fixtures from ./fixtures.js
//   2. Runs the live AI scorer against each transcript
//   3. Runs the engine to get the final result
//   4. Compares result + per-condition scores to the expected labels
//   5. Prints an agreement report:
//        - Result agreement (pass/notYet/invalid)
//        - Per-condition exact-match rate
//        - Per-condition off-by-one rate
//        - Strong-rep agreement
//        - Per-fixture detail for any disagreements
//
// Usage:
//   GEMINI_API_KEY=...  node functions/conditioning/calibration/run.js
//   ANTHROPIC_API_KEY=... node functions/conditioning/calibration/run.js
//   node functions/conditioning/calibration/run.js --rr=DRF
//   node functions/conditioning/calibration/run.js --id=red-strong-01
//
// Exit code: 0 if all results agree AND per-condition exact match >= 0.80,
// else 1. Use this in CI to catch prompt regressions.

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
const { scoreTranscript } = require('../scorer');
const { evaluateRep } = require('../engine');

const EXACT_MATCH_FLOOR = 0.8;

const args = process.argv.slice(2).reduce((acc, a) => {
  const m = a.match(/^--([^=]+)=(.*)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
}, {});

const filtered = FIXTURES.filter((f) => {
  if (args.rr && f.rrType !== args.rr.toUpperCase()) return false;
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

const fmtScores = (scores) =>
  Object.entries(scores)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');

const main = async () => {
  console.log(cyan(`\nCalibration run — ${filtered.length} fixtures\n`));

  const stats = {
    total: filtered.length,
    resultAgree: 0,
    strongAgree: 0,
    conditionExact: 0,
    conditionOffByOne: 0,
    conditionTotal: 0,
    perRr: {},
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
      recentReps: [],
    });

    // Result label normalization
    const actualResult =
      evalOut.validity === 'invalid' ? 'invalid' : evalOut.result;
    const resultMatch = actualResult === fx.expectedResult;
    if (resultMatch) stats.resultAgree += 1;

    // Strong rep agreement (only meaningful for valid passes)
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

    // Per-RR rollup
    if (!stats.perRr[fx.rrType]) {
      stats.perRr[fx.rrType] = { total: 0, resultAgree: 0 };
    }
    stats.perRr[fx.rrType].total += 1;
    if (resultMatch) stats.perRr[fx.rrType].resultAgree += 1;

    const tag = resultMatch ? green('PASS') : red('FAIL');
    console.log(
      `${tag} ${fx.rrType.padEnd(3)} ${fx.id.padEnd(28)} ` +
        `expected=${fx.expectedResult.padEnd(7)} actual=${actualResult}`
    );

    if (!resultMatch || condReport.some((c) => c.diff > 0)) {
      stats.failures.push({ fx, ai, evalOut, condReport, actualResult });
      for (const c of condReport) {
        const marker = c.diff === 0 ? green('  =') : c.diff === 1 ? yellow('  ~') : red('  X');
        console.log(
          `${marker} ${c.cond.padEnd(20)} expected=${c.expected} actual=${c.actual} ` +
            dim(`note=${(ai.evidenceNotes?.[c.cond] || '').slice(0, 80)}`)
        );
      }
    }
  }

  const exactRate = stats.conditionExact / Math.max(1, stats.conditionTotal);
  const offByOneRate = stats.conditionOffByOne / Math.max(1, stats.conditionTotal);
  const resultRate = stats.resultAgree / Math.max(1, stats.total);
  const strongRate = stats.strongAgree / Math.max(1, stats.total);

  console.log(cyan('\n— Summary —'));
  console.log(`  Result agreement:        ${(resultRate * 100).toFixed(1)}%  (${stats.resultAgree}/${stats.total})`);
  console.log(`  Strong-rep agreement:    ${(strongRate * 100).toFixed(1)}%  (${stats.strongAgree}/${stats.total})`);
  console.log(`  Condition exact match:   ${(exactRate * 100).toFixed(1)}%  (${stats.conditionExact}/${stats.conditionTotal})`);
  console.log(`  Condition off-by-one:    ${(offByOneRate * 100).toFixed(1)}%  (${stats.conditionOffByOne}/${stats.conditionTotal})`);

  console.log(cyan('\n— Per RR —'));
  for (const [rr, v] of Object.entries(stats.perRr)) {
    const pct = (v.resultAgree / v.total) * 100;
    console.log(`  ${rr}: ${pct.toFixed(1)}%  (${v.resultAgree}/${v.total})`);
  }

  const passed = resultRate === 1 && exactRate >= EXACT_MATCH_FLOOR;
  console.log(
    `\n${passed ? green('CALIBRATION PASSED') : red('CALIBRATION FAILED')} ` +
      dim(`(result must be 100%, condition exact must be >= ${(EXACT_MATCH_FLOOR * 100).toFixed(0)}%)`)
  );

  process.exit(passed ? 0 : 1);
};

main().catch((err) => {
  console.error(red('Calibration run failed:'), err);
  process.exit(2);
});
