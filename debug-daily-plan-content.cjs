const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkPlan() {
  // Check daily_plan_v1
  const snapshot = await db.collection('daily_plan_v1').where('dayNumber', '==', 1).get();
  if (snapshot.empty) {
      console.log('No Day 1 in daily_plan_v1');
  } else {
      snapshot.forEach(doc => {
          console.log('Found Day 1 in daily_plan_v1:', doc.id);
          const data = doc.data();
          if (data.actions) {
              data.actions.forEach(action => {
                  console.log('Action:', action.label, 'ResourceID:', action.resourceId);
              });
          }
      });
  }
}

checkPlan();
