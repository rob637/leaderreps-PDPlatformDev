const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';

async function checkAssessmentData() {
  // Check full dev plan data
  const devPlanSnap = await db.collection('users').doc(userId)
    .collection('developmentPlan').doc('current').get();
  
  if (devPlanSnap.exists) {
    const data = devPlanSnap.data();
    console.log('=== FULL DEV PLAN DATA ===');
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Check user_data collection
  const userDataSnap = await db.collection('user_data').doc(userId).get();
  if (userDataSnap.exists) {
    console.log('\n=== USER_DATA DOC ===');
    console.log(JSON.stringify(userDataSnap.data(), null, 2));
  } else {
    console.log('\n=== USER_DATA DOC: Does not exist ===');
  }
  
  // Check for leader profile data
  const leaderProfileSnap = await db.collection('user_data').doc(userId)
    .collection('profiles').doc('leader').get();
  if (leaderProfileSnap.exists) {
    console.log('\n=== LEADER PROFILE ===');
    console.log(JSON.stringify(leaderProfileSnap.data(), null, 2));
  } else {
    console.log('\n=== LEADER PROFILE: Does not exist ===');
  }
}

checkAssessmentData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
