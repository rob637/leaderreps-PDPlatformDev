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
  // Find Britt
  const brittQuery = await db.collection('users').where('email', '==', 'in2focus@gmail.com').get();
  
  if (brittQuery.empty) {
    console.log('Britt not found by email');
    process.exit(1);
  }
  
  const brittDoc = brittQuery.docs[0];
  const brittId = brittDoc.id;
  const brittData = brittDoc.data();
  
  console.log('=== BRITT JOHNSON ===');
  console.log('UserId:', brittId);
  console.log('Email:', brittData.email);
  console.log('Display Name:', brittData.displayName);
  console.log('CohortId:', brittData.cohortId);
  console.log('Last Login:', brittData.lastLogin?.toDate?.()?.toISOString() || 'NEVER');
  console.log('');
  
  // Check conditioning_reps subcollection
  console.log('=== CONDITIONING REPS ===');
  const repsSnap = await db.collection('users').doc(brittId).collection('conditioning_reps').get();
  console.log(`Total reps in subcollection: ${repsSnap.size}`);
  
  if (repsSnap.size > 0) {
    repsSnap.docs.forEach(d => {
      const data = d.data();
      console.log(`  ${d.id}:`);
      console.log(`    person: ${data.person}`);
      console.log(`    repType: ${data.repType}`);
      console.log(`    status: ${data.status}`);
      console.log(`    weekId: ${data.weekId}`);
      console.log(`    cohortId: ${data.cohortId}`);
      console.log(`    createdAt: ${data.createdAt?.toDate?.()?.toISOString()?.slice(0,16) || 'N/A'}`);
      console.log('');
    });
  }
  
  // Check action_progress
  console.log('=== ACTION PROGRESS ===');
  const actionsSnap = await db.collection('users').doc(brittId).collection('action_progress').get();
  console.log(`Total actions: ${actionsSnap.size}`);
  actionsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`  - ${data.label || d.id}: ${data.status}`);
  });
  
  // Check conditioning_weeks
  console.log('');
  console.log('=== CONDITIONING WEEKS ===');
  const weeksSnap = await db.collection('users').doc(brittId).collection('conditioning_weeks').get();
  console.log(`Total weeks: ${weeksSnap.size}`);
  weeksSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`  ${d.id}: ${JSON.stringify(data)}`);
  });
  
  // Check daily_logs
  console.log('');
  console.log('=== DAILY LOGS ===');
  const logsSnap = await db.collection('users').doc(brittId).collection('daily_logs').get();
  console.log(`Total daily logs: ${logsSnap.size}`);
  
  // Check videoProgress
  console.log('');
  console.log('=== VIDEO PROGRESS ===');
  const videosSnap = await db.collection('users').doc(brittId).collection('videoProgress').get();
  console.log(`Total video progress: ${videosSnap.size}`);
  
  // Check ALL subcollections
  console.log('');
  console.log('=== ALL SUBCOLLECTIONS ===');
  const collections = await db.collection('users').doc(brittId).listCollections();
  for (const coll of collections) {
    const snap = await coll.get();
    console.log(`  ${coll.id}: ${snap.size} docs`);
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
