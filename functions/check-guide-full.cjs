const admin = require('firebase-admin');

const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'leaderreps-pd-platform.firebasestorage.app'
});

const db = admin.firestore();

async function checkGuide() {
  const doc = await db.collection('content_library').doc('NUhMcboyoxHMWjJN5CMU').get();
  console.log('Full document data:', JSON.stringify(doc.data(), null, 2));
}

checkGuide().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
