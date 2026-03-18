const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
  const collections = await dbTest.listCollections();
  for (const coll of collections) {
     if (coll.id === 'users' || coll.id === 'modules' || coll.id === 'action_progress') continue;
     const docs = await coll.get();
     for (const doc of docs.docs) {
       const str = JSON.stringify(doc.data());
       if (str.includes("Session 2 Guide") || str.includes("Session 2 Video") || str.includes("S2 Tool")) {
           console.log(`Found in ${coll.id}/${doc.id}`);
           console.log(doc.data());
       }
     }
  }
}
run().then(()=>process.exit(0));
