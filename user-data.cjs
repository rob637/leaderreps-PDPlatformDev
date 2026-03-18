const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const users = await db.collection('users').where('email', '==', 'rob0315f@sagecg.com').get();
  for (const doc of users.docs) {
    const data = doc.data();
    console.log("prepStatus:", data.prepStatus);
    console.log("foundationCommitment:", data.foundationCommitment);
    console.log("milestoneProgress:", data.milestoneProgress);
  }
}
run().then(() => process.exit(0));
