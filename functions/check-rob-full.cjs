const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}
const db = admin.firestore();

async function check() {
  const userId = 'xaD3ow0KR4NVe4rkSm3DeEHo6tO2'; // rob@sagecg.com
  
  // Check ALL user subcollections
  console.log('=== ALL SUBCOLLECTIONS ===');
  const userRef = db.collection('users').doc(userId);
  const collections = await userRef.listCollections();
  for (const col of collections) {
    const snap = await col.get();
    console.log(`${col.id}: ${snap.size} docs`);
  }
  
  // Check if there's a dev_plan or daily_plan with more detail
  console.log('\n=== DEV_PLAN / DAILY_PLAN ===');
  const devPlanSnap = await db.collection('users').doc(userId).collection('dev_plan').get();
  console.log(`dev_plan: ${devPlanSnap.size} docs`);
  
  const dailyPlanSnap = await db.collection('users').doc(userId).collection('daily_plan').get();
  console.log(`daily_plan: ${dailyPlanSnap.size} docs`);
  
  // Check locker_progress
  console.log('\n=== LOCKER_PROGRESS ===');
  const lockerSnap = await db.collection('users').doc(userId).collection('locker_progress').get();
  console.log(`locker_progress: ${lockerSnap.size} docs`);
  lockerSnap.docs.forEach(d => {
    console.log(`  ${d.id}: ${JSON.stringify(d.data()).substring(0, 100)}`);
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
