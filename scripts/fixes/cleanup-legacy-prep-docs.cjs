/**
 * cleanup-legacy-prep-docs.cjs
 * 
 * Removes legacy day-* documents from daily_plan_v1 that have phase: 'pre-start'
 * These are duplicates - we now use onboarding-config and session1-config instead.
 * 
 * The duplicate day-001 document is causing users to see "14 required items" instead of "9".
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-prod-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function cleanup() {
  console.log('=== Cleaning Up Legacy Prep Documents in PRODUCTION ===\n');
  
  const planSnap = await db.collection('daily_plan_v1').get();
  
  // Find legacy day-* documents with phase: 'pre-start'
  const legacyPrepDocs = [];
  
  for (const doc of planSnap.docs) {
    const data = doc.data();
    // Match day-001, day-002, etc. with phase 'pre-start'
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
    console.log('No legacy prep documents found. Nothing to clean up.');
    process.exit(0);
    return;
  }
  
  console.log(`Found ${legacyPrepDocs.length} legacy prep document(s) to delete:\n`);
  legacyPrepDocs.forEach(d => {
    console.log(`  - ${d.id} (dayNumber: ${d.dayNumber}, actions: ${d.actionsCount})`);
  });
  
  console.log('\nDeleting...\n');
  
  // Delete each document
  for (const doc of legacyPrepDocs) {
    await doc.ref.delete();
    console.log(`  ✓ Deleted ${doc.id}`);
  }
  
  console.log('\n=== Cleanup Complete ===');
  console.log('Users should now see the correct count of 9 required prep items.');
  
  process.exit(0);
}

cleanup().catch(e => {
  console.error('Error during cleanup:', e);
  process.exit(1);
});
