/**
 * Query user activity by email in production
 * Usage: node scripts/debug/query-user-activity.cjs [email]
 */
const admin = require('firebase-admin');

const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-prod',
});

const db = admin.firestore();

async function queryUserByEmail(email) {
  console.log(`\n=== Querying user: ${email} in PROD ===\n`);
  
  // Find user by email (case-insensitive)
  const usersSnap = await db.collection('users').get();
  let foundUser = null;
  let userId = null;
  
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const userEmail = (data.email || data.profile?.email || '').toLowerCase();
    if (userEmail === email.toLowerCase()) {
      foundUser = data;
      userId = doc.id;
      break;
    }
  }
  
  if (!foundUser) {
    console.log(`User not found: ${email}`);
    return null;
  }
  
  console.log(`Found user: ${userId}`);
  console.log(`Email: ${foundUser.email || foundUser.profile?.email}`);
  console.log(`Name: ${foundUser.displayName || foundUser.profile?.displayName || 'N/A'}`);
  console.log(`Cohort ID: ${foundUser.cohortId || 'none'}`);
  console.log(`Role: ${foundUser.role || 'user'}`);
  console.log(`Created: ${foundUser.createdAt?.toDate?.() || foundUser.createdAt || 'unknown'}`);
  console.log(`Last Login: ${foundUser.lastLogin?.toDate?.() || foundUser.lastLogin || 'unknown'}`);
  
  // Check conditioning reps
  console.log(`\n--- Conditioning Reps ---`);
  const repsSnap = await db.collection('users').doc(userId).collection('conditioning_reps').get();
  if (repsSnap.empty) {
    console.log('No conditioning reps found');
  } else {
    console.log(`Total reps: ${repsSnap.size}`);
    for (const repDoc of repsSnap.docs) {
      const rep = repDoc.data();
      console.log(`\n  Rep ID: ${repDoc.id}`);
      console.log(`    Title: ${rep.title || rep.repName || 'N/A'}`);
      console.log(`    Type: ${rep.type || rep.repType || 'N/A'}`);
      console.log(`    Status: ${rep.status || 'N/A'}`);
      console.log(`    Week ID: ${rep.weekId || 'N/A'}`);
      console.log(`    Created: ${rep.createdAt?.toDate?.() || rep.createdAt || 'unknown'}`);
      console.log(`    Deadline: ${rep.deadline?.toDate?.() || rep.deadline || 'none'}`);
    }
  }
  
  // Check development plan
  console.log(`\n--- Development Plan ---`);
  const devPlanSnap = await db.collection('modules').doc(userId)
    .collection('development_plan').doc('current').get();
  if (!devPlanSnap.exists) {
    console.log('No development plan found');
  } else {
    const devPlan = devPlanSnap.data();
    console.log(`Start Date: ${devPlan.startDate?.toDate?.() || devPlan.startDate || 'N/A'}`);
    console.log(`Current Day: ${devPlan.currentDay || 'N/A'}`);
    console.log(`Phase: ${devPlan.phase || 'N/A'}`);
    console.log(`Cohort ID: ${devPlan.cohortId || 'N/A'}`);
  }
  
  // Check daily logs
  console.log(`\n--- Daily Logs (last 10 days) ---`);
  const logsSnap = await db.collection('users').doc(userId)
    .collection('daily_logs')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  if (logsSnap.empty) {
    console.log('No daily logs found');
  } else {
    console.log(`Total logs retrieved: ${logsSnap.size}`);
    for (const logDoc of logsSnap.docs) {
      const log = logDoc.data();
      console.log(`\n  Date: ${logDoc.id}`);
      console.log(`    AM Check-in: ${log.amCheckin ? 'Yes' : 'No'}`);
      console.log(`    PM Reflection: ${log.pmReflection ? 'Yes' : 'No'}`);
      console.log(`    Created: ${log.createdAt?.toDate?.() || log.createdAt || 'unknown'}`);
    }
  }
  
  // Check progress
  console.log(`\n--- Progress ---`);
  const progressSnap = await db.collection('users').doc(userId)
    .collection('progress').get();
  if (progressSnap.empty) {
    console.log('No progress records found');
  } else {
    console.log(`Progress records: ${progressSnap.size}`);
    for (const progressDoc of progressSnap.docs) {
      const progress = progressDoc.data();
      console.log(`  ${progressDoc.id}: ${JSON.stringify(progress).substring(0, 100)}...`);
    }
  }
  
  // Check arena/gamification data
  console.log(`\n--- Arena Data ---`);
  const arenaSnap = await db.collection('users').doc(userId)
    .collection('arena').get();
  if (arenaSnap.empty) {
    console.log('No arena data found');
  } else {
    for (const arenaDoc of arenaSnap.docs) {
      const arena = arenaDoc.data();
      console.log(`  ${arenaDoc.id}:`);
      console.log(`    Points: ${arena.points || 0}`);
      console.log(`    Level: ${arena.level || 1}`);
      console.log(`    Streak: ${arena.streak || 0}`);
    }
  }
  
  // Check conditioning_performance
  console.log(`\n--- Conditioning Performance ---`);
  const perfSnap = await db.collection('users').doc(userId)
    .collection('conditioning_performance').get();
  if (perfSnap.empty) {
    console.log('No conditioning performance records found');
  } else {
    for (const perfDoc of perfSnap.docs) {
      const perf = perfDoc.data();
      console.log(`\n  Week ${perfDoc.id}:`);
      console.log(`    ${JSON.stringify(perf)}`);
    }
  }
  
  return { foundUser, userId };
}

async function main() {
  const emails = ['hsmith@equity.net', 'in2focus@gmail.com'];
  
  for (const email of emails) {
    await queryUserByEmail(email);
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
