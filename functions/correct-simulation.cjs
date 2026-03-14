const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}
const db = admin.firestore();

// ACTUAL getCurrentWeekId from conditioningService
function getCurrentWeekId(date = null) {
  const d = date || new Date();
  
  const sunday = new Date(d);
  const dayOfWeek = sunday.getDay();
  sunday.setDate(sunday.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  
  const startOfYear = new Date(sunday.getFullYear(), 0, 1);
  const days = Math.floor((sunday - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${sunday.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

async function simulate() {
  const cohortId = 'GCfQUcilymvNrxWvVlZm';
  const weekId = getCurrentWeekId();
  
  console.log(`Correct query parameters:`);
  console.log(`  cohortId: ${cohortId}`);
  console.log(`  weekId: ${weekId}`);
  console.log('');
  
  const ryanQuery = await db.collection('users').where('email', '==', 'ryan@leaderreps.com').get();
  const ryanId = ryanQuery.docs[0].id;
  
  // Query with weekId=W11 and cohortId
  const repsRef = db.collection('users').doc(ryanId).collection('conditioning_reps');
  const q = repsRef
    .where('weekId', '==', weekId)
    .where('cohortId', '==', cohortId)
    .orderBy('createdAt', 'desc');
  
  const snapshot = await q.get();
  console.log(`Query result: ${snapshot.size} reps found`);
  
  const completedStates = ['debriefed', 'loop_closed', 'completed'];
  const completed = snapshot.docs.filter(d => completedStates.includes(d.data().status));
  console.log(`totalCompleted (in completed states): ${completed.length}`);
  
  process.exit(0);
}

simulate().catch(e => { console.error(e); process.exit(1); });
