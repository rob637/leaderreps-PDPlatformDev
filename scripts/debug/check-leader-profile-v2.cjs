const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';

async function checkLeaderProfile() {
  // Check the actual path used in useLeaderProfile
  const profileRef = db.doc(`user_data/${userId}/leader_profile/current`);
  const profileSnap = await profileRef.get();
  
  if (profileSnap.exists) {
    console.log('=== LEADER PROFILE (user_data/.../leader_profile/current) ===');
    console.log(JSON.stringify(profileSnap.data(), null, 2));
  } else {
    console.log('=== LEADER PROFILE NOT FOUND at user_data/.../leader_profile/current ===');
  }
  
  // Also check user_data subcollections
  const subcolls = await db.collection(`user_data/${userId}`).listDocuments();
  console.log('\n=== user_data subcollections ===');
  for (const doc of subcolls) {
    console.log('- ', doc.path);
  }
}

checkLeaderProfile().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
