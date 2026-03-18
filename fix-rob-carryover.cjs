const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function fix() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315h@sagecg.com').get();
  const userId = usersSnap.docs[0].id;
  
  // Check _carryover doc
  const carryoverRef = db.collection('users').doc(userId).collection('action_progress').doc('_carryover');
  const snap = await carryoverRef.get();
  
  if (!snap.exists) {
    console.log('No _carryover doc');
    return;
  }
  
  const data = snap.data();
  console.log('_carryover data:');
  (data.items || []).forEach((item, i) => {
    console.log(`  ${i}: ${item.label} [${item.id}] ${item.completedAt ? '✓' : '○'}`);
  });
  
  // Also check carryover doc (without underscore)
  const carryoverRef2 = db.collection('users').doc(userId).collection('action_progress').doc('carryover');
  const snap2 = await carryoverRef2.get();
  if (snap2.exists) {
    console.log('\ncarryover (no underscore) data:');
    (snap2.data().items || []).forEach((item, i) => {
      console.log(`  ${i}: ${item.label} [${item.id}] ${item.completedAt ? '✓' : '○'}`);
    });
  }
  
  // Also check all progress docs that have 'profile' in them
  const progressSnap = await db.collection('users').doc(userId).collection('action_progress').get();
  console.log('\nAll action_progress docs with profile:');
  progressSnap.forEach(doc => {
    const str = JSON.stringify(doc.data()).toLowerCase();
    if (str.includes('profile')) {
      console.log(`  ${doc.id}:`, JSON.stringify(doc.data(), null, 2).substring(0, 300));
    }
  });
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
