const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDocumentSources() {
  console.log('--- Checking Legacy content_documents ---');
  const legacySnapshot = await db.collection('content_documents').get();
  legacySnapshot.forEach(doc => {
    console.log(`[Legacy] ${doc.id}: ${doc.data().title}`);
  });

  console.log('\n--- Checking Unified content_library (DOCUMENT) ---');
  const unifiedSnapshot = await db.collection('content_library').where('type', '==', 'DOCUMENT').get();
  unifiedSnapshot.forEach(doc => {
    console.log(`[Unified] ${doc.id}: ${doc.data().title}`);
  });
}

checkDocumentSources().catch(console.error);
