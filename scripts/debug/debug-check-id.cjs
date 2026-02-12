const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkId() {
  const id = 'gjpKESqxHiqteFneAczq';
  console.log(`Checking ID: ${id}`);
  const doc = await db.collection('content_library').doc(id).get();
  if (doc.exists) {
      console.log('Found!');
      console.log(JSON.stringify(doc.data(), null, 2));
  } else {
      console.log('Doc NOT found in content_library');
      // Check legacy collections just in case
      const doc2 = await db.collection('content_documents').doc(id).get();
      if (doc2.exists) {
          console.log('Found in content_documents (Legacy)!');
          console.log(JSON.stringify(doc2.data(), null, 2));
      } else {
          console.log('Doc NOT found in content_documents');
      }
  }
}

checkId();
