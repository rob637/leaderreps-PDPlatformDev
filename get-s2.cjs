const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
  const snap = await dbTest.doc('daily_plan_v1/session2-config').get();
  console.log(JSON.stringify(snap.data(), null, 2));
}
run().then(() => process.exit(0));
