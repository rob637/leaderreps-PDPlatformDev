#!/usr/bin/env node
/**
 * Set metadata/config.GEMINI_MODEL across all 3 environments.
 * Usage: node scripts/set-gemini-model.cjs [model]
 *   default model: gemini-2.5-flash
 */
const admin = require('firebase-admin');
const path = require('path');

const MODEL = process.argv[2] || 'gemini-2.5-flash';

const PROJECTS = [
  { name: 'dev',  projectId: 'leaderreps-pd-platform', key: 'leaderreps-pd-platform-firebase-adminsdk.json' },
  { name: 'test', projectId: 'leaderreps-test',        key: 'leaderreps-test-firebase-adminsdk.json' },
  { name: 'prod', projectId: 'leaderreps-prod',        key: 'leaderreps-prod-firebase-adminsdk.json' },
];

(async () => {
  for (const p of PROJECTS) {
    const app = admin.initializeApp({
      credential: admin.credential.cert(require(path.resolve(__dirname, '..', p.key))),
      projectId: p.projectId,
    }, p.name);

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
})().catch((e) => { console.error(e); process.exit(1); });
