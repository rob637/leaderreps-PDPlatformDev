const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkContent() {
  // Search for anything starting with QuickStart
  const snapshot = await db.collection('content_library')
    .where('title', '>=', 'QuickStart')
    .where('title', '<=', 'QuickStart\uf8ff')
    .get();

  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }

  snapshot.forEach(doc => {
    console.log('ID:', doc.id);
    console.log('Title:', doc.data().title);
    console.log('Type:', doc.data().type);
    console.log('Visibility:', doc.data().visibility);
    console.log('-------------------');
  });
}

checkContent();
