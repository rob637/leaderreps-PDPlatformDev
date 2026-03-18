const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
  const c = await dbTest.collection('unified-content').get();
  const docs = c.docs.map(d => ({id: d.id, ...d.data()}));
  docs.sort((a,b) => {
      const ta = a.updatedAt?._seconds || a.createdAt?._seconds || 0;
      const tb = b.updatedAt?._seconds || b.createdAt?._seconds || 0;
      return tb - ta;
  });
  docs.slice(0, 15).forEach(d => console.log(d.id, d.title, d.type, d.updatedAt?._seconds || d.createdAt?._seconds));
}
run().then(()=>process.exit(0));
