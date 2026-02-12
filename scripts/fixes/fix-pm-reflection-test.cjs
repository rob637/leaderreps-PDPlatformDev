// Fix PM Reflection visibility for all days in daily_plan_v1 - TEST ENVIRONMENT
// This ensures the PM Bookend shows on the dashboard for all days

const admin = require('firebase-admin');

// Use TEST credentials explicitly
const serviceAccount = require('./leaderreps-test-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

console.log('Connected to TEST environment');

const db = admin.firestore();

async function fix() {
  // Get all daily plan docs
  const planSnap = await db.collection('daily_plan_v1').get();
  
  if (planSnap.empty) {
    console.log('No daily_plan_v1 docs found');
    process.exit(1);
  }
  
  console.log(`Found ${planSnap.size} daily plan documents\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const doc of planSnap.docs) {
    const data = doc.data();
    const dayNumber = data.dayNumber;
    const dashboard = data.dashboard || {};
    
    // Check if PM Reflection is already enabled
    const pmEnabled = dashboard['pm-bookend'] === true;
    const pmHeaderEnabled = dashboard['pm-bookend-header'] === true;
    
    if (pmEnabled && pmHeaderEnabled) {
      console.log(`Day ${dayNumber}: Already has PM Reflection enabled`);
      skipped++;
      continue;
    }
    
    // Update dashboard to enable PM Reflection
    const updatedDashboard = {
      ...dashboard,
      'showPMReflection': true,
      'pm-bookend': true,
      'pm-bookend-header': true
    };
    
    await doc.ref.update({ dashboard: updatedDashboard });
    
    console.log(`Day ${dayNumber}: ✅ Enabled PM Reflection`);
    updated++;
  }
  
  console.log(`\n========================================`);
  console.log(`Updated: ${updated} days`);
  console.log(`Skipped: ${skipped} days (already enabled)`);
  console.log(`Total: ${planSnap.size} days`);
  console.log(`========================================`);
  
  process.exit(0);
}

fix().catch(console.error);
