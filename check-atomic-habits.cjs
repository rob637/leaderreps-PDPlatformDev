const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkContent() {
  const snapshot = await db.collection('content')
    .where('title', '==', 'Atomic Habits')
    .get();

  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }

  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
    console.log('isHiddenUntilUnlocked:', doc.data().isHiddenUntilUnlocked);
  });
}

checkContent();
