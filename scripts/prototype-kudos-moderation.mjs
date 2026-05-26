#!/usr/bin/env node
/**
 * prototype-kudos-moderation.mjs
 *
 * Prototype script for the anonymous Kudos AI moderation layer.
 *
 * Goal: validate that a single prompt can reliably:
 *   1. ACCEPT  — genuine positive messages, preserving voice
 *   2. REWRITE — messages that are positive but reveal sender identity,
 *                contain minor issues, or could be tightened
 *   3. REJECT  — messages that are passive-aggressive, sarcastic,
 *                harassing, identifying in ways that can't be salvaged,
 *                or otherwise unsafe
 *
 * Usage:
 *   node scripts/prototype-kudos-moderation.mjs
 *   node scripts/prototype-kudos-moderation.mjs --model gemini-2.0-flash
 *   node scripts/prototype-kudos-moderation.mjs --only 3,7,12
 *   node scripts/prototype-kudos-moderation.mjs --env dev|test|prod
 *
 * This calls the deployed `geminiProxy` Cloud Function (same path the real
 * Kudos feature will use), so no local API key is needed.
 *
 * The moderation prompt itself lives in `functions/kudosModeration.js`
 * (single source of truth). This script imports it so prompt iteration
 * only happens in one place — and the deployed `moderateKudos` Cloud
 * Function and this prototype always agree.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  KUDOS_MODERATION_PROMPT: MODERATION_PROMPT,
  KUDOS_SYSTEM_INSTRUCTION,
} = require('../functions/kudosModeration.js');

// ---- CLI args -------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const MODEL = getArg('--model') || 'gemini-2.0-flash';
const ONLY = getArg('--only')
  ? new Set(getArg('--only').split(',').map((s) => parseInt(s.trim(), 10)))
  : null;
const ENV = getArg('--env') || 'dev';

const PROXY_URLS = {
  dev: 'https://us-central1-leaderreps-pd-platform.cloudfunctions.net/geminiProxy',
  test: 'https://us-central1-leaderreps-test.cloudfunctions.net/geminiProxy',
  prod: 'https://us-central1-leaderreps-prod.cloudfunctions.net/geminiProxy',
};
const PROXY_URL = PROXY_URLS[ENV];
if (!PROXY_URL) {
  console.error(`ERROR: unknown --env "${ENV}". Use dev | test | prod.`);
  process.exit(1);
}

// ---- The moderation prompt (imported from functions/kudosModeration.js) --
// To iterate on the prompt, edit functions/kudosModeration.js — NOT this file.
// (Removed inline copy; see import at top.)

// ---- Test cases -----------------------------------------------------------
// Mix of genuine, edge, identifying, sarcastic, harassing, generic, weird.
const TEST_CASES = [
  {
    label: 'Genuine warm — friend',
    expect: 'accept',
    input:
      "You're one of the calmest people I know. I think about how you handle stress when I'm losing mine. Thank you for being you.",
  },
  {
    label: 'Genuine warm — colleague (no identifiers)',
    expect: 'accept',
    input:
      'Quietly: you make the people around you better. You probably do not hear it enough.',
  },
  {
    label: 'Short and sweet',
    expect: 'accept',
    input: 'You matter. That is the whole message.',
  },
  {
    label: 'Identifies via shared event',
    expect: 'rewrite',
    input:
      'Your presentation at the Q2 offsite in Denver was incredible. You carried that whole meeting.',
  },
  {
    label: 'Identifies via relationship — sister',
    expect: 'rewrite',
    input:
      "Hey little brother, your big sister is so proud of how far you've come. Keep going.",
  },
  {
    label: 'Identifies via role — manager',
    expect: 'rewrite',
    input:
      "As your manager I do not say this enough — your work this quarter has been outstanding.",
  },
  {
    label: 'Passive-aggressive',
    expect: 'reject',
    input:
      "It's great that you finally started showing up on time. Keep it up, I guess.",
  },
  {
    label: 'Sarcastic',
    expect: 'reject',
    input: 'Wow, another email from you. Truly a gift to the inbox.',
  },
  {
    label: 'Backhanded compliment',
    expect: 'reject',
    input:
      "You're surprisingly good at your job for someone with your background.",
  },
  {
    label: 'Guilt trip disguised as kudos',
    expect: 'reject',
    input:
      "Thanks for finally remembering I exist. Means a lot after all this time.",
  },
  {
    label: 'Harassment / creepy',
    expect: 'reject',
    input:
      "I watch you every morning and I think about you all day. You're perfect.",
  },
  {
    label: 'Generic but harmless',
    expect: 'accept',
    input: 'You are awesome and I appreciate you!',
  },
  {
    label: 'Long but genuine',
    expect: 'accept',
    input:
      "I have been meaning to say this for a long time. The way you listen — really listen, not just wait to talk — has changed how I show up in conversations. I steal from your playbook constantly and I have never told you. So: thank you. Quietly, from someone whose life is better because of you.",
  },
  {
    label: 'Profanity, positive intent',
    expect: 'accept',
    input: "You're a damn good human and I'm lucky to know you.",
  },
  {
    label: 'Mild identifier — generic life fact',
    expect: 'accept',
    input:
      "Your kid is lucky to have you as a parent. The way you talk about them lights you up.",
  },
  {
    label: 'Inside joke (identifying)',
    expect: 'rewrite',
    input: 'Remember the tacos in 2019? You were right. About everything.',
  },
  {
    label: 'Vague to the point of meaningless',
    expect: 'reject',
    input: 'Hi.',
  },
  {
    label: 'Negative framing dressed as positive',
    expect: 'reject',
    input:
      "Most people would have cracked under the way you've been treated. You're stronger than the people around you deserve.",
  },
  {
    label: 'Compliment + soft ask (boundary violation)',
    expect: 'reject',
    input:
      "You're amazing. We should grab coffee — I know it's anonymous but you'll figure out who I am.",
  },
  {
    label: 'Compliment about quiet competence',
    expect: 'accept',
    input:
      'You make hard things look easy and you never make anyone feel small for not getting it the first time. That is rare.',
  },
];

// ---- geminiProxy call -----------------------------------------------------
// geminiProxy is an onRequest function with invoker:'public' — we POST a
// { prompt, model, systemInstruction } body and get back { text, provider, model }.
async function moderate(input, model) {
  const prompt = MODERATION_PROMPT.replace('{{INPUT}}', input);

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model,
      systemInstruction: KUDOS_SYSTEM_INSTRUCTION,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`geminiProxy ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  let text = data?.text || '';
  // Strip markdown fences if the model added them despite instructions.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(text);
    parsed._provider = data.provider;
    parsed._model = data.model;
    return parsed;
  } catch {
    return { _rawText: text, _parseError: true, _provider: data.provider };
  }
}

// ---- Pretty printing ------------------------------------------------------
const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const colorForDecision = (d) =>
  d === 'accept' ? C.green : d === 'rewrite' ? C.yellow : d === 'reject' ? C.red : C.dim;

function printResult(i, tc, result) {
  const decision = result.decision || '(no decision)';
  const matched = decision === tc.expect;
  const matchTag = matched ? `${C.green}✓ match${C.reset}` : `${C.red}✗ expected ${tc.expect}${C.reset}`;

  console.log(
    `\n${C.bold}#${i + 1}${C.reset} ${C.cyan}${tc.label}${C.reset}  ` +
      `${colorForDecision(decision)}[${decision}]${C.reset}  ${matchTag}`
  );
  console.log(`${C.dim}  in :${C.reset} ${tc.input}`);
  if (result._parseError) {
    console.log(`${C.red}  !! could not parse JSON${C.reset}`);
    console.log(`${C.dim}  raw:${C.reset} ${result._rawText?.slice(0, 300)}`);
    return matched;
  }
  console.log(`${C.dim}  out:${C.reset} ${result.rewritten || C.dim + '(none)' + C.reset}`);
  console.log(
    `${C.dim}  why:${C.reset} ${result.reason || '-'}   ` +
      `${C.dim}risk=${C.reset}${result.deAnonymizationRisk || '-'}  ` +
      `${C.dim}sent=${C.reset}${result.sentiment || '-'}  ` +
      `${C.dim}tags=${C.reset}${(result.concerns || []).join(',') || '-'}`
  );
  return matched;
}

// ---- Main -----------------------------------------------------------------
(async () => {
  console.log(`${C.bold}Kudos moderation prototype${C.reset}`);
  console.log(
    `${C.dim}env=${ENV}  model=${MODEL}  cases=${TEST_CASES.length}  ` +
      `proxy=${PROXY_URL}${C.reset}`
  );

  let matches = 0;
  let total = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    if (ONLY && !ONLY.has(i + 1)) continue;
    total++;
    const tc = TEST_CASES[i];
    try {
      const result = await moderate(tc.input, MODEL);
      const ok = printResult(i, tc, result);
      if (ok) matches++;
    } catch (err) {
      console.log(
        `\n${C.bold}#${i + 1}${C.reset} ${C.cyan}${tc.label}${C.reset}  ` +
          `${C.red}ERROR: ${err.message}${C.reset}`
      );
    }
  }

  console.log(
    `\n${C.bold}Summary:${C.reset} ${matches}/${total} matched expected decision ` +
      `(${Math.round((matches / total) * 100)}%)`
  );
  console.log(
    `${C.dim}Note: "expected" is a rough heuristic. Eyeball the rewrites — ` +
      `voice preservation matters more than the label.${C.reset}\n`
  );
})();
