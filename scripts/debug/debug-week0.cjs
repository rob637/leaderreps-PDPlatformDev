
const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkWeek0() {
  console.log('Checking Week 0 Data...');

  // Check Daily Plan
  const dailySnap = await db.collection('daily_plan_v1')
    .where('weekNumber', '==', 0)
    .get();
  
  console.log(`Daily Plan Week 0 Days: ${dailySnap.size}`);
  dailySnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Day ${data.dayNumber} Actions:`, data.actions ? data.actions.length : 0);
    if (data.actions && data.actions.length > 0) {
        console.log('Sample Action:', JSON.stringify(data.actions[0], null, 2));
    }
  });

  // Check Legacy Plan
  const legacySnap = await db.collection('development_plan_v1')
    .where('weekNumber', '==', 0)
    .get();
    
  console.log(`Legacy Plan Week 0 Weeks: ${legacySnap.size}`);
  legacySnap.docs.forEach(doc => {
      const data = doc.data();
      console.log('Legacy Content Items:', data.content ? data.content.length : 0);
  });
  
  // Check Week -1 just in case
  const legacySnapNeg = await db.collection('development_plan_v1')
    .where('weekNumber', '==', -1)
    .get();
  console.log(`Legacy Plan Week -1 Weeks: ${legacySnapNeg.size}`);

}

checkWeek0();
