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
  
  console.log('Current phase:', data.phase);
  
  // Day 1 should be Foundation phase, not pre-start
  // Pre-start is Day 0 (before program starts)
  await doc.ref.update({ 
    phase: {
      id: 'foundation',
      label: 'Foundation',
      week: 1
    }
  });
  
  console.log('✅ Day 1 phase updated to foundation');
  
  process.exit(0);
}

fix().catch(console.error);
