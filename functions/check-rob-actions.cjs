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
  // Find Rob by email
  const usersSnap = await db.collection('users')
    .where('email', '==', 'rob@sagecg.com')
    .get();
  
  if (usersSnap.empty) {
    console.log('User not found');
    process.exit(0);
  }
  
  const userId = usersSnap.docs[0].id;
  console.log(`UserId: ${userId}`);
  console.log('');
  
  // Get all action_progress
  console.log('=== ACTION PROGRESS ===');
  const actionsSnap = await db.collection('users').doc(userId).collection('action_progress').get();
  console.log(`Total: ${actionsSnap.size}`);
  console.log('');
  
  actionsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id}`);
    console.log(`  Label: ${data.label}`);
    console.log(`  Status: ${data.status}`);
    console.log(`  Category: ${data.category}`);
    console.log(`  WeekNumber: ${data.weekNumber}`);
    console.log('');
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
