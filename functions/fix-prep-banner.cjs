const admin = require('firebase-admin');
const sa = require('../leaderreps-test-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function fix() {
  // Get all pre-start days from daily_plan_v1
  const snapshot = await db.collection('daily_plan_v1').get();
  let updated = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Check if this is a pre-start day (dayNumber 1-14) or has phase='pre-start'
    const isPreStart = data.phase === 'pre-start' || (data.dayNumber >= 1 && data.dayNumber <= 14);
    
    if (data.dashboard && data.dashboard['prep-welcome-banner'] === false) {
      console.log(`Fixing ${doc.id} (day ${data.dayNumber}, phase: ${data.phase}): prep-welcome-banner false → true`);
      await doc.ref.update({ 'dashboard.prep-welcome-banner': true });
      updated++;
    }
  }
  
  console.log(`\n✅ Updated ${updated} documents`);
  process.exit(0);
}
fix().catch(e => { console.error(e); process.exit(1); });
