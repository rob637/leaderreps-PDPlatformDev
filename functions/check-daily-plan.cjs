const admin = require('firebase-admin');
const testSA = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(testSA),
});

async function check() {
  const db = admin.firestore();
  
  // Check daily_plan_v1 for video-series items
  const planSnapshot = await db.collection('daily_plan_v1').get();
  
  console.log(`Daily plan has ${planSnapshot.size} days\n`);
  
  for (const doc of planSnapshot.docs) {
    const data = doc.data();
    const items = data.items || [];
    const videoItems = items.filter(i => i.type === 'video-series');
    
    if (videoItems.length > 0) {
      console.log(`=== Day ${doc.id} - found ${videoItems.length} video items ===`);
      videoItems.forEach((v, i) => {
        console.log(`  [${i}] id: ${v.id}`);
        console.log(`      title: ${v.title}`);
        console.log(`      type: ${v.type}`);
        console.log(`      videoSeriesId: ${v.videoSeriesId}`);
        console.log(`      sourceCollection: ${v.sourceCollection}`);
        if (v.videos) {
          console.log(`      embedded videos:`, v.videos?.length);
          v.videos?.slice(0,1).forEach(video => {
            console.log(`        - url: ${video.url?.substring(0,100)}...`);
            console.log(`        - videoUrl: ${video.videoUrl?.substring(0,100)}...`);
          });
        }
      });
      console.log('');
    }
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
