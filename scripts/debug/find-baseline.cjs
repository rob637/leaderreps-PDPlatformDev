const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'leaderreps-prod' });
const db = admin.firestore();

async function run() {
  // Search by title
  const snap = await db.collection('unified-content').get();
  
  console.log('=== SEARCHING FOR BASELINE/LEADER PROFILE ===\n');
  snap.docs.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    if (title.includes('baseline') || title.includes('leader profile') || title.includes('assessment')) {
      console.log(`ID: ${doc.id}`);
      console.log(`  type: ${data.type}`);
      console.log(`  title: ${data.title}`);
      console.log(`  estimatedTime: ${data.estimatedTime}`);
      console.log(`  duration: ${data.duration}`);
      console.log('');
    }
  });
  process.exit(0);
}
run();
