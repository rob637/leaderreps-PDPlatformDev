const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';

async function fixUser() {
  const batch = db.batch();
  
  // Create development plan if missing
  const devPlanRef = db.collection('users').doc(userId)
    .collection('developmentPlan').doc('current');
  batch.set(devPlanRef, {
    currentCycle: 1,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastAssessmentDate: null,
    assessmentHistory: [], 
    planHistory: [],
    currentPlan: null,
  });
  console.log('Will create: developmentPlan/current');
  
  // Create daily practice if missing
  const todayStr = new Date().toISOString().split('T')[0];
  const dpRef = db.collection('users').doc(userId)
    .collection('dailyPractice').doc('current');
  batch.set(dpRef, {
    activeCommitments: [], 
    identityAnchor: '', 
    habitAnchor: '', 
    whyStatement: '',
    dailyTargetRepId: null, 
    dailyTargetRepDate: null, 
    dailyTargetRepStatus: 'Pending', 
    streakCount: 0,
    streakCoins: 0,
    lastUpdated: todayStr,
    completedRepsToday: [],
    _createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Will create: dailyPractice/current');
  
  await batch.commit();
  console.log('\n✅ Documents created successfully!');
  
  // Verify
  const devCheck = await devPlanRef.get();
  const dpCheck = await dpRef.get();
  console.log('\nVerification:');
  console.log('developmentPlan exists:', devCheck.exists);
  console.log('dailyPractice exists:', dpCheck.exists);
}

fixUser().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
