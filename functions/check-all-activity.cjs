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

async function checkAllActivity() {
  console.log('='.repeat(80));
  console.log('PRODUCTION USER ACTIVITY REPORT');
  console.log('='.repeat(80));
  console.log('');
  
  // Get all users
  const usersSnap = await db.collection('users').get();
  console.log('Total users in system:', usersSnap.size);
  console.log('');
  
  const usersWithActivity = [];
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const email = userData.email || 'NO EMAIL';
    
    // Check for any activity indicators
    const activity = {
      email,
      displayName: userData.displayName || 'Unknown',
      cohortId: userData.cohortId || 'None',
      role: userData.role || 'user',
      lastLogin: userData.lastLogin?.toDate?.() || userData.lastLoginAt?.toDate?.() || null,
      createdAt: userData.createdAt?.toDate?.() || userData._createdAt?.toDate?.() || null,
      prepStatus: userData.prepStatus || {},
      foundationCommitment: userData.foundationCommitment ? 'YES' : 'NO',
      sessionAttendance: userData.sessionAttendance ? Object.keys(userData.sessionAttendance).length : 0,
    };
    
    // Check subcollections
    const stateSnap = await db.collection('users').doc(userId).collection('state').doc('userState').get();
    if (stateSnap.exists) {
      const state = stateSnap.data();
      activity.dailyProgressDays = Object.keys(state.dailyProgress || {}).length;
      activity.actionProgressItems = Object.keys(state.actionProgress || {}).length;
      activity.sessionAttendanceItems = Object.keys(state.sessionAttendance || {}).length;
    } else {
      activity.dailyProgressDays = 0;
      activity.actionProgressItems = 0;
      activity.sessionAttendanceItems = 0;
    }
    
    // Check conditioning_reps
    const repsSnap = await db.collection('users').doc(userId).collection('conditioning_reps').get();
    activity.conditioningReps = repsSnap.size;
    
    // Check coaching_sessions registrations
    const coachingSnap = await db.collection('users').doc(userId).collection('coaching_sessions').get();
    activity.coachingSessions = coachingSnap.size;
    
    // Check assessments
    const assessSnap = await db.collection('users').doc(userId).collection('assessments').get();
    activity.assessments = assessSnap.size;
    
    // Check leader_profile subcollection
    const profileSnap = await db.collection('users').doc(userId).collection('leader_profile').get();
    activity.hasProfileSubcollection = profileSnap.size > 0;
    
    // Calculate activity score
    activity.activityScore = 
      (activity.lastLogin ? 10 : 0) +
      (Object.keys(activity.prepStatus).length * 5) +
      activity.dailyProgressDays * 2 +
      activity.actionProgressItems +
      activity.conditioningReps * 3 +
      activity.coachingSessions * 5 +
      activity.assessments * 5;
    
    if (activity.activityScore > 0 || activity.lastLogin) {
      usersWithActivity.push(activity);
    }
  }
  
  // Sort by activity score descending
  usersWithActivity.sort((a, b) => b.activityScore - a.activityScore);
  
  console.log('Users with any activity (sorted by activity level):');
  console.log('-'.repeat(80));
  
  for (const u of usersWithActivity) {
    console.log('');
    console.log(`${u.displayName} (${u.email})`);
    console.log(`  Role: ${u.role} | Cohort: ${u.cohortId?.substring(0,8) || 'None'}`);
    console.log(`  Last Login: ${u.lastLogin ? u.lastLogin.toISOString().slice(0,16) : 'NEVER'}`);
    console.log(`  Prep Status: ${JSON.stringify(u.prepStatus)}`);
    console.log(`  Foundation Commitment: ${u.foundationCommitment}`);
    console.log(`  Daily Progress Days: ${u.dailyProgressDays} | Action Progress Items: ${u.actionProgressItems}`);
    console.log(`  Conditioning Reps: ${u.conditioningReps} | Coaching Sessions: ${u.coachingSessions}`);
    console.log(`  Assessments: ${u.assessments} | Session Attendance: ${u.sessionAttendanceItems}`);
    console.log(`  Activity Score: ${u.activityScore}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('Users with any login:', usersWithActivity.filter(u => u.lastLogin).length);
  console.log('Users with prep status set:', usersWithActivity.filter(u => Object.keys(u.prepStatus).length > 0).length);
  console.log('Users with daily progress:', usersWithActivity.filter(u => u.dailyProgressDays > 0).length);
  console.log('Users with conditioning reps:', usersWithActivity.filter(u => u.conditioningReps > 0).length);
  console.log('Users with coaching sessions:', usersWithActivity.filter(u => u.coachingSessions > 0).length);
  
  process.exit(0);
}

checkAllActivity().catch(e => { console.error(e); process.exit(1); });
