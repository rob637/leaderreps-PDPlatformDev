const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function checkRyanWeeks() {
  const userId = 'aLZUDI4M7Pfz6pCM0k66P5i8WX12'; // Ryan
  const cohortId = 'X5pGc5YVgtBpwoOOZU0I';
  
  // Get cohort data
  const cohortDoc = await db.collection('cohorts').doc(cohortId).get();
  console.log('\n=== Cohort Data ===');
  if (cohortDoc.exists) {
    const cohort = cohortDoc.data();
    console.log('name:', cohort.name);
    console.log('startDate:', cohort.startDate);
    console.log('currentWeek:', cohort.currentWeek);
  }
  
  // Check leaderProfiles collection
  const lpQuery = await db.collection('leaderProfiles').where('userId', '==', userId).get();
  console.log('\n=== LeaderProfiles Collection ===');
  if (!lpQuery.empty) {
    const lp = lpQuery.docs[0].data();
    console.log('doc id:', lpQuery.docs[0].id);
    console.log('dayNumber:', lp.dayNumber);
    console.log('cohortStartDate:', lp.cohortStartDate);
  } else {
    // Try by doc id
    const lpById = await db.collection('leaderProfiles').doc(userId).get();
    if (lpById.exists) {
      console.log('Found by user id');
      const lp = lpById.data();
      console.log('dayNumber:', lp.dayNumber);
      console.log('cohortStartDate:', lp.cohortStartDate);
    } else {
      console.log('No leaderProfile found');
    }
  }
  
  // Check programs structure
  const programsSnap = await db.collection('programs').get();
  console.log('\n=== Programs ===');
  programsSnap.docs.forEach(d => {
    console.log(`  ${d.id}: ${d.data().name || d.data().title}`);
  });
  
  // Check if there's a dailyPlan top-level collection
  const dpTop = await db.collection('dailyPlans').doc(userId).get();
  console.log('\n=== Top-level dailyPlans ===');
  console.log('exists:', dpTop.exists);
  
  // Check for weeks data - maybe in a different location
  const userWeeksSnap = await db.collection('users').doc(userId).collection('weeks').get();
  console.log('\n=== User weeks subcollection ===');
  console.log('docs:', userWeeksSnap.docs.map(d => d.id));
  
  process.exit(0);
}

checkRyanWeeks().catch(console.error);
