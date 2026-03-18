const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const configs = ['onboarding-config', 'session1-config', 'session2-config', 'explore-config'];
  console.log('=== Checking config docs for profile items ===\n');
  
  for (const configId of configs) {
    const docRef = db.collection('daily_plan_v1').doc(configId);
    const snap = await docRef.get();
    
    if (!snap.exists) {
      console.log(`${configId}: NOT FOUND`);
      continue;
    }
    
    const data = snap.data();
    console.log(`\n${configId}:`);
    (data.actions || []).forEach((action, i) => {
      const label = action.label || '';
      if (label.toLowerCase().includes('profile')) {
        console.log(`  ${i}: "${label}" [${action.id}] handler: ${action.handlerType || 'none'} type: ${action.type || ''}`);
      }
    });
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
