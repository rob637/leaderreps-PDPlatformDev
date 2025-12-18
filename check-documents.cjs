const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDocuments() {
  console.log('Checking content_documents collection...');
  const snapshot = await db.collection('content_documents').get();
  console.log(`Found ${snapshot.size} documents.`);
  
  snapshot.forEach(doc => {
    console.log('---');
    console.log('ID:', doc.id);
    console.log('Data:', JSON.stringify(doc.data(), null, 2));
  });
}

checkDocuments().catch(console.error);
