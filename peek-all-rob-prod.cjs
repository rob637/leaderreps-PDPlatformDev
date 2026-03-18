const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const email = doc.data().email || '';
    if (email.startsWith('rob') && email.includes('@sagecg.com')) {
      const cRef = db.collection('users').doc(doc.id).collection('action_progress').doc('_carried_over_prep');
      const c = await cRef.get();
      if (c.exists && c.data().items.length > 0) {
        console.log("----", email, "----");
        c.data().items.forEach(i => console.log(i.label));
      }
    }
  }
}
run().then(() => process.exit(0));
