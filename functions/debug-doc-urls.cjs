const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  const snapshot = await db.collection('content_library').get();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const url = data.url || data.details?.url || data.details?.pdfUrl;
    if (url) {
      console.log(`${doc.id}: ${data.title}`);
      console.log(`  URL: ${url.substring(0, 100)}`);
      console.log(`  Contains /vault/: ${url.includes('/vault/')}`);
      console.log(`  Contains GoogleAccessId: ${url.includes('GoogleAccessId')}`);
      console.log('');
    }
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
