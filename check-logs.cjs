const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();

async function check() {
  const snap = await db.collection('system_logs').orderBy('timestamp', 'desc').limit(20).get();
  console.log('Total logs in system_logs:', snap.size);
  console.log('');
  snap.docs.forEach(d => {
    const data = d.data();
    const ts = data.timestamp ? data.timestamp.toDate().toISOString() : 'no timestamp';
    console.log('- Action:', data.action);
    console.log('  User:', data.user);
    console.log('  Time:', ts);
    console.log('  Type:', data.type);
    console.log('');
  });
}
check();
