const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  // Get Firebase Auth UID
  const authUser = await admin.auth().getUserByEmail('rob10@test.com');
  console.log('Firebase Auth UID:', authUser.uid);
  console.log('Auth Email:', authUser.email);
  console.log('---');

  // Get Firestore document
  const usersRef = db.collection('users');
  const snap = await usersRef.where('email', '==', 'rob10@test.com').get();
  snap.forEach(doc => {
    console.log('Firestore Document ID:', doc.id);
    const data = doc.data();
    console.log('email:', data.email);
    console.log('---');
    console.log('IDs Match:', authUser.uid === doc.id ? 'YES ✓' : 'NO ✗ - THIS IS THE PROBLEM!');
    console.log('---');
    console.log('notificationSettings:', JSON.stringify(data.notificationSettings, null, 2));
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
