const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const c = await db.collection('users').doc(doc.id).collection('action_progress').doc('_carried_over_prep').get();
    if (c.exists) {
        const data = c.data();
        const startLen = data.items.length;
        const newItems = data.items.filter(item => {
           if (item.handlerType === 'notification-setup') return false;
           if (item.handlerType === 'foundation-commitment') return false;
           return true;
        });
        if (newItems.length !== startLen) {
            await c.ref.update({ items: newItems });
            console.log("Cleaned up", doc.data().email, startLen, "->", newItems.length);
        }
    }
  }
}
run().then(() => process.exit());
