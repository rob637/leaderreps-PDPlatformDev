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
      if (c.exists) {
        const data = c.data();
        const startLen = data.items.length;
        const newItems = data.items.filter(item => {
           if (item.label && item.label.includes('Set Notifications')) return false;
           if (item.label && item.label.includes('Accept Foundation Expectation')) return false;
           return true; 
        });
        if (newItems.length !== startLen) {
            await cRef.update({ items: newItems });
            console.log(`Cleaned up ${email}: ${startLen} -> ${newItems.length} items`);
        }
      }
    }
  }
}
run().then(() => process.exit(0));
