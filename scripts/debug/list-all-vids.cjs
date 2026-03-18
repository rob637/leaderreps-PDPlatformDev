const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
     const c = await dbTest.collection('content_library').where('type', '==', 'VIDEO').get();
     c.docs.forEach(d => {
         console.log(d.id, d.data().title);
     });
     const c2 = await dbTest.collection('content_library').where('type', '==', 'video').get();
     c2.docs.forEach(d => {
         console.log(d.id, d.data().title);
     });
}
run().then(()=>process.exit(0));
