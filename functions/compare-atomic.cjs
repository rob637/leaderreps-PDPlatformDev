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

async function compareAtomicHabits() {
  try {
    console.log('Fetching reading_catalog from TEST...');
    const testReadingDoc = await testDb.doc('metadata/reading_catalog').get();
    const testData = testReadingDoc.data() || {};
    
    console.log('\nFetching reading_catalog from PROD...');
    const prodReadingDoc = await prodDb.doc('metadata/reading_catalog').get();
    const prodData = prodReadingDoc.data() || {};
    
    // Find Atomic Habits in test
    const testItems = testData.items || {};
    const atomicHabitsKey = Object.keys(testItems).find(k => 
      k.toLowerCase().includes('atomic') || testItems[k]?.title?.toLowerCase().includes('atomic')
    );
    
    if (atomicHabitsKey) {
      console.log('\n=== ATOMIC HABITS IN TEST ===');
      console.log(JSON.stringify(testItems[atomicHabitsKey], null, 2));
      
      // Check if it has a cover image that's different from prod
      const testEntry = testItems[atomicHabitsKey];
      const prodEntry = prodData.items?.[atomicHabitsKey];
      
      console.log('\n=== ATOMIC HABITS IN PROD ===');
      console.log(JSON.stringify(prodEntry, null, 2));
      
      if (testEntry?.coverUrl && testEntry?.coverUrl !== prodEntry?.coverUrl) {
        console.log('\n>>> Cover URL differs! Test has:', testEntry.coverUrl);
      }
      if (testEntry?.thumbnail && testEntry?.thumbnail !== prodEntry?.thumbnail) {
        console.log('\n>>> Thumbnail differs! Test has:', testEntry.thumbnail);
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    testApp.delete();
    prodApp.delete();
  }
}

compareAtomicHabits();
