const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  
  // Get first 3 daily_plan docs and print full structure
  const snapshot = await db.collection('daily_plan_v1').limit(3).get();
  
  snapshot.forEach(doc => {
    console.log(`\n=== ${doc.id} ===`);
    const data = doc.data();
    console.log('Keys:', Object.keys(data).join(', '));
    console.log('Full data:', JSON.stringify(data, null, 2).substring(0, 1500));
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
