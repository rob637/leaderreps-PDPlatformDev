const admin = require('firebase-admin');

// Initialize both apps
const testSa = require('./leaderreps-test-firebase-adminsdk.json');
const devSa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

const testApp = admin.initializeApp({ credential: admin.credential.cert(testSa) }, 'test');
const devApp = admin.initializeApp({ credential: admin.credential.cert(devSa) }, 'dev');

const testDb = testApp.firestore();
const devDb = devApp.firestore();

async function copyDailyPlanData() {
  console.log('=== Copying Daily Plan Data from Test to Dev ===\n');
  
  // 1. Copy daily_plan_v1 collection
  console.log('1. Copying daily_plan_v1 collection...');
  const dailyPlanSnap = await testDb.collection('daily_plan_v1').get();
  console.log(`   Found ${dailyPlanSnap.size} documents`);
  
  let count = 0;
  for (const doc of dailyPlanSnap.docs) {
    await devDb.collection('daily_plan_v1').doc(doc.id).set(doc.data());
    count++;
    if (count % 10 === 0 || count === dailyPlanSnap.size) {
      console.log(`   - Copied ${count}/${dailyPlanSnap.size} documents...`);
    }
  }
  
  // 2. Copy daily_reps_library if it exists
  console.log('\n2. Copying daily_reps_library collection...');
  const repsSnap = await testDb.collection('daily_reps_library').get();
  console.log(`   Found ${repsSnap.size} documents`);
  
  count = 0;
  for (const doc of repsSnap.docs) {
    await devDb.collection('daily_reps_library').doc(doc.id).set(doc.data());
    count++;
    if (count % 10 === 0 || count === repsSnap.size) {
      console.log(`   - Copied ${count}/${repsSnap.size} documents...`);
    }
  }
  
  // 3. Copy development_plan_v1 if it exists
  console.log('\n3. Copying development_plan_v1 collection...');
  const devPlanSnap = await testDb.collection('development_plan_v1').get();
  console.log(`   Found ${devPlanSnap.size} documents`);
  
  count = 0;
  for (const doc of devPlanSnap.docs) {
    await devDb.collection('development_plan_v1').doc(doc.id).set(doc.data());
    count++;
    if (count % 10 === 0 || count === devPlanSnap.size) {
      console.log(`   - Copied ${count}/${devPlanSnap.size} documents...`);
    }
  }
  
  console.log('\n=== Done! ===');
  console.log('\nYou should now be able to log in as rob@sagecg.com on dev.');
  console.log('Clear your browser cache/storage first if still having issues.');
  process.exit(0);
}

copyDailyPlanData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
