#!/usr/bin/env node
/**
 * Copy Phase Content Manager docs from Dev to Test.
 *
 * Source: leaderreps-pd-platform / daily_plan_v2/{foundation-content,ascent-content}
 * Target: leaderreps-test         / daily_plan_v2/{foundation-content,ascent-content}
 *
 * Usage:
 *   node scripts/migrations/copy-phase-content-dev-to-test.cjs            # writes
 *   node scripts/migrations/copy-phase-content-dev-to-test.cjs --dry-run  # preview only
 *
 * Notes:
 *   - Only copies the two daily_plan_v2 docs. Underlying content collections
 *     (content_videos, unified-content, etc.) are NOT touched. Item refs in
 *     these docs assume target env already has the same content IDs.
 *   - Adds copyMeta on the written docs.
 */

const admin = require('firebase-admin');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');

const SOURCE = {
  name: 'dev',
  projectId: 'leaderreps-pd-platform',
  keyPath: path.join(ROOT, 'leaderreps-pd-platform-firebase-adminsdk.json'),
};
const TARGET = {
  name: 'test',
  projectId: 'leaderreps-test',
  keyPath: path.join(ROOT, 'leaderreps-test-firebase-adminsdk.json'),
};

const DOC_IDS = ['foundation-content', 'ascent-content'];

function initApp(cfg) {
  return admin.initializeApp(
    {
      credential: admin.credential.cert(require(cfg.keyPath)),
      projectId: cfg.projectId,
    },
    cfg.name,
  );
}

(async () => {
  console.log('────────────────────────────────────────────────────────');
  console.log(' Copy Phase Content: Dev → Test');
  console.log('  Source :', SOURCE.projectId);
  console.log('  Target :', TARGET.projectId);
  console.log('  Dry run:', DRY_RUN ? 'YES (no writes)' : 'NO');
  console.log('────────────────────────────────────────────────────────');

  const srcApp = initApp(SOURCE);
  const tgtApp = initApp(TARGET);
  const srcDb = srcApp.firestore();
  const tgtDb = tgtApp.firestore();

  let okCount = 0;
  let missCount = 0;

  for (const id of DOC_IDS) {
    const srcRef = srcDb.collection('daily_plan_v2').doc(id);
    const snap = await srcRef.get();
    if (!snap.exists) {
      console.log(`⚠️  daily_plan_v2/${id}: missing in source — skipping`);
      missCount += 1;
      continue;
    }
    const data = snap.data() || {};
    const itemCount = Array.isArray(data.contentItems) ? data.contentItems.length : 0;
    console.log(`📄 daily_plan_v2/${id}: ${itemCount} contentItems`);

    if (DRY_RUN) {
      okCount += 1;
      continue;
    }

    const payload = {
      ...data,
      copyMeta: {
        copiedFrom: SOURCE.projectId,
        copiedTo: TARGET.projectId,
        copiedAt: admin.firestore.FieldValue.serverTimestamp(),
        script: 'scripts/migrations/copy-phase-content-dev-to-test.cjs',
      },
    };

    await tgtDb.collection('daily_plan_v2').doc(id).set(payload);
    console.log(`   ✅ wrote to ${TARGET.projectId}/daily_plan_v2/${id}`);
    okCount += 1;
  }

  console.log('────────────────────────────────────────────────────────');
  console.log(` Done. ${okCount} doc(s) ${DRY_RUN ? 'previewed' : 'copied'}, ${missCount} missing.`);
  console.log('────────────────────────────────────────────────────────');

  await Promise.all([srcApp.delete(), tgtApp.delete()]);
})().catch((err) => {
  console.error('❌ Copy failed:', err);
  process.exit(1);
});
