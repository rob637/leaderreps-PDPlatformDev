const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  // Get Session 2 config actions
  const s2Snap = await db.collection('daily_plan_v1').doc('session2-config').get();
  const s2Actions = s2Snap.data()?.actions || [];
  
  console.log('=== SESSION 2 CONFIG ACTIONS (5 expected) ===\n');
  s2Actions.forEach((a, i) => {
    console.log(`${i+1}. "${a.label}"`);
    console.log(`   id: ${a.id}`);
    console.log(`   type: ${a.type || 'none'}, handlerType: ${a.handlerType || 'none'}`);
    console.log(`   required: ${a.required}, optional: ${a.optional || false}`);
    console.log('');
  });
  
  // Get user's carryover
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315h@sagecg.com').get();
  const userId = usersSnap.docs[0].id;
  
  const carryoverSnap = await db.collection('users').doc(userId).collection('action_progress').doc('_carryover').get();
  
  console.log('\n=== USER CARRYOVER ===\n');
  if (!carryoverSnap.exists) {
    console.log('No carryover doc!');
  } else {
    const data = carryoverSnap.data();
    console.log('Current level:', data.currentLevel);
    console.log('Items:');
    (data.items || []).forEach((item, i) => {
      console.log(`  ${i+1}. "${item.label}" [${item.id}] ${item.completedAt ? '✓' : '○'}`);
      console.log(`      prepSection: ${item.prepSection}, handlerType: ${item.handlerType || 'none'}`);
    });
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
