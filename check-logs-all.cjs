const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function checkLogs() {
  console.log('=== All activity types in system_logs ===');
  
  const logsSnap = await db.collection('system_logs').get();
  console.log('Total logs:', logsSnap.size);
  
  // Group by type
  const byType = {};
  logsSnap.docs.forEach(doc => {
    const data = doc.data();
    const type = data.type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });
  
  console.log('\nActivity breakdown:');
  Object.entries(byType).sort((a,b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  // Check for content_complete logs
  console.log('\n=== Checking for content completions ===');
  const completions = logsSnap.docs.filter(d => d.data().type === 'content_complete');
  console.log('Content completions found:', completions.length);
  
  // Check for signups
  console.log('\n=== Checking for user signups ===');
  const signups = logsSnap.docs.filter(d => d.data().type === 'user_signup');
  console.log('User signups found:', signups.length);
}

checkLogs().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
