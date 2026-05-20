#!/usr/bin/env node
/**
 * scripts/seed-ascent-revamp-flag.cjs
 *
 * Seeds the `ascentRevamp` cohort flag into `config/features` so the
 * Ascent Revamp UI activates for the chosen audience. Without this,
 * `useRevampFlag` returns false for every user.
 *
 * USAGE:
 *   # Enable for everyone in dev:
 *   node scripts/seed-ascent-revamp-flag.cjs --project=leaderreps-pd-platform --cohorts=all
 *
 *   # Enable for specific cohorts in prod:
 *   node scripts/seed-ascent-revamp-flag.cjs --project=leaderreps-prod --cohorts=cohort-263,cohort-264
 *
 *   # Disable (kill switch):
 *   node scripts/seed-ascent-revamp-flag.cjs --project=leaderreps-pd-platform --enabled=false
 *
 * Requires the matching admin SDK file at the workspace root, e.g.:
 *   leaderreps-pd-platform-firebase-adminsdk.json
 *   leaderreps-test-firebase-adminsdk.json
 *   leaderreps-prod-firebase-adminsdk.json
 */

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// ---- Parse args -----------------------------------------------------------
const args = process.argv.slice(2).reduce((acc, raw) => {
  const m = raw.match(/^--([^=]+)=(.*)$/);
  if (m) acc[m[1]] = m[2];
  else if (raw.startsWith('--')) acc[raw.slice(2)] = true;
  return acc;
}, {});

const projectId = args.project;
if (!projectId) {
  console.error('ERROR: --project=<firebase-project-id> required');
  process.exit(1);
}

const enabled = args.enabled !== 'false';
const cohorts = (args.cohorts || 'all')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// ---- Init admin SDK -------------------------------------------------------
const credPath = path.resolve(
  __dirname,
  '..',
  `${projectId}-firebase-adminsdk.json`
);
if (!fs.existsSync(credPath)) {
  console.error(`ERROR: admin SDK file not found: ${credPath}`);
  process.exit(1);
}
admin.initializeApp({
  credential: admin.credential.cert(require(credPath)),
  projectId,
});
const db = admin.firestore();

// ---- Write ----------------------------------------------------------------
(async () => {
  console.log(`Project: ${projectId}`);
  console.log(`Setting ascentRevamp = { enabled: ${enabled}, cohorts: ${JSON.stringify(cohorts)} }`);

  const ref = db.collection('config').doc('features');
  const snap = await ref.get();
  const existing = snap.exists ? snap.data() : {};

  await ref.set(
    {
      ...existing,
      ascentRevamp: {
        enabled,
        cohorts,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );

  console.log('✅ Seeded config/features.ascentRevamp');
  process.exit(0);
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
