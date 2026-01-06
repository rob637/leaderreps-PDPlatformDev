const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkFeatures() {
  const configDoc = await db.collection('config').doc('features').get();
  const features = configDoc.data();
  
  console.log('=== All features related to dev-plan: ===');
  
  const devPlanFeatures = Object.entries(features || {})
    .filter(([key]) => key.includes('dev-plan') || key === 'development-plan')
    .sort((a, b) => ((a[1] && a[1].order) || 999) - ((b[1] && b[1].order) || 999));
  
  devPlanFeatures.forEach(([key, value]) => {
    console.log(key + ':', JSON.stringify(value));
  });
  
  console.log('\n=== ZONE_CONFIG for development-plan: ===');
  console.log(['dev-plan-header', 'dev-plan-stats', 'dev-plan-actions', 'dev-plan-focus-areas', 'dev-plan-goal', 'development-plan']);
}

checkFeatures().catch(console.error);
