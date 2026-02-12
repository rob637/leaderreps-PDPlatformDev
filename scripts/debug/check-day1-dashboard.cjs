const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  // Get daily plan v1
  const planSnap = await db.collection('daily_plan_v1').orderBy('dayNumber', 'asc').limit(5).get();
  console.log('Total docs found:', planSnap.docs.length);
  
  for (const doc of planSnap.docs) {
    const data = doc.data();
    console.log(`\nDay ${data.dayNumber} (${data.phase?.id}):`);
    console.log('  dashboard:', JSON.stringify(data.dashboard, null, 2));
  }
  
  process.exit(0);
}

check().catch(console.error);
