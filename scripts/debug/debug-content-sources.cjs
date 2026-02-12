const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkContentSources() {
  console.log('--- Checking Legacy content_videos ---');
  const legacySnapshot = await db.collection('content_videos').get();
  legacySnapshot.forEach(doc => {
    console.log(`[Legacy] ${doc.id}: ${doc.data().title}`);
  });

  console.log('\n--- Checking Unified content_library (VIDEO) ---');
  const unifiedSnapshot = await db.collection('content_library').where('type', '==', 'VIDEO').get();
  unifiedSnapshot.forEach(doc => {
    console.log(`[Unified] ${doc.id}: ${doc.data().title}`);
  });
}

checkContentSources().catch(console.error);
