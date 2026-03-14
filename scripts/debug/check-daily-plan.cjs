const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function check() {
  // Get all daily_plan_v1 documents
  const snap = await db.collection('daily_plan_v1').get();
  console.log('daily_plan_v1 documents:');
  snap.docs.forEach(doc => {
    console.log(`  ${doc.id}`);
  });
  
  // Check onboarding-config and session1-config
  const onboarding = await db.collection('daily_plan_v1').doc('onboarding-config').get();
  const session1 = await db.collection('daily_plan_v1').doc('session1-config').get();
  
  console.log('\nonboarding-config actions:');
  (onboarding.data()?.actions || []).forEach(a => console.log(`  - ${a.label} (prepSection: ${a.prepSection || 'N/A'})`));
  
  console.log('\nsession1-config actions:');
  (session1.data()?.actions || []).forEach(a => console.log(`  - ${a.label} (prepSection: ${a.prepSection || 'N/A'})`));
  
  // Check milestone-1
  const m1 = await db.collection('daily_plan_v1').doc('milestone-1').get();
  console.log('\nmilestone-1 actions:');
  if (m1.exists) {
    (m1.data()?.actions || []).forEach(a => console.log(`  - ${a.label}`));
  }
  
  process.exit(0);
}
check();
