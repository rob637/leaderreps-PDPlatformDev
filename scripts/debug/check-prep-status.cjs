const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkPrepStatus() {
  // Get jim1@test.com user
  const usersSnapshot = await db.collection('users')
    .where('email', '==', 'jim1@test.com')
    .get();
  
  if (usersSnapshot.empty) {
    console.log('User not found');
    return;
  }
  
  const userDoc = usersSnapshot.docs[0];
  const uid = userDoc.id;
  const userData = userDoc.data();
  
  console.log('\n=== User Info ===');
  console.log('UID:', uid);
  console.log('Email:', userData.email);
  console.log('Cohort:', userData.cohortId);
  
  // Check development plan
  const devPlanSnap = await db.doc(`user_data/${uid}/developmentPlan/current`).get();
  
  if (devPlanSnap.exists) {
    const devPlan = devPlanSnap.data();
    console.log('\n=== Development Plan ===');
    console.log('dailyProgress:', JSON.stringify(devPlan.dailyProgress, null, 2));
    console.log('assessmentHistory:', devPlan.assessmentHistory?.length || 0, 'entries');
    console.log('currentPlan.focusAreas:', devPlan.currentPlan?.focusAreas?.length || 0, 'items');
  } else {
    console.log('\n=== Development Plan ===');
    console.log('NO DEVELOPMENT PLAN FOUND');
  }
  
  // Check leader profile
  const profileSnap = await db.doc(`user_data/${uid}/leader_profile/current`).get();
  
  if (profileSnap.exists) {
    const profile = profileSnap.data();
    console.log('\n=== Leader Profile ===');
    console.log('isComplete:', profile.isComplete);
    console.log('firstName:', profile.firstName);
    console.log('lastName:', profile.lastName);
  } else {
    console.log('\n=== Leader Profile ===');
    console.log('NO PROFILE FOUND');
  }
  
  // Check action progress
  const progressSnap = await db.collection(`user_data/${uid}/action_progress`).get();
  
  console.log('\n=== Action Progress ===');
  console.log('Total actions tracked:', progressSnap.size);
  
  progressSnap.forEach(doc => {
    const data = doc.data();
    if (doc.id.includes('prep') || doc.id.includes('day-1') || doc.id.includes('pre-start')) {
      console.log(`${doc.id}: status=${data.status}`);
    }
  });
  
  console.log('\n=== All Action Progress (first 30) ===');
  let count = 0;
  progressSnap.forEach(doc => {
    if (count < 30) {
      console.log(`  ${doc.id}: ${doc.data().status}`);
      count++;
    }
  });
  if (progressSnap.size > 30) {
    console.log(`  ... and ${progressSnap.size - 30} more`);
  }
}

checkPrepStatus()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
