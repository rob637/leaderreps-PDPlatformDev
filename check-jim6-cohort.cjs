const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function checkJim6Cohort() {
  console.log('=== Checking jim6@test.com cohort data ===\n');
  
  // Find user by email
  const usersSnap = await db.collection('users').where('email', '==', 'jim6@test.com').get();
  
  if (usersSnap.empty) {
    console.log('❌ User jim6@test.com not found in users collection');
    process.exit(1);
  }
  
  const userDoc = usersSnap.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  
  console.log('User ID:', userId);
  console.log('\n--- User Document (users collection) ---');
  console.log('cohortId:', userData.cohortId);
  console.log('cohortName:', userData.cohortName);
  console.log('startDate:', userData.startDate?.toDate?.() || userData.startDate);
  console.log('email:', userData.email);
  console.log('displayName:', userData.displayName);
  
  // Check development_plan document
  console.log('\n--- Development Plan (modules collection) ---');
  const devPlanRef = db.doc(`modules/${userId}/development_plan/current`);
  const devPlanSnap = await devPlanRef.get();
  
  if (devPlanSnap.exists) {
    const devPlanData = devPlanSnap.data();
    console.log('cohortId:', devPlanData.cohortId);
    console.log('startDate:', devPlanData.startDate?.toDate?.() || devPlanData.startDate);
    console.log('prepVisitLog:', devPlanData.prepVisitLog);
  } else {
    console.log('❌ Development plan document does not exist');
  }
  
  // Check if cohort exists
  if (userData.cohortId) {
    console.log('\n--- Cohort Document ---');
    const cohortRef = db.doc(`cohorts/${userData.cohortId}`);
    const cohortSnap = await cohortRef.get();
    
    if (cohortSnap.exists) {
      const cohortData = cohortSnap.data();
      console.log('Cohort exists:', true);
      console.log('name:', cohortData.name);
      console.log('startDate:', cohortData.startDate?.toDate?.() || cohortData.startDate);
      console.log('memberCount:', cohortData.memberCount);
    } else {
      console.log('❌ Cohort document does not exist!');
    }
  } else {
    console.log('\n⚠️ No cohortId in user document!');
  }
  
  // Check invitations for this email
  console.log('\n--- Checking Invitations ---');
  const invitesSnap = await db.collection('invitations').where('email', '==', 'jim6@test.com').get();
  
  if (invitesSnap.empty) {
    console.log('No invitations found for jim6@test.com');
  } else {
    invitesSnap.docs.forEach((doc, idx) => {
      const inv = doc.data();
      console.log(`\nInvitation ${idx + 1} (${doc.id}):`);
      console.log('  cohortId:', inv.cohortId);
      console.log('  cohortName:', inv.cohortName);
      console.log('  status:', inv.status);
      console.log('  createdAt:', inv.createdAt?.toDate?.() || inv.createdAt);
    });
  }
  
  process.exit(0);
}

checkJim6Cohort().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
