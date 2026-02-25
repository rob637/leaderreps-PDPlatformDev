const admin = require('firebase-admin');
admin.apps.forEach(app => app.delete());

const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function dumpDailyPlan() {
  const snap = await db.collection('daily_plan_v1').get();
  
  // Look specifically for Live QS3 in any field
  console.log('Searching for "Live QS3" in all fields...\n');
  
  snap.forEach(doc => {
    const dataStr = JSON.stringify(doc.data());
    
    // Check for the exact string "Live QS3"
    if (dataStr.includes('Live QS3')) {
      console.log(`\n=== ${doc.id} has "Live QS3" ===`);
      
      // Find where it is
      const data = doc.data();
      
      // Check actions
      if (data.actions) {
        data.actions.forEach((a, i) => {
          if (JSON.stringify(a).includes('Live QS3')) {
            console.log(`  actions[${i}]:`, JSON.stringify(a).slice(0, 300));
          }
        });
      }
      
      // Check weeklyResources
      if (data.weeklyResources) {
        const wr = data.weeklyResources;
        if (JSON.stringify(wr.weeklyCoaching).includes('Live QS3')) {
          console.log('  weeklyResources.weeklyCoaching:', JSON.stringify(wr.weeklyCoaching));
        }
        if (JSON.stringify(wr.weeklyCommunity).includes('Live QS3')) {
          console.log('  weeklyResources.weeklyCommunity:', JSON.stringify(wr.weeklyCommunity));
        }
      }
      
      // Check coaching
      if (data.coaching) {
        data.coaching.forEach((c, i) => {
          if (JSON.stringify(c).includes('Live QS3')) {
            console.log(`  coaching[${i}]:`, JSON.stringify(c));
          }
        });
      }
    }
  });
  
  console.log('\nDone!');
}

dumpDailyPlan().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
