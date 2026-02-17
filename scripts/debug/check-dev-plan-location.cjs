const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkDevPlanLocation() {
  const uid = 'QUA65XyWmrWnMVmecG4yhIWMop52';
  
  // Check multiple potential locations
  const locations = [
    `user_data/${uid}/developmentPlan/current`,
    `users/${uid}/developmentPlan/current`,
    `user_data/${uid}`,
    `users/${uid}`
  ];
  
  for (const path of locations) {
    const docRef = db.doc(path);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      console.log(`\n=== ${path} ===`);
      console.log('Keys:', Object.keys(data).slice(0, 15).join(', '));
      if (data.cohortId) console.log('cohortId:', data.cohortId);
      if (data.programDay) console.log('programDay:', data.programDay);
      if (data.currentDay) console.log('currentDay:', data.currentDay);
    } else {
      console.log(`${path}: NOT FOUND`);
    }
  }
  
  // Check subcollections under users/{uid}
  console.log('\n=== Subcollections under users/{uid} ===');
  const userRef = db.collection('users').doc(uid);
  const collections = await userRef.listCollections();
  console.log('Collections:', collections.map(c => c.id).join(', '));
  
  // Check if there's developmentPlan in user doc itself
  console.log('\n=== User Doc Fields ===');
  const userSnap = await userRef.get();
  const userData = userSnap.data();
  console.log('Keys:', Object.keys(userData).join(', '));
  if (userData.developmentPlan) {
    console.log('Found developmentPlan in user doc!');
    console.log('Type:', typeof userData.developmentPlan);
  }
}

checkDevPlanLocation()
  .then(() => process.exit(0))
  .catch(console.error);
