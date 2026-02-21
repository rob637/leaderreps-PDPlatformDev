/**
 * Add Conditioning Tutorial action to day-001 in daily_plan_v1
 * This adds the Conditioning App Tutorial as a prep item (after Foundation Video Series, before Foundation Expectations)
 * 
 * Usage: node scripts/migrations/add-conditioning-tutorial.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addConditioningTutorial() {
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
  
  // Check if conditioning tutorial already exists
  const hasConditioningTutorial = actions.some(a => 
    (a.label || '').toLowerCase().includes('conditioning tutorial') ||
    a.handlerType === 'conditioning-tutorial'
  );
  
  if (hasConditioningTutorial) {
    console.log('\nConditioning tutorial already exists in day-001');
    return;
  }
  
  // Add conditioning tutorial action after Foundation Video Series (index 3) and before Foundation Expectations (last)
  const newAction = {
    id: 'prep-conditioning-tutorial',
    label: 'Conditioning App Tutorial',
    type: 'onboarding',
    handlerType: 'conditioning-tutorial',
    required: true,
    optional: false,
    description: 'Learn how the conditioning (Real Reps) system works',
    estimatedMinutes: 5
  };
  
  // Find the index of Foundation Video Series and insert after it
  const videoSeriesIndex = actions.findIndex(a => 
    a.type === 'content' || (a.label || '').toLowerCase().includes('video series')
  );
  
  // Find index of Foundation Expectations (if exists)
  const foundationExpectationsIndex = actions.findIndex(a =>
    a.handlerType === 'foundation-commitment' || (a.label || '').toLowerCase().includes('foundation expectations')
  );
  
  let updatedActions;
  if (foundationExpectationsIndex >= 0) {
    // Insert before Foundation Expectations
    updatedActions = [
      ...actions.slice(0, foundationExpectationsIndex),
      newAction,
      ...actions.slice(foundationExpectationsIndex)
    ];
  } else if (videoSeriesIndex >= 0) {
    // Insert after video series
    updatedActions = [
      ...actions.slice(0, videoSeriesIndex + 1),
      newAction,
      ...actions.slice(videoSeriesIndex + 1)
    ];
  } else {
    // Just add to end
    updatedActions = [...actions, newAction];
  }
  
  await docRef.update({ actions: updatedActions });
  
  console.log('\n✅ Added conditioning tutorial to day-001');
  console.log('\nUpdated actions:');
  updatedActions.forEach((a, i) => console.log(`  ${i + 1}. ${a.label} (${a.handlerType || a.type})`));
}

addConditioningTutorial()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch(e => { 
    console.error('Error:', e); 
    process.exit(1); 
  });
