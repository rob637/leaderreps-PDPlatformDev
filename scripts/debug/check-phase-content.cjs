const admin = require('firebase-admin');
const path = require('path');

const envArg = (process.argv.find((a) => a.startsWith('--env=')) || '--env=dev').split('=')[1];
const SA = {
  dev: '../../leaderreps-pd-platform-firebase-adminsdk.json',
  test: '../../leaderreps-test-firebase-adminsdk.json',
  prod: '../../leaderreps-prod-firebase-adminsdk.json',
};
const sa = require(SA[envArg]);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  console.log(`\nEnvironment: ${envArg}\n`);
  for (const id of ['foundation-content', 'ascent-content']) {
    const ref = db.collection('daily_plan_v2').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`daily_plan_v2/${id}: MISSING`);
      continue;
    }
    const d = snap.data() || {};
    const counts = {};
    for (const k of [
      'actions','contentItems','coachingItems','communityItems',
      'tools','workouts','dailyReps','reps','coaching','community',
      'content','resources','skills','pillars',
      'coachingSessionTypes','communitySessionTypes',
    ]) {
      counts[k] = Array.isArray(d[k]) ? d[k].length : 0;
    }
    console.log(`daily_plan_v2/${id}:`);
    console.log('  source docs:', d?._source?.docIds?.length || 0);
    const u = d.updatedAt;
    console.log('  updatedAt:', u && u.toDate ? u.toDate().toISOString() : u);
    console.log('  counts:', JSON.stringify(counts));
  }
  const v1 = await db.collection('daily_plan_v1').get();
  console.log(`\ndaily_plan_v1 doc count: ${v1.size}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
