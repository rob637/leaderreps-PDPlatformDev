const admin = require('firebase-admin');
const fs = require('fs');

async function updateEnv(envName, jsonPath) {
  console.log(`\n=== Updating ${envName} ===`);
  const app = admin.initializeApp({
    credential: admin.credential.cert(require(jsonPath))
  }, envName);
  
  const db = app.firestore();
  
  const snap = await db.collection('daily_plan_v1').get();
  for (const doc of snap.docs) {
    let data = doc.data();
    let updated = false;
    if (data.actions) {
      data.actions = data.actions.map(a => {
        if (a.id === 'action-s1-deliberate-practice') {
          console.log(`Updating Attend Session 1 in ${doc.id} from ${a.estimatedMinutes} to 120`);
          a.estimatedMinutes = 120;
          updated = true;
        }
        if (a.id === 'action-1773103039642') {
          console.log(`Updating Conditioning Tool demo in ${doc.id} from ${a.estimatedMinutes} to 8`);
          a.estimatedMinutes = 8;
          updated = true;
        }
        return a;
      });
      if (updated) {
        await db.collection('daily_plan_v1').doc(doc.id).update({ actions: data.actions });
        console.log(`Saved ${doc.id}`);
      }
    }
  }
}

async function main() {
  await updateEnv('dev', '/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');
  await updateEnv('test', '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');
  await updateEnv('prod', '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
  console.log('Done!');
  process.exit(0);
}

main();
