#!/usr/bin/env node
/* eslint-disable no-console */
//
// scripts/check-screen-keys.cjs
//
// CI guardrail (REVAMP-PLAN.md §10): verifies that every value in
// REVAMP_SCREEN_ALIASES resolves to a registered key in ScreenRouter's
// ScreenMap. Catches cases where a revamp alias was added but the target
// screen was renamed/removed, which would silently 404 inside the SPA.
//
// Run: `npm run check:screens` (added to package.json scripts).
// Exit code: 0 if all aliases resolve; 1 with a diagnostic on first
// missing target.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ROUTER_PATH = path.join(ROOT, 'src/routing/ScreenRouter.jsx');
const ALIASES_PATH = path.join(ROOT, 'src/routing/screenAliases.js');

const read = (p) => {
  if (!fs.existsSync(p)) {
    console.error(`✗ Missing file: ${path.relative(ROOT, p)}`);
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8');
};

// Pull every key registered in `ScreenMap = { ... }` in ScreenRouter.jsx.
// Matches: 'key': lazy(...)  OR  key: lazy(...)  (bareword keys allowed).
const extractScreenKeys = (source) => {
  const start = source.indexOf('const ScreenMap');
  if (start === -1) {
    console.error("✗ Couldn't find `const ScreenMap` in ScreenRouter.jsx");
    process.exit(1);
  }
  // Naive brace match for the object literal that follows the `=`.
  const eqIdx = source.indexOf('{', start);
  if (eqIdx === -1) process.exit(1);
  let depth = 0;
  let end = -1;
  for (let i = eqIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) {
    console.error('✗ Could not parse ScreenMap braces');
    process.exit(1);
  }
  const body = source.slice(eqIdx + 1, end - 1);
  const keys = new Set();
  // Quoted keys: 'key': or "key":
  const quoted = /["']([a-zA-Z0-9_-]+)["']\s*:\s*lazy/g;
  let m;
  while ((m = quoted.exec(body)) !== null) keys.add(m[1]);
  // Bareword keys: key: lazy
  const bare = /(^|[\n,{\s])([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*lazy/g;
  while ((m = bare.exec(body)) !== null) keys.add(m[2]);
  return keys;
};

// Pull (legacy → revamp) pairs from screenAliases.js
const extractAliases = (source) => {
  const start = source.indexOf('REVAMP_SCREEN_ALIASES');
  if (start === -1) return [];
  const open = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return [];
  const body = source.slice(open + 1, end - 1);
  const pairs = [];
  const re = /["']([a-zA-Z0-9_-]+)["']\s*:\s*["']([a-zA-Z0-9_-]+)["']/g;
  let m;
  while ((m = re.exec(body)) !== null) pairs.push([m[1], m[2]]);
  return pairs;
};

const screenKeys = extractScreenKeys(read(ROUTER_PATH));
const aliases = extractAliases(read(ALIASES_PATH));

if (screenKeys.size === 0) {
  console.error('✗ No screen keys parsed from ScreenRouter.jsx');
  process.exit(1);
}

console.log(`✓ Parsed ${screenKeys.size} screen keys from ScreenRouter.jsx`);
console.log(`✓ Parsed ${aliases.length} alias pairs from screenAliases.js`);

const missing = [];
for (const [legacy, target] of aliases) {
  if (!screenKeys.has(target)) {
    missing.push({ legacy, target });
  }
}

if (missing.length > 0) {
  console.error('\n✗ Revamp alias targets missing from ScreenRouter.jsx ScreenMap:');
  for (const m of missing) {
    console.error(`  - "${m.legacy}" → "${m.target}"  (target not registered)`);
  }
  console.error('\nFix: register the missing screen in ScreenRouter.jsx, OR remove the alias.');
  process.exit(1);
}

console.log('\n✅ All revamp alias targets resolve to registered screens.');
process.exit(0);
