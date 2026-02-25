const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-pd-platform'
});

const db = admin.firestore();

async function run() {
  console.log('=== DEV: ALL PREP-RELATED ACTIONS ===\n');
  
  const dailyPlan = await db.collection('daily_plan_v1').orderBy('dayNumber').get();
  
  for (const doc of dailyPlan.docs) {
    const data = doc.data();
    // Show first 5 days or prep phase
    if (data.dayNumber <= 5) {
      console.log(`\n📅 Day ${data.dayNumber} (${data.phase || 'no phase'}):`);
      
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach(a => {
          const durStr = a.duration ? `${a.duration} min` : 'NO DURATION';
          console.log(`   [${durStr}] ${a.label || a.title}`);
          console.log(`            type: ${a.type || 'unknown'}, interactive: ${a.isInteractive || false}`);
          if (a.handlerType) console.log(`            handlerType: ${a.handlerType}`);
        });
      } else {
        console.log('   (no actions)');
      }
    }
  }
  
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
