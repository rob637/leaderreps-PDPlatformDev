const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
  const colls = await dbTest.listCollections();
  for (const c of colls) {
    if (c.id === 'users' || c.id === 'modules' || c.id === 'action_progress') continue;
    const snap = await c.limit(1).get().catch(() => ({size:-1}));
    if (snap.size > 0) {
        console.log("Collection with data:", c.id);
    }
  }
}
run().then(()=>process.exit(0));
