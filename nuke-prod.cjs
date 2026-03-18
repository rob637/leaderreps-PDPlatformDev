const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  let count = 0;
  const groups = await db.collectionGroup('action_progress').get();
  for (const doc of groups.docs) {
    if (doc.id === '_carried_over_prep') {
      const data = doc.data();
      if (!data.items) continue;
      
      const origLen = data.items.length;
      const newItems = data.items.filter(item => {
         const label = (item.label || '').toLowerCase();
         const type = (item.handlerType || '');
         
         if (type === 'notification-setup' || label.includes('notification')) return false;
         if (type === 'foundation-commitment' || label.includes('expectation') || label.includes('commitment')) return false;
         return true;
      });
      
      if (newItems.length !== origLen) {
         await doc.ref.update({ items: newItems });
         count++;
      }
    }
  }
  console.log(`Nuked ghosts from ${count} users.`);
}
run().then(() => process.exit(0));
