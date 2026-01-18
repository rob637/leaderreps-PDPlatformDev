const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  // Get explore-config doc
  const planSnap = await db.collection('daily_plan_v1').where('id', '==', 'explore-config').get();
  
  if (planSnap.empty) {
    console.log('explore-config not found');
    // Also check for 'explore' id
    const planSnap2 = await db.collection('daily_plan_v1').get();
    const ids = planSnap2.docs.map(d => d.data().id || d.id);
    console.log('Available IDs:', ids.slice(0, 10));
    process.exit(1);
  }
  
  const doc = planSnap.docs[0];
  const data = doc.data();
  
  console.log('explore-config dashboard:', JSON.stringify(data.dashboard, null, 2));
  
  process.exit(0);
}

check().catch(console.error);
