#!/usr/bin/env node
// Merge daily_plan_v2 phase docs:
//   coachingItems + communityItems  -> events  (preserves legacy entries)
//   dailyReps                       -> deleted
//   coachingItems / communityItems  -> deleted (after merge)
//
// Usage: node scripts/migrations/merge-events-drop-dailyreps.cjs

const admin = require('firebase-admin');
const path = require('path');

const SA = path.join(__dirname, '..', '..', 'leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(require(SA)) });

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const PHASE_DOCS = [
  'daily_plan_v2/foundation-content',
  'daily_plan_v2/ascent-content',
];

const dedupe = (arr) => {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = JSON.stringify({
      r: item?.resourceId || '',
      c: item?.contentItemId || '',
      l: item?.label || item?.eventLabel || item?.coachingItemLabel || item?.communityItemLabel || '',
    });
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

(async () => {
  for (const docPath of PHASE_DOCS) {
    const ref = db.doc(docPath);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`[skip] ${docPath} does not exist`);
      continue;
    }
    const data = snap.data() || {};
    const existingEvents = Array.isArray(data.events) ? data.events : [];
    const coaching = Array.isArray(data.coachingItems) ? data.coachingItems : [];
    const community = Array.isArray(data.communityItems) ? data.communityItems : [];
    const merged = dedupe([
      ...existingEvents,
      ...coaching.map((i) => ({ ...i, _migratedFrom: 'coachingItems' })),
      ...community.map((i) => ({ ...i, _migratedFrom: 'communityItems' })),
    ]);

    const update = {
      events: merged,
      coachingItems: FieldValue.delete(),
      communityItems: FieldValue.delete(),
      dailyReps: FieldValue.delete(),
      // also retire the older parallel arrays that the schema doc mentioned
      coaching: FieldValue.delete(),
      community: FieldValue.delete(),
      reps: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'merge-events-drop-dailyreps.cjs',
    };

    await ref.update(update);
    console.log(`[ok]  ${docPath} — events=${merged.length} (was: events=${existingEvents.length}, coaching=${coaching.length}, community=${community.length}); dropped dailyReps + legacy fields`);
  }
  console.log('Done.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
