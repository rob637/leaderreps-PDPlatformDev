const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function checkLogs() {
  console.log('=== Checking system_logs collection ===');
  
  const logsSnap = await db.collection('system_logs').orderBy('timestamp', 'desc').limit(20).get();
  console.log('Total logs found:', logsSnap.size);
  
  if (logsSnap.size > 0) {
    logsSnap.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`\n[${i+1}] ${data.type || 'unknown'}`);
      console.log('   Action:', data.action);
      console.log('   User:', data.user);
      console.log('   Details:', data.details);
      console.log('   Timestamp:', data.timestamp ? data.timestamp.toDate().toISOString() : 'none');
    });
  } else {
    console.log('No logs found in system_logs collection');
  }
}

checkLogs().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
