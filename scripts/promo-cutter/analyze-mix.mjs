#!/usr/bin/env node
/**
 * analyze-mix.mjs — Like analyze.mjs but uploads MULTIPLE source videos
 * and asks Gemini to assemble a sentence-mix reel by pulling words/sounds
 * from any of them.
 *
 * Output JSON has a `source` field per clip naming which input file to cut from.
 *
 * Usage:
 *   node analyze-mix.mjs <prompt-name> <video1> [video2] [video3] ...
 *   node analyze-mix.mjs rob-tribute ryan-v1.mp4 ryan-v2.mp4
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_DIR = path.join(__dirname, 'output');
const PROMPTS_DIR = path.join(__dirname, 'prompts');

function die(msg) {
  console.error(`\n[analyze-mix] ERROR: ${msg}\n`);
  process.exit(1);
}

const [, , promptArg, ...videoArgs] = process.argv;
if (!promptArg || videoArgs.length === 0) {
  die(
    'Usage: node analyze-mix.mjs <prompt-name> <video1> [video2] ...\n' +
      '  e.g. node analyze-mix.mjs rob-tribute ryan-v1.mp4 ryan-v2.mp4',
  );
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.startsWith('your_key')) {
  die('GEMINI_API_KEY missing. Copy .env.example to .env and fill it in.');
}

const promptPath = path.join(PROMPTS_DIR, `${promptArg}.md`);
if (!fs.existsSync(promptPath)) die(`Prompt not found: ${promptPath}`);
const promptText = fs.readFileSync(promptPath, 'utf8');

const videoPaths = videoArgs.map((v) => {
  const p = path.isAbsolute(v) ? v : path.join(INPUT_DIR, v);
  if (!fs.existsSync(p)) die(`Video not found: ${p}`);
  return { name: path.basename(p), path: p };
});

const modelId = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const outPath = path.join(OUTPUT_DIR, `mix--${promptArg}.json`);

console.log(`[analyze-mix] prompt:  ${promptPath}`);
console.log(`[analyze-mix] model:   ${modelId}`);
console.log(`[analyze-mix] sources: ${videoPaths.map((v) => v.name).join(', ')}`);
console.log(`[analyze-mix] output:  ${outPath}\n`);

const ai = new GoogleGenAI({ apiKey });

// Upload all videos
const uploaded = [];
for (const v of videoPaths) {
  console.log(`[analyze-mix] uploading ${v.name} ...`);
  let file = await ai.files.upload({
    file: v.path,
    config: { mimeType: guessMime(v.path) },
  });
  while (file.state === 'PROCESSING') {
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 3000));
    file = await ai.files.get({ name: file.name });
  }
  console.log(`\n[analyze-mix] ${v.name} → ${file.state}`);
  if (file.state !== 'ACTIVE') die(`File processing failed for ${v.name}: ${file.state}`);
  uploaded.push({ name: v.name, file });
}

// Build a multi-part prompt that labels each video so Gemini can reference them by filename
const parts = [];
for (const u of uploaded) {
  parts.push({ text: `\n=== SOURCE VIDEO: ${u.name} ===\n` });
  parts.push({ fileData: { fileUri: u.file.uri, mimeType: u.file.mimeType } });
}
parts.push({ text: '\n=== INSTRUCTIONS ===\n' + promptText });

console.log('\n[analyze-mix] calling Gemini to assemble the mix...\n');
const response = await ai.models.generateContent({
  model: modelId,
  contents: [{ role: 'user', parts }],
  config: {
    temperature: 0.8,
    responseMimeType: 'application/json',
  },
});

const raw = response.text ?? '';
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error('[analyze-mix] Gemini did not return valid JSON. Raw response:\n');
  console.error(raw);
  die('Parse failed: ' + e.message);
}

// Validate sources
const validSources = new Set(videoPaths.map((v) => v.name));
const badClips = (parsed.clips || []).filter((c) => !validSources.has(c.source));
if (badClips.length) {
  console.warn(
    `[analyze-mix] WARNING: ${badClips.length} clip(s) reference an unknown source. ` +
      `Valid sources: ${[...validSources].join(', ')}`,
  );
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));

const totalSecs = (parsed.clips || []).reduce(
  (acc, c) => acc + (toSeconds(c.end) - toSeconds(c.start)),
  0,
);

console.log(`\n[analyze-mix] DONE. ${parsed.clips?.length || 0} clips, ~${totalSecs.toFixed(1)}s total`);
console.log(`[analyze-mix] wrote ${outPath}`);
console.log(
  `\nNext: node render-mix.mjs ${path.basename(outPath)} ${videoPaths.map((v) => v.name).join(' ')}`,
);

// ---------- helpers ----------
function guessMime(p) {
  const ext = path.extname(p).toLowerCase();
  return (
    {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.m4v': 'video/mp4',
    }[ext] || 'video/mp4'
  );
}

function toSeconds(ts) {
  if (typeof ts === 'number') return ts;
  const parts = String(ts).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(ts) || 0;
}
