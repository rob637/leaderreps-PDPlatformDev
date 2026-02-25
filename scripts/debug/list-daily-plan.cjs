const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-pd-platform'
});

const db = admin.firestore();

async function run() {
  const snap = await db.collection('daily_plan_v1').get();
  console.log('Document IDs:', snap.docs.map(d => d.id));
  
  for (const doc of snap.docs.slice(0, 3)) {
    console.log(`\n--- ${doc.id} ---`);
    const data = doc.data();
    console.log('dayNumber:', data.dayNumber);
    console.log('phase:', data.phase);
    console.log('actions count:', data.actions?.length || 0);
    if (data.actions?.length > 0) {
      console.log('First action:', JSON.stringify(data.actions[0]));
    }
  }
  process.exit(0);
}
run();
