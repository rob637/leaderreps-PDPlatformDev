const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const cRef = db.collection('users').doc(doc.id).collection('action_progress').doc('_carried_over_prep');
    const c = await cRef.get();
    if (c.exists) {
      const items = c.data().items;
      if (items.some(i => i.label && i.label.includes('Foundation Expectation'))) {
        console.log("Found match: ", doc.data().email);
        console.log(items.map(i => i.label).join(', '));
      }
    }
  }
}
run().then(() => process.exit(0));
