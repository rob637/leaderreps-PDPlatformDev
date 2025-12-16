const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function main() {
  // Get Week 1 full details
  const week1 = await db.collection('development_plan_v1').doc('100').get();
  if (week1.exists) {
    const data = week1.data();
    console.log('=== WEEK 1 FULL STRUCTURE ===');
    console.log('content count:', data.content?.length);
    console.log('reps count:', data.reps?.length);
    console.log('workouts count:', data.workouts?.length);
    
    if (data.content?.[0]) {
      console.log('\n=== SAMPLE CONTENT ===');
      console.log(JSON.stringify(data.content[0], null, 2));
    }
    
    if (data.reps?.[0]) {
      console.log('\n=== SAMPLE REP ===');
      console.log(JSON.stringify(data.reps[0], null, 2));
    }
    
    if (data.workouts?.[0]) {
      console.log('\n=== SAMPLE WORKOUT ===');
      console.log(JSON.stringify(data.workouts[0], null, 2));
    }
  }
}

main().then(() => process.exit(0));
