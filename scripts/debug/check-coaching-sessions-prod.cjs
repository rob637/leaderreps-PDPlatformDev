/**
 * Debug script to check coaching sessions and user cohort data in prod
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin for prod
const serviceAccount = require(path.join(__dirname, '../../leaderreps-prod-firebase-adminsdk.json'));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'leaderreps-prod'
});

const db = getFirestore(app);

async function main() {
  const testEmail = process.argv[2] || 'rob@sagecg.com';
  
  console.log('\n=== COACHING SESSIONS DEBUG ===\n');
  
  // 1. Check user's cohortId
  console.log(`1. Checking user: ${testEmail}`);
  const usersSnap = await db.collection('users').where('email', '==', testEmail).limit(1).get();
  
  if (usersSnap.empty) {
    console.log('   ERROR: User not found!');
  } else {
    const user = usersSnap.docs[0].data();
    console.log(`   ✓ Found user: ${user.displayName || user.email}`);
    console.log(`   ✓ cohortId: "${user.cohortId || '(not set)'}"`);
    console.log(`   ✓ programId: "${user.programId || '(not set)'}"`);
  }
  
  // 2. Check coaching sessions
  console.log('\n2. Checking coaching_sessions collection:');
  const sessionsSnap = await db.collection('coaching_sessions').get();
  
  if (sessionsSnap.empty) {
    console.log('   No sessions found!');
  } else {
    console.log(`   Found ${sessionsSnap.size} sessions:\n`);
    
    const now = new Date();
    sessionsSnap.docs.forEach(doc => {
      const s = doc.data();
      const sessionDate = s.date ? new Date(s.date) : null;
      const isUpcoming = sessionDate && sessionDate >= now;
      const isPast = sessionDate && sessionDate < now;
      
      console.log(`   [${doc.id}]`);
      console.log(`     title: ${s.title || '(no title)'}`);
      console.log(`     date: ${s.date || '(no date)'} ${isPast ? '(PAST)' : isUpcoming ? '(UPCOMING)' : ''}`);
      console.log(`     status: ${s.status || '(no status)'}`);
      console.log(`     cohortAccess: ${s.cohortAccess || '(NOT SET - shows to all)'}`);
      console.log(`     cohortIds: ${JSON.stringify(s.cohortIds || [])}`);
      console.log('');
    });
  }
  
  // 3. Check cohorts collection
  console.log('3. Checking active cohorts:');
  const cohortsSnap = await db.collection('cohorts').where('status', '==', 'active').get();
  
  if (cohortsSnap.empty) {
    console.log('   No active cohorts found!');
  } else {
    cohortsSnap.docs.forEach(doc => {
      const c = doc.data();
      console.log(`   [${doc.id}] - ${c.name || '(no name)'}`);
    });
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
