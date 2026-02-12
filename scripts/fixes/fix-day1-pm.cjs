const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fix() {
  // Get Day 1 doc
  const planSnap = await db.collection('daily_plan_v1').where('dayNumber', '==', 1).get();
  
  if (planSnap.empty) {
    console.log('Day 1 not found');
    process.exit(1);
  }
  
  const doc = planSnap.docs[0];
  const data = doc.data();
  
  console.log('Before:', JSON.stringify(data.dashboard, null, 2));
  
  // Update dashboard to enable PM Reflection and locker widgets for Day 1
  const updatedDashboard = {
    ...data.dashboard,
    'showPMReflection': true,
    'pm-bookend': true,
    'pm-bookend-header': true,
    'locker-latest-reflection': true
  };
  
  await doc.ref.update({ dashboard: updatedDashboard });
  
  console.log('\nAfter:', JSON.stringify(updatedDashboard, null, 2));
  console.log('\n✅ Day 1 updated to enable PM Reflection');
  
  process.exit(0);
}

fix().catch(console.error);
