const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deleteQS3() {
  // Days 29-35 are week 3 - check all days with QS3 in weeklyCommunity or weeklyCoaching
  const daysToCheck = ['day-029', 'day-030', 'day-031', 'day-032', 'day-033', 'day-034', 'day-035'];
  
  for (const dayId of daysToCheck) {
    const docRef = db.collection('daily_plan_v1').doc(dayId);
    const doc = await docRef.get();
    
    if (!doc.exists) continue;
    
    const data = doc.data();
    const weeklyResources = data.weeklyResources || {};
    let updated = false;
    
    // Remove Live QS3 from weeklyCommunity
    if (weeklyResources.weeklyCommunity) {
      const filtered = weeklyResources.weeklyCommunity.filter(item => {
        const hasQS3 = item.communityItemLabel?.includes('QS3');
        if (hasQS3) console.log(`Removing from ${dayId}.weeklyCommunity:`, item.communityItemLabel);
        return !hasQS3;
      });
      if (filtered.length !== weeklyResources.weeklyCommunity.length) {
        weeklyResources.weeklyCommunity = filtered;
        updated = true;
      }
    }
    
    // Remove Live QS3 from weeklyCoaching 
    if (weeklyResources.weeklyCoaching) {
      const filtered = weeklyResources.weeklyCoaching.filter(item => {
        const hasQS3 = item.coachingItemLabel?.includes('QS3');
        if (hasQS3) console.log(`Removing from ${dayId}.weeklyCoaching:`, item.coachingItemLabel);
        return !hasQS3;
      });
      if (filtered.length !== weeklyResources.weeklyCoaching.length) {
        weeklyResources.weeklyCoaching = filtered;
        updated = true;
      }
    }
    
    if (updated) {
      await docRef.update({ weeklyResources });
      console.log(`Updated ${dayId}`);
    }
  }
  
  console.log('Done!');
}

deleteQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
