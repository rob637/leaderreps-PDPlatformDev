const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkUserDates() {
  const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';
  
  // Check user doc
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  console.log('User doc:');
  console.log('  cohortId:', userData?.cohortId);
  console.log('  startDate:', userData?.startDate);
  
  // Check development_plan/current
  const devPlanDoc = await db.doc(`modules/${userId}/development_plan/current`).get();
  const devPlanData = devPlanDoc.data();
  console.log('\nDev Plan doc:');
  console.log('  startDate:', devPlanData?.startDate);
  console.log('  prepVisitLog:', devPlanData?.prepVisitLog);
  console.log('  prepPhaseFirstVisit:', devPlanData?.prepPhaseFirstVisit);
  
  // Check cohort
  if (userData?.cohortId) {
    const cohortDoc = await db.collection('cohorts').doc(userData.cohortId).get();
    const cohortData = cohortDoc.data();
    console.log('\nCohort doc:');
    console.log('  name:', cohortData?.name);
    console.log('  startDate:', cohortData?.startDate);
  }
  
  process.exit(0);
}

checkUserDates().catch(console.error);
