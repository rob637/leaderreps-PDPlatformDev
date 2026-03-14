const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('../leaderreps-test-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'leaderreps-test' });
}
const db = admin.firestore();

async function check() {
  const userId = '6IHcajHJVIXfwVZKFZAkCce5zxH3';
  
  // Check user_data path (where LeaderProfile is saved)
  console.log('=== user_data PATH ===');
  const leaderProfileRef = db.doc(`user_data/${userId}/leader_profile/current`);
  const lpSnap = await leaderProfileRef.get();
  if (lpSnap.exists) {
    const data = lpSnap.data();
    console.log('Leader Profile EXISTS');
    console.log('  isComplete:', data.isComplete);
    console.log('  completedAt:', data.completedAt?.toDate?.() || 'none');
    console.log('  firstName:', data.firstName);
  } else {
    console.log('Leader Profile NOT FOUND');
  }
  
  // Check all collections under user_data/{userId}
  console.log('\n=== ALL user_data SUBCOLLECTIONS ===');
  const userDataRef = db.collection(`user_data/${userId}`);
  const cols = await db.doc(`user_data/${userId}`).listCollections();
  for (const col of cols) {
    console.log('Collection:', col.id);
    const docs = await col.listDocuments();
    for (const d of docs) {
      console.log('  - ', d.id);
    }
  }
  
  // Also check if there's a users/{userId}/leaderProfile
  console.log('\n=== users/{uid}.leaderProfile ===');
  const userSnap = await db.doc(`users/${userId}`).get();
  const userData = userSnap.data();
  if (userData?.leaderProfile) {
    console.log('Found leaderProfile on user doc');
    console.log('  isComplete:', userData.leaderProfile.isComplete);
  } else {
    console.log('No leaderProfile on user doc');
  }
  
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
