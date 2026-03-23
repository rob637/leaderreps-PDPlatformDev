const admin = require('firebase-admin');
const sa = require('./leaderreps-prod-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();

async function checkUser() {
  const usersSnap = await db.collection('users')
    .where('email', '==', 'rob0320d@sagecg.com')
    .get();
  
  if (usersSnap.empty) {
    console.log('User not found');
    return;
  }
  
  const userDoc = usersSnap.docs[0];
  const userData = userDoc.data();
  const userId = userDoc.id;
  
  console.log('=== USER INFO ===');
  console.log('ID:', userId);
  console.log('Email:', userData.email);
  console.log('Cohort ID:', userData.cohortId);
  
  // Get cohort info
  if (userData.cohortId) {
    const cohortSnap = await db.collection('cohorts').doc(userData.cohortId).get();
    if (cohortSnap.exists) {
      const cohort = cohortSnap.data();
      console.log('\n=== COHORT INFO ===');
      console.log('Name:', cohort.name);
      const start = cohort.startDate?.toDate?.() || new Date(cohort.startDate);
      const end = cohort.endDate?.toDate?.() || new Date(cohort.endDate);
      console.log('Start Date:', start);
      console.log('End Date:', end);
      
      const now = new Date();
      if (now < start) {
        console.log('Current Phase: PRE-START');
      } else if (now > end) {
        console.log('Current Phase: POST-PROGRAM');
      } else {
        const daysSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        console.log('Current Phase: START (active)');
        console.log('Days since start:', daysSinceStart);
      }
    }
  }
  
  // Check prep requirements - this is what drives carryover
  const prepReqSnap = await db.collection('users').doc(userId)
    .collection('development_plan').doc('prep_requirements').get();
  
  console.log('\n=== PREP REQUIREMENTS (drives carryover) ===');
  if (prepReqSnap.exists) {
    const prepReq = prepReqSnap.data();
    console.log('All Complete:', prepReq.allComplete);
    if (prepReq.items) {
      prepReq.items.forEach(item => {
        console.log(`  - ${item.label}: complete=${item.complete}, prepSection=${item.prepSection || 'onboarding'}`);
      });
    }
  } else {
    console.log('*** NO prep_requirements document - this is the problem! ***');
    console.log('Carryover relies on prepRequirementsComplete.items which comes from this doc');
  }
  
  // Check completions
  const completionsSnap = await db.collection('users').doc(userId)
    .collection('development_plan').doc('completions').get();
  
  console.log('\n=== COMPLETIONS ===');
  if (completionsSnap.exists) {
    const completions = completionsSnap.data();
    const items = completions.items || {};
    console.log('Total completed items:', Object.keys(items).length);
    if (Object.keys(items).length > 0) {
      Object.entries(items).slice(0, 10).forEach(([key, val]) => {
        console.log(`  - ${key}: ${val.status || JSON.stringify(val)}`);
      });
    }
  } else {
    console.log('No completions document');
  }
}

checkUser().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
