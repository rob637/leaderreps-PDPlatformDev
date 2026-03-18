const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
  const colls = ['unified-content'];
  for (const c of colls) {
    const snap = await dbTest.collection(c).get();
    for (const d of snap.docs) {
      if (JSON.stringify(d.data()).includes("Session 2 Guide") || JSON.stringify(d.data()).includes("Session 2 Video") || JSON.stringify(d.data()).includes("1773320767771")) {
         console.log(d.id, d.data());
      }
    }
  }
}
run().then(()=>process.exit(0));
