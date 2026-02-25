/**
 * Fix all prep item handlerTypes in day-001
 * - Download/print Onboarding Guide: should have NO handlerType (opens resource)
 * - Complete Leader Profile: should have handlerType='leader-profile'
 * - Complete Leadership Skills Baseline: should have handlerType='baseline-assessment'
 * - Accept Foundation Expectations: should have handlerType='foundation-commitment'
 */

const admin = require('firebase-admin');

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

console.log(`\n🔧 Fixing All Prep Item Handler Types`);
console.log(`   Environment: ${env.toUpperCase()}`);
console.log(`   Project: ${projectName}\n`);

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Define the rules for each prep action
const handlerRules = [
  { 
    match: label => label.includes('onboarding guide') || label.includes('review onboarding'),
    expectedHandler: null, // Should NOT have a handler - opens resource
    name: 'Onboarding Guide'
  },
  { 
    match: label => label.includes('leader profile') && !label.includes('onboarding'),
    expectedHandler: 'leader-profile',
    name: 'Leader Profile'
  },
  { 
    match: label => label.includes('baseline assessment'),
    expectedHandler: 'baseline-assessment',
    name: 'Leadership Skills Baseline'
  },
  { 
    match: label => label.includes('foundation') && (label.includes('expectations') || label.includes('commitment')),
    expectedHandler: 'foundation-commitment',
    name: 'Foundation Commitment'
  },
  { 
    match: label => label.includes('notification'),
    expectedHandler: 'notification-setup',
    name: 'Notification Setup'
  },
  { 
    match: label => label.includes('conditioning tutorial'),
    expectedHandler: 'conditioning-tutorial',
    name: 'Conditioning Tutorial'
  }
];

async function fixAllHandlerTypes() {
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
  
  let changes = [];
  
  // Check each action against the rules
  actions.forEach((action, idx) => {
    const labelLower = (action.label || '').toLowerCase();
    
    for (const rule of handlerRules) {
      if (rule.match(labelLower)) {
        const currentHandler = action.handlerType;
        const expectedHandler = rule.expectedHandler;
        
        if (expectedHandler === null) {
          // Should NOT have a handler
          if (currentHandler) {
            delete actions[idx].handlerType;
            changes.push(`${rule.name}: removed handlerType "${currentHandler}"`);
          }
        } else {
          // Should have a specific handler
          if (currentHandler !== expectedHandler) {
            actions[idx].handlerType = expectedHandler;
            changes.push(`${rule.name}: set handlerType to "${expectedHandler}" (was: ${currentHandler || 'none'})`);
          }
        }
        break; // First rule match wins
      }
    }
  });
  
  if (changes.length > 0) {
    console.log('\n📝 Changes made:');
    changes.forEach(c => console.log(`  ✅ ${c}`));
    
    await docRef.update({ actions });
    console.log('\n📝 Updated day-001 in Firestore');
    
    console.log('\nUpdated actions:');
    actions.forEach((a, i) => {
      const handlerInfo = a.handlerType ? `handlerType: ${a.handlerType}` : 'no handlerType';
      console.log(`  ${i + 1}. ${a.label} (${handlerInfo})`);
    });
  } else {
    console.log('\n✅ All handler types are correct - no changes needed');
  }
}

fixAllHandlerTypes()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(e => { 
    console.error('Error:', e); 
    process.exit(1); 
  });
