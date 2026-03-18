const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
     const c = await dbTest.collection('content_videos').get();
     c.docs.forEach(d => {
         console.log("v:", d.id, d.data().title);
     });
     const t = await dbTest.collection('content_tools').get().catch(()=>({docs:[]}));
     t.docs.forEach(d => {
         console.log("t:", d.id, d.data().title);
     });
     const docCol = await dbTest.collection('content_documents').get().catch(()=>({docs:[]}));
     docCol.docs.forEach(d => {
         console.log("d:", d.id, d.data().title);
     });
}
run().then(()=>process.exit(0));
