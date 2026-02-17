const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkFeatures() {
  const featuresDoc = await db.collection('config').doc('features').get();
  const features = featuresDoc.data() || {};
  
  console.log('=== All Locker Features ===');
  const lockerFeatures = [
    'locker-wins-history', 
    'locker-scorecard-history', 
    'locker-latest-reflection', 
    'locker-conditioning-history',
    'locker-reps-history'
  ];
  
  for (const fid of lockerFeatures) {
    const val = features[fid];
    if (val === undefined) {
      console.log(`${fid}: NOT IN DB (defaults to TRUE)`);
    } else if (typeof val === 'object') {
      console.log(`${fid}: enabled=${val.enabled}, order=${val.order}`);
    } else {
      console.log(`${fid}: ${val}`);
    }
  }
  
  console.log('\n=== Conditioning Features ===');
  const condFeatures = ['conditioning', 'conditioning-history'];
  for (const fid of condFeatures) {
    const val = features[fid];
    if (val === undefined) {
      console.log(`${fid}: NOT IN DB (defaults to TRUE)`);
    } else if (typeof val === 'object') {
      console.log(`${fid}: enabled=${val.enabled}, order=${val.order}`);
    } else {
      console.log(`${fid}: ${val}`);
    }
  }
  
  process.exit(0);
}

checkFeatures().catch(console.error);
