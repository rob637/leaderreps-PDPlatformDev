/**
 * Add Foundation Commitment action to day-001 in daily_plan_v1
 * This adds the Foundation Expectations acknowledgment as the last prep item
 * 
 * Usage: node scripts/migrations/add-foundation-commitment.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addFoundationCommitment() {
  // Get day-001 document
  const docRef = db.collection('daily_plan_v1').doc('day-001');
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log('day-001 not found!');
    return;
  }
  
  const data = doc.data();
  const actions = data.actions || [];
  
  console.log('Current actions:');
  actions.forEach((a, i) => console.log(`  ${i + 1}. ${a.label} (${a.handlerType || a.type})`));
  
  // Check if foundation commitment already exists
  const hasFoundationCommitment = actions.some(a => 
    (a.label || '').toLowerCase().includes('foundation commitment') ||
    (a.label || '').toLowerCase().includes('foundation expectations') ||
    a.handlerType === 'foundation-commitment'
  );
  
  if (hasFoundationCommitment) {
    console.log('\nFoundation commitment already exists in day-001');
    return;
  }
  
  // Add foundation commitment action at the end (after video series)
  const newAction = {
    id: 'prep-foundation-commitment',
    label: 'Foundation Expectations',
    type: 'onboarding',
    handlerType: 'foundation-commitment',
    required: true,
    optional: false,
    description: 'Review and acknowledge the Foundation program expectations',
    estimatedMinutes: 2
  };
  
  // Add to end of actions list
  const updatedActions = [...actions, newAction];
  
  await docRef.update({ actions: updatedActions });
  
  console.log('\n✅ Added foundation commitment to day-001');
  console.log('\nUpdated actions:');
  updatedActions.forEach((a, i) => console.log(`  ${i + 1}. ${a.label} (${a.handlerType || a.type})`));
}

addFoundationCommitment()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch(e => { 
    console.error('Error:', e); 
    process.exit(1); 
  });
