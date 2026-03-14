const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}
const db = admin.firestore();

async function check() {
  const brittId = 'AgHqf6UYqlQBPZR2C25qGHqdOBp1';
  
  // List ALL subcollections
  console.log('=== ALL SUBCOLLECTIONS ===');
  const userRef = db.collection('users').doc(brittId);
  const collections = await userRef.listCollections();
  for (const col of collections) {
    const snap = await col.get();
    console.log(`${col.id}: ${snap.size} docs`);
  }
  
  // Check action_progress for reinforcing feedback
  console.log('\n=== ACTION PROGRESS (all) ===');
  const actionsSnap = await db.collection('users').doc(brittId).collection('action_progress').get();
  actionsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`\nAction: ${d.id}`);
    console.log(JSON.stringify(data, null, 2));
  });
  
  // Check content_progress
  console.log('\n=== CONTENT_PROGRESS ===');
  const contentSnap = await db.collection('users').doc(brittId).collection('content_progress').get();
  console.log(`Total: ${contentSnap.size}`);
  contentSnap.docs.forEach(d => {
    console.log(`${d.id}: ${JSON.stringify(d.data())}`);
  });
  
  // Check rep_progress
  console.log('\n=== REP_PROGRESS ===');
  const repProgSnap = await db.collection('users').doc(brittId).collection('rep_progress').get();
  console.log(`Total: ${repProgSnap.size}`);
  repProgSnap.docs.forEach(d => {
    console.log(`${d.id}: ${JSON.stringify(d.data())}`);
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
