
const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkPrepDays() {
  console.log('Checking Prep Days (1-14)...');

  // Check Day 14
  const day14Snap = await db.collection('daily_plan_v1')
    .where('dayNumber', '==', 14)
    .get();
  
  if (!day14Snap.empty) {
      const data = day14Snap.docs[0].data();
      console.log('Day 14 Found:');
      console.log('Week Number:', data.weekNumber);
      console.log('Actions:', data.actions ? data.actions.length : 0);
      if (data.actions) {
          data.actions.forEach(a => console.log(` - ${a.label} (Req: ${a.required})`));
      }
  } else {
      console.log('Day 14 NOT Found');
  }

  // Check Day 13
  const day13Snap = await db.collection('daily_plan_v1')
    .where('dayNumber', '==', 13)
    .get();
    
  if (!day13Snap.empty) {
      const data = day13Snap.docs[0].data();
      console.log('Day 13 Week Number:', data.weekNumber);
  }
}

checkPrepDays();
