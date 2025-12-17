const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugStartWithWhy() {
  console.log('--- Debugging "Start With Why" Video ---');

  // 1. Search in content_videos by title
  console.log('\n1. Searching content_videos for "Start With Why"...');
  const snapshot = await db.collection('content_videos').get();
  
  let found = false;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.title && data.title.toLowerCase().includes('start with why')) {
      console.log(`\nFOUND in content_videos!`);
      console.log(`ID: ${doc.id}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      found = true;
    }
  });

  if (!found) {
    console.log('NOT FOUND in content_videos.');
  }
}

debugStartWithWhy().catch(console.error);
