const admin = require('firebase-admin');
const sa = require('../leaderreps-test-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function check() {
  const doc = await db.collection('daily_plan_v1').doc('day-001').get();
  const data = doc.data();
  data.actions.forEach((a, i) => {
    console.log(`  ${i}: id="${a.id}" label="${a.label}"`);
  });
  process.exit(0);
}
check();
