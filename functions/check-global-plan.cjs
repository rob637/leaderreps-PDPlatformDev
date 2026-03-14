const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}

const db = admin.firestore();

async function check() {
  // Check GLOBAL daily_plan_v1 collection
  const globalPlanSnap = await db.collection('daily_plan_v1').get();
  console.log('Global daily_plan_v1 collection has', globalPlanSnap.size, 'docs');
  
  if (globalPlanSnap.size > 0) {
    console.log('\nSample doc IDs:');
    globalPlanSnap.docs.slice(0, 10).forEach(doc => {
      console.log('  -', doc.id);
    });
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
