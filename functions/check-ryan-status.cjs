const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const email = 'ryan@leaderreps.com';
  const usersSnap = await db.collection('users').where('email', '==', email).get();
  
  if (usersSnap.empty) {
    console.log('User not found');
    return;
  }
  
  const userDoc = usersSnap.docs[0];
  const data = userDoc.data();
  
  console.log('User ID:', userDoc.id);
  console.log('\n=== prepStatus ===');
  console.log(JSON.stringify(data.prepStatus, null, 2));
  
  console.log('\n=== leaderProfile ===');
  console.log(JSON.stringify(data.leaderProfile, null, 2));
  
  console.log('\n=== baselineAssessment or assessmentHistory ===');
  console.log('Has assessmentHistory:', !!data.assessmentHistory);
  console.log(JSON.stringify(data.assessmentHistory || 'none', null, 2).substring(0, 500));
  
  // Check development_plan subcollection
  const devPlanSnap = await db.collection('users').doc(userDoc.id).collection('development_plan').doc('current').get();
  if (devPlanSnap.exists) {
    const devPlan = devPlanSnap.data();
    console.log('\n=== development_plan/current ===');
    console.log('Has focusAreas:', devPlan?.currentPlan?.focusAreas?.length || 0);
    console.log('Has assessmentHistory:', devPlan?.assessmentHistory?.length || 0);
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
