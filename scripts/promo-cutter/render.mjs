#!/usr/bin/env node
/**
 * render.mjs — Takes a clips JSON from analyze.mjs + the source video,
 * cuts the clips with FFmpeg, burns subtitles, and concatenates to one MP4.
 *
 * Usage:
 *   node render.mjs <clips.json in output/> <video-file in input/>
 *   node render.mjs ryan-v1--landing-page.json ryan-v1.mp4
 *
 * Flags:
 *   --no-subs       Skip burning subtitles
 *   --crossfade=0.3 Crossfade duration between clips (seconds). Default 0.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_DIR = path.join(__dirname, 'output');

function die(msg) {
  console.error(`\n[render] ERROR: ${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v === undefined ? true : v];
    }),
);

const [clipsArg, videoArg] = positional;
if (!clipsArg || !videoArg) {
  die('Usage: node render.mjs <clips.json> <video-file> [--no-subs] [--crossfade=0.3]');
}

const clipsPath = path.isAbsolute(clipsArg) ? clipsArg : path.join(OUTPUT_DIR, clipsArg);
const videoPath = path.isAbsolute(videoArg) ? videoArg : path.join(INPUT_DIR, videoArg);
if (!fs.existsSync(clipsPath)) die(`Clips JSON not found: ${clipsPath}`);
if (!fs.existsSync(videoPath)) die(`Video not found: ${videoPath}`);

const data = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
const clips = data.clips || [];
if (!clips.length) die('No clips in JSON');

const burnSubs = !flags['no-subs'];
const crossfade = Number(flags.crossfade || 0);

const baseName = path.basename(clipsPath, '.json');
const workDir = path.join(OUTPUT_DIR, `.tmp-${baseName}`);
fs.rmSync(workDir, { recursive: true, force: true });
fs.mkdirSync(workDir, { recursive: true });

const finalOut = path.join(OUTPUT_DIR, `${baseName}.mp4`);

console.log(`[render] clips:     ${clips.length}`);
console.log(`[render] video:     ${videoPath}`);
console.log(`[render] subs:      ${burnSubs ? 'on' : 'off'}`);
console.log(`[render] crossfade: ${crossfade}s`);
console.log(`[render] output:    ${finalOut}\n`);

// 1. Cut each clip, optionally burn subs
const cutFiles = [];
clips.forEach((clip, i) => {
  const start = toSeconds(clip.start);
  const end = toSeconds(clip.end);
  const duration = Math.max(0.1, end - start);
  const cutPath = path.join(workDir, `clip-${String(i).padStart(3, '0')}.mp4`);

  const filters = [];
  if (burnSubs && clip.transcript) {
    const srtPath = path.join(workDir, `clip-${String(i).padStart(3, '0')}.srt`);
    fs.writeFileSync(srtPath, makeSrt(clip.transcript, duration));
    // Escape path for ffmpeg subtitles filter
    const esc = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
    filters.push(
      `subtitles='${esc}':force_style='Fontname=Sans,Fontsize=22,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BackColour=&H80000000&,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=40'`,
    );
  }
  // Always re-encode so all clips share codec/timebase for clean concat
  const vfArg = filters.length ? ['-vf', filters.join(',')] : [];

  console.log(`[render] cut ${i + 1}/${clips.length} [${clip.section || ''}] ${clip.start} → ${clip.end} (${duration.toFixed(1)}s)`);

  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-ss', String(start),
      '-i', videoPath,
      '-t', String(duration),
      ...vfArg,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-c:a', 'aac',
      '-b:a', '160k',
      '-ar', '48000',
      '-ac', '2',
      '-movflags', '+faststart',
      cutPath,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  if (result.status !== 0) die(`ffmpeg cut failed on clip ${i}`);
  cutFiles.push(cutPath);
});

// 2. Concatenate
console.log('\n[render] concatenating...');
if (crossfade > 0 && cutFiles.length > 1) {
  // xfade pipeline — slower but smoother
  concatWithCrossfade(cutFiles, finalOut, crossfade);
} else {
  const listPath = path.join(workDir, 'concat.txt');
  fs.writeFileSync(
    listPath,
    cutFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'),
  );
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      finalOut,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  if (r.status !== 0) die('ffmpeg concat failed');
}

const totalSec = clips.reduce((a, c) => a + (toSeconds(c.end) - toSeconds(c.start)), 0);
console.log(`\n[render] DONE. ~${totalSec.toFixed(1)}s output → ${finalOut}`);
console.log('[render] (intermediate cuts kept in ' + workDir + ' for inspection)');

// ---------- helpers ----------
function toSeconds(ts) {
  if (typeof ts === 'number') return ts;
  const parts = String(ts).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(ts) || 0;
}

function fmtSrtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(sec)).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Split a transcript into ~5-7 word chunks and distribute evenly across the clip duration.
function makeSrt(text, durationSec) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const wordsPerChunk = 6;
  const chunks = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  const perChunk = durationSec / chunks.length;
  return chunks
    .map((c, i) => {
      const start = i * perChunk;
      const end = Math.min(durationSec, (i + 1) * perChunk);
      return `${i + 1}\n${fmtSrtTime(start)} --> ${fmtSrtTime(end)}\n${c}\n`;
    })
    .join('\n');
}

function concatWithCrossfade(files, output, xfade) {
  // Build a complex filter graph chaining xfade transitions on video + acrossfade on audio.
  // Get durations first
  const durations = files.map((f) => {
    const out = execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', f,
    ]).toString().trim();
    return Number(out);
  });

  const inputs = files.flatMap((f) => ['-i', f]);
  const parts = [];
  let prevV = '[0:v]';
  let prevA = '[0:a]';
  let runningOffset = durations[0] - xfade;
  for (let i = 1; i < files.length; i++) {
    const vOut = `[v${i}]`;
    const aOut = `[a${i}]`;
    parts.push(`${prevV}[${i}:v]xfade=transition=fade:duration=${xfade}:offset=${runningOffset.toFixed(3)}${vOut}`);
    parts.push(`${prevA}[${i}:a]acrossfade=d=${xfade}${aOut}`);
    prevV = vOut;
    prevA = aOut;
    runningOffset += durations[i] - xfade;
  }
  const filter = parts.join(';');
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      ...inputs,
      '-filter_complex', filter,
      '-map', prevV,
      '-map', prevA,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '160k',
      '-movflags', '+faststart',
      output,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  if (r.status !== 0) die('ffmpeg xfade concat failed');
}
