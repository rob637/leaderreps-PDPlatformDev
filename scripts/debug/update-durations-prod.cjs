const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-prod'
});

const db = admin.firestore();

const durationMap = {
  'Leader Profile': 5,
  'Leadership Skills Baseline': 10,
  'Onboarding Guide': 3,
  'Onboarding Videos': 14,
  'Foundation Expectations': 2,
  'Watch Session 1 Guide': 15,
  'Setup Notifications': 2,
  'Conditioning Tutorial': 5,
};

async function run() {
  console.log('=== UPDATING DURATIONS IN PROD ===\n');
  const snap = await db.collection('daily_plan_v1').get();
  
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.actions || data.actions.length === 0) continue;
    
    let updated = false;
    const newActions = data.actions.map(a => {
      for (const [key, duration] of Object.entries(durationMap)) {
        if (a.label?.includes(key)) {
          if (!a.duration) {
            updated = true;
            console.log(`  ${doc.id}: "${a.label}" → ${duration} min`);
            return { ...a, duration };
          }
        }
      }
      return a;
    });
    
    if (updated) {
      await db.collection('daily_plan_v1').doc(doc.id).update({ actions: newActions });
    }
  }
  console.log('\nDone!');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
