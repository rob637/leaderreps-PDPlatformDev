/**
 * cleanup-legacy-prep-docs-dev.cjs
 * 
 * Same cleanup for DEV environment
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function cleanup() {
  console.log('=== Checking/Cleaning Legacy Prep Docs in DEV ===\n');
  
  const planSnap = await db.collection('daily_plan_v1').get();
  
  const legacyPrepDocs = [];
  
  for (const doc of planSnap.docs) {
    const data = doc.data();
    if (/^day-\d+$/.test(doc.id) && data.phase === 'pre-start') {
      legacyPrepDocs.push({
        id: doc.id,
        dayNumber: data.dayNumber,
        actionsCount: (data.actions || []).length,
        ref: doc.ref
      });
    }
  }
  
  if (legacyPrepDocs.length === 0) {
    console.log('No legacy prep documents found in DEV. Already clean!');
    process.exit(0);
    return;
  }
  
  console.log(`Found ${legacyPrepDocs.length} legacy prep document(s) to delete:\n`);
  legacyPrepDocs.forEach(d => {
    console.log(`  - ${d.id} (dayNumber: ${d.dayNumber}, actions: ${d.actionsCount})`);
  });
  
  console.log('\nDeleting...\n');
  
  for (const doc of legacyPrepDocs) {
    await doc.ref.delete();
    console.log(`  ✓ Deleted ${doc.id}`);
  }
  
  console.log('\n=== DEV Cleanup Complete ===');
  process.exit(0);
}

cleanup().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
