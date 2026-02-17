const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkModulesDevPlan() {
  const uid = 'QUA65XyWmrWnMVmecG4yhIWMop52';
  
  // Check the correct path: modules/{userId}/development_plan/current
  const devPlanPath = `modules/${uid}/development_plan/current`;
  console.log(`Checking: ${devPlanPath}`);
  
  const devPlanRef = db.doc(devPlanPath);
  const devPlanSnap = await devPlanRef.get();
  
  if (!devPlanSnap.exists) {
    console.log('Development plan NOT FOUND at this path!');
  } else {
    const devPlan = devPlanSnap.data();
    console.log('\n=== Development Plan ===');
    console.log('cohortId:', devPlan.cohortId);
    console.log('currentDay:', devPlan.currentDay);
    console.log('programDay:', devPlan.programDay);
    console.log('currentPhaseId:', devPlan.currentPhaseId);
    console.log('currentWeek:', devPlan.currentWeek);
    
    // Get current day data
    const currentDayIndex = devPlan.currentDay || devPlan.programDay || 1;
    const dailyPlan = devPlan.dailyPlan || [];
    console.log('\ndailyPlan array length:', dailyPlan.length);
    
    const currentDayData = dailyPlan.find(d => d.dayNumber == currentDayIndex);
    
    console.log('\n=== Current Day Data (Day', currentDayIndex, ') ===');
    if (currentDayData) {
      console.log('Phase:', currentDayData.phase?.name);
      console.log('Dashboard visibility:', JSON.stringify(currentDayData.dashboard, null, 2));
    } else {
      console.log('No day data found for current day');
    }
    
    // Check locker-related visibility
    const dash = currentDayData?.dashboard || {};
    console.log('\n=== Locker-relevant flags ===');
    console.log("dashboard['daily-leader-reps']:", dash['daily-leader-reps']);
    console.log("dashboard['showDailyReps']:", dash.showDailyReps);
    console.log("dashboard['conditioning']:", dash.conditioning);
  }
}

checkModulesDevPlan()
  .then(() => process.exit(0))
  .catch(console.error);
