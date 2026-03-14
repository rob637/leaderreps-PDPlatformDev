const admin = require('firebase-admin');

const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'leaderreps-pd-platform.firebasestorage.app'
});

const db = admin.firestore();

async function findAndFixSessionGuide() {
  // Search for Session 1 Guide in content_library
  const snapshot = await db.collection('content_library')
    .where('title', '==', 'Session 1 Guide')
    .get();
  
  if (snapshot.empty) {
    console.log('Session 1 Guide not found in content_library');
    
    // Try unified-content
    const unifiedSnap = await db.collection('unified-content')
      .where('title', '==', 'Session 1 Guide')
      .get();
    
    if (unifiedSnap.empty) {
      console.log('Session 1 Guide not found in unified-content either');
      return;
    }
    
    unifiedSnap.forEach(doc => {
      console.log('Found in unified-content:', doc.id);
      console.log('Current URL:', doc.data().url || doc.data().fileUrl || doc.data().mediaUrl);
    });
    return;
  }
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('Found:', doc.id);
    console.log('Title:', data.title);
    console.log('Current URL:', data.url || data.fileUrl || data.mediaUrl);
    console.log('All URL fields:', {
      url: data.url,
      fileUrl: data.fileUrl,
      mediaUrl: data.mediaUrl,
      downloadUrl: data.downloadUrl
    });
  });
}

findAndFixSessionGuide().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
