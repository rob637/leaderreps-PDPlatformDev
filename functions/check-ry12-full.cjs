const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('../leaderreps-test-firebase-adminsdk.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-test'
  });
}
const db = admin.firestore();

async function check() {
  const userId = '6IHcajHJVIXfwVZKFZAkCce5zxH3';
  
  // Check all docs in modules subcollection
  console.log('=== ALL USER MODULE DOCS ===');
  const modulesSnap = await db.collection(`users/${userId}/modules`).listDocuments();
  for (const docRef of modulesSnap) {
    console.log('Module:', docRef.id);
    const subDocs = await docRef.listCollections();
    for (const col of subDocs) {
      const docs = await col.listDocuments();
      for (const d of docs) {
        console.log(`  - ${col.id}/${d.id}`);
      }
    }
  }
  
  // Check daily_practice
  console.log('\n=== DAILY PRACTICE ===');
  const dpRef = db.doc(`users/${userId}/modules/daily_practice/documents/current`);
  const dpSnap = await dpRef.get();
  if (dpSnap.exists) {
    const data = dpSnap.data();
    console.log('Keys:', Object.keys(data));
    console.log('activeCommitments:', data.activeCommitments?.length || 0);
    if (data.activeCommitments) {
      data.activeCommitments.forEach(c => {
        console.log(`  - ${c.id}: ${c.status}`);
      });
    }
  } else {
    console.log('No daily_practice found');
  }
  
  // Check user doc for leaderProfile
  console.log('\n=== USER DOC (leaderProfile) ===');
  const userSnap = await db.doc(`users/${userId}`).get();
  const userData = userSnap.data();
  console.log('Has leaderProfile:', !!userData.leaderProfile);
  console.log('leaderProfile.completedAt:', userData.leaderProfile?.completedAt?.toDate?.() || 'none');
  console.log('Has baselineAssessment:', !!userData.baselineAssessment);
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
