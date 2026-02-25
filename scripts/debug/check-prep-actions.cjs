const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-pd-platform'
});

const db = admin.firestore();

async function run() {
  console.log('=== DEV: PREP PHASE ACTIONS ===\n');
  
  // Get all prep phase days
  const dailyPlan = await db.collection('daily_plan_v1').get();
  
  for (const doc of dailyPlan.docs) {
    const data = doc.data();
    // Only show prep phase or days with prep actions
    if (data.phase === 'Preparation' || data.dayNumber < 1) {
      console.log(`\n📅 Day ${data.dayNumber} (${data.phase || 'unknown'}):`);
      
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach(a => {
          console.log(`   - ${a.label || a.title}`);
          console.log(`     type: ${a.type}, duration: ${a.duration || 'NOT SET'}`);
          if (a.isInteractive) console.log(`     isInteractive: true, handlerType: ${a.handlerType}`);
          if (a.config) console.log(`     config: ${a.config}`);
        });
      }
    }
  }
  
  // Also check "explore-config" items
  console.log('\n=== EXPLORE CONFIG ITEMS ===');
  for (const doc of dailyPlan.docs) {
    const data = doc.data();
    if (data.actions) {
      const exploreItems = data.actions.filter(a => a.config === 'explore-config');
      if (exploreItems.length > 0) {
        console.log(`\nDay ${data.dayNumber}:`);
        exploreItems.forEach(a => {
          console.log(`   - ${a.label || a.title}`);
          console.log(`     duration: ${a.duration || 'NOT SET'}`);
        });
      }
    }
  }
  
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
