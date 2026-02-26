const admin = require('firebase-admin');

// Check test environment video_series
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(testSA),
  storageBucket: 'leaderreps-test.firebasestorage.app'
});

async function check() {
  const db = admin.firestore();
  const snapshot = await db.collection('video_series').get();
  
  console.log(`Found ${snapshot.size} video series`);
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log('\n=== Series:', doc.id, '===');
    console.log('Title:', data.title);
    console.log('Videos count:', data.videos?.length || 0);
    
    if (data.videos?.length > 0) {
      console.log('\nFirst 2 videos:');
      data.videos.slice(0, 2).forEach((v, i) => {
        console.log(`  [${i}] id: ${v.id}`);
        console.log(`      title: ${v.title}`);
        console.log(`      url: ${v.url?.substring(0, 100)}...`);
        console.log(`      videoUrl: ${v.videoUrl?.substring(0, 100)}...`);
      });
    }
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
