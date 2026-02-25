const admin = require('firebase-admin');
admin.apps.forEach(app => app.delete());

const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function checkUserData() {
  // Check the logged-in user from screenshot (id ending in W7153)
  const usersSnap = await db.collection('users').get();
  
  console.log('Checking users for QS3 in actionProgress...\n');
  
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    
    // Check actionProgress for any QS3 references
    if (data.actionProgress) {
      const apStr = JSON.stringify(data.actionProgress);
      if (apStr.includes('QS3')) {
        console.log(`User ${userDoc.id} actionProgress has QS3:`, apStr.slice(0, 500));
      }
    }
    
    // Check carriedOver items
    if (data.carriedOverItems || data.carryOver) {
      const coStr = JSON.stringify(data.carriedOverItems || data.carryOver);
      if (coStr && coStr.includes('QS3')) {
        console.log(`User ${userDoc.id} carriedOverItems has QS3:`, coStr.slice(0, 500));
      }
    }
  }
  
  // Also check modules collection for user-specific data
  const modulesSnap = await db.collectionGroup('development_plan').get();
  console.log('\nChecking modules/development_plan for QS3...');
  modulesSnap.forEach(doc => {
    const dataStr = JSON.stringify(doc.data());
    if (dataStr.includes('QS3')) {
      console.log(`Found in ${doc.ref.path}:`, dataStr.slice(0, 400));
    }
  });
  
  console.log('\nDone!');
}

checkUserData().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
