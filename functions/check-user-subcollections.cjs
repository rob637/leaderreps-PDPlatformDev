const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkSubcollections() {
  // Get any user to check subcollections
  const usersSnap = await db.collection('users').limit(1).get();
  if (usersSnap.empty) {
    console.log('No users found');
    return;
  }
  
  const userId = usersSnap.docs[0].id;
  console.log('Checking subcollections for user:', userId);
  
  // List all subcollections
  const subcollections = await db.collection('users').doc(userId).listCollections();
  console.log('\nSubcollections found:');
  for (const sub of subcollections) {
    const count = (await sub.count().get()).data().count;
    console.log(`  - ${sub.id}: ${count} docs`);
  }
}

checkSubcollections().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
