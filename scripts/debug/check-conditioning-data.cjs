/**
 * Debug: Check conditioning data for a user across all environments
 * Usage: node scripts/debug/check-conditioning-data.cjs [env] [userId]
 * Default env: prod
 * If no userId provided, lists all users with conditioning_reps
 */
const admin = require('firebase-admin');

const ENV_CONFIG = {
  dev: {
    serviceAccount: '/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json',
    projectId: 'leaderreps-pd-platform',
  },
  test: {
    serviceAccount: '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json',
    projectId: 'leaderreps-test',
  },
  prod: {
    serviceAccount: '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json',
    projectId: 'leaderreps-prod',
  },
};

const env = process.argv[2] || 'prod';
const targetUserId = process.argv[3] || null;

if (!ENV_CONFIG[env]) {
  console.error(`Invalid env: ${env}. Use dev, test, or prod.`);
  process.exit(1);
}

const config = ENV_CONFIG[env];
const serviceAccount = require(config.serviceAccount);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: config.projectId,
});

const db = admin.firestore();

async function run() {
  console.log(`\n=== Checking conditioning data in ${env.toUpperCase()} (${config.projectId}) ===\n`);

  // Find users
  const usersSnap = await db.collection('users').get();
  const usersWithReps = [];

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    if (targetUserId && userId !== targetUserId) continue;

    const repsSnap = await db.collection('users').doc(userId).collection('conditioning_reps').get();
    if (repsSnap.empty) continue;

    const userData = userDoc.data();
    const userEmail = userData.email || userData.profile?.email || 'unknown';
    const userCohortId = userData.cohortId || null;

    usersWithReps.push({ userId, userEmail, userCohortId, repsCount: repsSnap.size });

    console.log(`\n--- User: ${userEmail} (${userId}) ---`);
    console.log(`  user.cohortId: ${userCohortId}`);

    // Check development plan for cohortId
    const devPlanSnap = await db.collection('modules').doc(userId)
      .collection('development_plan').doc('current').get();
    const devPlanCohortId = devPlanSnap.exists ? devPlanSnap.data()?.cohortId : null;
    console.log(`  developmentPlan.cohortId: ${devPlanCohortId}`);

    // Get cohort data
    const cohortsSnap = await db.collection('cohorts').get();
    console.log(`  Available cohorts: ${cohortsSnap.docs.map(d => d.id).join(', ') || 'none'}`);

    // Resolved cohortId (matches the app logic)
    const resolvedCohortId = devPlanCohortId || null; // Can't check cohortData.id here
    console.log(`  Resolved cohortId (devPlan || cohortData.id || user.cohortId): ${devPlanCohortId || userCohortId || 'UNDEFINED'}`);

    console.log(`\n  Conditioning Reps (${repsSnap.size} total):`);

    // Get current week ID (Sunday-based)
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    sunday.setHours(0, 0, 0, 0);
    const startOfYear = new Date(sunday.getFullYear(), 0, 1);
    const days = Math.floor((sunday - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const currentWeekId = `${sunday.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    console.log(`  Current week ID: ${currentWeekId}`);
    console.log('');

    const activeStates = ['committed', 'prepared', 'scheduled', 'executed', 'follow_up_pending', 'active'];
    const completedStates = ['debriefed', 'loop_closed', 'completed'];

    for (const repDoc of repsSnap.docs) {
      const rep = repDoc.data();
      const deadline = rep.deadline?.toDate?.() || rep.deadline || 'no deadline';
      const isCurrentWeek = rep.weekId === currentWeekId;
      const isActive = activeStates.includes(rep.status);
      const isCompleted = completedStates.includes(rep.status);
      const cohortMatch = rep.cohortId === (devPlanCohortId || userCohortId);

      console.log(`  [${repDoc.id}]`);
      console.log(`    status: ${rep.status} ${isActive ? '(ACTIVE)' : isCompleted ? '(COMPLETED)' : rep.status === 'missed' ? '(MISSED)' : ''}`);
      console.log(`    weekId: ${rep.weekId} ${isCurrentWeek ? '← CURRENT WEEK' : ''}`);
      console.log(`    cohortId on rep: ${rep.cohortId}`);
      console.log(`    cohortId match: ${cohortMatch ? 'YES ✓' : 'NO ✗ (MISMATCH!)'}`);
      console.log(`    repType: ${rep.repType}`);
      console.log(`    deadline: ${deadline}`);
      console.log(`    person: ${rep.person || 'none'}`);
      if (rep.taxonomyVersion) console.log(`    taxonomyVersion: ${rep.taxonomyVersion}`);
      console.log('');
    }

    // Summary
    const allReps = repsSnap.docs.map(d => d.data());
    const currentWeekReps = allReps.filter(r => r.weekId === currentWeekId);
    const activeReps = allReps.filter(r => activeStates.includes(r.status));
    const cohortMismatches = allReps.filter(r => r.cohortId !== (devPlanCohortId || userCohortId));

    console.log('  === SUMMARY ===');
    console.log(`  Total reps: ${allReps.length}`);
    console.log(`  Current week reps: ${currentWeekReps.length}`);
    console.log(`  Active status reps: ${activeReps.length}`);
    console.log(`  CohortId mismatches: ${cohortMismatches.length}`);
    if (cohortMismatches.length > 0) {
      console.log('  ⚠️  COHORT MISMATCH DETECTED - This is likely the issue!');
      cohortMismatches.forEach(r => {
        console.log(`    Rep ${r.id}: cohortId="${r.cohortId}" vs resolved="${devPlanCohortId || userCohortId}"`);
      });
    }
  }

  if (usersWithReps.length === 0) {
    console.log('No users found with conditioning reps.');
  } else {
    console.log(`\n=== Found ${usersWithReps.length} user(s) with conditioning reps ===`);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
