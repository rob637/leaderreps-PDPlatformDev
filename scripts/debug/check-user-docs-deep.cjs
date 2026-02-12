const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkUserDocs() {
  const email = 'jim1@test.com';
  
  // Get user
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();
  
  if (usersSnapshot.empty) {
    console.log('User not found');
    return;
  }
  
  const userDoc = usersSnapshot.docs[0];
  const uid = userDoc.id;
  console.log('UID:', uid);
  console.log('User data:', JSON.stringify(userDoc.data(), null, 2));
  
  // List ALL subcollections and documents under user_data/{uid}
  console.log('\n=== Checking user_data/{uid} ===');
  const userDataRef = db.collection(`user_data`).doc(uid);
  const collections = await userDataRef.listCollections();
  
  console.log('Subcollections found:', collections.map(c => c.id));
  
  for (const col of collections) {
    console.log(`\n--- Collection: ${col.id} ---`);
    const docs = await col.get();
    docs.forEach(doc => {
      console.log(`  Doc ID: ${doc.id}`);
      const data = doc.data();
      // Just show keys, not full data
      console.log(`    Keys: ${Object.keys(data).join(', ')}`);
    });
  }
  
  // Also check if developmentPlan doc exists directly
  console.log('\n=== Direct check for developmentPlan/current ===');
  const devPlanRef = db.doc(`user_data/${uid}/developmentPlan/current`);
  const devPlanSnap = await devPlanRef.get();
  console.log('Exists:', devPlanSnap.exists);
  if (devPlanSnap.exists) {
    console.log('Keys:', Object.keys(devPlanSnap.data()));
  }
}

checkUserDocs()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
