const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkLockerVisibility() {
  const email = 'rob@sagecg.com';
  
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();
  
  if (usersSnapshot.empty) {
    console.log('User not found');
    return;
  }
  
  const userDoc = usersSnapshot.docs[0];
  const uid = userDoc.id;
  console.log('UID:', uid);
  
  // Check development plan
  const devPlanRef = db.doc(`user_data/${uid}/developmentPlan/current`);
  const devPlanSnap = await devPlanRef.get();
  
  if (!devPlanSnap.exists) {
    console.log('No development plan found!');
  } else {
    const devPlan = devPlanSnap.data();
    console.log('\n=== Development Plan ===');
    console.log('cohortId:', devPlan.cohortId);
    console.log('currentDay:', devPlan.currentDay);
    console.log('programDay:', devPlan.programDay);
    console.log('currentPhaseId:', devPlan.currentPhaseId);
    
    // Get current day data
    const currentDayIndex = devPlan.currentDay || devPlan.programDay || 1;
    const dailyPlan = devPlan.dailyPlan || [];
    const currentDayData = dailyPlan.find(d => d.dayNumber == currentDayIndex);
    
    console.log('\n=== Current Day Data (Day', currentDayIndex, ') ===');
    if (currentDayData?.dashboard) {
      console.log('Dashboard visibility:', JSON.stringify(currentDayData.dashboard, null, 2));
    } else {
      console.log('No dashboard config for current day');
    }
    
    // Check if daily-leader-reps or showDailyReps is in there
    const dash = currentDayData?.dashboard || {};
    console.log('\n=== Locker-relevant flags ===');
    console.log("dashboard['daily-leader-reps']:", dash['daily-leader-reps']);
    console.log("dashboard['showDailyReps']:", dash.showDailyReps);
    console.log("dashboard['conditioning']:", dash.conditioning);
  }
  
  // Check cohort data
  const userData = userDoc.data();
  const cohortId = userData.cohortId;
  if (cohortId) {
    const cohortDoc = await db.collection('cohorts').doc(cohortId).get();
    if (cohortDoc.exists) {
      const cohort = cohortDoc.data();
      console.log('\n=== Cohort ===');
      console.log('name:', cohort.name);
      console.log('startDate:', cohort.startDate?.toDate?.() || cohort.startDate);
    }
  }
  
  // Fix week stats
  console.log('\n=== Fixing Week 2026-W08 Stats ===');
  const weekRef = db.doc(`users/${uid}/conditioning_weeks/2026-W08`);
  const weekSnap = await weekRef.get();
  const week = weekSnap.data();
  console.log('Current stats:', week);
  
  // Count actual completed reps for this week
  const repsSnapshot = await db.collection(`users/${uid}/conditioning_reps`)
    .where('weekId', '==', '2026-W08')
    .get();
  
  const completedStates = ['debriefed', 'follow_up_pending', 'loop_closed', 'completed'];
  let completedCount = 0;
  repsSnapshot.forEach(doc => {
    const rep = doc.data();
    console.log(`Rep ${doc.id}: status=${rep.status}`);
    if (completedStates.includes(rep.status)) {
      completedCount++;
    }
  });
  console.log('Actual completed count:', completedCount);
  
  if (completedCount !== week?.totalRepsCompleted || (completedCount >= 1 && !week?.requiredRepCompleted)) {
    console.log('\n>>> STATS NEED FIXING!');
    await weekRef.set({
      totalRepsCompleted: completedCount,
      requiredRepCompleted: completedCount >= 1
    }, { merge: true });
    console.log('Stats updated!');
  }
}

checkLockerVisibility()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
