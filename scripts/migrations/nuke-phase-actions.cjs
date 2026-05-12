#!/usr/bin/env node
// Nuke the actions array on daily_plan_v2 phase docs.
// The 51 items in foundation-content.actions were polluted with
// daily_rep / conditioning-rep / content references during the
// daily_plan_v1 → v2 seed. Real content lives in contentItems,
// tools, workouts, events — those are unaffected.
//
// Usage: node scripts/migrations/nuke-phase-actions.cjs

const admin = require('firebase-admin');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, '..', '..', 'leaderreps-pd-platform-firebase-adminsdk.json'))) });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

(async () => {
  for (const id of ['foundation-content', 'ascent-content']) {
    const ref = db.doc(`daily_plan_v2/${id}`);
    const snap = await ref.get();
    if (!snap.exists) { console.log(`[skip] ${id} missing`); continue; }
    const before = (snap.data().actions || []).length;
    await ref.update({
      actions: [],
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'nuke-phase-actions.cjs',
    });
    console.log(`[ok]  ${id} — actions cleared (was ${before})`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
