const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json'); // dev env
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  // Find rob@sagecg.com
  const u = await db.collection('users').where('email', '==', 'rob@sagecg.com').get();
  if(u.empty) return console.log("User not found");
  const uid = u.docs[0].id;
  
  const c = await db.collection('users').doc(uid).collection('action_progress').doc('_carried_over_prep').get();
  if(!c.exists) return console.log("no carry over");
  console.log(JSON.stringify(c.data(), null, 2));
}
run().then(() => process.exit());
