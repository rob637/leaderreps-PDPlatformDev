const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUserProgress() {
  const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';
  
  // Check user state
  const userStateDoc = await db.collection('users').doc(userId).collection('dailyPractice').doc('state').get();
  console.log('=== USER STATE ===');
  if (userStateDoc.exists) {
    const state = userStateDoc.data();
    console.log('Daily Progress keys:', Object.keys(state.dailyProgress || {}));
    
    // Look for recent progress
    const dailyProgress = state.dailyProgress || {};
    for (const [key, value] of Object.entries(dailyProgress)) {
      if (value.itemsCompleted && value.itemsCompleted.length > 0) {
        console.log('Day', key, 'completed items:', value.itemsCompleted);
      }
    }
  } else {
    console.log('No state document');
  }
  
  // Check action progress
  const progressSnap = await db.collection('users').doc(userId).collection('actionProgress').get();
  console.log('\n=== ACTION PROGRESS ===');
  progressSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, ':', data.status, '-', data.label || data.title || '(no label)');
  });
  
  process.exit(0);
}

checkUserProgress();
