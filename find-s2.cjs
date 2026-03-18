const admin = require('firebase-admin');

const saTest = require('./leaderreps-test-firebase-adminsdk.json');

const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

async function findItems() {
  const collections = ['unified-content', 'content_videos', 'content_documents', 'modules', 'metadata', 'daily_plan_v1'];
  
  for (const collName of collections) {
    console.log(`Checking ${collName}...`);
    const snap = await dbTest.collection(collName).get();
    snap.forEach(doc => {
      const dataStr = JSON.stringify(doc.data());
      if (dataStr.includes('Session 2') || dataStr.includes('S2 Tool')) {
        console.log(`Found in ${collName}/${doc.id}`);
        if(doc.data().title) {
            console.log(`  Title: ${doc.data().title}`);
        }
      }
    });

    // Also check subcollections for metadata?
    if (collName === 'metadata') {
      const catalogsSnap = await dbTest.collection('metadata').doc('catalogs').collection('items').get().catch(() => ({ docs: [] }));
      for (const d of catalogsSnap.docs) {
          const dataStr = JSON.stringify(d.data());
          if (dataStr.includes('Session 2') || dataStr.includes('S2 Tool')) {
            console.log(`Found in metadata/catalogs/items/${d.id}`);
            console.log(`  Title: ${d.data().title}`);
          }
      }
    }
  }
}
findItems().then(() => process.exit(0));
