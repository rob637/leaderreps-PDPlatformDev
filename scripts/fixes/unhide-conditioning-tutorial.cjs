/**
 * unhide-conditioning-tutorial.cjs
 * 
 * Re-enables the Conditioning Tutorial in session1-config
 * Run this when ready to show it again
 * 
 * Usage: 
 *   node scripts/fixes/unhide-conditioning-tutorial.cjs [prod|dev|test|all]
 *   Default: all environments
 */

const admin = require('firebase-admin');

async function unhideInEnv(envName, serviceAccountPath) {
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
      const { hidden, ...rest } = action;
      console.log(`[${envName}] Unhiding: ${action.label}`);
      return rest; // Remove hidden flag
    }
    return action;
  });
  
  await docRef.update({ actions: updatedActions });
  console.log(`[${envName}] ✓ Updated`);
}

async function main() {
  const env = process.argv[2] || 'all';
  
  const envConfigs = {
    prod: ['PROD', '../../leaderreps-prod-firebase-adminsdk.json'],
    dev: ['DEV', '../../leaderreps-pd-platform-firebase-adminsdk.json'],
    test: ['TEST', '../../leaderreps-test-firebase-adminsdk.json']
  };
  
  if (env === 'all') {
    for (const [name, path] of Object.values(envConfigs)) {
      await unhideInEnv(name, path);
    }
  } else if (envConfigs[env]) {
    const [name, path] = envConfigs[env];
    await unhideInEnv(name, path);
  } else {
    console.error('Usage: node unhide-conditioning-tutorial.cjs [prod|dev|test|all]');
    process.exit(1);
  }
  
  console.log('\n✓ Conditioning Tutorial re-enabled!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
