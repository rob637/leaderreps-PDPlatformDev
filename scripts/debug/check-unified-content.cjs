const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'leaderreps-prod' });
const db = admin.firestore();

async function run() {
  // Find interactive content items
  const snap = await db.collection('unified-content')
    .where('type', '==', 'interactive')
    .limit(5)
    .get();
  
  console.log('=== INTERACTIVE CONTENT ITEMS ===\n');
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  title: ${data.title}`);
    console.log(`  estimatedTime: ${data.estimatedTime}`);
    console.log(`  duration: ${data.duration}`);
    console.log('');
  });
  process.exit(0);
}
run();
