const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findAllQS3() {
  // Check all daily_plan_v1 docs for ANY QS3 reference anywhere
  const dpSnap = await db.collection('daily_plan_v1').get();
  
  console.log('Searching all daily_plan_v1 documents for QS3...\n');
  
  dpSnap.forEach(doc => {
    const dataStr = JSON.stringify(doc.data());
    if (dataStr.includes('QS3') || dataStr.includes('Live QS')) {
      console.log(`Found in ${doc.id}:`);
      // Find the specific location
      const data = doc.data();
      if (data.weeklyResources) {
        const wr = data.weeklyResources;
        if (JSON.stringify(wr.weeklyCommunity).includes('QS3')) {
          console.log('  - weeklyCommunity:', JSON.stringify(wr.weeklyCommunity));
        }
        if (JSON.stringify(wr.weeklyCoaching).includes('QS3')) {
          console.log('  - weeklyCoaching:', JSON.stringify(wr.weeklyCoaching));
        }
      }
      if (dataStr.includes('QS3') && !JSON.stringify(data.weeklyResources).includes('QS3')) {
        console.log('  - Other location:', dataStr.slice(dataStr.indexOf('QS3') - 50, dataStr.indexOf('QS3') + 50));
      }
    }
  });
  
  // Check coaching_sessions 
  const csSnap = await db.collection('coaching_sessions').get();
  console.log('\nSearching coaching_sessions...');
  csSnap.forEach(doc => {
    const dataStr = JSON.stringify(doc.data());
    if (dataStr.includes('QS3')) {
      console.log(`Found in coaching_sessions/${doc.id}`);
    }
  });
  
  // Check coaching_session_types
  const cstSnap = await db.collection('coaching_session_types').get();
  console.log('\nSearching coaching_session_types...');
  cstSnap.forEach(doc => {
    const dataStr = JSON.stringify(doc.data());
    if (dataStr.includes('QS3')) {
      console.log(`Found in coaching_session_types/${doc.id}:`, dataStr.slice(0, 300));
    }
  });
  
  console.log('\nDone!');
}

findAllQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
