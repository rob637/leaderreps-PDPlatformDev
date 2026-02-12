const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkAllProfiles() {
  // Get all user_data documents
  const usersSnap = await db.collection('users').limit(30).get();
  
  console.log('Checking Leader Profiles for all users:\n');
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    const profileRef = db.doc(`user_data/${userId}/leader_profile/current`);
    const profileSnap = await profileRef.get();
    
    if (profileSnap.exists) {
      const profile = profileSnap.data();
      console.log(`${userData.email || 'NO EMAIL'}:`);
      console.log(`  isComplete: ${profile.isComplete}`);
      console.log(`  firstName: ${profile.firstName}, lastName: ${profile.lastName}`);
      console.log(`  updatedAt: ${profile.updatedAt?.toDate?.() || 'N/A'}`);
      console.log('');
    }
  }
}

checkAllProfiles().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
