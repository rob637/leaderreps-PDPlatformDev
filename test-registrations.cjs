const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const snapshot = await db.collectionGroup('coaching_registrations').get();
  snapshot.docs.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}
check().catch(console.error);
