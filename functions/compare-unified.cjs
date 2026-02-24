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

async function findAtomicHabitsId() {
  try {
    console.log('=== Searching unified-content in TEST ===');
    const testDocs = await testDb.collection('unified-content').get();
    console.log('TEST unified-content docs:', testDocs.size);
    
    for (const doc of testDocs.docs) {
      const data = doc.data();
      if (data.title?.toLowerCase().includes('atomic')) {
        console.log('\nFound in TEST unified-content:', doc.id);
        console.log('Keys:', Object.keys(data));
        console.log('thumbnail:', data.thumbnail);
        console.log('coverImage:', data.coverImage);
      }
    }
    
    console.log('\n=== Searching unified-content in PROD ===');
    const prodDocs = await prodDb.collection('unified-content').get();
    console.log('PROD unified-content docs:', prodDocs.size);
    
    for (const doc of prodDocs.docs) {
      const data = doc.data();
      if (data.title?.toLowerCase().includes('atomic')) {
        console.log('\nFound in PROD unified-content:', doc.id);
        console.log('Keys:', Object.keys(data));
        console.log('thumbnail:', data.thumbnail);
        console.log('coverImage:', data.coverImage);
      }
    }
    
    // Also check the reading_catalog items
    console.log('\n=== Checking reading_catalog items ===');
    const testReading = await testDb.doc('metadata/reading_catalog').get();
    const prodReading = await prodDb.doc('metadata/reading_catalog').get();
    
    const testItems = testReading.data()?.items || {};
    const prodItems = prodReading.data()?.items || {};
    
    // The items might be grouped by theme
    Object.entries(testItems).forEach(([theme, books]) => {
      if (Array.isArray(books)) {
        books.forEach(book => {
          if (book.title?.toLowerCase().includes('atomic')) {
            console.log('\nTEST reading_catalog Atomic Habits:');
            console.log('id:', book.id);
            console.log('thumbnail:', book.thumbnail);
            console.log('coverImage:', book.coverImage);
          }
        });
      }
    });
    
    Object.entries(prodItems).forEach(([theme, books]) => {
      if (Array.isArray(books)) {
        books.forEach(book => {
          if (book.title?.toLowerCase().includes('atomic')) {
            console.log('\nPROD reading_catalog Atomic Habits:');
            console.log('id:', book.id);
            console.log('thumbnail:', book.thumbnail);
            console.log('coverImage:', book.coverImage);
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

findAtomicHabitsId();
