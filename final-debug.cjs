const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const users = await db.collection('users').orderBy('lastLogin', 'desc').limit(1).get();
  const user = users.docs[0];
  const uid = user.id;
  const userData = user.data();
  
  console.log('User:', userData.email);
  console.log('\n=== CARRYOVER TABLE ===');
  const carryover = await db.collection('users').doc(uid).collection('action_progress').doc('_carryover').get();
  const carryoverItems = carryover.exists ? carryover.data().items : [];
  
  console.log('Items in carryover:', carryoverItems.length);
  
  // Get action_progress for comparison
  const progress = await db.collection('users').doc(uid).collection('action_progress').get();
  const progressMap = {};
  progress.docs.forEach(d => {
    if (d.id !== '_carryover') progressMap[d.id] = d.data();
  });
  
  console.log('\n=== CHECKING EACH CARRYOVER ITEM ===');
  for (const item of carryoverItems) {
    const prog = progressMap[item.id];
    const isCompleteInProgress = prog?.status === 'completed';
    
    // Check by label too
    let foundByLabel = false;
    Object.values(progressMap).forEach(p => {
      if (p.status === 'completed' && p.label?.toLowerCase().trim() === item.label?.toLowerCase().trim()) {
        foundByLabel = true;
      }
    });
    
    console.log(`\n${item.label}`);
    console.log(`  ID: ${item.id}`);
    console.log(`  completedAt in carryover: ${item.completedAt || 'NULL'}`);
    console.log(`  action_progress[id].status: ${prog?.status || 'NOT FOUND'}`);
    console.log(`  Found completed by label: ${foundByLabel}`);
    console.log(`  SHOULD FILTER: ${item.completedAt || isCompleteInProgress || foundByLabel ? 'YES' : 'NO'}`);
  }
  
  process.exit(0);
})();
