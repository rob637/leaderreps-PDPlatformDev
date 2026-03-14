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
  
  console.log('=== BRITT\'S REP DRAFTS ===');
  const draftsSnap = await db.collection('users').doc(brittId).collection('rep_drafts').get();
  console.log(`Total drafts: ${draftsSnap.size}`);
  console.log('');
  
  draftsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`Draft ID: ${d.id}`);
    console.log(`  Person: ${data.person}`);
    console.log(`  Rep Type: ${data.repType}`);
    console.log(`  Context: ${data.context?.substring(0, 100)}...`);
    console.log(`  Status: ${data.status || 'draft'}`);
    console.log(`  Created: ${data.createdAt?.toDate?.()?.toISOString() || 'N/A'}`);
    console.log(`  Updated: ${data.updatedAt?.toDate?.()?.toISOString() || 'N/A'}`);
    console.log('');
  });
  
  // Also check daily_practice
  console.log('=== BRITT\'S DAILY PRACTICE ===');
  const practiceSnap = await db.collection('users').doc(brittId).collection('daily_practice').get();
  practiceSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`Daily Practice: ${d.id}`);
    console.log(JSON.stringify(data, null, 2));
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
