const admin = require('firebase-admin');
const sa = require('../leaderreps-test-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function check() {
  // Check day-001 and day-015 from daily_plan_v1
  for (const dayId of ['day-001', 'day-015']) {
    const doc = await db.collection('daily_plan_v1').doc(dayId).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`\n=== ${dayId} ===`);
      console.log('Phase:', data.phase);
      console.log('Title:', data.title);
      console.log('dayNumber:', data.dayNumber);
      console.log('dashboard:', JSON.stringify(data.dashboard, null, 2));
    } else {
      console.log(`\n=== ${dayId}: NOT FOUND ===`);
    }
  }
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
