const admin = require('firebase-admin');

// 1. Initialize Test App
const testServiceAccount = require('./leaderreps-test-firebase-adminsdk.json');
const testApp = admin.initializeApp({
  credential: admin.credential.cert(testServiceAccount),
  databaseURL: 'https://leaderreps-test.firebaseio.com' 
}, 'test');

const dbTest = testApp.firestore();

async function run() {
  const collections = await dbTest.listCollections();
  for (const collection of collections) {
     if(collection.id.startsWith("content_")) {
        console.log("Collection: " + collection.id)
        const docs = await collection.get();
        docs.forEach(doc => {
            console.log(doc.id, doc.data().title);
        });
     }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
