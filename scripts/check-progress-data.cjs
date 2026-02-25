const admin = require('firebase-admin');
admin.apps.forEach(app => app.delete());

const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function checkProgressData() {
  // Check modules collection for action_progress
  const userId = 'Obis5aK9ZhaYd48QL8vtjCpW7153'; // From screenshot logs
  
  console.log('Checking modules for user:', userId);
  
  // Check action_progress subcollection under modules
  const apRef = db.collection('modules').doc(userId).collection('action_progress');
  const apSnap = await apRef.get();
  
  console.log(`\naction_progress documents: ${apSnap.size}`);
  apSnap.forEach(doc => {
    const data = doc.data();
    const dataStr = JSON.stringify(data);
    if (dataStr.includes('QS3') || dataStr.includes('QS') || doc.id.includes('coaching')) {
      console.log(`  ${doc.id}:`, data);
    }
  });
  
  // Also check the modules/<userId>/daily_progress
  const dpRef = db.collection('modules').doc(userId).collection('daily_progress');
  const dpSnap = await dpRef.get();
  
  console.log(`\ndaily_progress documents: ${dpSnap.size}`);
  dpSnap.forEach(doc => {
    const dataStr = JSON.stringify(doc.data());
    if (dataStr.includes('QS3')) {
      console.log(`  ${doc.id}:`, dataStr.slice(0, 400));
    }
  });
  
  // Check action progress at root user level
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  console.log('\nUser actionProgress keys:', Object.keys(userData.actionProgress || {}));
  
  // Check each key for QS3
  if (userData.actionProgress) {
    Object.entries(userData.actionProgress).forEach(([key, value]) => {
      if (key.includes('QS') || key.includes('coaching') || JSON.stringify(value).includes('QS3')) {
        console.log(`  ${key}:`, value);
      }
    });
  }
  
  console.log('\nDone!');
}

checkProgressData().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
