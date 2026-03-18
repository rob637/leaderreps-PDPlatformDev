const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const email = process.argv[2] || 'rob0315c@sagecg.com';
  const usersSnap = await db.collection('users').where('email', '==', email).get();
  if (usersSnap.empty) {
    console.log('User not found:', email);
    process.exit(1);
  }
  const uid = usersSnap.docs[0].id;
  console.log('User:', email, '->', uid);
  
  const carryover = await db.doc('users/' + uid + '/action_progress/_carryover').get();
  
  if (!carryover.exists) {
    console.log('\nNO CARRYOVER DOC EXISTS');
  } else {
    const data = carryover.data();
    console.log('\nCarryover Level:', data.currentLevel);
    console.log('Items:', data.items ? data.items.length : 0);
    if (data.items) {
      data.items.forEach(function(i) {
        console.log('  -', i.label, '| completed:', !!i.completedAt, '| addedAtLevel:', i.addedAtLevel);
      });
    }
  }
  
  const userDoc = await db.doc('users/' + uid).get();
  const mp = userDoc.data().milestoneProgress || {};
  console.log('\nMilestone Progress:');
  Object.keys(mp).forEach(function(k) {
    console.log('  ', k, ':', mp[k] && mp[k].signedOff ? 'SIGNED OFF' : 'not signed off');
  });
  
  process.exit(0);
})();
