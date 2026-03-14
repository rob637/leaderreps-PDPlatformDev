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
  // Get all users in Cohort 261
  const cohortId = 'GCfQUcilymvNrxWvVlZm';
  const usersSnap = await db.collection('users').where('cohortId', '==', cohortId).get();
  
  console.log('COHORT 261 USERS - DETAILED ACTIVITY');
  console.log('='.repeat(70));
  console.log('');
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`${userData.displayName || 'Unknown'} (${userData.email})`);
    console.log(`  Last Login: ${userData.lastLogin?.toDate?.()?.toISOString()?.slice(0,16) || 'NEVER'}`);
    
    // Check action_progress subcollection
    const actionProgressSnap = await db.collection('users').doc(userId).collection('action_progress').get();
    console.log(`  action_progress: ${actionProgressSnap.size} items`);
    
    // Show what actions they've completed
    if (actionProgressSnap.size > 0) {
      console.log('    Actions completed:');
      actionProgressSnap.docs.forEach(d => {
        const data = d.data();
        console.log(`      - ${d.id}: ${data.label?.substring(0,40) || 'no label'} (${data.status})`);
      });
    }
    
    // Check conditioning_reps
    const repsSnap = await db.collection('users').doc(userId).collection('conditioning_reps').get();
    console.log(`  conditioning_reps: ${repsSnap.size}`);
    
    // Check videoProgress
    const videoSnap = await db.collection('users').doc(userId).collection('videoProgress').get();
    console.log(`  videoProgress: ${videoSnap.size}`);
    
    // Check daily_logs
    const logsSnap = await db.collection('users').doc(userId).collection('daily_logs').get();
    console.log(`  daily_logs: ${logsSnap.size}`);
    
    console.log('');
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
