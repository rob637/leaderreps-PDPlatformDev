const admin = require('firebase-admin');
const sa = require('../leaderreps-test-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function check() {
  const uid = 'QUA65XyWmrWnMVmecG4yhIWMop52';
  
  // Check modules/{uid}/development_plan/current for actionProgress
  const devPlanDoc = await db.collection('modules').doc(uid).collection('development_plan').doc('current').get();
  const devPlan = devPlanDoc.data();
  console.log('Has actionProgress:', !!devPlan?.actionProgress);
  console.log('actionProgress keys:', devPlan?.actionProgress ? Object.keys(devPlan.actionProgress) : 'none');
  
  // Check users/{uid}/action_progress subcollection
  const actionProgressSnap = await db.collection('users').doc(uid).collection('action_progress').get();
  console.log('\n=== action_progress subcollection ===');
  console.log('Total docs:', actionProgressSnap.docs.length);
  actionProgressSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`  ${doc.id}: status=${data.status} label="${data.label}" completed=${!!data.completedAt}`);
  });
  
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
