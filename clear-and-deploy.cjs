const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  // Find test user
  const users = await db.collection('users').orderBy('lastLogin', 'desc').limit(1).get();
  if (users.empty) { console.log('No users'); process.exit(1); }
  
  const user = users.docs[0];
  console.log('Clearing carryover for:', user.data()?.email);
  
  // Delete carryover doc
  await db.collection('users').doc(user.id).collection('action_progress').doc('_carryover').delete();
  
  console.log('Carryover cleared! Ready for fresh test.');
  process.exit(0);
})();
