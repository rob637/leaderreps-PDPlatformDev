const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  const doc = await db.collection('content_library').doc('FdWXB7NN6D4vhzg008Md').get();
  
  if (doc.exists) {
    const data = doc.data();
    const url = data.details?.url;
    console.log('Full URL:');
    console.log(url);
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
