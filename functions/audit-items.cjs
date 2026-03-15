const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function main() {
  // Check prep phase config
  const prepRef = db.doc('daily_plan_v1/prep');
  const prepSnap = await prepRef.get();
  if (prepSnap.exists) {
    const data = prepSnap.data();
    console.log('=== PREP PHASE ===');
    console.log('Keys:', Object.keys(data));
    
    // Check onboarding
    const onboarding = data.onboarding || {};
    console.log('\nOnboarding actions:', (onboarding.actions || []).length);
    (onboarding.actions || []).forEach(a => {
      console.log('  - ' + (a.label || a.title || 'NO LABEL'));
      console.log('    type:', a.type || a.resourceType || 'MISSING');
      console.log('    desc:', a.description || a.resourceTitle || 'MISSING');
      console.log('    time:', a.estimatedMinutes || a.duration || 'MISSING');
    });
    
    // Check session prep sections
    const sessionPrep = data.sessionPrep || {};
    console.log('\nSession prep keys:', Object.keys(sessionPrep));
    Object.entries(sessionPrep).forEach(([sessionId, config]) => {
      console.log('\n' + sessionId + ' prep (' + (config.actions || []).length + ' actions):');
      (config.actions || []).forEach(a => {
        console.log('  - ' + (a.label || a.title || 'NO LABEL'));
        console.log('    type:', a.type || a.resourceType || 'MISSING');
        console.log('    desc:', a.description || a.resourceTitle || 'MISSING');
        console.log('    time:', a.estimatedMinutes || a.duration || 'MISSING');
      });
    });
  } else {
    console.log('No prep doc found');
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
