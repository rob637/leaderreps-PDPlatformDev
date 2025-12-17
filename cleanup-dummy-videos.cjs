const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function cleanupDummyVideos() {
  console.log('--- Cleaning up Dummy Videos ---');
  const snapshot = await db.collection('content_videos').get();
  
  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.title && data.title.startsWith('Dummy QS')) {
      console.log(`Deleting: [${doc.id}] ${data.title}`);
      batch.delete(doc.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully deleted ${count} dummy videos.`);
  } else {
    console.log('No dummy videos found to delete.');
  }
}

cleanupDummyVideos().catch(console.error);
