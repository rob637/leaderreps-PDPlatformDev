const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function audit() {
  // Get official labels from onboarding-config
  const docRef = db.collection('daily_plan_v1').doc('onboarding-config');
  const snap = await docRef.get();
  const actions = snap.data()?.actions || [];
  
  console.log('=== OFFICIAL LABELS (Firestore) ===\n');
  const officialLabels = {};
  actions.forEach(a => {
    if (a.resourceId?.startsWith('interactive-')) {
      const handlerType = a.resourceId.replace('interactive-', '');
      officialLabels[handlerType] = a.label;
      console.log(`  ${handlerType}: "${a.label}"`);
    }
  });
  
  return officialLabels;
}

audit().then(labels => {
  console.log('\n\n=== CODE SHOULD USE THESE LABELS ===');
  console.log('leader-profile:', labels['leader-profile'] || 'NOT FOUND');
  console.log('baseline-assessment:', labels['baseline-assessment'] || 'NOT FOUND');
  console.log('notification-setup:', labels['notification-setup'] || 'NOT FOUND');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
