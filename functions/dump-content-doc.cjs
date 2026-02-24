const admin = require('firebase-admin');

// Initialize test environment
const testApp = admin.initializeApp({
  credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json')),
  storageBucket: 'leaderreps-test.firebasestorage.app'
}, 'test');

// Initialize prod environment  
const prodApp = admin.initializeApp({
  credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json')),
  storageBucket: 'leaderreps-prod.firebasestorage.app'
}, 'prod');

const testDb = testApp.firestore();
const prodDb = prodApp.firestore();

async function dumpContentDoc() {
  try {
    console.log('=== TEST rr_atomic-habits FULL ===');
    const testDoc = await testDb.doc('content/rr_atomic-habits').get();
    console.log('Exists:', testDoc.exists);
    if (testDoc.exists) {
      console.log(JSON.stringify(testDoc.data(), null, 2));
    }
    
    console.log('\n=== PROD rr_atomic-habits FULL ===');
    const prodDoc = await prodDb.doc('content/rr_atomic-habits').get();
    console.log('Exists:', prodDoc.exists);
    if (prodDoc.exists) {
      console.log(JSON.stringify(prodDoc.data(), null, 2));
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    testApp.delete();
    prodApp.delete();
  }
}

dumpContentDoc();
