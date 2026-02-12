const admin = require('firebase-admin');

const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function resetPrepVisitLog() {
  const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';
  
  // Correct path: modules/{userId}/development_plan/current
  const path = `modules/${userId}/development_plan/current`;
  console.log('Checking:', path);
  
  const ref = db.doc(path);
  const doc = await ref.get();
  
  if (doc.exists) {
    const data = doc.data();
    console.log('Current prepVisitLog:', JSON.stringify(data.prepVisitLog || 'not present'));
    console.log('All keys:', Object.keys(data).join(', '));
    
    if (data.prepVisitLog) {
      await ref.update({ prepVisitLog: [] });
      console.log('✅ Reset prepVisitLog to empty array!');
    } else {
      console.log('No prepVisitLog found - will be created on first visit');
    }
  } else {
    console.log('Document not found at', path);
  }
  
  process.exit(0);
}

resetPrepVisitLog().catch(console.error);
