const admin = require('firebase-admin');
const sa = require('../../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();

async function main() {
  // Day 18 = Foundation Day 4 (prep is days 1-14, so day 15 = foundation day 1)
  const snap = await db.collection('daily_plan_v1').doc('day-018').get();
  
  if (!snap.exists) {
    console.log('day-018 not found');
    return;
  }
  
  const data = snap.data();
  console.log('Title:', data.title);
  console.log('Week:', data.weekNumber);
  console.log('Focus:', data.focus);
  console.log('Theme:', data.theme);
  console.log('\nActions:');
  (data.actions || []).forEach(a => console.log('  -', a.label || a.title || a.id));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
