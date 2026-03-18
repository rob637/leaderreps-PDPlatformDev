const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function find() {
  // Check all collections for profile items
  const collections = ['prep-requirements', 'daily_action_plans', 'metadata', 'content-groups', 'programs', 'config'];
  
  for (const col of collections) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (str.includes('leader profile') || str.includes('your leader profile')) {
        console.log(`\n=== ${col}/${doc.id} ===`);
        // Find the specific items
        if (data.items) {
          data.items.forEach((item, i) => {
            const label = item.label || item.title || '';
            if (label.toLowerCase().includes('profile')) {
              console.log(`  Item ${i}: "${label}" [${item.id}]`);
            }
          });
        }
        if (data.onboarding?.items) {
          data.onboarding.items.forEach((item, i) => {
            const label = item.label || item.title || '';
            if (label.toLowerCase().includes('profile')) {
              console.log(`  Onboarding Item ${i}: "${label}" [${item.id}]`);
            }
          });
        }
        if (data.actions) {
          data.actions.forEach((item, i) => {
            const label = item.label || item.title || '';
            if (label.toLowerCase().includes('profile')) {
              console.log(`  Action ${i}: "${label}" [${item.id}]`);
            }
          });
        }
      }
    }
  }
  
  // Check metadata/prep-phases
  const phases = await db.collection('metadata').doc('prep-phases').get();
  if (phases.exists) {
    console.log('\n=== metadata/prep-phases ===');
    console.log(JSON.stringify(phases.data(), null, 2).substring(0, 2000));
  }
}

find().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
