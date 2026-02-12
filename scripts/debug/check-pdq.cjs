const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function check() {
  // Check daily_plan_v1 actions
  const snapshot = await db.collection('daily_plan_v1').get();
  snapshot.docs.forEach(doc => {
    const d = doc.data();
    (d.actions || []).forEach(a => {
      if ((a.label || '').toLowerCase().includes('pdq')) {
        console.log('\n--- Found in', doc.id, '---');
        console.log(JSON.stringify(a, null, 2));
      }
    });
  });
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
