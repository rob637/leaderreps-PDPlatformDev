const admin = require('firebase-admin');
const sa = require('./leaderreps-test-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function checkHistory() {
  const userId = 'QUA65XyWmrWnMVmecG4yhIWMop52';
  
  // Check daily_practice module
  const dpSnap = await db.doc(`modules/${userId}/daily_practice/current`).get();
  const dpData = dpSnap.data();
  
  console.log('=== Scorecard History ===');
  console.log(JSON.stringify(dpData.scorecardHistory, null, 2));
  
  console.log('\n=== Wins List (historical) ===');
  console.log(JSON.stringify(dpData.winsList, null, 2));
  
  console.log('\n=== Reps History ===');
  console.log(JSON.stringify(dpData.repsHistory, null, 2));
  
  console.log('\n=== Reflection History ===');
  console.log(JSON.stringify(dpData.reflectionHistory, null, 2));
  
  console.log('\n=== Streak History ===');
  console.log(JSON.stringify(dpData.streakHistory, null, 2));
  
  console.log('\n=== Date field ===');
  console.log('date:', dpData.date);
  console.log('lastUpdated:', dpData.lastUpdated);
  
  // Check if there are any subcollections with history
  const subcollections = await db.doc(`modules/${userId}/daily_practice/current`).listCollections();
  console.log('\n=== Subcollections ===');
  for (const subcol of subcollections) {
    console.log(`  - ${subcol.id}`);
    const subSnap = await subcol.limit(5).get();
    subSnap.docs.forEach(d => console.log(`    ${d.id}:`, JSON.stringify(d.data()).slice(0,100)));
  }
  
  process.exit(0);
}

checkHistory().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
