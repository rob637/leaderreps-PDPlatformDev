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

const testBucket = testApp.storage().bucket();
const prodBucket = prodApp.storage().bucket();

async function copyBookCovers() {
  try {
    console.log('Looking for book covers in test...');
    
    // List all files to find book covers
    const [files] = await testBucket.getFiles({ prefix: '' });
    
    const bookCoverFiles = files.filter(f => 
      f.name.toLowerCase().includes('book') || 
      f.name.toLowerCase().includes('atomic') ||
      f.name.toLowerCase().includes('cover')
    );
    
    console.log('Found files:', files.slice(0, 30).map(f => f.name));
    console.log('\nBook cover candidates:', bookCoverFiles.map(f => f.name));
    
    if (bookCoverFiles.length === 0) {
      console.log('\nNo book cover files found. Listing all files:');
      files.forEach(f => console.log(' -', f.name));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    testApp.delete();
    prodApp.delete();
  }
}

copyBookCovers();
