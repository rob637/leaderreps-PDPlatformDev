const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function check() {
  const doc = await db.collection('daily_plan_v1').doc('day-015').get();
  const d = doc.data();
  const feedback = d.actions?.find(a => a.label && a.label.includes('5:1'));
  console.log('5:1 Feedback full object:');
  console.log(JSON.stringify(feedback, null, 2));
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
