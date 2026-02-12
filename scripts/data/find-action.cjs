
const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findAction() {
  console.log('Searching for "Watch QS S1 Prep Video"...');
  
  // Search daily_plan_v1
  const dailySnap = await db.collection('daily_plan_v1').get();
  dailySnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.actions) {
          data.actions.forEach(a => {
              if (a.label && a.label.includes('Watch QS S1 Prep Video')) {
                  console.log(`Found in Daily Plan Day ${data.dayNumber} (Week ${data.weekNumber})`);
              }
          });
      }
  });

  // Search development_plan_v1
  const devSnap = await db.collection('development_plan_v1').get();
  devSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.content) {
          data.content.forEach(c => {
              if (c.label && c.label.includes('Watch QS S1 Prep Video')) {
                  console.log(`Found in Legacy Plan Week ${data.weekNumber} (ID: ${doc.id})`);
              }
          });
      }
  });
}

findAction();
