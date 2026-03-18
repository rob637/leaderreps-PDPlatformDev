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
           // Remove the known ghost items that artificially carried over due to the old DB race condition
           if (item.handlerType === 'notification-setup') return false;
           if (item.handlerType === 'foundation-commitment') return false;
           // They might have Leader Profile / Baseline Assessment as true ghosts too
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
