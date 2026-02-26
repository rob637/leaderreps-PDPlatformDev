const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkProgress() {
  // Get test user by email
  const email = 'ryan@leaderreps.com';
  const usersSnap = await db.collection('users').where('email', '==', email).get();
  
  if (usersSnap.empty) {
    console.log('User not found');
    process.exit(1);
  }
  
  const userDoc = usersSnap.docs[0];
  console.log('User ID:', userDoc.id);
  
  // Get all action_progress entries
  const progressSnap = await db.collection('users').doc(userDoc.id).collection('action_progress').get();
  
  console.log('\n=== Action Progress Entries ===');
  progressSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.label && (
      data.label.toLowerCase().includes('download') ||
      data.label.toLowerCase().includes('watch') ||
      data.label.toLowerCase().includes('session')
    )) {
      console.log(`\nID: ${doc.id}`);
      console.log(`Label: ${data.label}`);
      console.log(`Status: ${data.status}`);
      console.log(`Completed: ${data.completedAt?.toDate?.() || data.completedAt || 'N/A'}`);
    }
  });
}

checkProgress().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
