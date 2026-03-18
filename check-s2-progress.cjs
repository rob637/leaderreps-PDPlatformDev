const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315h@sagecg.com').get();
  const userId = usersSnap.docs[0].id;
  
  // Check action progress for session 2 items
  const progressSnap = await db.collection('users').doc(userId).collection('action_progress').get();
  
  console.log('=== ALL ACTION PROGRESS (Session 2 related) ===\n');
  progressSnap.forEach(doc => {
    const data = doc.data();
    const label = data.label || '';
    if (label.toLowerCase().includes('session 2') || 
        doc.id.includes('s2') || 
        label.includes('1:1') ||
        label.includes('Vulnerability') ||
        label.includes('Follow-up')) {
      console.log(`${doc.id}:`);
      console.log(`  label: "${label}"`);
      console.log(`  status: ${data.status || 'none'}`);
      console.log(`  completedAt: ${data.completedAt ? 'YES' : 'no'}`);
      console.log('');
    }
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
