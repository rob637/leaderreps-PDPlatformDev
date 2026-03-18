const admin = require('firebase-admin');
const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function run() {
  const collNames = ['content', 'content_library', 'media_assets', 'metadata'];
  for (const cn of collNames) {
     console.log("Checking", cn)
     const c = await dbTest.collection(cn).get();
     c.docs.forEach(d => {
       const str = JSON.stringify(d.data());
       if (str.includes("Session") || str.includes("S2")) {
           console.log(`Found in ${cn}/${d.id}`);
           console.log(d.data().title || d.data().name || d.data().label || d.data().resourceTitle);
       }
     });
     if (cn === 'metadata') {
         // check specific documents
         for (const docId of ['documents', 'videos', 'tools']) {
             const d = await dbTest.collection('metadata').doc(docId).get();
             if (d.exists) {
                 const str = JSON.stringify(d.data());
                 if (str.includes("Session") || str.includes("S2")) {
                     console.log(`Found in metadata/${docId}`);
                     // metadata might be a map or array of items
                 }
             }
         }
     }
  }
}
run().then(()=>process.exit(0));
