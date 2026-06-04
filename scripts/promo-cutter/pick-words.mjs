#!/usr/bin/env node
/**
 * pick-words.mjs — Build a clip list by matching each word in a target
 * sentence against the word indexes produced by transcribe.py.
 *
 * Matching priority for each target word:
 *   1. Exact match (case-insensitive, punctuation stripped)
 *   2. Prefix match  (target "Rob" → source word starting with "rob")
 *   3. Substring match (any source word containing the target)
 *   4. Soundex / first-letter fallback (last resort)
 *
 * Usage:
 *   node pick-words.mjs <label> "<sentence>" [more sentences...]
 *
 *   node pick-words.mjs rob-tribute \
 *     "Rob is the greatest leader I have ever seen." \
 *     "Rob is my hero my coach and frankly too handsome."
 *
 * Reads:  output/<source>.words.json for every source present
 * Writes: output/mix--<label>.json (same shape render-mix.mjs expects)
 *
 * Flags:
 *   --pad=0.05       Extra padding (s) before/after each word. Default 0.06.
 *   --min-dur=0.35   Minimum per-clip duration (pads with neighbor silence). Default 0.35.
 *   --max-dur=1.2    Cap on per-clip duration. Default 1.2.
 *   --sources=a.mp4,b.mp4   Limit to specific sources (default: all *.words.json in output/)
 *   --no-reuse       Don't reuse the same word slot more than once
 *   --strict         Skip words with no exact/prefix/substring match (no first-letter fallback)
 *   --gap-on-miss    Insert a silent gap clip when a word can't be matched (only with --strict)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

function die(msg) {
  console.error(`\n[pick-words] ERROR: ${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  }),
);

const [label, ...sentences] = positional;
if (!label || sentences.length === 0) {
  die('Usage: node pick-words.mjs <label> "<sentence>" ["<sentence2>"]');
}

const pad = Number(flags.pad ?? 0.06);
const minDur = Number(flags['min-dur'] ?? 0.35);
const maxDur = Number(flags['max-dur'] ?? 1.2);
const noReuse = !!flags['no-reuse'];
const strict = !!flags.strict;
const gapOnMiss = !!flags['gap-on-miss'];
const sourceFilter = flags.sources ? String(flags.sources).split(',').map((s) => s.trim()) : null;

// Load all word indexes
const indexFiles = fs
  .readdirSync(OUTPUT_DIR)
  .filter((f) => f.endsWith('.words.json'))
  .map((f) => path.join(OUTPUT_DIR, f));

if (!indexFiles.length) {
  die(
    'No *.words.json files in output/. ' +
      'Run `.venv/bin/python transcribe.py <video>` first.',
  );
}

const indexes = indexFiles
  .map((f) => JSON.parse(fs.readFileSync(f, 'utf8')))
  .filter((idx) => !sourceFilter || sourceFilter.includes(idx.source));

console.log(`[pick-words] loaded indexes: ${indexes.map((i) => `${i.source} (${i.words.length}w)`).join(', ')}`);

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9']/g, '');

// Build a flat searchable pool: every word from every source
const pool = [];
indexes.forEach((idx) => {
  idx.words.forEach((w) => {
    pool.push({
      source: idx.source,
      idx: w.i,
      raw: w.word,
      norm: norm(w.word),
      start: w.start,
      end: w.end,
      used: 0,
    });
  });
});

function score(target, candidate) {
  // returns { score: number, kind: string }   higher = better. 0 = no match.
  if (!candidate.norm) return { score: 0, kind: 'empty' };
  if (candidate.norm === target) return { score: 100, kind: 'exact' };
  if (candidate.norm.startsWith(target) && target.length >= 2)
    return { score: 80, kind: 'prefix' };
  if (target.startsWith(candidate.norm) && candidate.norm.length >= 3)
    return { score: 70, kind: 'is-prefix-of-target' };
  if (candidate.norm.includes(target) && target.length >= 3)
    return { score: 65, kind: 'substring' };
  if (candidate.norm.endsWith(target) && target.length >= 3)
    return { score: 55, kind: 'suffix' };
  // Shared 3+ letter stem (e.g. "smart"/"smarter")
  if (target.length >= 4 && candidate.norm.length >= 4) {
    const stem = target.slice(0, Math.min(4, target.length - 1));
    if (candidate.norm.startsWith(stem)) return { score: 45, kind: 'stem' };
  }
  if (strict) return { score: 0, kind: 'none' };
  // Loose fallback (off by default): first 2 letters match
  if (target.length >= 2 && candidate.norm.startsWith(target.slice(0, 2)))
    return { score: 25, kind: 'first-2-letters' };
  return { score: 0, kind: 'none' };
}

function pickWord(targetRaw) {
  const target = norm(targetRaw);
  if (!target) return null;

  let best = null;
  for (const cand of pool) {
    if (noReuse && cand.used) continue;
    const dur = cand.end - cand.start;
    if (dur <= 0.02) continue; // too short to be useful

    const { score: s, kind } = score(target, cand);
    if (s === 0) continue;

    // Penalize over-long words and heavily-reused slots
    const lenPenalty = Math.max(0, dur - 0.6) * 8;
    const reusePenalty = cand.used * 15;
    const final = s - lenPenalty - reusePenalty;

    if (!best || final > best.final) {
      best = { cand, kind, final, raw: cand.raw };
    }
  }
  if (best) best.cand.used += 1;
  return best;
}

const clips = [];
const misses = [];
for (const sentence of sentences) {
  const tokens = sentence.match(/[A-Za-z0-9']+/g) || [];
  for (const tok of tokens) {
    const pick = pickWord(tok);
    if (!pick) {
      misses.push(tok);
      if (gapOnMiss) {
        clips.push({ source: '__gap__', word: tok, actual: '(no match)', match: 'miss', start: '00:00.000', end: '00:00.300', gap: 0.25 });
      }
      continue;
    }
    const { cand, kind, raw } = pick;
    const rawDur = cand.end - cand.start;
    // Enforce a minimum displayable/audible duration by extending into surrounding silence
    const targetDur = Math.max(minDur, Math.min(rawDur + pad * 2, maxDur));
    const extraNeeded = Math.max(0, targetDur - rawDur);
    const start = Math.max(0, cand.start - extraNeeded / 2 - pad / 2);
    const end = start + targetDur;

    clips.push({
      source: cand.source,
      word: tok,
      actual: raw,
      match: kind,
      start: fmt(start),
      end: fmt(end),
    });
  }
}

const outPath = path.join(OUTPUT_DIR, `mix--${label}.json`);
const data = {
  version_label: label,
  target_seconds: clips.reduce((a, c) => a + (toSec(c.end) - toSec(c.start)), 0),
  sentences,
  clips,
};
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

const matchCounts = clips.reduce((acc, c) => {
  acc[c.match] = (acc[c.match] || 0) + 1;
  return acc;
}, {});
console.log(`\n[pick-words] ${clips.length} clips picked (~${data.target_seconds.toFixed(1)}s)`);
console.log(`[pick-words] match breakdown:`, matchCounts);
if (misses.length) console.log(`[pick-words] could not match: ${misses.join(', ')}`);
console.log(`[pick-words] wrote ${outPath}`);
console.log(
  `\nNext: node render-mix.mjs ${path.basename(outPath)} ${indexes.map((i) => i.source).join(' ')} --subs --gap=0.04`,
);

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${String(m).padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0')}`;
}
function toSec(ts) {
  const p = String(ts).split(':').map(Number);
  if (p.length === 2) return p[0] * 60 + p[1];
  return Number(ts) || 0;
}
