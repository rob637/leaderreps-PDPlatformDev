const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function main() {
  const uid = 'QUA65XyWmrWnMVmecG4yhIWMop52';
  
  // Check the modules path
  const devPlanPath = `modules/${uid}/development_plan/current`;
  const devPlanSnap = await db.doc(devPlanPath).get();
  
  console.log('=== Full Development Plan Document ===');
  console.log(JSON.stringify(devPlanSnap.data(), null, 2));
}

main().then(() => process.exit(0)).catch(console.error);
