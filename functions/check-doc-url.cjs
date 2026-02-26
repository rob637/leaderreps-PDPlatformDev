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
    console.log('Full details.url:');
    console.log(data.details?.url);
    console.log('\nIs it a signed URL?', data.details?.url?.includes('GoogleAccessId') ? 'YES' : 'NO');
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
