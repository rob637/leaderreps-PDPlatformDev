const admin = require('firebase-admin');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require(path.join(process.cwd(), 'leaderreps-pd-platform-firebase-adminsdk.json'))) });
const db = admin.firestore();
(async () => {
  for (const id of ['foundation-content', 'ascent-content']) {
    const snap = await db.doc(`daily_plan_v2/${id}`).get();
    const d = snap.data() || {};
    console.log(`\n=== ${id} ===`);
    for (const k of ['actions','contentItems','events','tools','workouts','content','resources','coaching','community','reps','coachingItems','communityItems','dailyReps']) {
      const v = d[k];
      console.log(`  ${k}: ${Array.isArray(v) ? v.length : (v === undefined ? '—' : typeof v)}`);
    }
  }
  process.exit(0);
})();
