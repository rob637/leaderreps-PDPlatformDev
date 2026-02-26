const admin = require('firebase-admin');
const sa = require('../leaderreps-test-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function verify() {
  const doc = await db.collection('daily_plan_v1').doc('day-001').get();
  console.log('day-001 prep-welcome-banner:', doc.data().dashboard['prep-welcome-banner']);
  
  const doc15 = await db.collection('daily_plan_v1').doc('day-015').get();
  console.log('day-015 prep-welcome-banner:', doc15.data().dashboard['prep-welcome-banner']);
  process.exit(0);
}
verify();
