const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json'); // dev env

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const ss = await db.collection('coaching_registrations').limit(5).get();
  console.log("Found registrations:", ss.size);
  ss.forEach(d => {
      console.log(d.id, d.data());
  });
}
run().then(() => process.exit());
