const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  // Find user in prod
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315h@sagecg.com').get();
  
  if (usersSnap.empty) {
    console.log('User not found in PROD');
    return;
  }
  
  const userId = usersSnap.docs[0].id;
  console.log('PROD User ID:', userId);
  
  // Check carryover
  const carryoverSnap = await db.collection('users').doc(userId).collection('action_progress').doc('_carryover').get();
  
  console.log('\n=== PROD CARRYOVER ===\n');
  if (!carryoverSnap.exists) {
    console.log('No carryover doc in PROD!');
  } else {
    const data = carryoverSnap.data();
    console.log('Current level:', data.currentLevel);
    console.log('Items:');
    (data.items || []).forEach((item, i) => {
      console.log(`  ${i+1}. "${item.label}" [${item.id}]`);
      console.log(`      completedAt: ${item.completedAt || 'NOT DONE'}`);
    });
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
