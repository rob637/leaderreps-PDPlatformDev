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

async function searchAll() {
  try {
    console.log('=== TEST reading_catalog ===');
    const testReadingDoc = await testDb.doc('metadata/reading_catalog').get();
    const testData = testReadingDoc.data() || {};
    console.log('Keys:', Object.keys(testData));
    console.log('Full data:', JSON.stringify(testData, null, 2));
    
    console.log('\n=== PROD reading_catalog ===');
    const prodReadingDoc = await prodDb.doc('metadata/reading_catalog').get();
    const prodData = prodReadingDoc.data() || {};
    console.log('Keys:', Object.keys(prodData));
    console.log('Full data:', JSON.stringify(prodData, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    testApp.delete();
    prodApp.delete();
  }
}

searchAll();
