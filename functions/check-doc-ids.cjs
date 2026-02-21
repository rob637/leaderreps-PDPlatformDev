const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../leaderreps-test-firebase-adminsdk.json'))
  });
}
const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('team_settings/gmail_accounts/accounts').get();
  snapshot.forEach(doc => {
    console.log('Document ID:', doc.id);
    console.log('Email in doc:', doc.data().email);
    console.log('---');
  });
}
check();
