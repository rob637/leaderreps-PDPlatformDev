const admin = require('firebase-admin');
const sa = require('../leaderreps-test-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function check() {
  // Check daily_plan_v1 for all pre-start days and their actions
  const snap = await db.collection('daily_plan_v1').where('phase', '==', 'pre-start').get();
  
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`\n=== ${doc.id} (day ${data.dayNumber}) ===`);
    if (data.actions) {
      data.actions.forEach((a, i) => {
        console.log(`  ${i}: id="${a.id}" label="${a.label}" type="${a.type}" handlerType="${a.handlerType || ''}" resourceType="${a.resourceType || ''}"`);
      });
    }
  });
  
  // Also check session1-config
  const s1 = await db.collection('daily_plan_v1').doc('session1-config').get();
  if (s1.exists) {
    const data = s1.data();
    console.log(`\n=== session1-config (day ${data.dayNumber}) ===`);
    if (data.actions) {
      data.actions.forEach((a, i) => {
        console.log(`  ${i}: id="${a.id}" label="${a.label}" type="${a.type}" resourceType="${a.resourceType || ''}" optional=${a.optional}`);
      });
    }
  }
  
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
