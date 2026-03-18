const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const email = doc.data().email;
    if (email && email.startsWith('rob') && email.includes('@sagecg.com')) {
      const c = await db.collection('users').doc(doc.id).collection('action_progress').doc('_carried_over_prep').get();
      const hasCarry = c.exists ? c.data().items.length : 0;
      console.log(email, doc.id, "CarryOver Items:", hasCarry);
    }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
