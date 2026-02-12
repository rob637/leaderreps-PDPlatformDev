
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'leaderreps-pd-platform-firebase-adminsdk.json'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkRobert() {
  const uid = '18BmIs35txM4VkyfxiycGcDvXIA3';
  console.log(`Checking specific user: ${uid}`);
  checkSpecificUser(uid);
}

async function checkSpecificUser(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();

  
  console.log(`Found User: ${userData.name} (${uid})`);
  console.log('User Data:', JSON.stringify(userData, null, 2));

  // Check Development Plan
  const devPlanRef = db.doc(`modules/${uid}/development_plan/current`);
  const devPlanSnap = await devPlanRef.get();
  
  if (devPlanSnap.exists) {
    const data = devPlanSnap.data();
    console.log('Development Plan Data:');
    console.log('  startDate:', data.startDate ? (data.startDate.toDate ? data.startDate.toDate() : data.startDate) : 'MISSING');
    console.log('  prepVisitLog:', data.prepVisitLog);
    console.log('  prepPhaseFirstVisit:', data.prepPhaseFirstVisit ? (data.prepPhaseFirstVisit.toDate ? data.prepPhaseFirstVisit.toDate() : data.prepPhaseFirstVisit) : 'MISSING');
  } else {
    console.log('No Development Plan found!');
  }
  
  // Check Cohort if assigned
  if (userData.cohortId) {
      const cohortSnap = await db.doc(`cohorts/${userData.cohortId}`).get();
      if (cohortSnap.exists) {
        const cData = cohortSnap.data();
        console.log('Cohort Data:');
        console.log('  Name:', cData.name);
        console.log('  StartDate:', cData.startDate ? (cData.startDate.toDate ? cData.startDate.toDate() : cData.startDate) : 'MISSING');
      }
  }
}

checkRobert();
