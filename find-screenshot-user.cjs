const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const query = await db.collectionGroup('action_progress').where('items', '!=', null).get();
  for (const doc of query.docs) {
    if (doc.id === '_carried_over_prep') {
      const items = doc.data().items;
      if (items.some(i => i.label && i.label.includes('Foundation Expectation'))) {
        const userDoc = await doc.ref.parent.parent.get();
        console.log("Found user:", userDoc.data().email);
        console.log(items.map(i => i.label));
      }
    }
  }
}
run().then(() => process.exit(0));
