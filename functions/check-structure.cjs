const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

// Clean up any existing app
try { admin.app().delete(); } catch {}

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  // List all docs in daily_plan_v1
  const snap = await db.collection('daily_plan_v1').get();
  console.log('Documents in daily_plan_v1:');
  snap.forEach(doc => console.log('  -', doc.id));
  
  // Check milestone-1 for example structure
  const m1 = await db.doc('daily_plan_v1/milestone-1').get();
  if (m1.exists) {
    console.log('\n=== MILESTONE-1 STRUCTURE ===');
    console.log('Keys:', Object.keys(m1.data()));
    const actions = m1.data().actions || [];
    console.log('Actions count:', actions.length);
    if (actions.length > 0) {
      console.log('\nFirst action full object:');
      console.log(JSON.stringify(actions[0], null, 2));
    }
  }
  
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
