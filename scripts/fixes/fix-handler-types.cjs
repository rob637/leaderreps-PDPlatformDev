/**
 * Fix missing handlerTypes on day-001 actions
 * Specifically: Leader Profile and Baseline Assessment
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixHandlerTypes() {
  const docRef = db.collection('daily_plan_v1').doc('day-001');
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log('day-001 not found!');
    return;
  }
  
  const data = doc.data();
  const actions = [...data.actions];
  
  console.log('Current actions:');
  actions.forEach((a, i) => console.log(`  ${i + 1}. ${a.label} (handlerType: ${a.handlerType || 'MISSING'})`));
  
  let changed = false;
  
  // Fix Leader Profile
  const leaderProfileIdx = actions.findIndex(a => 
    (a.label || '').toLowerCase().includes('leader profile')
  );
  if (leaderProfileIdx >= 0 && !actions[leaderProfileIdx].handlerType) {
    actions[leaderProfileIdx].handlerType = 'leader-profile';
    console.log('\n✅ Fixed: Leader Profile -> handlerType: leader-profile');
    changed = true;
  }
  
  // Fix Baseline Assessment
  const baselineIdx = actions.findIndex(a => 
    (a.label || '').toLowerCase().includes('baseline assessment')
  );
  if (baselineIdx >= 0 && !actions[baselineIdx].handlerType) {
    actions[baselineIdx].handlerType = 'baseline-assessment';
    console.log('✅ Fixed: Baseline Assessment -> handlerType: baseline-assessment');
    changed = true;
  }
  
  if (changed) {
    await docRef.update({ actions });
    console.log('\nUpdated day-001 with handlerTypes');
    
    console.log('\nNew actions:');
    actions.forEach((a, i) => console.log(`  ${i + 1}. ${a.label} (handlerType: ${a.handlerType || 'none'})`));
  } else {
    console.log('\nNo changes needed - all handlerTypes are set');
  }
}

fixHandlerTypes()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
