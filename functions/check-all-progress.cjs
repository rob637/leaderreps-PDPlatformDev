const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkProgress() {
  const email = 'ryan@leaderreps.com';
  const usersSnap = await db.collection('users').where('email', '==', email).get();
  
  if (usersSnap.empty) {
    console.log('User not found');
    process.exit(1);
  }
  
  const userDoc = usersSnap.docs[0];
  console.log('User ID:', userDoc.id);
  
  // Get ALL action_progress entries
  const progressSnap = await db.collection('users').doc(userDoc.id).collection('action_progress').get();
  
  console.log('\n=== ALL Action Progress Entries ===');
  console.log('Total entries:', progressSnap.size);
  progressSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`\nID: ${doc.id}`);
    console.log(`Label: ${data.label || 'N/A'}`);
    console.log(`Status: ${data.status || 'N/A'}`);
    console.log(`weekNumber: ${data.weekNumber}`);
  });
}

checkProgress().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
