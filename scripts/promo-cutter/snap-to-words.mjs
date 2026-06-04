#!/usr/bin/env node
/**
 * snap-to-words.mjs — Take a clips JSON produced by analyze.mjs and snap
 * each clip's start/end to real word-level timestamps from a *.words.json
 * transcript. Fixes the common Gemini drift (timestamps off by several
 * seconds) so subtitles and audio line up.
 *
 * Usage:
 *   node snap-to-words.mjs <clips.json> <words.json> [--out=<path>]
 *   node snap-to-words.mjs ryan-v2--landing-page-60s.json ryan-v2.words.json
 *
 * Each clip needs a `transcript` field. We anchor on the first ~5 words
 * (start) and last ~5 words (end), find the unique contiguous match in the
 * source transcript, and rewrite start/end. If we can't find a unique
 * match we leave the clip untouched and warn.
 *
 * Output: writes <basename>--snapped.json (or --out=<path>).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

function die(msg) {
  console.error(`\n[snap] ERROR: ${msg}\n`);
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

const [clipsArg, wordsArg] = positional;
if (!clipsArg || !wordsArg) {
  die('Usage: node snap-to-words.mjs <clips.json> <words.json> [--out=<path>] [--anchor=5] [--pad=0.08]');
}

const anchorN = Number(flags.anchor ?? 5);
const pad = Number(flags.pad ?? 0.08);

const clipsPath = path.isAbsolute(clipsArg) ? clipsArg : path.join(OUTPUT_DIR, clipsArg);
const wordsPath = path.isAbsolute(wordsArg) ? wordsArg : path.join(OUTPUT_DIR, wordsArg);
if (!fs.existsSync(clipsPath)) die(`clips JSON not found: ${clipsPath}`);
if (!fs.existsSync(wordsPath)) die(`words JSON not found: ${wordsPath}`);

const clipsData = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const words = wordsData.words || [];
if (!words.length) die('No words in words.json');

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normTokens = (s) => norm(s).split(' ').filter(Boolean);

const sourceTokens = words.map((w) => norm(w.word));

// Find every starting index in sourceTokens where the `needle` token array
// appears as a contiguous subsequence.
function findMatches(needle) {
  if (!needle.length) return [];
  const hits = [];
  outer: for (let i = 0; i <= sourceTokens.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (sourceTokens[i + j] !== needle[j]) continue outer;
    }
    hits.push(i);
  }
  return hits;
}

// Pick the match closest to a hint time (the original Gemini start, in seconds).
function pickClosest(hits, hintSec) {
  if (!hits.length) return -1;
  if (hits.length === 1) return hits[0];
  let best = hits[0];
  let bestDelta = Math.abs(words[hits[0]].start - hintSec);
  for (let k = 1; k < hits.length; k++) {
    const d = Math.abs(words[hits[k]].start - hintSec);
    if (d < bestDelta) {
      best = hits[k];
      bestDelta = d;
    }
  }
  return best;
}

function toSeconds(ts) {
  if (typeof ts === 'number') return ts;
  const parts = String(ts).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(ts) || 0;
}

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${String(m).padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0')}`;
}

// Try anchor lengths down from anchorN until we get a unique match.
function findAnchor(targetTokens, hintSec, side /* 'start' | 'end' */) {
  for (let n = Math.min(anchorN, targetTokens.length); n >= 2; n--) {
    const needle =
      side === 'start' ? targetTokens.slice(0, n) : targetTokens.slice(-n);
    const hits = findMatches(needle);
    if (hits.length === 0) continue;
    const idx = pickClosest(hits, hintSec);
    return { idx, n, ambiguous: hits.length > 1, hits: hits.length };
  }
  return null;
}

console.log(`[snap] clips:  ${(clipsData.clips || []).length}`);
console.log(`[snap] words:  ${words.length} (source ${wordsData.source || '?'})`);
console.log(`[snap] anchor: up to ${anchorN} words, pad ${pad}s\n`);

const snapped = [];
let fixedCount = 0;
let skippedCount = 0;

(clipsData.clips || []).forEach((clip, i) => {
  const tokens = normTokens(clip.transcript || '');
  if (tokens.length < 4) {
    console.warn(`[snap] clip ${i}: transcript too short, leaving as-is`);
    snapped.push(clip);
    skippedCount++;
    return;
  }
  const hintStart = toSeconds(clip.start);
  const hintEnd = toSeconds(clip.end);

  const startAnchor = findAnchor(tokens, hintStart, 'start');
  const endAnchor = findAnchor(tokens, hintEnd, 'end');

  if (!startAnchor || !endAnchor) {
    console.warn(
      `[snap] clip ${i} [${clip.section || ''}]: could not anchor (start:${!!startAnchor} end:${!!endAnchor}) — leaving as-is`,
    );
    snapped.push(clip);
    skippedCount++;
    return;
  }

  const startIdx = startAnchor.idx;
  const endIdx = endAnchor.idx + endAnchor.n - 1;
  if (endIdx <= startIdx) {
    console.warn(
      `[snap] clip ${i} [${clip.section || ''}]: anchors crossed (start=${startIdx} end=${endIdx}) — leaving as-is`,
    );
    snapped.push(clip);
    skippedCount++;
    return;
  }

  const newStart = Math.max(0, words[startIdx].start - pad);
  const newEnd = Math.min(wordsData.duration || Infinity, words[endIdx].end + pad);

  const oldStart = toSeconds(clip.start);
  const oldEnd = toSeconds(clip.end);
  const drift = newStart - oldStart;

  console.log(
    `[snap] clip ${i} [${clip.section || ''}] ` +
      `${clip.start} → ${fmt(newStart)}  ` +
      `${clip.end} → ${fmt(newEnd)}  ` +
      `(drift ${drift >= 0 ? '+' : ''}${drift.toFixed(2)}s, ${(newEnd - newStart).toFixed(1)}s)` +
      (startAnchor.ambiguous || endAnchor.ambiguous
        ? `  [picked from ${Math.max(startAnchor.hits, endAnchor.hits)} matches]`
        : ''),
  );

  snapped.push({
    ...clip,
    start: fmt(newStart),
    end: fmt(newEnd),
    _original_start: clip.start,
    _original_end: clip.end,
  });
  fixedCount++;
});

const outPath =
  flags.out
    ? path.isAbsolute(flags.out)
      ? flags.out
      : path.join(OUTPUT_DIR, flags.out)
    : clipsPath.replace(/\.json$/, '--snapped.json');

const outData = {
  ...clipsData,
  version_label: (clipsData.version_label || 'snapped') + '-snapped',
  target_seconds: snapped.reduce(
    (a, c) => a + (toSeconds(c.end) - toSeconds(c.start)),
    0,
  ),
  clips: snapped,
};

fs.writeFileSync(outPath, JSON.stringify(outData, null, 2));

console.log(
  `\n[snap] DONE. fixed ${fixedCount}, skipped ${skippedCount}, total ~${outData.target_seconds.toFixed(1)}s`,
);
console.log(`[snap] wrote ${outPath}`);
console.log(
  `\nNext: node render.mjs ${path.basename(outPath)} ${(wordsData.source || 'ryan-v2.mp4')}`,
);
