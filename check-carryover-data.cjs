const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  // List recent users to find the right one
  const users = await db.collection('users').orderBy('lastLogin', 'desc').limit(5).get();
  
  console.log('Recent users:');
  users.docs.forEach(d => {
    console.log(' -', d.data()?.email, d.id);
  });
  
  // Try the first user (most recent login is probably testing)
  if (users.docs.length > 0) {
    const user = users.docs[0];
    const uid = user.id;
    console.log('\nChecking carryover for:', user.data()?.email);
    
    const carryover = await db.collection('users').doc(uid).collection('action_progress').doc('_carryover').get();
    
    if (!carryover.exists) {
      console.log('No carryover doc');
      process.exit(0);
    }
    
    const data = carryover.data();
    console.log('Current level:', data.currentLevel);
    console.log('Items:', data.items?.length);
    console.log('');
    
    data.items?.forEach((item, i) => {
      console.log((i+1) + '.', item.label);
      console.log('   completedAt:', item.completedAt || 'NULL');
      console.log('   addedAtLevel:', item.addedAtLevel);
    });
  }
  
  process.exit(0);
})();
