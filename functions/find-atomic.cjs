const admin = require('firebase-admin');

// Initialize test environment
const testApp = admin.initializeApp({
  credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json')),
  storageBucket: 'leaderreps-test.firebasestorage.app'
}, 'test');

const testDb = testApp.firestore();

async function findAtomicHabits() {
  try {
    console.log('Searching for Atomic Habits content in test Firestore...\n');
    
    // Check unified-content collection
    const unifiedContent = await testDb.collection('unified-content').get();
    console.log('unified-content docs:', unifiedContent.docs.map(d => d.id));
    
    for (const doc of unifiedContent.docs) {
      const data = doc.data();
      if (data.title?.toLowerCase().includes('atomic') || doc.id.toLowerCase().includes('atomic')) {
        console.log('\nFound Atomic Habits in unified-content:', doc.id);
        console.log('Data:', JSON.stringify(data, null, 2));
      }
    }
    
    // Check metadata/book-catalog or similar
    const metadata = await testDb.collection('metadata').get();
    console.log('\nmetadata docs:', metadata.docs.map(d => d.id));
    
    const bookCatalog = await testDb.doc('metadata/book-catalog').get();
    if (bookCatalog.exists) {
      const data = bookCatalog.data();
      console.log('book-catalog keys:', Object.keys(data || {}));
      // Find atomic habits in the catalog
      if (data.items) {
        const atomicEntry = Object.entries(data.items || {}).find(([k,v]) => 
          k.toLowerCase().includes('atomic') || v?.title?.toLowerCase().includes('atomic')
        );
        if (atomicEntry) {
          console.log('\nAtomic Habits entry:', JSON.stringify(atomicEntry, null, 2));
        }
      }
    }
    
    // Check content-groups collection
    const contentGroups = await testDb.collection('content-groups').get();
    console.log('\ncontent-groups docs:', contentGroups.docs.map(d => d.id));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    testApp.delete();
  }
}

findAtomicHabits();
