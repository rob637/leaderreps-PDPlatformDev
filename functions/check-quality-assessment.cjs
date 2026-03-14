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

async function check() {
  const ryanQuery = await db.collection('users').where('email', '==', 'ryan@leaderreps.com').get();
  const ryanId = ryanQuery.docs[0].id;
  
  const repsSnap = await db.collection('users').doc(ryanId).collection('conditioning_reps').get();
  
  console.log('Ryan conditioning_reps - Quality Assessment Check:');
  console.log('===================================================');
  repsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`  ${data.person} (${data.status}):`);
    console.log(`    qualityAssessment exists: ${!!data.qualityAssessment}`);
    if (data.qualityAssessment) {
      console.log(`    meetsStandard: ${data.qualityAssessment.meetsStandard}`);
    }
    console.log('');
  });
  
  // Now check how the dashboard logic works
  console.log('Dashboard logic check:');
  console.log('======================');
  
  // These are "done" states that would count
  const doneStates = ['debriefed', 'loop_closed', 'follow_up_pending', 'completed'];
  const completedStates = ['debriefed', 'loop_closed', 'completed'];
  const activeStates = ['committed', 'prepared', 'scheduled', 'executed', 'follow_up_pending', 'active'];
  
  const reps = repsSnap.docs.map(d => d.data());
  
  // totalCompleted (no quality check)
  const completed = reps.filter(r => completedStates.includes(r.status));
  console.log(`totalCompleted (status in completed states): ${completed.length}`);
  
  // totalActive
  const active = reps.filter(r => activeStates.includes(r.status));
  console.log(`totalActive (status in active states): ${active.length}`);
  
  // Required rep check (needs quality assessment)
  const doneForRequirement = reps.filter(r => {
    if (!doneStates.includes(r.status)) return false;
    const qa = r.qualityAssessment;
    if (!qa) return false;
    return qa.meetsStandard === true;
  });
  console.log(`Reps meeting requirement (with quality passing): ${doneForRequirement.length}`);
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
