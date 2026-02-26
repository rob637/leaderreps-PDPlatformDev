const admin = require('firebase-admin');

async function hideInEnv(envName, serviceAccountPath) {
  if (admin.apps.length > 0) {
    await admin.app().delete();
  }
  
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  const docRef = db.collection('daily_plan_v1').doc('session1-config');
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log(`[${envName}] session1-config not found`);
    return;
  }
  
  const data = doc.data();
  const actions = data.actions || [];
  
  const updatedActions = actions.map(action => {
    const label = (action.label || '').toLowerCase();
    if (label.includes('conditioning tutorial')) {
      return { ...action, hidden: true };
    }
    return action;
  });
  
  await docRef.update({ actions: updatedActions });
  console.log(`[${envName}] Conditioning Tutorial hidden`);
}

async function main() {
  await hideInEnv('DEV', '../../leaderreps-pd-platform-firebase-adminsdk.json');
  await hideInEnv('TEST', '../../leaderreps-test-firebase-adminsdk.json');
  console.log('\nDone!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
