const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function simulateLoadHistory() {
  const uid = 'QUA65XyWmrWnMVmecG4yhIWMop52';
  
  // Get data from the same sources the widget uses
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();
  
  const devPlanDoc = await db.doc(`modules/${uid}/development_plan/current`).get();
  const devPlanData = devPlanDoc.data();
  
  // Check cohortId sources (mirroring ConditioningHistoryWidget)
  console.log('=== CohortId Sources ===');
  console.log('developmentPlanData?.cohortId:', devPlanData?.cohortId || 'undefined');
  console.log('userProfile?.cohortId:', userData?.cohortId || 'undefined');
  
  const cohortId = devPlanData?.cohortId || userData?.cohortId;
  console.log('\nResolved cohortId:', cohortId || 'NONE - This would show enrollment prompt!');
  
  if (!cohortId) {
    console.log('\n*** PROBLEM: No cohortId found! Widget will show enrollment prompt. ***');
    return;
  }
  
  // Now simulate getRepHistory
  console.log('\n=== Simulating getRepHistory ===');
  const repsSnapshot = await db.collection(`users/${uid}/conditioning_reps`).get();
  let reps = repsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log('Total reps in collection:', reps.length);
  
  // Filter to history states
  const historyStates = ['debriefed', 'follow_up_pending', 'loop_closed', 'completed'];
  reps = reps.filter(rep => historyStates.includes(rep.status) || rep.status === 'canceled');
  console.log('Reps after status filter (history states):', reps.length);
  
  // Filter by cohortId
  reps = reps.filter(rep => rep.cohortId === cohortId);
  console.log('Reps after cohortId filter:', reps.length);
  
  // Show which reps match
  console.log('\n=== Matching Reps ===');
  for (const rep of reps) {
    console.log(`- ${rep.id}: status=${rep.status}, weekId=${rep.weekId}, cohortId=${rep.cohortId}`);
  }
  
  if (reps.length > 0) {
    console.log('\n*** SUCCESS: Widget should show these reps! ***');
  } else {
    console.log('\n*** PROBLEM: No matching reps found! Widget will show "No conditioning reps yet" ***');
  }
}

simulateLoadHistory()
  .then(() => process.exit(0))
  .catch(console.error);
