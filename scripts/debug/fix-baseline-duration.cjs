const admin = require('firebase-admin');

async function fixEnv(name, serviceAccountPath, projectId) {
  // Reset for each environment
  if (admin.apps.length) {
    await Promise.all(admin.apps.map(app => app.delete()));
  }
  
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId
  });
  
  const db = admin.firestore();
  const docRef = db.collection('daily_plan_v1').doc('day-001');
  const doc = await docRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    const newActions = data.actions.map(a => {
      if (a.label?.includes('Baseline Assessment')) {
        console.log(`  ${name}: Fixing Baseline Assessment: ${a.duration} → 8 min`);
        return { ...a, duration: 8 };
      }
      return a;
    });
    await docRef.update({ actions: newActions });
  }
}

async function run() {
  console.log('=== FIXING BASELINE ASSESSMENT DURATION ===\n');
  
  await fixEnv('DEV', '/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json', 'leaderreps-pd-platform');
  await fixEnv('TEST', '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json', 'leaderreps-test');
  await fixEnv('PROD', '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'leaderreps-prod');
  
  console.log('\nDone!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
