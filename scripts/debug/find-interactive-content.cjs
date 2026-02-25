const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'leaderreps-prod' });
const db = admin.firestore();

async function run() {
  // Check direct IDs first
  const ids = ['interactive-leader-profile', 'interactive-baseline-assessment'];
  
  console.log('=== CHECKING DIRECT IDS ===\n');
  for (const id of ids) {
    const doc = await db.collection('unified-content').doc(id).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`${id}:`);
      console.log(`  title: ${data.title}`);
      console.log(`  estimatedTime: ${data.estimatedTime}`);
      console.log('');
    } else {
      console.log(`${id}: NOT FOUND in unified-content`);
    }
  }
  
  // Also check interactive collection if exists
  console.log('\n=== CHECKING INTERACTIVE COLLECTION ===\n');
  const intColl = await db.collection('interactive').limit(5).get();
  intColl.docs.forEach(doc => {
    const data = doc.data();
    console.log(`${doc.id}: ${data.title}`);
    console.log(`  estimatedTime: ${data.estimatedTime}`);
  });
  
  process.exit(0);
}
run();
