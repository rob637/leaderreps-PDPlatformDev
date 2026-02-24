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

async function findAtomicHabitsComplete() {
  try {
    // Get full reading_catalog and dump the Atomic Habits entry
    const testReading = await testDb.doc('metadata/reading_catalog').get();
    const testItems = testReading.data()?.items || {};
    
    Object.entries(testItems).forEach(([theme, books]) => {
      if (Array.isArray(books)) {
        books.forEach((book, idx) => {
          if (book.title?.toLowerCase().includes('atomic')) {
            console.log('=== TEST Atomic Habits FULL DATA ===');
            console.log('Theme:', theme, 'Index:', idx);
            console.log(JSON.stringify(book, null, 2));
          }
        });
      }
    });
    
    const prodReading = await prodDb.doc('metadata/reading_catalog').get();
    const prodItems = prodReading.data()?.items || {};
    
    Object.entries(prodItems).forEach(([theme, books]) => {
      if (Array.isArray(books)) {
        books.forEach((book, idx) => {
          if (book.title?.toLowerCase().includes('atomic')) {
            console.log('\n=== PROD Atomic Habits FULL DATA ===');
            console.log('Theme:', theme, 'Index:', idx);
            console.log(JSON.stringify(book, null, 2));
          }
        });
      }
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    testApp.delete();
    prodApp.delete();
  }
}

findAtomicHabitsComplete();
