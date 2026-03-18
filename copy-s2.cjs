const admin = require('firebase-admin');

// 1. Initialize Test App
const testServiceAccount = require('./leaderreps-test-firebase-adminsdk.json');
const testApp = admin.initializeApp({
  credential: admin.credential.cert(testServiceAccount),
  databaseURL: 'https://leaderreps-test.firebaseio.com' 
}, 'testApp');

// 2. Initialize Prod App
const prodServiceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
const prodApp = admin.initializeApp({
  credential: admin.credential.cert(prodServiceAccount),
  databaseURL: 'https://leaderreps-prod.firebaseio.com'
}, 'prodApp');

const dbTest = testApp.firestore();
const dbProd = prodApp.firestore();

// S2 Prep Guide = d9rmMDJZst6nKzts54qL
// 1:1 Tool = EzsG3rrAWVjQ7TUhXmcU

const DOC_IDS = [
  'd9rmMDJZst6nKzts54qL',
  'EzsG3rrAWVjQ7TUhXmcU'
];

async function copyDocs() {
  for (const docId of DOC_IDS) {
    console.log(`Copying doc ${docId}...`);
    const docRef = dbTest.collection('content_library').doc(docId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      console.log(`Found doc ${docId} with title: ${docSnap.data().title}`);
      await dbProd.collection('content_library').doc(docId).set(docSnap.data());
      console.log(`Successfully copied doc ${docId}`);
    } else {
      console.log(`Document ${docId} not found in test environment!`);
    }
  }
}

copyDocs()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
