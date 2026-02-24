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

async function findAllCollections() {
  try {
    console.log('=== TEST Collections with "atomic" or "s_a_1" ===');
    
    // Check common content collections
    const collectionsToCheck = [
      'content-books', 
      'books', 
      'readreps', 
      'read-reps',
      'content-readreps',
      'unified-content',
      'content'
    ];
    
    for (const collName of collectionsToCheck) {
      try {
        const coll = await testDb.collection(collName).get();
        if (coll.size > 0) {
          console.log(`\n${collName}: ${coll.size} docs`);
          for (const doc of coll.docs) {
            const data = doc.data();
            if (data.title?.toLowerCase().includes('atomic') || doc.id === 's_a_1' || doc.id.toLowerCase().includes('atomic')) {
              console.log(`  Found: ${doc.id}`);
              console.log('  thumbnail:', data.thumbnail);
              console.log('  coverImage:', data.coverImage);
              console.log('  cover:', data.cover);
              console.log('  imageUrl:', data.imageUrl);
              console.log('  All keys:', Object.keys(data).filter(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('cover') || k.toLowerCase().includes('thumb')));
            }
          }
        }
      } catch (e) {
        // Collection doesn't exist
      }
    }
    
    // Also check content-readreps
    console.log('\n=== Checking content-readreps specifically ===');
    const testReadreps = await testDb.collection('content-readreps').get();
    console.log('TEST content-readreps docs:', testReadreps.size);
    for (const doc of testReadreps.docs) {
      const data = doc.data();
      if (data.title?.toLowerCase().includes('atomic')) {
        console.log('\nFound Atomic Habits in content-readreps:', doc.id);
        console.log(JSON.stringify(data, null, 2));
      }
    }
    
    const prodReadreps = await prodDb.collection('content-readreps').get();
    console.log('\nPROD content-readreps docs:', prodReadreps.size);
    for (const doc of prodReadreps.docs) {
      const data = doc.data();
      if (data.title?.toLowerCase().includes('atomic')) {
        console.log('\nFound Atomic Habits in content-readreps:', doc.id);
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

findAllCollections();
