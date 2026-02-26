const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(testSA) });
}

async function check() {
  const db = admin.firestore();
  
  // Look at prep days
  const prepDays = ['prep-1', 'prep-2', 'prep-3', 'day-0', 'onboarding'];
  for (const day of prepDays) {
    const doc = await db.collection('daily_plan_v1').doc(day).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`\n=== ${day} ===`);
      console.log('Items:');
      (data.items || []).forEach((item, i) => {
        console.log(`  [${i}] type: ${item.type}, title: ${item.title}`);
        if (item.type === 'video') {
          console.log(`       videoUrl: ${item.videoUrl?.substring(0,80)}...`);
          console.log(`       url: ${item.url?.substring(0,80)}...`);
        }
        if (item.videoSeriesId) {
          console.log(`       videoSeriesId: ${item.videoSeriesId}`);
        }
        if (item.videos) {
          console.log(`       embedded videos: ${item.videos.length}`);
        }
      });
    }
  }
  
  // Also check what types exist in the first 5 docs
  console.log('\n\n=== Types across all days ===');
  const snapshot = await db.collection('daily_plan_v1').limit(10).get();
  const allTypes = new Set();
  snapshot.forEach(doc => {
    const items = doc.data().items || [];
    items.forEach(i => allTypes.add(i.type));
  });
  console.log('Types found:', [...allTypes].join(', '));
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
