const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';

async function checkAllData() {
  console.log('=== CHECKING ALL SUBCOLLECTIONS ===');
  
  // Check all dailyPractice documents
  const dpCol = await db.collection('users').doc(userId).collection('dailyPractice').get();
  console.log('\ndailyPractice documents:', dpCol.docs.map(d => d.id));
  
  for (const doc of dpCol.docs) {
    console.log(`\n--- dailyPractice/${doc.id} ---`);
    const data = doc.data();
    const keys = Object.keys(data);
    console.log('Keys:', keys);
    // Show sizes
    keys.forEach(k => {
      if (Array.isArray(data[k])) {
        console.log(`  ${k}: array with ${data[k].length} items`);
      } else if (typeof data[k] === 'object' && data[k] !== null) {
        console.log(`  ${k}: object with keys`, Object.keys(data[k]).slice(0, 5));
      } else {
        console.log(`  ${k}:`, data[k]);
      }
    });
  }
  
  // Check developmentPlan
  const devPlan = await db.collection('users').doc(userId).collection('developmentPlan').doc('current').get();
  if (devPlan.exists) {
    console.log('\n=== DEVELOPMENT PLAN ===');
    const data = devPlan.data();
    console.log('Keys:', Object.keys(data));
    console.log('activeWeekNumber:', data.activeWeekNumber);
    console.log('currentPhase:', data.currentPhase);
    console.log('currentDay:', data.currentDay);
  } else {
    console.log('\n=== NO DEVELOPMENT PLAN ===');
  }
}

checkAllData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
