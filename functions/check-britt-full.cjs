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
  
  // Check all draft details
  console.log('=== FULL DRAFT DATA ===');
  const draftsSnap = await db.collection('users').doc(brittId).collection('rep_drafts').get();
  draftsSnap.docs.forEach(d => {
    console.log(`\nDraft: ${d.id}`);
    console.log(JSON.stringify(d.data(), null, 2));
  });
  
  // Check planned_reps subcollection if it exists
  console.log('\n=== PLANNED REPS ===');
  const plannedSnap = await db.collection('users').doc(brittId).collection('planned_reps').get();
  console.log(`Total: ${plannedSnap.size}`);
  plannedSnap.docs.forEach(d => {
    console.log(JSON.stringify(d.data(), null, 2));
  });
  
  // Check commitments subcollection
  console.log('\n=== COMMITMENTS ===');
  const commitmentsSnap = await db.collection('users').doc(brittId).collection('commitments').get();
  console.log(`Total: ${commitmentsSnap.size}`);
  commitmentsSnap.docs.forEach(d => {
    console.log(JSON.stringify(d.data(), null, 2));
  });
  
  // Check rep_commitments
  console.log('\n=== REP_COMMITMENTS ===');
  const repCommSnap = await db.collection('users').doc(brittId).collection('rep_commitments').get();
  console.log(`Total: ${repCommSnap.size}`);
  repCommSnap.docs.forEach(d => {
    console.log(JSON.stringify(d.data(), null, 2));
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
