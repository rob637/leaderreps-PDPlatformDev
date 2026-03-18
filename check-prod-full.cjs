const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315ab@sagecg.com').get();
  const userId = usersSnap.docs[0].id;
  
  // Get FULL carryover doc
  const carryoverSnap = await db.collection('users').doc(userId).collection('action_progress').doc('_carryover').get();
  
  console.log('=== FULL PROD CARRYOVER DOC ===\n');
  if (!carryoverSnap.exists) {
    console.log('No carryover doc!');
  } else {
    const data = carryoverSnap.data();
    console.log('Raw data:', JSON.stringify(data, null, 2));
  }
  
  // Also check ALL action_progress docs
  console.log('\n=== ALL ACTION PROGRESS DOCS ===\n');
  const progressSnap = await db.collection('users').doc(userId).collection('action_progress').get();
  progressSnap.forEach(doc => {
    console.log(`${doc.id}:`, JSON.stringify(doc.data(), null, 2).substring(0, 200));
    console.log('');
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
