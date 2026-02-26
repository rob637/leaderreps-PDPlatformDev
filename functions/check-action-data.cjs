const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  const doc = await db.collection('daily_plan_v1').doc('onboarding-config').get();
  
  if (doc.exists) {
    const actions = doc.data().actions || [];
    const videoAction = actions.find(a => a.resourceType === 'video_series');
    console.log('Video series action from Firestore:');
    console.log(JSON.stringify(videoAction, null, 2));
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
