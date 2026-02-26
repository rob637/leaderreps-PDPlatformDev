const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  const uid = 'UIEBLtWIB5U4pbpiH5N8G5OW28v2'; // rob+224l@sagecg.com
  
  // Check current dev plan startDate
  const devPlanRef = db.doc(`modules/${uid}/development_plan/current`);
  const devPlanSnap = await devPlanRef.get();
  
  if (devPlanSnap.exists) {
    const data = devPlanSnap.data();
    console.log('Current startDate:', data.startDate);
    
    // Remove the startDate so it uses cohort
    await devPlanRef.update({
      startDate: admin.firestore.FieldValue.delete()
    });
    console.log('✅ Removed startDate from dev plan');
  } else {
    console.log('No dev plan document found');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
