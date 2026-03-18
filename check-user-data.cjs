const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315h@sagecg.com').get();
  const userId = usersSnap.docs[0].id;
  const userData = usersSnap.docs[0].data();
  
  console.log('User ID:', userId);
  console.log('prepStatus:', JSON.stringify(userData.prepStatus || {}, null, 2));
  
  // Check action_progress
  const progressSnap = await db.collection('users').doc(userId).collection('action_progress').get();
  console.log('\nAction Progress docs:');
  progressSnap.forEach(doc => {
    const data = doc.data();
    console.log(`  ${doc.id}:`, data.status || 'no status', data.label || '');
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
