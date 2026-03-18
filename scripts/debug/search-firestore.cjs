const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function search() {
  // List all root collections
  const collections = await db.listCollections();
  console.log('Root collections:');
  for (const col of collections) {
    console.log('  -', col.id);
  }
  
  // Now search each one for "profile"
  console.log('\n\nSearching for "profile" items...\n');
  for (const col of collections) {
    const docs = await col.limit(50).get();
    for (const doc of docs.docs) {
      const str = JSON.stringify(doc.data());
      if (str.toLowerCase().includes('create your leader profile')) {
        console.log(`FOUND in ${col.id}/${doc.id}`);
        // Parse and find the specific item
        const data = doc.data();
        const allArrays = Object.entries(data).filter(([k,v]) => Array.isArray(v));
        for (const [key, arr] of allArrays) {
          arr.forEach((item, i) => {
            if (JSON.stringify(item).toLowerCase().includes('create your leader profile')) {
              console.log(`  ${key}[${i}]:`, JSON.stringify(item).substring(0, 200));
            }
          });
        }
      }
    }
  }
}

search().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
