const admin = require('firebase-admin');
const path = require('path');

async function checkEnv(name, serviceAccountPath, projectId) {
  const app = admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(serviceAccountPath))),
    projectId
  }, name);
  
  const db = app.firestore();
  
  const collections = ['cohorts', 'facilitators', 'development_plan_v1', 'unified-content', 'users'];
  const counts = {};
  
  for (const coll of collections) {
    const snap = await db.collection(coll).get();
    counts[coll] = snap.size;
  }
  
  console.log(`\n${name.toUpperCase()} (${projectId}):`);
  for (const [coll, count] of Object.entries(counts)) {
    console.log(`  ${coll}: ${count}`);
  }
  
  return counts;
}

async function main() {
  console.log('Checking data sync across environments...');
  
  await checkEnv('dev', './leaderreps-pd-platform-firebase-adminsdk.json', 'leaderreps-pd-platform');
  await checkEnv('test', './leaderreps-test-firebase-adminsdk.json', 'leaderreps-test');
  await checkEnv('prod', './leaderreps-prod-firebase-adminsdk.json', 'leaderreps-prod');
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
