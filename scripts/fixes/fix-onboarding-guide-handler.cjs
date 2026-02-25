/**
 * Fix incorrect handlerType on "Download/print Onboarding Guide" action
 * The item should NOT have handlerType='leader-profile' - it should open a link, not a modal
 */

const admin = require('firebase-admin');
const path = require('path');

// Determine which environment to use based on command line arg
const env = process.argv[2] || 'dev';
let serviceAccountPath;
let projectName;

if (env === 'test') {
  serviceAccountPath = '../../leaderreps-test-firebase-adminsdk.json';
  projectName = 'leaderreps-test';
} else if (env === 'prod') {
  serviceAccountPath = '../../leaderreps-prod-firebase-adminsdk.json';
  projectName = 'leaderreps-prod';
} else {
  serviceAccountPath = '../../leaderreps-pd-platform-firebase-adminsdk.json';
  projectName = 'leaderreps-pd-platform';
}

console.log(`\n🔧 Fixing Onboarding Guide Handler Type`);
console.log(`   Environment: ${env.toUpperCase()}`);
console.log(`   Project: ${projectName}\n`);

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixOnboardingGuideHandler() {
  const docRef = db.collection('daily_plan_v1').doc('day-001');
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log('❌ day-001 not found!');
    return;
  }
  
  const data = doc.data();
  const actions = [...data.actions];
  
  console.log('Current actions in day-001:');
  actions.forEach((a, i) => {
    const handlerInfo = a.handlerType ? `handlerType: ${a.handlerType}` : 'no handlerType';
    console.log(`  ${i + 1}. ${a.label} (${handlerInfo})`);
  });
  
  let changed = false;
  
  // Find and fix Onboarding Guide if it has wrong handlerType
  const onboardingIdx = actions.findIndex(a => {
    const label = (a.label || '').toLowerCase();
    return label.includes('onboarding guide') || label.includes('review onboarding');
  });
  
  if (onboardingIdx >= 0) {
    const item = actions[onboardingIdx];
    console.log(`\n📋 Found Onboarding Guide at index ${onboardingIdx + 1}:`);
    console.log(`   Label: ${item.label}`);
    console.log(`   Current handlerType: ${item.handlerType || '(none)'}`);
    console.log(`   Current resourceId: ${item.resourceId || '(none)'}`);
    console.log(`   Current url: ${item.url || '(none)'}`);
    
    if (item.handlerType === 'leader-profile') {
      // Remove the incorrect handlerType
      delete actions[onboardingIdx].handlerType;
      console.log('\n✅ FIXED: Removed handlerType "leader-profile" from Onboarding Guide');
      changed = true;
    } else if (item.handlerType) {
      console.log(`\n⚠️  Onboarding Guide has handlerType="${item.handlerType}" - may need review`);
    } else {
      console.log('\n✅ Onboarding Guide has no handlerType (correct)');
    }
  } else {
    console.log('\n❓ Could not find Onboarding Guide item in day-001');
  }
  
  if (changed) {
    await docRef.update({ actions });
    console.log('\n📝 Updated day-001 in Firestore');
    
    console.log('\nUpdated actions:');
    actions.forEach((a, i) => {
      const handlerInfo = a.handlerType ? `handlerType: ${a.handlerType}` : 'no handlerType';
      console.log(`  ${i + 1}. ${a.label} (${handlerInfo})`);
    });
  } else {
    console.log('\n✅ No changes needed');
  }
}

fixOnboardingGuideHandler()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(e => { 
    console.error('Error:', e); 
    process.exit(1); 
  });
