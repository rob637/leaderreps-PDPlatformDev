const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function searchEverywhere() {
  console.log('--- Searching Everywhere for "Start With Why" ---');

  const collections = [
    'content_videos',
    'content_library',
    'media_assets',
    'content_readings', // Just in case
    'content_documents' // Just in case
  ];

  for (const colName of collections) {
    console.log(`\nChecking ${colName}...`);
    const snapshot = await db.collection(colName).get();
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = data.title || data.name || ''; // media_assets might use 'name'
      if (title.toLowerCase().includes('start with why')) {
        console.log(`  FOUND in ${colName}!`);
        console.log(`  ID: ${doc.id}`);
        console.log('  Data:', JSON.stringify(data, null, 2));
      }
    });
  }
}

searchEverywhere().catch(console.error);
