const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const docRef = db.collection('daily_plan_v1').doc('onboarding-config');
  const snap = await docRef.get();
  
  console.log('=== onboarding-config actions ===\n');
  const data = snap.data();
  (data.actions || []).forEach((action, i) => {
    console.log(`${i}: "${action.label}"`);
    console.log(`   id: ${action.id}`);
    console.log(`   type: ${action.type || 'none'}`);
    console.log(`   handlerType: ${action.handlerType || 'none'}`);
    console.log(`   resourceId: ${action.resourceId || 'none'}`);
    console.log('');
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
