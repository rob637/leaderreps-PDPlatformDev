const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCollection(name) {
  console.log(`Checking collection: ${name}`);
  const snapshot = await db.collection(name).get();
  console.log(`Found ${snapshot.size} documents.`);
  if (snapshot.size > 0) {
    const doc = snapshot.docs[0].data();
    console.log('Sample document keys:', Object.keys(doc));
    console.log('dateAdded:', doc.dateAdded);
  }
}

async function run() {
  await checkCollection('content_readings');
  await checkCollection('content_videos');
}

run();
