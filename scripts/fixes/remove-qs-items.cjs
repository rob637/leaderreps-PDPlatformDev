const admin = require('firebase-admin');

const ENVS = [
  { name: 'DEV', sa: '../../leaderreps-pd-platform-firebase-adminsdk.json', project: 'leaderreps-pd-platform' },
  { name: 'TEST', sa: '../../leaderreps-test-firebase-adminsdk.json', project: 'leaderreps-test' },
  { name: 'PROD', sa: '../../leaderreps-prod-firebase-adminsdk.json', project: 'leaderreps-prod' }
];

async function cleanEnv(env) {
  const app = admin.initializeApp({ credential: admin.credential.cert(require(env.sa)) }, env.name);
  const db = app.firestore();
  
  const toRemove = {
    'day-022': ['action-1765979859778', 'week2-workout-1'], // QS2 Video, Live QS2
    'day-029': ['action-1765979929554', 'action-1765979945924'], // QS3 Video, Live QS3
    'day-036': ['week4-content-0', 'week4-workout-0', 'week4-tool-0'] // Content 1, QS4 Video, Live QS4
  };
  
  console.log('\n' + env.name + ':');
  for (const [dayId, actionIds] of Object.entries(toRemove)) {
    const docRef = db.collection('daily_plan_v1').doc(dayId);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log('  ' + dayId + ': not found');
      continue;
    }
    const data = doc.data();
    const before = data.actions?.length || 0;
    const filtered = (data.actions || []).filter(a => !actionIds.includes(a.id));
    const removed = before - filtered.length;
    if (removed > 0) {
      await docRef.update({ actions: filtered });
      console.log('  ' + dayId + ': removed ' + removed + ' actions');
    } else {
      console.log('  ' + dayId + ': no matching actions found');
    }
  }
}

async function run() {
  console.log('=== REMOVING QS2-QS4 ITEMS FROM ALL ENVIRONMENTS ===');
  for (const env of ENVS) {
    await cleanEnv(env);
  }
  console.log('\nDone!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
