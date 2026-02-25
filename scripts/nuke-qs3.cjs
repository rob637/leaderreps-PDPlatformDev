// Fresh script to delete all QS3 items

const admin = require('firebase-admin');

// Delete default app if it exists
admin.apps.forEach(app => app.delete());

const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function nukeQS3() {
  console.log('Scanning daily_plan_v1 for QS3...\n');
  
  const snap = await db.collection('daily_plan_v1').get();
  let foundCount = 0;
  
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const wr = data.weeklyResources || {};
    let updated = false;
    
    // Check weeklyCoaching
    if (wr.weeklyCoaching && Array.isArray(wr.weeklyCoaching)) {
      const origLen = wr.weeklyCoaching.length;
      wr.weeklyCoaching = wr.weeklyCoaching.filter(item => {
        if (item.coachingItemLabel && item.coachingItemLabel.includes('QS3')) {
          console.log(`FOUND & REMOVING from ${docSnap.id}/weeklyCoaching:`, item.coachingItemLabel);
          foundCount++;
          return false;
        }
        return true;
      });
      if (wr.weeklyCoaching.length !== origLen) updated = true;
    }
    
    // Check weeklyCommunity
    if (wr.weeklyCommunity && Array.isArray(wr.weeklyCommunity)) {
      const origLen = wr.weeklyCommunity.length;
      wr.weeklyCommunity = wr.weeklyCommunity.filter(item => {
        if (item.communityItemLabel && item.communityItemLabel.includes('QS3')) {
          console.log(`FOUND & REMOVING from ${docSnap.id}/weeklyCommunity:`, item.communityItemLabel);
          foundCount++;
          return false;
        }
        return true;
      });
      if (wr.weeklyCommunity.length !== origLen) updated = true;
    }
    
    if (updated) {
      await docSnap.ref.update({ weeklyResources: wr });
      console.log(`  -> Updated ${docSnap.id}`);
    }
  }
  
  console.log(`\nTotal QS3 items found and removed: ${foundCount}`);
  console.log('Done!');
}

nukeQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
