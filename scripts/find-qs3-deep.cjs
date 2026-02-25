const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deepSearch() {
  // List all collections
  const collections = await db.listCollections();
  console.log('Collections:', collections.map(c => c.id).join(', '));
  
  // Search for QS3 in each collection
  for (const col of collections) {
    const snapshot = await col.limit(50).get();
    snapshot.forEach(doc => {
      const data = JSON.stringify(doc.data());
      if (data.includes('QS3') || data.includes('Live QS')) {
        console.log(`\n${col.id}/${doc.id}:`, data.slice(0, 500));
      }
    });
  }
  
  // Also check daily_plan_v1 for milestones (documents with type: milestone)
  const dpSnap = await db.collection('daily_plan_v1').get();
  dpSnap.forEach(doc => {
    const data = doc.data();
    if (data.type === 'milestone' || data.actions?.some(a => a.label?.includes('QS') || a.label?.includes('Live Q'))) {
      console.log(`\ndaily_plan_v1/${doc.id}:`, JSON.stringify(data).slice(0, 400));
    }
  });
}

deepSearch().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
