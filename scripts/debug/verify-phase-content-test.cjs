#!/usr/bin/env node
// Quick read-back of daily_plan_v2 docs in TEST to confirm copy.
const admin = require('firebase-admin');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const cfg = {
  projectId: 'leaderreps-test',
  keyPath: path.join(ROOT, 'leaderreps-test-firebase-adminsdk.json'),
};

admin.initializeApp({
  credential: admin.credential.cert(require(cfg.keyPath)),
  projectId: cfg.projectId,
});
const db = admin.firestore();

(async () => {
  for (const id of ['foundation-content', 'ascent-content']) {
    const snap = await db.doc(`daily_plan_v2/${id}`).get();
    console.log(`\n=== TEST/daily_plan_v2/${id} ===`);
    if (!snap.exists) {
      console.log('  MISSING');
      continue;
    }
    const data = snap.data() || {};
    console.log('  Top-level keys:', Object.keys(data));
    const items = Array.isArray(data.contentItems) ? data.contentItems : [];
    console.log(`  contentItems: ${items.length}`);
    items.forEach((it, i) => {
      console.log(`   [${i}] label="${it.contentItemLabel || it.label || it.title || '?'}" resourceId=${it.resourceId || it.contentId || '(none)'} type=${it.resourceType || it.type || '?'}`);
    });
    if (data.copyMeta) {
      console.log('  copyMeta:', JSON.stringify(data.copyMeta));
    }
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
