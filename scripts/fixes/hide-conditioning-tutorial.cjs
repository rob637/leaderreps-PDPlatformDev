const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-prod-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function hideConditioningTutorial() {
  console.log('Hiding Conditioning Tutorial from session1-config in PRODUCTION...\n');
  
  const docRef = db.collection('daily_plan_v1').doc('session1-config');
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log('ERROR: session1-config not found');
    process.exit(1);
  }
  
  const data = doc.data();
  const actions = data.actions || [];
  
  console.log('Current actions:');
  actions.forEach((a, i) => console.log(`  ${i}: ${a.label} (hidden: ${a.hidden || false})`));
  
  // Find and hide the conditioning tutorial
  const updatedActions = actions.map(action => {
    const label = (action.label || '').toLowerCase();
    if (label.includes('conditioning tutorial')) {
      console.log(`\n→ Marking as hidden: ${action.label}`);
      return { ...action, hidden: true };
    }
    return action;
  });
  
  await docRef.update({ actions: updatedActions });
  console.log('\n✓ Done! Conditioning Tutorial is now hidden.');
  process.exit(0);
}

hideConditioningTutorial().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
