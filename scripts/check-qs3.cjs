const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findQS3() {
  // Search all days in daily_plan_v1 for QS3
  const snapshot = await db.collection('daily_plan_v1').get();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    (data.actions || []).forEach(a => {
      if (a.label && (a.label.includes('QS') || a.label.includes('Live'))) {
        console.log(doc.id, '-', a.id, '-', a.label, '- category:', a.category);
      }
    });
  });
}

findQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
