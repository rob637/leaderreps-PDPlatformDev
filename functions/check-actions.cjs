const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  
  // Check all actions across daily_plan_v1 for video_series
  const snapshot = await db.collection('daily_plan_v1').get();
  
  let found = [];
  snapshot.forEach(d => {
    const actions = d.data().actions || [];
    actions.forEach(action => {
      if (action.resourceType === 'video_series' || action.label?.toLowerCase().includes('onboarding')) {
        found.push({
          dayId: d.id,
          actionId: action.id,
          label: action.label,
          resourceType: action.resourceType,
          resourceId: action.resourceId,
          url: action.url
        });
      }
    });
  });
  
  console.log('Video series or onboarding actions:');
  console.log(JSON.stringify(found, null, 2));
  
  // Also check the onboarding-config document
  const onboardingConfig = await db.collection('daily_plan_v1').doc('onboarding-config').get();
  if (onboardingConfig.exists) {
    console.log('\n\n=== onboarding-config ===');
    console.log(JSON.stringify(onboardingConfig.data(), null, 2));
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
