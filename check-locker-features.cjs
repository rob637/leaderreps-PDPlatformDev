const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkFeatures() {
  const featuresDoc = await db.collection('config').doc('features').get();
  const features = featuresDoc.data() || {};
  
  console.log('=== Locker Features ===');
  const lockerFeatures = ['locker-wins-history', 'locker-scorecard-history', 'locker-latest-reflection', 'locker-reps-history'];
  
  for (const fid of lockerFeatures) {
    const val = features[fid];
    if (val === undefined) {
      console.log(`${fid}: NOT IN DB (will default to true)`);
    } else if (typeof val === 'object') {
      console.log(`${fid}: { enabled: ${val.enabled}, order: ${val.order} }`);
    } else {
      console.log(`${fid}: ${val}`);
    }
  }
  
  process.exit(0);
}

checkFeatures().catch(console.error);
