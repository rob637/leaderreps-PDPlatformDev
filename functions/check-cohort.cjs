const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}

const db = admin.firestore();

async function check() {
  // Get the cohort these users are in
  const cohortId = 'GCfQUcilymvNrxWvVlZm';
  const cohortSnap = await db.collection('cohorts').doc(cohortId).get();
  
  if (!cohortSnap.exists) {
    console.log('Cohort not found!');
    process.exit(1);
  }
  
  const cohort = cohortSnap.data();
  console.log('Cohort:', cohortId);
  console.log('Name:', cohort.name);
  console.log('Status:', cohort.status);
  console.log('Start Date:', cohort.startDate);
  console.log('End Date:', cohort.endDate);
  console.log('Foundation Start:', cohort.foundationStartDate);
  console.log('Prep Start:', cohort.prepStartDate);
  console.log('Session 1 Date:', cohort.session1Date);
  console.log('\nAll fields:');
  Object.keys(cohort).forEach(key => {
    const val = cohort[key];
    if (typeof val === 'object' && val !== null && val.toDate) {
      console.log('  ', key, ':', val.toDate().toISOString());
    } else {
      console.log('  ', key, ':', val);
    }
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
