const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = 'CNZfMN20DqQWRrH4z0w7nf24Qmm1';

async function checkAllData() {
  // List all subcollections
  const userRef = db.collection('users').doc(userId);
  const collections = await userRef.listCollections();
  
  console.log('User subcollections:');
  for (const coll of collections) {
    const snap = await coll.get();
    console.log(`  ${coll.id}: ${snap.size} docs`);
  }
  
  // Check prepPlan specifically
  const prepPlan = await userRef.collection('prepPlan').get();
  console.log('\n--- prepPlan ---');
  prepPlan.docs.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, ':', JSON.stringify(data, null, 2).slice(0, 500));
  });

  // Check arena data
  const arena = await userRef.collection('arena').get();
  console.log('\n--- arena ---');
  arena.docs.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, ':', JSON.stringify(data, null, 2).slice(0, 500));
  });

  // Check progress
  const progress = await userRef.collection('progress').get();
  console.log('\n--- progress ---');
  progress.docs.forEach(doc => {
    console.log(doc.id, ':', JSON.stringify(doc.data(), null, 2).slice(0, 500));
  });
  
  process.exit(0);
}

checkAllData().catch(e => { console.error(e); process.exit(1); });
