const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function find() {
  // Check day-001 prep actions
  const day001 = await db.collection('daily_action_plans').doc('day-001').get();
  const actions = day001.data()?.actions || [];
  console.log('day-001 actions with "profile":');
  actions.forEach((a, i) => {
    if ((a.label || '').toLowerCase().includes('profile')) {
      console.log(`  ${i}: ${a.label} [${a.id || a.resourceId}] handler: ${a.handlerType || 'none'}`);
    }
  });
  
  // Check unified-content for profile items
  const contentSnap = await db.collection('unified-content').get();
  console.log('\nunified-content items with "profile":');
  contentSnap.forEach(doc => {
    const data = doc.data();
    if ((data.title || '').toLowerCase().includes('profile') || (data.label || '').toLowerCase().includes('profile')) {
      console.log(`  ${doc.id}: ${data.title || data.label} type: ${data.type}`);
    }
  });
}

find().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
