const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315ab@sagecg.com').get();
  const userId = usersSnap.docs[0].id;
  
  // Check the _carried_over_prep document (seems to be the original carryover)
  const originalSnap = await db.collection('users').doc(userId).collection('action_progress').doc('_carried_over_prep').get();
  
  console.log('=== ORIGINAL CARRIED OVER PREP ===\n');
  if (originalSnap.exists) {
    const data = originalSnap.data();
    console.log('Milestone:', data.milestone);
    console.log('Items:');
    (data.items || []).forEach((item, i) => {
      console.log(`  ${i+1}. "${item.label}" [${item.id}]`);
    });
  } else {
    console.log('Not found');
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
