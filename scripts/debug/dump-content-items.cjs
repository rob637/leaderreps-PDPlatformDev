const admin = require('firebase-admin');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require(path.join(process.cwd(), 'leaderreps-pd-platform-firebase-adminsdk.json'))) });
const db = admin.firestore();
(async () => {
  const snap = await db.doc('daily_plan_v2/foundation-content').get();
  const d = snap.data() || {};
  console.log('--- contentItems (9) ---');
  (d.contentItems||[]).forEach((x,i)=>console.log(i, x.contentItemLabel||x.label||x.title||x.resourceTitle, '|', x.resourceType||x.contentItemType||x.type, '|', x.resourceId||x.contentItemId||'(no id)'));
  console.log('\n--- tools (4) ---');
  (d.tools||[]).forEach((x,i)=>console.log(i, x.toolName||x.label||x.title, '|', x.resourceId||'(no id)'));
  console.log('\n--- workouts (5) ---');
  (d.workouts||[]).forEach((x,i)=>console.log(i, x.workoutName||x.label||x.title, '|', x.resourceId||'(no id)'));
  console.log('\n--- events (7) ---');
  (d.events||[]).forEach((x,i)=>console.log(i, x.eventLabel||x.coachingItemLabel||x.communityItemLabel||x.label||x.title, '|', x.resourceType||x.type, '|', x.resourceId||'(no id)'));
  process.exit(0);
})();
