const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'leaderreps-prod' });
const db = admin.firestore();

async function run() {
  const ids = ['interactive-leader-profile', 'interactive-baseline-assessment'];
  
  console.log('=== CONTENT LIBRARY INTERACTIVE ITEMS ===\n');
  for (const id of ids) {
    const doc = await db.collection('content_library').doc(id).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`${id}:`);
      console.log(`  title: ${data.title}`);
      console.log(`  estimatedTime: ${data.estimatedTime}`);
      console.log(`  metadata.estimatedTime: ${data.metadata?.estimatedTime}`);
      console.log('');
    } else {
      console.log(`${id}: NOT FOUND`);
    }
  }
  
  process.exit(0);
}
run();
