const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';

async function checkFull() {
  // Check user profile
  const userSnap = await db.collection('users').doc(userId).get();
  if (userSnap.exists) {
    const data = userSnap.data();
    console.log('=== USER PROFILE ===');
    console.log('startDate:', data.startDate);
    console.log('cohortId:', data.cohortId);
  }
  
  // Check dev plan
  const devPlanSnap = await db.collection('users').doc(userId)
    .collection('developmentPlan').doc('current').get();
  console.log('\n=== DEVELOPMENT PLAN ===');
  console.log('exists:', devPlanSnap.exists);
  if (devPlanSnap.exists) {
    console.log('data:', JSON.stringify(devPlanSnap.data(), null, 2));
  }
  
  // Check daily practice
  const dpSnap = await db.collection('users').doc(userId)
    .collection('dailyPractice').doc('data').get();
  console.log('\n=== DAILY PRACTICE (data) ===');
  console.log('exists:', dpSnap.exists);
  
  // Try alternate path - some code uses 'current' instead of 'data'
  const dpCurrent = await db.collection('users').doc(userId)
    .collection('dailyPractice').doc('current').get();
  console.log('\n=== DAILY PRACTICE (current) ===');
  console.log('exists:', dpCurrent.exists);
  if (dpCurrent.exists) {
    const dpData = dpCurrent.data();
    console.log('Keys:', Object.keys(dpData));
  }
}

checkFull().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
