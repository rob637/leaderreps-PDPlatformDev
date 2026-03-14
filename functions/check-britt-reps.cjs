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
  
  console.log('=== BRITT CONDITIONING REPS (full detail) ===');
  const repsSnap = await db.collection('users').doc(brittId).collection('conditioning_reps').get();
  console.log(`Total: ${repsSnap.size}`);
  
  repsSnap.docs.forEach(d => {
    console.log(`\nRep ID: ${d.id}`);
    console.log(JSON.stringify(d.data(), null, 2));
  });
  
  console.log('\n=== REP DRAFTS ===');
  const draftsSnap = await db.collection('users').doc(brittId).collection('rep_drafts').get();
  console.log(`Total: ${draftsSnap.size}`);
  draftsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`\nDraft: ${d.id}`);
    console.log(`  repType: ${data.repType}`);
    console.log(`  person: ${data.formData?.person || 'empty'}`);
    console.log(`  step: ${data.currentStep}`);
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
