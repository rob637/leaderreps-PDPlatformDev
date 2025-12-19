
const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDocuments() {
  console.log('\n=== Checking content_documents ===');
  try {
    const snapshot = await db.collection('content_documents').get();
    console.log(`Found ${snapshot.size} documents.`);
    
    if (snapshot.empty) {
      console.log('Collection is empty.');
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\nID: ${doc.id}`);
        console.log(`Title: ${data.title}`);
        console.log(`Type: ${data.type}`); // Should be undefined or something
        console.log(`IsActive: ${data.isActive}`);
        console.log(`IsHiddenUntilUnlocked: ${data.isHiddenUntilUnlocked}`);
      });
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
  }
}

checkDocuments();
