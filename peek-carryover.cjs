const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function peek() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315h@sagecg.com').get();
  if (usersSnap.empty) {
    console.log('User not found');
    return;
  }
  
  const userId = usersSnap.docs[0].id;
  console.log('User ID:', userId);
  
  const carryoverRef = db.collection('users').doc(userId).collection('action_progress').doc('carryover');
  const carryoverSnap = await carryoverRef.get();
  
  if (!carryoverSnap.exists) {
    console.log('No carryover doc');
    return;
  }
  
  const data = carryoverSnap.data();
  console.log('\nCarryover items:');
  (data.items || []).forEach((item, i) => {
    console.log(`${i+1}. ${item.label} [${item.id}] ${item.completedAt ? '✓ DONE' : '○'}`);
  });
}

peek().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
