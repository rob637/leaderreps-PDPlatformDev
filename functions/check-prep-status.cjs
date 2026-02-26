const admin = require('firebase-admin');
const sa = require('../leaderreps-test-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function check() {
  // rob@sagecg.com uid
  const uid = 'QUA65XyWmrWnMVmecG4yhIWMop52';
  
  // Check user doc for prepStatus
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();
  console.log('prepStatus:', JSON.stringify(userData?.prepStatus, null, 2));
  console.log('milestoneProgress:', JSON.stringify(userData?.milestoneProgress, null, 2));
  
  // Check action_progress for Download/print Onboarding Guide
  const progressSnap = await db.collection('users').doc(uid).collection('action_progress').get();
  console.log('\n=== Action Progress ===');
  progressSnap.docs.forEach(doc => {
    const data = doc.data();
    const label = data.label || '';
    if (label.toLowerCase().includes('download') || label.toLowerCase().includes('onboarding') || label.toLowerCase().includes('guide')) {
      console.log(`${doc.id}: ${JSON.stringify(data, null, 2)}`);
    }
  });
  
  // Also check dev plan dailyProgress
  const devPlanDoc = await db.collection('modules').doc(uid).collection('development_plan').doc('current').get();
  const devPlan = devPlanDoc.data();
  console.log('\n=== Daily Progress (day-001) ===');
  console.log(JSON.stringify(devPlan?.dailyProgress?.['day-001'], null, 2));
  console.log('\n=== Daily Progress (session1-config) ===');
  console.log(JSON.stringify(devPlan?.dailyProgress?.['session1-config'], null, 2));
  
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
