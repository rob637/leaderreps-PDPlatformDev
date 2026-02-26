const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  
  // Check content_library for Session 1 Video
  const snapshot = await db.collection('content_library').get();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.title?.toLowerCase().includes('session 1') && data.title?.toLowerCase().includes('video')) {
      console.log(`=== ${doc.id} ===`);
      console.log(`Title: ${data.title}`);
      console.log(`Type: ${data.type}`);
      console.log(`URL: ${data.url}`);
      console.log(`details.url: ${data.details?.url}`);
      console.log(`details.videoUrl: ${data.details?.videoUrl}`);
      console.log(`details.externalUrl: ${data.details?.externalUrl}`);
      console.log('');
    }
  });
  
  // Also check media_assets
  const mediaSnapshot = await db.collection('media_assets').get();
  mediaSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.title?.toLowerCase().includes('session 1')) {
      console.log(`=== media_assets/${doc.id} ===`);
      console.log(`Title: ${data.title}`);
      console.log(`URL: ${data.url}`);
      console.log(`videoUrl: ${data.videoUrl}`);
      console.log('');
    }
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
