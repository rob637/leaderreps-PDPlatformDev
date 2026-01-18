const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';

async function checkPrepStatus() {
  // Check development plan for assessment completion
  const devPlanSnap = await db.collection('users').doc(userId)
    .collection('developmentPlan').doc('current').get();
  
  if (devPlanSnap.exists) {
    const data = devPlanSnap.data();
    console.log('=== DEVELOPMENT PLAN ===');
    console.log('assessmentHistory length:', data.assessmentHistory?.length || 0);
    console.log('currentPlan focusAreas:', data.currentPlan?.focusAreas?.length || 0);
    console.log('dailyProgress keys:', Object.keys(data.dailyProgress || {}));
  }
  
  // Check action progress for prep items
  const actionProgressSnap = await db.collection('users').doc(userId)
    .collection('action_progress').get();
  
  console.log('\n=== ACTION PROGRESS ===');
  actionProgressSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`${doc.id}: status=${data.status}, completedAt=${data.completedAt?._seconds || 'none'}`);
  });
}

checkPrepStatus().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
