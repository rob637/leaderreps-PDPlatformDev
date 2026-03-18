const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  // Check session2-config in daily_plan_v1
  const s2 = await db.collection('daily_plan_v1').doc('session2-config').get();
  
  if (!s2.exists) {
    console.log('session2-config NOT FOUND');
    process.exit(0);
  }
  
  console.log('=== SESSION2-CONFIG ACTIONS ===');
  const actions = s2.data().actions || [];
  actions.forEach(function(a) {
    console.log('  -', a.label);
    console.log('    id:', a.id);
    console.log('    prepSection:', a.prepSection || 'NOT SET');
    console.log('    resourceId:', a.resourceId || 'NONE');
  });
  
  // Check what's the user's completed items for session2
  const uid = '3pq6VRq3I9djqgy5TA762HaCxP82';
  const progressSnap = await db.collection('users/' + uid + '/action_progress').get();
  
  console.log('\n=== USER COMPLETED SESSION2 ITEMS ===');
  progressSnap.docs.forEach(function(d) {
    if (d.id === '_carryover') return;
    const data = d.data();
    const label = data.label || '';
    if (label.toLowerCase().includes('session 2') || d.id.includes('s2')) {
      console.log('  -', d.id, ':', label, '| status:', data.status);
    }
  });
  
  process.exit(0);
})();
