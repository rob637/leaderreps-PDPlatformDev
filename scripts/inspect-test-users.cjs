const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve('./leaderreps-test-firebase-adminsdk.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-test'
});

const db = admin.firestore();

async function main() {
  const usersSnapshot = await db.collection('users').limit(2).get();
  for (const userDoc of usersSnapshot.docs) {
    console.log('\n=== User:', userDoc.id, userDoc.data().email, '===');
    
    // Check subcollections
    const collections = await userDoc.ref.listCollections();
    console.log('Subcollections:', collections.map(c => c.id));
    
    for (const coll of collections) {
      const docs = await coll.limit(2).get();
      console.log(`  ${coll.id}: ${docs.size} docs`);
      if (docs.size > 0) {
        console.log('    Sample keys:', Object.keys(docs.docs[0].data()));
      }
    }
  }
  process.exit(0);
}
main();
