const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'leaderreps-prod' });
const db = admin.firestore();

async function run() {
  // Check the day-001 action for resourceId
  const day1 = await db.collection('daily_plan_v1').doc('day-001').get();
  const actions = day1.data().actions;
  
  console.log('=== DAY-001 ACTIONS WITH RESOURCE IDS ===\n');
  actions.forEach(a => {
    console.log(`${a.label}:`);
    console.log(`  resourceId: ${a.resourceId}`);
    console.log(`  type: ${a.type}`);
    console.log(`  handlerType: ${a.handlerType}`);
    console.log('');
  });
  
  process.exit(0);
}
run();
