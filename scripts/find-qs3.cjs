const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findQS3() {
  // Check weeks collection
  const weeksSnap = await db.collection('weekly_plan_v1').get();
  console.log('Weekly plans:', weeksSnap.size);
  weeksSnap.forEach(doc => {
    const data = doc.data();
    console.log('Week:', doc.id, JSON.stringify(data).slice(0, 200));
  });
  
  // Check milestones
  const milestonesSnap = await db.collection('milestones').get();
  console.log('\nMilestones:', milestonesSnap.size);
  milestonesSnap.forEach(doc => {
    const data = doc.data();
    if (JSON.stringify(data).includes('QS') || JSON.stringify(data).includes('Live')) {
      console.log('Milestone:', doc.id, JSON.stringify(data).slice(0, 300));
    }
  });
}

findQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
