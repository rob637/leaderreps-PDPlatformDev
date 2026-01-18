const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function main() {
  const uid = 'XHz1O92WB0YvXczJ89oBB4ifgQ72';
  
  const devPlan = await db.doc(`modules/${uid}/development_plan/current`).get();
  const data = devPlan.data();
  
  console.log('=== Assessment Data ===');
  console.log('assessmentHistory:', data.assessmentHistory);
  console.log('currentPlan:', JSON.stringify(data.currentPlan, null, 2));
  console.log('currentPlan.focusAreas:', data['currentPlan.focusAreas']);
  
  // Show all keys
  console.log('\n=== All Keys ===');
  Object.keys(data).forEach(k => console.log(`  ${k}`));
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
