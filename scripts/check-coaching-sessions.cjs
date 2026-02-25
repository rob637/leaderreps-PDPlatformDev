const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCoachingSessions() {
  // Check coaching_sessions for QS3
  const snap = await db.collection('coaching_sessions').get();
  
  console.log('Coaching sessions:', snap.size);
  snap.forEach(doc => {
    const data = doc.data();
    if (data.title?.includes('QS') || data.sessionTitle?.includes('QS') || JSON.stringify(data).includes('QS3')) {
      console.log(`coaching_sessions/${doc.id}:`, JSON.stringify(data).slice(0, 500));
    }
  });
  
  // Check coaching_session_types
  const typesSnap = await db.collection('coaching_session_types').get();
  console.log('\nCoaching session types:', typesSnap.size);
  typesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`  ${doc.id}:`, data.title || data.name || 'no title');
  });
  
  console.log('\nDone!');
}

checkCoachingSessions().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
