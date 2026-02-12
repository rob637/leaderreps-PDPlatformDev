const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkContent() {
  const doc = await db.collection('content_library').doc('llxW1nrkXxEpc8fSJi7C').get();
  if (doc.exists) {
      console.log(JSON.stringify(doc.data(), null, 2));
  } else {
      console.log('Doc not found');
  }
}

checkContent();
