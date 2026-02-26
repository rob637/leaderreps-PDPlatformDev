const admin = require('firebase-admin');
const sa = require('../leaderreps-test-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function fix() {
  // Fix day-001: "Download/print" → "Download/Print" 
  const dayRef = db.collection('daily_plan_v1').doc('day-001');
  const dayDoc = await dayRef.get();
  const data = dayDoc.data();
  
  if (data.actions) {
    const updatedActions = data.actions.map(a => {
      if (a.label === 'Download/print Onboarding Guide') {
        console.log('Fixing label: "Download/print Onboarding Guide" → "Download/Print Onboarding Guide"');
        return { ...a, label: 'Download/Print Onboarding Guide' };
      }
      return a;
    });
    await dayRef.update({ actions: updatedActions });
    console.log('✅ day-001 label fixed');
  }
  
  process.exit(0);
}
fix().catch(e => { console.error(e); process.exit(1); });
