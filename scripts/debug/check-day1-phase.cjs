const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  // Get Day 1 doc
  const planSnap = await db.collection('daily_plan_v1').where('dayNumber', '==', 1).get();
  
  if (planSnap.empty) {
    console.log('Day 1 not found');
    process.exit(1);
  }
  
  const doc = planSnap.docs[0];
  const data = doc.data();
  
  console.log('Day 1 phase:', data.phase);
  console.log('Day 1 dashboard showPMReflection:', data.dashboard?.showPMReflection);
  console.log('Day 1 dashboard locker-latest-reflection:', data.dashboard?.['locker-latest-reflection']);
  
  process.exit(0);
}

check().catch(console.error);
