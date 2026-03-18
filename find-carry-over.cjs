const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const c = await db.collection('users').doc(doc.id).collection('action_progress').doc('_carried_over_prep').get();
    if (c.exists) {
        console.log(doc.data().email, doc.id, c.data().items.length, "items");
    }
  }
}
run().then(() => process.exit());
