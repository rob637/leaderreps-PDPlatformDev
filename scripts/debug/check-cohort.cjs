const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const cohortId = 'X5pGc5YVgtBpwoOOZU0I';

async function checkCohort() {
  console.log('=== CHECKING COHORT ===');
  const cohortSnap = await db.collection('cohorts').doc(cohortId).get();
  if (cohortSnap.exists) {
    const data = cohortSnap.data();
    console.log('Cohort found:', cohortSnap.id);
    console.log('Name:', data.name);
    console.log('Start Date:', data.startDate);
    console.log('Timezone:', data.timezone);
    console.log('Full data:', JSON.stringify(data, null, 2));
  } else {
    console.log('COHORT NOT FOUND!');
  }
}

checkCohort().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
