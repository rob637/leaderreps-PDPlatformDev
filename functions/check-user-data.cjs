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
  
  const userData = userDoc.data();
  console.log('\n=== prepStatus ===');
  console.log(JSON.stringify(userData.prepStatus, null, 2));
  
  console.log('\n=== actionProgress (if embedded) ===');
  console.log(JSON.stringify(userData.actionProgress, null, 2));
  
  // Check development_plan subcollection
  const devPlanSnap = await db.collection('users').doc(userDoc.id).collection('development_plan').get();
  console.log('\n=== development_plan subcollection ===');
  console.log('Docs:', devPlanSnap.size);
  devPlanSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`\nDoc: ${doc.id}`);
    if (data.dailyProgress) {
      console.log('dailyProgress keys:', Object.keys(data.dailyProgress));
      Object.entries(data.dailyProgress).forEach(([key, val]) => {
        if (val.itemsCompleted?.length > 0) {
          console.log(`  ${key} itemsCompleted:`, val.itemsCompleted);
        }
      });
    }
    if (data.actionProgress) {
      console.log('actionProgress:', JSON.stringify(data.actionProgress, null, 2));
    }
  });
}

checkProgress().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
