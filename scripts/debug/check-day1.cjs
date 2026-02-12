const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  // Get day-001 (prep day 1)
  const doc = await db.collection('daily_plan_v1').doc('day-001').get();
  
  if (!doc.exists) {
    console.log('day-001 not found');
    process.exit(0);
  }
  
  const data = doc.data();
  console.log('Day 1:');
  console.log('  Phase:', data.phase);
  console.log('  Day Number:', data.dayNumber);
  console.log('  Actions:');
  
  if (data.actions) {
    data.actions.forEach((action, idx) => {
      const req = action.required === true || (action.required !== false && action.optional !== true);
      console.log(`    [${idx}] ${req ? 'REQUIRED' : 'optional'}: ${action.label || 'No label'}`);
      console.log(`        type: ${action.type || 'unknown'}, handlerType: ${action.handlerType || 'none'}`);
    });
  }
  
  // Also check daily_plan_v1_test/day-001
  console.log('\n--- Also check prep-config ---');
  const prepDoc = await db.collection('daily_plan_v1').doc('prep-config').get();
  if (prepDoc.exists) {
    const prepData = prepDoc.data();
    console.log('prep-config found:');
    console.log(JSON.stringify(prepData, null, 2));
  } else {
    console.log('No prep-config document');
  }
  
  process.exit(0);
}

check().catch(console.error);
