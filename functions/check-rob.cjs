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
    .where('email', '==', 'rob@leaderreps.com')
    .get();
  
  if (usersSnap.empty) {
    console.log('User not found');
    process.exit(0);
  }
  
  const userDoc = usersSnap.docs[0];
  const userData = userDoc.data();
  console.log('=== ROB@LEADERREPS.COM ===');
  console.log(`UserId: ${userDoc.id}`);
  console.log(`Name: ${userData.displayName}`);
  console.log(`CohortId: ${userData.cohortId}`);
  console.log('');
  
  // Get conditioning reps
  console.log('=== CONDITIONING REPS ===');
  const repsSnap = await db.collection('users').doc(userDoc.id).collection('conditioning_reps').get();
  console.log(`Total: ${repsSnap.size}`);
  console.log('');
  
  repsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`Rep: ${d.id}`);
    console.log(`  Type: ${data.repType}`);
    console.log(`  Person: ${data.person}`);
    console.log(`  Status: ${data.status}`);
    console.log(`  Created: ${data.createdAt?.toDate?.()?.toISOString() || 'N/A'}`);
    if (data.evidence) {
      console.log(`  Evidence: ${data.evidence.reflection?.substring(0, 80)}...`);
    }
    console.log('');
  });
  
  // Check rep commitments too
  console.log('=== ACTIVE COMMITMENTS (daily_practice) ===');
  const practiceSnap = await db.collection('users').doc(userDoc.id).collection('daily_practice').doc('current').get();
  if (practiceSnap.exists) {
    const data = practiceSnap.data();
    console.log(`Active commitments: ${JSON.stringify(data.activeCommitments || data.active_commitments || [])}`);
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
