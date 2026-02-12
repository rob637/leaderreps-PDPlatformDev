const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkLeaderProfile() {
  // Find the test user
  const usersSnap = await db.collection('users').where('email', '==', 'rob@leaderreps.com').limit(1).get();
  
  if (usersSnap.empty) {
    console.log('User not found');
    return;
  }
  
  const userId = usersSnap.docs[0].id;
  console.log('User ID:', userId);
  
  // Check leader profile
  const profileRef = db.doc(`user_data/${userId}/leader_profile/current`);
  const profileSnap = await profileRef.get();
  
  if (profileSnap.exists) {
    const data = profileSnap.data();
    console.log('\nLeader Profile Data:');
    console.log('  isComplete:', data.isComplete);
    console.log('  completedAt:', data.completedAt);
    console.log('  firstName:', data.firstName);
    console.log('  lastName:', data.lastName);
    console.log('  companyName:', data.companyName);
    console.log('  jobTitle:', data.jobTitle);
    console.log('  updatedAt:', data.updatedAt);
  } else {
    console.log('No leader profile document found');
  }
}

checkLeaderProfile().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
