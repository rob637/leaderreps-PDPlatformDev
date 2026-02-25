const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findAndDeleteQS3() {
  // Search ALL days for Live QS3 in weeklyCoaching
  const snap = await db.collection('daily_plan_v1').get();
  
  for (const doc of snap.docs) {
    const data = doc.data();
    const wr = data.weeklyResources || {};
    let needsUpdate = false;
    
    // Check weeklyCoaching
    if (wr.weeklyCoaching && Array.isArray(wr.weeklyCoaching)) {
      const filtered = wr.weeklyCoaching.filter(item => {
        if (item.coachingItemLabel?.includes('QS3')) {
          console.log(`FOUND in ${doc.id} weeklyCoaching:`, JSON.stringify(item));
          return false; // Remove it
        }
        return true;
      });
      
      if (filtered.length !== wr.weeklyCoaching.length) {
        wr.weeklyCoaching = filtered;
        needsUpdate = true;
      }
    }
    
    // Check weeklyCommunity
    if (wr.weeklyCommunity && Array.isArray(wr.weeklyCommunity)) {
      const filtered = wr.weeklyCommunity.filter(item => {
        if (item.communityItemLabel?.includes('QS3')) {
          console.log(`FOUND in ${doc.id} weeklyCommunity:`, JSON.stringify(item));
          return false; // Remove it
        }
        return true;
      });
      
      if (filtered.length !== wr.weeklyCommunity.length) {
        wr.weeklyCommunity = filtered;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await doc.ref.update({ weeklyResources: wr });
      console.log(`Updated ${doc.id}`);
    }
  }
  
  console.log('Done!');
}

findAndDeleteQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
