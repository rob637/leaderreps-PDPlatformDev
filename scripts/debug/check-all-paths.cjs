const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkAllPaths() {
  const email = 'jim1@test.com';
  
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();
  
  const uid = usersSnapshot.docs[0].id;
  console.log('UID:', uid);
  
  // Path 1: users/{uid}/action_progress (useActionProgress.js uses this)
  console.log('\n=== Path 1: users/{uid}/action_progress ===');
  const path1 = await db.collection(`users/${uid}/action_progress`).get();
  console.log('Documents:', path1.size);
  path1.forEach(doc => console.log(`  ${doc.id}: ${doc.data().status}`));
  
  // Path 2: user_data/{uid}/action_progress
  console.log('\n=== Path 2: user_data/{uid}/action_progress ===');
  const path2 = await db.collection(`user_data/${uid}/action_progress`).get();
  console.log('Documents:', path2.size);
  
  // Path 3: modules/{uid}/action_progress/current
  console.log('\n=== Path 3: modules/{uid}/action_progress/current ===');
  const path3 = await db.doc(`modules/${uid}/action_progress/current`).get();
  console.log('Exists:', path3.exists);
  if (path3.exists) {
    console.log('Data keys:', Object.keys(path3.data()));
  }
  
  // Also check dailyProgress in development_plan
  console.log('\n=== modules/{uid}/development_plan/current.dailyProgress ===');
  const devPlan = await db.doc(`modules/${uid}/development_plan/current`).get();
  if (devPlan.exists) {
    const data = devPlan.data();
    // Look for any dailyProgress fields
    const dpKeys = Object.keys(data).filter(k => k.startsWith('dailyProgress'));
    console.log('dailyProgress keys:', dpKeys);
    dpKeys.forEach(k => {
      console.log(`  ${k}:`, JSON.stringify(data[k]));
    });
  }
}

checkAllPaths()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
