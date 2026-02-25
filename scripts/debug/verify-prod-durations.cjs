const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'leaderreps-prod' });
const db = admin.firestore();

async function run() {
  const day1 = await db.collection('daily_plan_v1').doc('day-001').get();
  if (day1.exists) {
    console.log('=== PROD day-001 actions ===');
    day1.data().actions.forEach(a => {
      console.log(`  "${a.label}": duration=${a.duration}, estimatedMinutes=${a.estimatedMinutes}`);
    });
  }
  process.exit(0);
}
run();
