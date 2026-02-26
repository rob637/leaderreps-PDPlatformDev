const admin = require('firebase-admin');
const devSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(devSA) });
}

async function check() {
  const db = admin.firestore();
  
  // Check video_series
  const seriesSnap = await db.collection('video_series').get();
  console.log('=== DEV video_series ===');
  seriesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Title: ${data.title}`);
    console.log(`Videos: ${data.videos?.length || 0}`);
    if (data.videos?.length > 0) {
      console.log(`First video URL: ${data.videos[0].videoUrl?.substring(0, 100)}...`);
    }
  });
  
  // Check onboarding-config action
  const configDoc = await db.collection('daily_plan_v1').doc('onboarding-config').get();
  if (configDoc.exists) {
    const actions = configDoc.data().actions || [];
    const videoAction = actions.find(a => a.resourceType === 'video_series');
    console.log('\n=== DEV onboarding-config video action ===');
    console.log(JSON.stringify(videoAction, null, 2));
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
