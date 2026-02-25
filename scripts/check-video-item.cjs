const admin = require('firebase-admin');
const path = require('path');
const sa = require(path.join(__dirname, '..', 'leaderreps-test-firebase-adminsdk.json'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function check() {
  // Check onboarding-config for video items
  const onb = await db.collection('daily_plan_v1').doc('onboarding-config').get();
  if (onb.exists) {
    const data = onb.data();
    console.log('=== ONBOARDING CONFIG ===');
    console.log(JSON.stringify(data, null, 2));
  }

  // Find all items with 'video' or 'watch' in title
  const snap = await db.collection('daily_plan_v1').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.items) {
      for (const item of data.items) {
        const title = (item.title || '').toLowerCase();
        if (title.includes('video') || title.includes('watch')) {
          console.log('\n=== Found video item ===');
          console.log('Day:', doc.id);
          console.log('Title:', item.title);
          console.log('Type:', item.type);
          console.log('ContentRef:', item.contentRef);
          console.log('MediaId:', item.mediaId);
          console.log('Handler:', item.handler);
        }
      }
    }
  }
  process.exit(0);
}
check();
