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

// Reproduce getCurrentWeekId exactly as the service does
function getCurrentWeekId() {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const daysSinceJan4 = Math.floor((now - jan4) / 86400000);
  const weekNumber = Math.ceil((daysSinceJan4 + jan4.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

async function simulate() {
  const cohortId = 'GCfQUcilymvNrxWvVlZm';
  const weekId = getCurrentWeekId();
  
  console.log(`Dashboard query parameters:`);
  console.log(`  cohortId: ${cohortId}`);
  console.log(`  weekId: ${weekId}`);
  console.log('');
  
  // Get Ryan
  const ryanQuery = await db.collection('users').where('email', '==', 'ryan@leaderreps.com').get();
  const ryanId = ryanQuery.docs[0].id;
  
  console.log(`Ryan's userId: ${ryanId}`);
  
  // Simulate getRepsByWeek query
  console.log('');
  console.log('Simulating getRepsByWeek query...');
  
  const repsRef = db.collection('users').doc(ryanId).collection('conditioning_reps');
  const q = repsRef
    .where('weekId', '==', weekId)
    .where('cohortId', '==', cohortId)
    .orderBy('createdAt', 'desc');
  
  try {
    const snapshot = await q.get();
    console.log(`  Query result: ${snapshot.size} reps found`);
    
    if (snapshot.size > 0) {
      snapshot.docs.forEach(d => {
        const data = d.data();
        console.log(`    - ${data.person}: ${data.status}`);
      });
    }
  } catch (err) {
    console.log(`  Query ERROR: ${err.message}`);
    console.log(`  Error code: ${err.code}`);
  }
  
  // Also check what weekIds actually exist  
  console.log('');
  console.log('All weekIds in Ryan\'s reps:');
  const allReps = await db.collection('users').doc(ryanId).collection('conditioning_reps').get();
  const weekIds = [...new Set(allReps.docs.map(d => d.data().weekId))];
  console.log(`  ${weekIds.join(', ')}`);
  
  process.exit(0);
}

simulate().catch(e => { console.error(e); process.exit(1); });
