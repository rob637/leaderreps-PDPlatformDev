const admin = require('firebase-admin');

const serviceAccount = require('../leaderreps-test-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-test'
});

const db = admin.firestore();

async function checkUser() {
  const email = 'ry12@test.com';
  
  const usersSnap = await db.collection('users').where('email', '==', email).get();
  
  if (usersSnap.empty) {
    console.log('User not found:', email);
    process.exit(0);
  }
  
  const userDoc = usersSnap.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  
  console.log('=== USER:', email, '===');
  console.log('User ID:', userId);
  console.log('Cohort:', userData.cohortId || 'none');
  console.log('');
  
  // Check development_plan
  const devPlanRef = db.doc(`users/${userId}/modules/development_plan/documents/current`);
  const devPlanSnap = await devPlanRef.get();
  
  if (devPlanSnap.exists) {
    const devPlan = devPlanSnap.data();
    console.log('=== DEVELOPMENT PLAN ===');
    console.log('dailyProgress keys:', Object.keys(devPlan.dailyProgress || {}));
    console.log('carryForwardLocks:', JSON.stringify(devPlan.carryForwardLocks, null, 2));
    console.log('uiState:', JSON.stringify(devPlan.uiState, null, 2));
    
    const dailyProgress = devPlan.dailyProgress || {};
    let allCompleted = [];
    Object.entries(dailyProgress).forEach(([day, data]) => {
      if (data.itemsCompleted && data.itemsCompleted.length > 0) {
        console.log(`  ${day}: ${data.itemsCompleted.length} items completed`);
        allCompleted.push(...data.itemsCompleted);
      }
    });
    console.log('Total items in dailyProgress:', allCompleted.length);
    console.log('Completed IDs:', allCompleted);
  } else {
    console.log('No development_plan found');
  }
  
  console.log('');
  
  // Check action_progress subcollection
  const actionProgressSnap = await db.collection(`users/${userId}/action_progress`).get();
  console.log('=== ACTION PROGRESS ===');
  console.log('Total documents:', actionProgressSnap.size);
  
  const completed = [];
  actionProgressSnap.forEach(doc => {
    const data = doc.data();
    if (data.status === 'completed') {
      completed.push({ id: doc.id, label: data.label, completedAt: data.completedAt?.toDate?.() || 'unknown' });
    }
  });
  
  console.log('Completed actions:', completed.length);
  completed.forEach(c => console.log(`  - ${c.id}: ${c.label}`));
  
  process.exit(0);
}

checkUser().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
