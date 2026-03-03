const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = 'CNZfMN20DqQWRrH4z0w7nf24Qmm1';

async function main() {
  const actionProgress = await db.collection('users').doc(userId)
    .collection('action_progress').get();
  
  console.log('action_progress docs:', actionProgress.size);
  actionProgress.docs.forEach(doc => {
    const data = doc.data();
    console.log(`\n${doc.id}:`);
    console.log(`  completed: ${data.completed}`);
    console.log(`  completedAt: ${data.completedAt?.toDate?.() || data.completedAt}`);
    console.log(`  title: ${data.title || 'N/A'}`);
    console.log(`  phase: ${data.phase || 'N/A'}`);
    console.log(`  group: ${data.group || 'N/A'}`);
  });
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
