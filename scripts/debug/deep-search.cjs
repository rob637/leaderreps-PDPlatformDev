const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function search() {
  const collections = await db.listCollections();
  
  for (const col of collections) {
    const docs = await col.get();
    for (const doc of docs.docs) {
      const str = JSON.stringify(doc.data());
      if (str.includes('Create Your Leader')) {
        console.log(`FOUND in ${col.id}/${doc.id}`);
        console.log('  Snippet:', str.substring(str.indexOf('Create Your Leader'), str.indexOf('Create Your Leader') + 100));
      }
    }
  }
  console.log('\nSearch complete');
}

search().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
