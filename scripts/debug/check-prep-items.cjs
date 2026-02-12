const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  // Get all prep phase days
  const planSnap = await db.collection('daily_plan_v1').orderBy('dayNumber', 'asc').get();
  
  console.log('=== Prep Phase Days (phase = pre-start) ===');
  let prepItemCount = 0;
  
  for (const doc of planSnap.docs) {
    const data = doc.data();
    if (data.phase === 'pre-start' || data.phase?.id === 'pre-start') {
      console.log(`\nDay ${data.dayNumber} (id: ${data.id || doc.id}):`);
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach((action, idx) => {
          const req = action.required !== false && !action.optional ? 'REQUIRED' : 'optional';
          console.log(`  [${idx}] ${req}: ${action.label || 'No label'} (type: ${action.type || action.resourceType || 'unknown'})`);
          if (req === 'REQUIRED') prepItemCount++;
        });
      } else {
        console.log('  (no actions)');
      }
    }
  }
  
  console.log(`\n=== Total Required Prep Items: ${prepItemCount} ===`);
  
  process.exit(0);
}

check().catch(console.error);
