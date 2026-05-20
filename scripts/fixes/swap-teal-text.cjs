#!/usr/bin/env node
/**
 * Replace `text-corporate-teal` with `text-corporate-teal-ink` ONLY when the
 * occurrence is a text usage (not an icon decoration).
 *
 * Heuristic: an icon line typically has BOTH `w-N` and `h-N` Tailwind size
 * utilities adjacent to the color class. Anything else is treated as text.
 *
 * Pass --apply to actually write changes; otherwise prints a dry-run summary.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', 'src');
const APPLY = process.argv.includes('--apply');

const exts = new Set(['.js', '.jsx']);
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (exts.has(path.extname(name))) files.push(p);
  }
}
walk(ROOT);

// Match a JSX className string and inspect each token list inside it.
// We only need to look at the substring containing `text-corporate-teal`.
const SIZE_RE = /\bw-\d+(\.\d+)?\b/;
const SIZE_H_RE = /\bh-\d+(\.\d+)?\b/;

let textSwaps = 0;
let iconKeeps = 0;
let modifiedFiles = 0;

for (const file of files) {
  const orig = fs.readFileSync(file, 'utf8');
  if (!orig.includes('text-corporate-teal')) continue;

  // Walk line by line, since classNames are typically on one line.
  const lines = orig.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('text-corporate-teal')) continue;

    // Replace only `text-corporate-teal` whole-token (not -ink/-soft/-dark variants)
    // Use word boundary on the right: must be followed by space, ", ', `, /, or end.
    const tokenRe = /\btext-corporate-teal(?![-\w/])/g;

    let newLine = line.replace(tokenRe, (match, offset) => {
      // Look at the className string surrounding this token to decide icon vs text.
      // Find the nearest enclosing quote pair.
      const before = line.slice(0, offset);
      const after = line.slice(offset);
      // Find nearest opening quote
      const openMatch = before.match(/["'`][^"'`]*$/);
      const closeMatch = after.match(/^[^"'`]*["'`]/);
      const cls = (openMatch ? openMatch[0].slice(1) : '') + (closeMatch ? closeMatch[0].slice(0, -1) : '');

      // If the class string contains BOTH w-N and h-N → icon. Keep brand color.
      if (SIZE_RE.test(cls) && SIZE_H_RE.test(cls)) {
        iconKeeps++;
        return match;
      }
      textSwaps++;
      return 'text-corporate-teal-ink';
    });

    if (newLine !== line) {
      lines[i] = newLine;
      changed = true;
    }
  }

  if (changed) {
    modifiedFiles++;
    if (APPLY) fs.writeFileSync(file, lines.join('\n'));
  }
}

console.log(`Files scanned: ${files.length}`);
console.log(`Files modified: ${modifiedFiles}`);
console.log(`Text swaps:    ${textSwaps}  (text-corporate-teal -> text-corporate-teal-ink)`);
console.log(`Icon kept:     ${iconKeeps}  (kept brand color for icons w/ w-N h-N)`);
console.log(APPLY ? '\nWrote changes to disk.' : '\nDry run. Re-run with --apply to write.');
