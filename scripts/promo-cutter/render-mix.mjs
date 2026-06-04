#!/usr/bin/env node
/**
 * render-mix.mjs — Like render.mjs but each clip can come from a different
 * source video (clip.source = "ryan-v1.mp4" etc.).
 *
 * Usage:
 *   node render-mix.mjs <clips.json> <video1> [video2] ...
 *   node render-mix.mjs mix--rob-tribute.json ryan-v1.mp4 ryan-v2.mp4
 *
 * Flags:
 *   --subs           Burn the target word as a subtitle on each clip
 *   --crossfade=0.05 Crossfade between clips (seconds). Default 0.
 *   --gap=0.05       Force tiny silent gap between clips (helps avoid audio glitches)
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_DIR = path.join(__dirname, 'output');

function die(msg) {
  console.error(`\n[render-mix] ERROR: ${msg}\n`);
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

const [clipsArg, ...videoArgs] = positional;
if (!clipsArg || videoArgs.length === 0) {
  die('Usage: node render-mix.mjs <clips.json> <video1> [video2] ... [--subs] [--crossfade=0.05]');
}

const clipsPath = path.isAbsolute(clipsArg) ? clipsArg : path.join(OUTPUT_DIR, clipsArg);
if (!fs.existsSync(clipsPath)) die(`Clips JSON not found: ${clipsPath}`);

// Build name → absolute path map
const sourceMap = {};
for (const v of videoArgs) {
  const p = path.isAbsolute(v) ? v : path.join(INPUT_DIR, v);
  if (!fs.existsSync(p)) die(`Video not found: ${p}`);
  sourceMap[path.basename(p)] = p;
}

const data = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
const clips = data.clips || [];
if (!clips.length) die('No clips in JSON');

const burnSubs = !!flags.subs;
const crossfade = Number(flags.crossfade || 0);
const gap = Number(flags.gap || 0);

const baseName = path.basename(clipsPath, '.json');
const workDir = path.join(OUTPUT_DIR, `.tmp-${baseName}`);
fs.rmSync(workDir, { recursive: true, force: true });
fs.mkdirSync(workDir, { recursive: true });

const finalOut = path.join(OUTPUT_DIR, `${baseName}.mp4`);

console.log(`[render-mix] clips:     ${clips.length}`);
console.log(`[render-mix] sources:   ${Object.keys(sourceMap).join(', ')}`);
console.log(`[render-mix] subs:      ${burnSubs ? 'on (word labels)' : 'off'}`);
console.log(`[render-mix] crossfade: ${crossfade}s`);
console.log(`[render-mix] gap:       ${gap}s`);
console.log(`[render-mix] output:    ${finalOut}\n`);

// Cut each clip from its source
const cutFiles = [];
clips.forEach((clip, i) => {
  // Synthetic gap clip (a missed word)
  if (clip.source === '__gap__') {
    const dur = Number(clip.gap || 0.25);
    const gapPath = path.join(workDir, `clip-${String(i).padStart(3, '0')}.mp4`);
    const overlay = burnSubs && clip.word
      ? `,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='[${clip.word}?]':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2`
      : '';
    const r = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-f', 'lavfi', '-i', `color=c=black:s=1920x1080:r=30:d=${dur}`,
        '-f', 'lavfi', '-i', `anullsrc=channel_layout=stereo:sample_rate=48000`,
        '-t', String(dur),
        '-vf', `setsar=1${overlay}`,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '160k',
        '-shortest',
        gapPath,
      ],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    );
    if (r.status === 0) {
      cutFiles.push(gapPath);
      console.log(`[render-mix] gap ${i + 1}/${clips.length} [${clip.word}?] ${dur}s`);
    }
    return;
  }

  const src = sourceMap[clip.source];
  if (!src) {
    console.warn(`[render-mix] skipping clip ${i}: unknown source "${clip.source}"`);
    return;
  }
  const start = toSeconds(clip.start);
  const end = toSeconds(clip.end);
  const duration = Math.max(0.05, end - start);
  const cutPath = path.join(workDir, `clip-${String(i).padStart(3, '0')}.mp4`);

  const filters = [
    // Normalize all clips to a common canvas so concat doesn't choke on size mismatches
    `scale=1920:1080:force_original_aspect_ratio=decrease`,
    `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black`,
    `setsar=1`,
  ];
  if (burnSubs && clip.word) {
    const srtPath = path.join(workDir, `clip-${String(i).padStart(3, '0')}.srt`);
    fs.writeFileSync(srtPath, makeSrt(clip.word, duration));
    const esc = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
    filters.push(
      `subtitles='${esc}':force_style='Fontname=Sans,Fontsize=28,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=60'`,
    );
  }
  const vfArg = ['-vf', filters.join(',')];

  console.log(
    `[render-mix] cut ${i + 1}/${clips.length} ${clip.source} ${clip.start}→${clip.end} ` +
      `(${duration.toFixed(2)}s) "${clip.word || ''}" [${clip.actual || ''}]`,
  );

  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-ss', String(start),
      '-i', src,
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

  // Optional silent gap
  if (gap > 0 && i < clips.length - 1) {
    const gapPath = path.join(workDir, `gap-${String(i).padStart(3, '0')}.mp4`);
    const r = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-f', 'lavfi', '-i', `color=c=black:s=1920x1080:r=30:d=${gap}`,
        '-f', 'lavfi', '-i', `anullsrc=channel_layout=stereo:sample_rate=48000`,
        '-t', String(gap),
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '160k',
        '-shortest',
        gapPath,
      ],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    );
    if (r.status === 0) cutFiles.push(gapPath);
  }
});

if (!cutFiles.length) die('No clips were cut successfully');

console.log('\n[render-mix] concatenating...');
if (crossfade > 0 && cutFiles.length > 1) {
  concatWithCrossfade(cutFiles, finalOut, crossfade);
} else {
  // Re-encode concat (clips share params already, but force consistency to avoid stream mismatches)
  const inputs = cutFiles.flatMap((f) => ['-i', f]);
  const n = cutFiles.length;
  const filter =
    cutFiles.map((_, i) => `[${i}:v:0][${i}:a:0]`).join('') +
    `concat=n=${n}:v=1:a=1[outv][outa]`;
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      ...inputs,
      '-filter_complex', filter,
      '-map', '[outv]',
      '-map', '[outa]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '160k',
      '-movflags', '+faststart',
      finalOut,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  if (r.status !== 0) die('ffmpeg concat failed');
}

const totalSec = clips.reduce((a, c) => a + (toSeconds(c.end) - toSeconds(c.start)), 0);
console.log(`\n[render-mix] DONE. ~${totalSec.toFixed(1)}s output → ${finalOut}`);
console.log('[render-mix] (intermediate cuts in ' + workDir + ')');

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

function makeSrt(text, durationSec) {
  return `1\n${fmtSrtTime(0)} --> ${fmtSrtTime(durationSec)}\n${text}\n`;
}

function concatWithCrossfade(files, output, xfade) {
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
