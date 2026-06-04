#!/usr/bin/env node
/**
 * analyze.mjs — Uploads a video to Gemini, asks it to pick promo clips,
 * writes the result to ./output/<video>-<prompt>.json
 *
 * Usage:
 *   node analyze.mjs <video-file-in-input/> <prompt-name>
 *   node analyze.mjs ryan-v1.mp4 landing-page
 *   node analyze.mjs ryan-v1.mp4 bloopers
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
  console.error(`\n[analyze] ERROR: ${msg}\n`);
  process.exit(1);
}

const [, , videoArg, promptArg] = process.argv;
if (!videoArg || !promptArg) {
  die('Usage: node analyze.mjs <video-filename-in-input/> <prompt-name>\n' +
      '  e.g. node analyze.mjs ryan-v1.mp4 landing-page');
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.startsWith('your_key')) {
  die('GEMINI_API_KEY missing. Copy .env.example to .env and fill it in.');
}

const videoPath = path.isAbsolute(videoArg) ? videoArg : path.join(INPUT_DIR, videoArg);
if (!fs.existsSync(videoPath)) die(`Video not found: ${videoPath}`);

const promptPath = path.join(PROMPTS_DIR, `${promptArg}.md`);
if (!fs.existsSync(promptPath)) die(`Prompt not found: ${promptPath}`);

const promptText = fs.readFileSync(promptPath, 'utf8');
const modelId = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const videoBase = path.basename(videoPath).replace(/\.[^.]+$/, '');
const outPath = path.join(OUTPUT_DIR, `${videoBase}--${promptArg}.json`);

console.log(`[analyze] video:  ${videoPath}`);
console.log(`[analyze] prompt: ${promptPath}`);
console.log(`[analyze] model:  ${modelId}`);
console.log(`[analyze] output: ${outPath}\n`);

const ai = new GoogleGenAI({ apiKey });

console.log('[analyze] uploading video to Gemini File API (this can take a minute for large files)...');
const uploaded = await ai.files.upload({
  file: videoPath,
  config: { mimeType: guessMime(videoPath) },
});
console.log(`[analyze] uploaded: ${uploaded.name} (${uploaded.uri})`);

// Wait until processing is done
let fileMeta = uploaded;
while (fileMeta.state === 'PROCESSING') {
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, 3000));
  fileMeta = await ai.files.get({ name: uploaded.name });
}
console.log(`\n[analyze] file state: ${fileMeta.state}`);
if (fileMeta.state !== 'ACTIVE') die(`File processing failed: ${fileMeta.state}`);

console.log('[analyze] calling Gemini to pick clips...\n');
const response = await ai.models.generateContent({
  model: modelId,
  contents: [
    {
      role: 'user',
      parts: [
        { fileData: { fileUri: fileMeta.uri, mimeType: fileMeta.mimeType } },
        { text: promptText },
      ],
    },
  ],
  config: {
    temperature: 0.7,
    responseMimeType: 'application/json',
  },
});

const raw = response.text ?? '';
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error('[analyze] Gemini did not return valid JSON. Raw response:\n');
  console.error(raw);
  die('Parse failed: ' + e.message);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));

const totalSecs = (parsed.clips || []).reduce(
  (acc, c) => acc + (toSeconds(c.end) - toSeconds(c.start)),
  0,
);

console.log(`\n[analyze] DONE. ${parsed.clips?.length || 0} clips, ~${totalSecs.toFixed(1)}s total`);
console.log(`[analyze] wrote ${outPath}`);
console.log(`\nNext: node render.mjs ${path.basename(outPath)} ${path.basename(videoPath)}`);

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
