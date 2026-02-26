const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  const seriesDoc = await db.collection('video_series').doc('KsW1yMmdhWRHJSodivq7').get();
  
  if (seriesDoc.exists) {
    const data = seriesDoc.data();
    console.log('First video URL:');
    console.log(data.videos[0].videoUrl);
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
