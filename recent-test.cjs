const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
  const c = await dbTest.collection('unified-content').orderBy('updatedAt', 'desc').limit(10).get();
  c.forEach(d => console.log(d.id, d.data().title, d.data().type));
}
run().then(()=>process.exit(0));
