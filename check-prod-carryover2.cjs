const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315ab@sagecg.com').get();
  
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
  
  // Also check action_progress for completed items
  console.log('\n=== RECENT ACTION PROGRESS ===\n');
  const progressSnap = await db.collection('users').doc(userId).collection('action_progress').get();
  progressSnap.forEach(doc => {
    if (doc.id === '_carryover') return;
    const data = doc.data();
    if (data.status === 'completed') {
      console.log(`  ${doc.id}: "${data.label}" - COMPLETED`);
    }
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
