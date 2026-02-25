const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-pd-platform'
});

const db = admin.firestore();

// Duration and handlerType mapping by label
const actionConfig = {
  // Day 1 required prep actions
  'Download/print Onboarding Guide': { duration: 3, handlerType: null }, // static content
  'Watch Onboarding Videos': { duration: 14, handlerType: null }, // video content
  'Complete Leader Profile': { duration: 5, handlerType: 'leader-profile', isInteractive: true },
  'Complete Baseline Assessment': { duration: 10, handlerType: 'baseline-assessment', isInteractive: true },
  'Accept Foundation Expectations': { duration: 2, handlerType: 'foundation-commitment', isInteractive: true },
  
  // Day 0 explore/optional actions
  'Watch Session 1 Guide': { duration: 15, handlerType: null },
  'Setup Notifications': { duration: 2, handlerType: 'notification-setup', isInteractive: true },
  'Follow Conditioning Tutorial': { duration: 5, handlerType: 'conditioning-tutorial', isInteractive: true },
};

async function run() {
  console.log('=== UPDATING PREP ACTION DURATIONS IN DEV ===\n');
  
  // Update Day 0
  const day0Ref = db.collection('daily_plan_v1').doc('day_0');
  const day0Doc = await day0Ref.get();
  
  if (day0Doc.exists) {
    const data = day0Doc.data();
    let updated = false;
    const newActions = data.actions.map(a => {
      const config = actionConfig[a.label];
      if (config) {
        updated = true;
        const result = { ...a, duration: config.duration };
        if (config.handlerType) result.handlerType = config.handlerType;
        if (config.isInteractive) result.isInteractive = config.isInteractive;
        console.log(`  Day 0: ${a.label} → ${config.duration} min`);
        return result;
      }
      return a;
    });
    
    if (updated) {
      await day0Ref.update({ actions: newActions });
      console.log('  ✓ Day 0 updated\n');
    }
  }
  
  // Update Day 1
  const day1Ref = db.collection('daily_plan_v1').doc('day_1');
  const day1Doc = await day1Ref.get();
  
  if (day1Doc.exists) {
    const data = day1Doc.data();
    let updated = false;
    const newActions = data.actions.map(a => {
      const config = actionConfig[a.label];
      if (config) {
        updated = true;
        const result = { ...a, duration: config.duration };
        if (config.handlerType) {
          result.handlerType = config.handlerType;
        } else {
          // Remove incorrect handlerType if present
          delete result.handlerType;
        }
        if (config.isInteractive) {
          result.isInteractive = config.isInteractive;
        }
        console.log(`  Day 1: ${a.label} → ${config.duration} min${config.handlerType ? ` (${config.handlerType})` : ''}`);
        return result;
      }
      return a;
    });
    
    if (updated) {
      await day1Ref.update({ actions: newActions });
      console.log('  ✓ Day 1 updated\n');
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
