#!/usr/bin/env node
/**
 * Set metadata/config.GEMINI_MODEL across all 3 environments.
 *
 * Usage:
 *   node scripts/set-gemini-model.cjs [model]
 *
 * Defaults:
 *   model = gemini-2.5-flash
 *
 * Auth:
 *   Uses Application Default Credentials (ADC). Run once:
 *     gcloud auth application-default login
 *   Your Google account must have Firestore write access (roles/datastore.user
 *   or owner/editor) on each target project.
 */
const admin = require('firebase-admin');

const MODEL = process.argv[2] || 'gemini-2.5-flash';

const PROJECTS = [
  { name: 'dev',  projectId: 'leaderreps-pd-platform' },
  { name: 'test', projectId: 'leaderreps-test' },
  { name: 'prod', projectId: 'leaderreps-prod' },
];

(async () => {
  for (const p of PROJECTS) {
    // No `credential` field => firebase-admin picks up ADC automatically.
    const app = admin.initializeApp({ projectId: p.projectId }, p.name);

    const db = admin.firestore(app);
    const ref = db.doc('metadata/config');
    const before = await ref.get();
    const prev = before.exists ? before.data().GEMINI_MODEL : '(no doc)';
    await ref.set({ GEMINI_MODEL: MODEL }, { merge: true });
    const after = await ref.get();
    console.log(`[${p.name.padEnd(4)}] ${p.projectId}: GEMINI_MODEL  ${prev}  ->  ${after.data().GEMINI_MODEL}`);

    await app.delete();
  }
  console.log('\nDone.');
})().catch((e) => {
  console.error(e);
  if (String(e && e.message).includes('Could not load the default credentials')) {
    console.error('\nADC not configured. Run:  gcloud auth application-default login');
  }
  process.exit(1);
});
