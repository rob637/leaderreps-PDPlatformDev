const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = 'CNZfMN20DqQWRrH4z0w7nf24Qmm1';

async function checkDevPlan() {
  // Check devPlan
  const devPlanSnap = await db.collection('users').doc(userId)
    .collection('devPlan').get();
  
  console.log('DevPlan docs:', devPlanSnap.size);
  devPlanSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log('\n---', doc.id, '---');
    console.log('Phase:', data.phase);
    console.log('Items count:', data.items?.length || 0);
    if (data.items) {
      data.items.forEach((item, i) => {
        console.log(`  [${i}] ${item.title} - completed: ${item.completed}, status: ${item.status || 'N/A'}`);
      });
    }
  });
  
  process.exit(0);
}

checkDevPlan().catch(e => { console.error(e); process.exit(1); });
