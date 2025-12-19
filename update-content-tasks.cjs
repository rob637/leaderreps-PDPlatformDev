const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  // 1. Delete Legacy Video
  console.log('--- Deleting Legacy Video ---');
  const videoId = 'xi2YwVB6yhOSscH9Fuv9';
  await db.collection('content_videos').doc(videoId).delete();
  console.log(`Deleted video ${videoId}`);

  // 2. Inspect QuickStart Program
  console.log('\n--- Inspecting QuickStart Program ---');
  const snapshot = await db.collection('content_library')
    .where('type', '==', 'PROGRAM')
    .get();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`[${doc.id}] ${data.title}`);
    console.log('Image fields:', {
      thumbnail: data.thumbnail,
      coverUrl: data.coverUrl,
      image: data.image,
      metadata_thumbnail: data.metadata?.thumbnail,
      metadata_coverUrl: data.metadata?.coverUrl
    });
  });
}

run().catch(console.error);
