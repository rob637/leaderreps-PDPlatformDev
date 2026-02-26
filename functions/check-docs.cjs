const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  
  // Check content_library for documents
  const snapshot = await db.collection('content_library').get();
  console.log(`Found ${snapshot.size} content_library items\n`);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.type === 'DOCUMENT' || data.type === 'TOOL' || data.title?.toLowerCase().includes('guide')) {
      console.log(`=== ${doc.id} ===`);
      console.log(`Title: ${data.title}`);
      console.log(`Type: ${data.type}`);
      console.log(`URL: ${data.url?.substring(0, 120)}...`);
      console.log(`details.url: ${data.details?.url?.substring(0, 120)}...`);
      console.log(`details.pdfUrl: ${data.details?.pdfUrl?.substring(0, 120)}...`);
      console.log('');
    }
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
