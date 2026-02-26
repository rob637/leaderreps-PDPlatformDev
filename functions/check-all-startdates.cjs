const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  const uid = 'UIEBLtWIB5U4pbpiH5N8G5OW28v2'; // rob+224l@sagecg.com
  
  // Check user doc
  const userDoc = await db.doc(`users/${uid}`).get();
  if (userDoc.exists) {
    console.log('users/ startDate:', userDoc.data().startDate);
  }
  
  // Check dev plan
  const devPlanDoc = await db.doc(`modules/${uid}/development_plan/current`).get();
  if (devPlanDoc.exists) {
    console.log('dev_plan startDate:', devPlanDoc.data().startDate);
  }
  
  // Check user_state
  const userStateDoc = await db.doc(`user_data/${uid}/user_state/current`).get();
  if (userStateDoc.exists) {
    console.log('user_state startDate:', userStateDoc.data().startDate);
    console.log('user_state prepVisitLog:', userStateDoc.data().prepVisitLog);
  } else {
    console.log('No user_state document');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
