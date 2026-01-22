const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();

async function check() {
  // Find rob@sagecg.com user
  const usersSnap = await db.collection('users').where('email', '==', 'rob@sagecg.com').get();
  
  if (usersSnap.empty) {
    console.log('No user found with email rob@sagecg.com');
    return;
  }
  
  const userDoc = usersSnap.docs[0];
  const userId = userDoc.id;
  console.log('User ID:', userId);
  console.log('User data:', JSON.stringify(userDoc.data(), null, 2));
  
  // Check cohort assignment
  const userData = userDoc.data();
  if (userData.cohortId) {
    const cohortDoc = await db.collection('cohorts').doc(userData.cohortId).get();
    console.log('\nCohort exists:', cohortDoc.exists);
    if (cohortDoc.exists) {
      const cohortData = cohortDoc.data();
      console.log('Cohort ID:', userData.cohortId);
      console.log('Cohort name:', cohortData.name);
      console.log('Daily Plan ID:', cohortData.dailyPlanId);
    }
  } else {
    console.log('\nNo cohort assigned!');
  }
  
  process.exit(0);
}

check();
