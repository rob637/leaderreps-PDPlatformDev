const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-prod'
});

const db = admin.firestore();

async function run() {
  console.log('=== PRODUCTION DATA CHECK ===\n');
  
  // 1. Check daily_plan_v1
  const dailyPlan = await db.collection('daily_plan_v1').get();
  console.log(`2. DAILY PLAN: ${dailyPlan.size} days configured`);
  
  // Check prep phase days (negative days)
  const prepDays = dailyPlan.docs.filter(d => d.data().dayNumber < 0 || d.data().phase === 'Preparation');
  console.log(`   - Prep phase days: ${prepDays.length}`);
  
  // 2. Check cohorts
  const cohorts = await db.collection('cohorts').get();
  console.log(`\n3. COHORTS: ${cohorts.size} total`);
  for (const c of cohorts.docs) {
    const data = c.data();
    console.log(`   - ${data.name || c.id}`);
    console.log(`     Start: ${data.startDate?._seconds ? new Date(data.startDate._seconds * 1000).toISOString().split('T')[0] : data.startDate || 'Not set'}`);
    console.log(`     Members: ${data.memberIds?.length || 0}`);
    console.log(`     Status: ${data.status || 'active'}`);
  }
  
  // 3. Check coaching sessions
  const sessions = await db.collection('coaching_sessions').get();
  console.log(`\n4. COACHING SESSIONS: ${sessions.size} configured`);
  
  // 4. Check content library
  const content = await db.collection('content_library').get();
  console.log(`\n5. CONTENT LIBRARY: ${content.size} items`);
  
  // 5. Check metadata/config
  const configSnap = await db.doc('metadata/config').get();
  if (configSnap.exists) {
    const config = configSnap.data();
    console.log(`\n6. ADMIN CONFIGURATION:`);
    console.log(`   Admin emails: ${config.adminemails?.length || 0}`);
    if (config.adminemails) {
      config.adminemails.forEach(e => console.log(`   - ${e}`));
    }
  }
  
  // 6. Check users
  const users = await db.collection('users').get();
  console.log(`\n7. USERS: ${users.size} total`);
  
  // 7. Check invitations
  const invitations = await db.collection('invitations').get();
  const pendingInvites = invitations.docs.filter(i => i.data().status === 'pending');
  console.log(`\n8. INVITATIONS: ${invitations.size} total (${pendingInvites.length} pending)`);
  
  console.log('\n=== CHECK COMPLETE ===');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
