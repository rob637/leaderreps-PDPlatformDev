const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json'); // dev
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const u = await db.collection('users').where('email', '==', 'rob@sagecg.com').get();
  if(u.empty) return console.log("User not found");
  const uid = u.docs[0].id;
  
  const ref = db.collection('users').doc(uid).collection('action_progress').doc('_carried_over_prep');
  const c = await ref.get();
  if(!c.exists) return console.log("no carry over");
  
  const data = c.data();
  // Filter out the ghost ones he completed in prep phase that carried over due to race condition
  const newItems = data.items.filter(item => {
     if (item.handlerType === 'notification-setup') return false;
     if (item.handlerType === 'foundation-commitment') return false;
     return true;
  });
  
  await ref.update({ items: newItems });
  console.log("Cleaned up Rob's CatchUp items!");
}
run().then(() => process.exit());
