const admin = require('firebase-admin');

// Initialize prod environment  
const prodApp = admin.initializeApp({
  credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json')),
  storageBucket: 'leaderreps-prod.firebasestorage.app'
}, 'prod');

const prodDb = prodApp.firestore();

async function addCoverToProd() {
  try {
    const docRef = prodDb.doc('content_library/3JcqdoCLgxSxszhy5ZMv');
    
    console.log('Adding book cover to Atomic Habits in PROD...');
    
    await docRef.update({
      thumbnail: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg'
    });
    
    console.log('✅ Done! Cover image added to PROD.');
    
    // Verify
    const updated = await docRef.get();
    const data = updated.data();
    console.log('\nVerification:');
    console.log('  thumbnail:', data.thumbnail);
    console.log('  coverImage:', data.coverImage);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    prodApp.delete();
  }
}

addCoverToProd();
