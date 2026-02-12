const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugResourceSelector() {
  console.log('--- Debugging Resource Selector Data ---');

  // 1. Check content_videos (Wrappers)
  console.log('\n1. Checking content_videos (Wrappers):');
  const videosSnapshot = await db.collection('content_videos').get();
  if (videosSnapshot.empty) {
    console.log('   No documents found in content_videos.');
  } else {
    videosSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - [${doc.id}] ${data.title} (Type: ${data.type || 'N/A'})`);
    });
  }

  // 2. Check content_library (Unified - Read & Reps)
  console.log('\n2. Checking content_library (Unified) for READ_REP:');
  const unifiedSnapshot = await db.collection('content_library')
    .where('type', '==', 'READ_REP')
    .get();
  
  if (unifiedSnapshot.empty) {
    console.log('   No READ_REP documents found in content_library.');
    
    // Check ALL content_library to see what's there
    console.log('   Listing ALL content_library items to check types:');
    const allUnified = await db.collection('content_library').get();
    allUnified.forEach(doc => {
        const data = doc.data();
        console.log(`     - [${doc.id}] ${data.title} (Type: ${data.type})`);
    });

  } else {
    unifiedSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - [${doc.id}] ${data.title} (Type: ${data.type})`);
    });
  }
}

debugResourceSelector().catch(console.error);
