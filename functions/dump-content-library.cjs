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

async function dumpContentLibrary() {
  try {
    console.log('=== TEST content_library - Atomic Habits ===');
    const testDocs = await testDb.collection('content_library').get();
    console.log('Total docs:', testDocs.size);
    
    for (const doc of testDocs.docs) {
      const data = doc.data();
      if (data.title?.toLowerCase().includes('atomic') || doc.id.toLowerCase().includes('atomic')) {
        console.log('\nFound:', doc.id);
        console.log(JSON.stringify(data, null, 2));
      }
    }
    
    console.log('\n=== PROD content_library - Atomic Habits ===');
    const prodDocs = await prodDb.collection('content_library').get();
    console.log('Total docs:', prodDocs.size);
    
    for (const doc of prodDocs.docs) {
      const data = doc.data();
      if (data.title?.toLowerCase().includes('atomic') || doc.id.toLowerCase().includes('atomic')) {
        console.log('\nFound:', doc.id);
        console.log(JSON.stringify(data, null, 2));
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    testApp.delete();
    prodApp.delete();
  }
}

dumpContentLibrary();
