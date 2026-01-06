const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function enableWidgets() {
  const featureDocRef = db.collection('config').doc('features');
  
  // Enable all dev-plan widgets while preserving other properties
  await featureDocRef.set({
    'dev-plan-header': { enabled: true, order: 1 },
    'dev-plan-stats': { enabled: true, order: 2 },
    'dev-plan-actions': { enabled: true, order: 3 },
    'dev-plan-focus-areas': { enabled: true, order: 4 },
    'dev-plan-goal': { enabled: true, order: 5 },
    'dev-plan-roadmap': { enabled: true, order: 6 }
  }, { merge: true });
  
  console.log('Enabled dev-plan widgets!');
  
  // Verify the changes
  const doc = await featureDocRef.get();
  const data = doc.data();
  const devPlanFeatures = Object.entries(data)
    .filter(([key]) => key.includes('dev-plan'))
    .map(([key, val]) => `${key}: enabled=${val.enabled}, order=${val.order}`);
  
  console.log('\nVerification:');
  devPlanFeatures.forEach(f => console.log(f));
}

enableWidgets().catch(console.error);
