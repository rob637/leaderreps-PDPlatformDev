/**
 * Extended user activity query - check all subcollections
 */
const admin = require('firebase-admin');

const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-prod',
});

const db = admin.firestore();

async function checkAllSubcollections(userId, email) {
  console.log(`\n=== Extended activity check for ${email} (${userId}) ===\n`);
  
  // Get all subcollections of user
  const userRef = db.collection('users').doc(userId);
  const collections = await userRef.listCollections();
  
  console.log('Subcollections found:');
  for (const col of collections) {
    const snap = await col.get();
    console.log(`  - ${col.id}: ${snap.size} documents`);
    
    // Show first few docs if any
    if (snap.size > 0 && snap.size <= 5) {
      for (const doc of snap.docs) {
        const data = doc.data();
        console.log(`      ${doc.id}: ${JSON.stringify(data).substring(0, 200)}`);
      }
    }
  }
  
  // Check modules subcollections
  console.log('\n--- Modules subcollections ---');
  const modulesRef = db.collection('modules').doc(userId);
  try {
    const modulesCollections = await modulesRef.listCollections();
    for (const col of modulesCollections) {
      const snap = await col.get();
      console.log(`  - ${col.id}: ${snap.size} documents`);
      if (snap.size > 0 && snap.size <= 5) {
        for (const doc of snap.docs) {
          console.log(`      ${doc.id}: ${JSON.stringify(doc.data()).substring(0, 200)}`);
        }
      }
    }
  } catch (e) {
    console.log('  No modules data');
  }
  
  // Check coaching sessions
  console.log('\n--- Coaching Sessions ---');
  try {
    const coachingSnap = await db.collection('coaching_sessions')
      .where('userId', '==', userId)
      .get();
    if (coachingSnap.empty) {
      console.log('  No coaching sessions');
    } else {
      console.log(`  ${coachingSnap.size} sessions`);
      for (const doc of coachingSnap.docs) {
        console.log(`    ${doc.id}: ${JSON.stringify(doc.data()).substring(0, 200)}`);
      }
    }
  } catch (e) {
    console.log('  Could not query coaching sessions');
  }
  
  // Check if user has done any assessments (in profiles)
  console.log('\n--- Profile Data ---');
  const profileSnap = await db.collection('users').doc(userId).collection('profiles').get();
  if (profileSnap.empty) {
    console.log('  No profile data in profiles subcollection');
  } else {
    for (const doc of profileSnap.docs) {
      console.log(`  ${doc.id}: ${JSON.stringify(doc.data()).substring(0, 300)}`);
    }
  }
  
  // Check rep_coach_conversations
  console.log('\n--- Rep Coach Conversations ---');
  const repCoachSnap = await db.collection('users').doc(userId)
    .collection('rep_coach_conversations').get();
  if (repCoachSnap.empty) {
    console.log('  No Rep coach conversations');
  } else {
    console.log(`  ${repCoachSnap.size} conversations`);
  }
  
  // Check assessments
  console.log('\n--- Assessments ---');
  const assessmentsSnap = await db.collection('users').doc(userId)
    .collection('assessments').get();
  if (assessmentsSnap.empty) {
    console.log('  No assessments');
  } else {
    console.log(`  ${assessmentsSnap.size} assessments`);
    for (const doc of assessmentsSnap.docs) {
      console.log(`    ${doc.id}: ${JSON.stringify(doc.data()).substring(0, 200)}`);
    }
  }
  
  // Check tasks
  console.log('\n--- Tasks ---');
  const tasksSnap = await db.collection('users').doc(userId)
    .collection('tasks').get();
  if (tasksSnap.empty) {
    console.log('  No tasks');
  } else {
    console.log(`  ${tasksSnap.size} tasks`);
  }
}

async function main() {
  const users = [
    { email: 'hsmith@equity.net', id: 'U4evSPD3Iwgn3VESzy61NGM1e5W2' },
    { email: 'in2focus@gmail.com', id: 'AgHqf6UYqlQBPZR2C25qGHqdOBp1' },
  ];
  
  for (const user of users) {
    await checkAllSubcollections(user.id, user.email);
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
