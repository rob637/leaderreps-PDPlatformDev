const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findQS3() {
  // Check day-029 specifically and all days for week 3
  const days = ['day-029', 'day-030', 'day-031', 'day-032', 'day-033', 'day-034', 'day-035'];
  
  for (const dayId of days) {
    const doc = await db.collection('daily_plan_v1').doc(dayId).get();
    if (!doc.exists) continue;
    
    const data = doc.data();
    const wr = data.weeklyResources || {};
    
    // Check weeklyCommunity for QS3
    if (wr.weeklyCommunity) {
      wr.weeklyCommunity.forEach(item => {
        if (item.communityItemLabel?.includes('QS3')) {
          console.log(`${dayId} - weeklyCommunity:`, JSON.stringify(item));
        }
      });
    }
    
    // Check weeklyCoaching for QS3
    if (wr.weeklyCoaching) {
      wr.weeklyCoaching.forEach(item => {
        if (item.coachingItemLabel?.includes('QS3')) {
          console.log(`${dayId} - weeklyCoaching:`, JSON.stringify(item));
        }
      });
    }
  }
  
  console.log('Done!');
}

findQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
