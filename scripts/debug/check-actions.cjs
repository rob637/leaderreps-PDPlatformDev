const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-pd-platform'
});

const db = admin.firestore();

async function run() {
  const day0 = await db.collection('daily_plan_v1').doc('day_0').get();
  const day1 = await db.collection('daily_plan_v1').doc('day_1').get();
  
  console.log('=== DAY 0 RAW ACTIONS ===');
  if (day0.exists) {
    console.log(JSON.stringify(day0.data().actions, null, 2));
  }
  
  console.log('\n=== DAY 1 RAW ACTIONS ===');
  if (day1.exists) {
    console.log(JSON.stringify(day1.data().actions, null, 2));
  }
  
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
