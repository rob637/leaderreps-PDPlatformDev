const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  // Get all users and find matching email
  const usersSnap = await db.collection('users').get();
  let foundUser = null;
  usersSnap.forEach(doc => {
    const email = doc.data().email || '';
    if (email.toLowerCase() === 'rob@capxpartners.com') {
      foundUser = doc;
    }
  });
  
  if (!foundUser) {
    console.log('User not found');
    process.exit(1);
  }
  
  const userId = foundUser.id;
  console.log('Found user:', userId, foundUser.data().email);
  
  const carryOverRef = db.doc('users/' + userId + '/action_progress/_carried_over_prep');
  const snap = await carryOverRef.get();
  if (snap.exists) {
    console.log('Current data:', JSON.stringify(snap.data(), null, 2));
    await carryOverRef.delete();
    console.log('Cleared _carried_over_prep for user');
  } else {
    console.log('No _carried_over_prep doc exists');
  }
  process.exit(0);
})();
