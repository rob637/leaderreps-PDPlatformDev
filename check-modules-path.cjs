const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkModulesPath() {
  const email = 'jim1@test.com';
  
  // Get user
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();
  
  const userDoc = usersSnapshot.docs[0];
  const uid = userDoc.id;
  console.log('UID:', uid);
  
  // Check CORRECT path: modules/{uid}/development_plan/current
  console.log('\n=== Checking modules/{uid}/development_plan/current ===');
  const devPlanSnap = await db.doc(`modules/${uid}/development_plan/current`).get();
  console.log('Exists:', devPlanSnap.exists);
  if (devPlanSnap.exists) {
    const data = devPlanSnap.data();
    console.log('Keys:', Object.keys(data));
    console.log('dailyProgress:', JSON.stringify(data.dailyProgress, null, 2));
  }
  
  // Check daily_practice too
  console.log('\n=== Checking modules/{uid}/daily_practice/current ===');
  const dailySnap = await db.doc(`modules/${uid}/daily_practice/current`).get();
  console.log('Exists:', dailySnap.exists);
  if (dailySnap.exists) {
    const data = dailySnap.data();
    console.log('Keys:', Object.keys(data));
  }
  
  // List all subcollections under modules/{uid}
  console.log('\n=== All subcollections under modules/{uid} ===');
  const modulesRef = db.collection(`modules`).doc(uid);
  const collections = await modulesRef.listCollections();
  console.log('Collections:', collections.map(c => c.id));
  
  // Check action_progress under user_data (this is where prep completion status should be tracked)
  console.log('\n=== Checking user_data/{uid}/action_progress ===');
  const actionProgressSnap = await db.collection(`user_data/${uid}/action_progress`).get();
  console.log('Documents:', actionProgressSnap.size);
  actionProgressSnap.forEach(doc => {
    console.log(`  ${doc.id}: ${doc.data().status}`);
  });
}

checkModulesPath()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
