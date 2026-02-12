const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function listUsers() {
  const usersSnap = await db.collection('users').limit(20).get();
  
  console.log('Users in database:\n');
  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`  ${doc.id}: ${data.email}`);
  });
}

listUsers().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
