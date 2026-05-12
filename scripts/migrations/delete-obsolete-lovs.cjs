#!/usr/bin/env node
// Delete obsolete LOVs from system_lovs.
// Keeps: Content Categories, Leadership Tiers, Skills (groups/content_skills), System Quotes.
//
// Usage: node scripts/migrations/delete-obsolete-lovs.cjs
const admin = require('firebase-admin');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, '..', '..', 'leaderreps-pd-platform-firebase-adminsdk.json'))) });
const db = admin.firestore();

const TO_DELETE = [
  { id: 'gzrCseY6odOEuEHpCc3j', title: 'Coaching Types' },
  { id: '07tJpRPlOssCDFY3sfoQ', title: 'Community Types' },
  { id: 'EFwTThxkrgKtwlAjG7p5', title: 'Content Types' },
  { id: '1Ts8W1eTBXoOu2lKFJgh', title: 'Difficulty Levels' },
  { id: 'QzEbju7bAvU6tK3AfDQB', title: 'Pillars' },
  { id: 'ARa3oCpCvvtwZDL9uYsJ', title: 'Program Phases' },
  { id: 'content_programs', title: 'Programs' },
  { id: 'zViZIRA1Hh0YO5o3YnA7', title: 'Skills (string list)' },
  { id: 'content_workouts', title: 'Workouts' },
];

(async () => {
  for (const { id, title } of TO_DELETE) {
    const ref = db.doc(`system_lovs/${id}`);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`[skip] ${title} (${id}) — not found`);
      continue;
    }
    await ref.delete();
    console.log(`[ok]   deleted ${title} (${id})`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
