const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function main() {
  const cohortId = 'GPSBMtFHqfh8rIfOdvWA';
  
  const cohortSnap = await db.doc(`cohorts/${cohortId}`).get();
  console.log('Cohort data:', JSON.stringify(cohortSnap.data(), null, 2));
  
  // Get daily_plans collection
  console.log('\n=== Daily Plans Collection ===');
  const plansSnap = await db.collection('daily_plans').get();
  plansSnap.forEach(doc => {
    console.log(`Plan ID: ${doc.id}`);
  });
  
  // Check days subcollection of first plan
  if (plansSnap.size > 0) {
    const planId = plansSnap.docs[0].id;
    console.log(`\n=== Days in plan: ${planId} ===`);
    const daysSnap = await db.collection(`daily_plans/${planId}/days`)
      .where('phase', '==', 'pre-start')
      .get();
    
    daysSnap.forEach(doc => {
      const day = doc.data();
      console.log(`\nDay: ${doc.id}`);
      if (day.actions) {
        day.actions.forEach((action, idx) => {
          const isRequired = action.required === true || (action.required !== false && action.optional !== true);
          console.log(`  [${idx}] id="${action.id}" label="${action.label}" required=${isRequired}`);
        });
      }
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
