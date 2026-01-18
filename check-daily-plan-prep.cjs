const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkDailyPlanPrep() {
  // Get cohort for jim1@test.com
  const usersSnapshot = await db.collection('users')
    .where('email', '==', 'jim1@test.com')
    .get();
  
  const userData = usersSnapshot.docs[0].data();
  const cohortId = userData.cohortId;
  console.log('Cohort ID:', cohortId);
  
  // Get cohort's daily plan
  const cohortSnap = await db.doc(`cohorts/${cohortId}`).get();
  const dailyPlanId = cohortSnap.data()?.dailyPlanId;
  console.log('Daily Plan ID:', dailyPlanId);
  
  // Get prep days from daily plan
  const daysSnap = await db.collection(`daily_plans/${dailyPlanId}/days`)
    .where('phase', '==', 'pre-start')
    .get();
  
  console.log('\n=== Prep Phase Days ===');
  
  daysSnap.forEach(doc => {
    const day = doc.data();
    console.log(`\nDay: ${doc.id} (dayNumber: ${day.dayNumber})`);
    
    if (day.actions && day.actions.length > 0) {
      console.log('Actions:');
      day.actions.forEach((action, idx) => {
        const isRequired = action.required === true || (action.required !== false && action.optional !== true);
        console.log(`  [${idx}] id="${action.id || `daily-${doc.id}-${idx}`}" label="${action.label}"`);
        console.log(`      type: ${action.type}, handlerType: ${action.handlerType || 'N/A'}`);
        console.log(`      required: ${action.required}, optional: ${action.optional} => isRequired: ${isRequired}`);
      });
    } else {
      console.log('  No actions');
    }
  });
}

checkDailyPlanPrep()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
