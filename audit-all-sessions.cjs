const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function audit() {
  const configs = [
    'onboarding-config', 
    'session1-config', 'session2-config', 'session3-config', 
    'session4-config', 'session5-config'
  ];
  
  console.log('=== ALL INTERACTIVE ITEMS ACROSS ALL SESSIONS ===\n');
  
  for (const configId of configs) {
    const snap = await db.collection('daily_plan_v1').doc(configId).get();
    if (!snap.exists) continue;
    
    const actions = snap.data()?.actions || [];
    const interactives = actions.filter(a => 
      a.resourceId?.startsWith('interactive-') || 
      a.handlerType ||
      a.type === 'interactive'
    );
    
    if (interactives.length > 0) {
      console.log(`\n${configId}:`);
      interactives.forEach(a => {
        console.log(`  ID: ${a.id}`);
        console.log(`  Label: "${a.label}"`);
        console.log(`  resourceId: ${a.resourceId || 'none'}`);
        console.log(`  handlerType: ${a.handlerType || 'none'}`);
        console.log('');
      });
    }
  }
}

audit().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
