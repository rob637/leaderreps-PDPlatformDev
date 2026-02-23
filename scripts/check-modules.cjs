const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve('./leaderreps-test-firebase-adminsdk.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-test'
});

const db = admin.firestore();

async function main() {
  // Check modules collection
  console.log('\n=== MODULES COLLECTION ===');
  const modulesSnapshot = await db.collection('modules').limit(5).get();
  console.log('Modules count:', modulesSnapshot.size);
  for (const doc of modulesSnapshot.docs) {
    console.log('  -', doc.id);
  }
  
  // Check if there are progress docs per user
  console.log('\n=== USER PROGRESS PATTERNS ===');
  const usersSnapshot = await db.collection('users').limit(1).get();
  for (const userDoc of usersSnapshot.docs) {
    console.log('User:', userDoc.data().email);
    const collections = await userDoc.ref.listCollections();
    for (const coll of collections) {
      const allDocs = await coll.get();
      console.log(`  ${coll.id}: ${allDocs.size} total docs`);
    }
  }
  
  process.exit(0);
}
main();
