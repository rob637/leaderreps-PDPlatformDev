const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();
async function run() {
  const c = await dbTest.collection('unified-content').get();
  console.log("Unified content count:", c.size);
  const metadata = await dbTest.collection('metadata').doc('catalogs').collection('items').get().catch(()=>({size:0}));
  console.log("Metadata catalogs items count:", metadata.size);
}
run().then(()=>process.exit(0));
