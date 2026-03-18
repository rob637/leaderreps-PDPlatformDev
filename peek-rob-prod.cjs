const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const cRef = db.collection('users').doc('0MzRDB6btMPZJnSVkIybeEhrODq2').collection('action_progress').doc('_carried_over_prep');
  const c = await cRef.get();
  if (c.exists) {
    const data = c.data();
    data.items.forEach(i => console.log(i.label, i.handlerType, i.id));
  }
}
run().then(() => process.exit(0));
