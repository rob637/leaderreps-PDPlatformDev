const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkHistoryData() {
  // Find a user with history data - try rob
  const robQuery = await db.collection('users')
    .where('email', '==', 'rob@leaderreps.com')
    .limit(1)
    .get();
    
  if (robQuery.empty) {
    console.log('No user found');
    return;
  }
  
  const userId = robQuery.docs[0].id;
  console.log('User ID:', userId);
  
  // Check dailyPractice document for history
  const dpDoc = await db.collection('dailyPractice').doc(userId).get();
  
  if (!dpDoc.exists) {
    console.log('No dailyPractice doc');
    return;
  }
  
  const data = dpDoc.data();
  
  console.log('\n=== Wins List ===');
  const winsList = data.winsList || [];
  console.log(`Total wins: ${winsList.length}`);
  if (winsList.length > 0) {
    console.log('Sample wins:', winsList.slice(0, 5));
  }
  
  console.log('\n=== Reflection History ===');
  const reflections = data.reflectionHistory || [];
  console.log(`Total reflections: ${reflections.length}`);
  if (reflections.length > 0) {
    console.log('Sample reflections:', reflections.slice(0, 5));
  }
  
  console.log('\n=== Scorecard History ===');
  const scorecards = data.scorecardHistory || [];
  console.log(`Total scorecards: ${scorecards.length}`);
  
  console.log('\n=== Reps History ===');
  const reps = data.repsHistory || [];
  console.log(`Total reps history: ${reps.length}`);
}

checkHistoryData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
