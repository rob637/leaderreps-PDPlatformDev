const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  // Find test user
  const users = await db.collection('users').orderBy('lastLogin', 'desc').limit(1).get();
  if (users.empty) { console.log('No users'); process.exit(1); }
  
  const user = users.docs[0];
  const userData = user.data();
  console.log('User:', userData.email);
  console.log('\n=== user.prepStatus ===');
  console.log(JSON.stringify(userData.prepStatus || {}, null, 2));
  
  console.log('\n=== action_progress documents ===');
  const progressDocs = await db.collection('users').doc(user.id).collection('action_progress').get();
  
  progressDocs.docs.forEach(doc => {
    if (doc.id === '_carryover') return; // skip carryover doc
    const data = doc.data();
    console.log('\n' + doc.id + ':');
    console.log('  status:', data.status);
    console.log('  label:', data.label);
    console.log('  completedAt:', data.completedAt?.toDate?.() || data.completedAt || 'null');
  });
  
  process.exit(0);
})();
