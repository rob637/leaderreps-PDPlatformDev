const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
     const c = await dbTest.collection('content_library').get();
     c.docs.forEach(d => {
         const data = d.data();
         if (data.title && (data.title.includes('Session 2') || data.title.includes('S2') || data.title.includes('1:1'))) {
             console.log(d.id, data.title);
         }
     });
}
run().then(()=>process.exit(0));
