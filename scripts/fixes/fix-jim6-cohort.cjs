const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function fixJim6Cohort() {
  console.log('=== Fixing jim6@test.com cohort assignment ===\n');
  
  const cohortId = 'GPSBMtFHqfh8rIfOdvWA';
  const userId = 'TJZ7BB9bpqYYWzKpIU2L7CmOUU52';
  
  // 1. Get cohort data for start date
  const cohortSnap = await db.doc(`cohorts/${cohortId}`).get();
  if (!cohortSnap.exists) {
    console.log('❌ Cohort does not exist:', cohortId);
    process.exit(1);
  }
  const cohortData = cohortSnap.data();
  console.log('Cohort:', cohortData.name);
  console.log('Start Date:', cohortData.startDate?.toDate?.() || cohortData.startDate);
  
  // 2. Update user document with cohortId
  console.log('\nUpdating user document...');
  await db.doc(`users/${userId}`).update({
    cohortId: cohortId
  });
  console.log('✅ User document updated with cohortId');
  
  // 3. Update dev plan with cohort start date (if different)
  console.log('\nUpdating development plan startDate...');
  await db.doc(`modules/${userId}/development_plan/current`).update({
    cohortId: cohortId,
    startDate: cohortData.startDate
  });
  console.log('✅ Development plan updated with cohortId and startDate');
  
  // 4. Increment cohort member count
  console.log('\nIncrementing cohort member count...');
  await db.doc(`cohorts/${cohortId}`).update({
    memberCount: admin.firestore.FieldValue.increment(1)
  });
  console.log('✅ Cohort member count incremented');
  
  // Verify
  console.log('\n=== Verification ===');
  const userSnap = await db.doc(`users/${userId}`).get();
  console.log('User cohortId:', userSnap.data().cohortId);
  
  const devPlanSnap = await db.doc(`modules/${userId}/development_plan/current`).get();
  console.log('DevPlan cohortId:', devPlanSnap.data().cohortId);
  console.log('DevPlan startDate:', devPlanSnap.data().startDate?.toDate?.());
  
  console.log('\n✅ jim6@test.com cohort assignment fixed!');
  process.exit(0);
}

fixJim6Cohort().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
