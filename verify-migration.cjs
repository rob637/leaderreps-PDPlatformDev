const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyMigration() {
  console.log('Verifying content_library documents...');
  const snapshot = await db.collection('content_library').where('type', '==', 'DOCUMENT').get();
  console.log(`Found ${snapshot.size} documents in Unified Content.`);
  
  snapshot.forEach(doc => {
    console.log(`- ${doc.data().title} (${doc.id})`);
  });
}

verifyMigration().catch(console.error);
