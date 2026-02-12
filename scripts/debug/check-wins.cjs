const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const userQuery = await db.collection('users')
    .where('email', '==', 'rob7@test.com')
    .limit(1)
    .get();
    
  if (userQuery.empty) {
    console.log('User not found');
    return;
  }
  
  const userId = userQuery.docs[0].id;
  console.log('User ID:', userId);
  
  const dpDoc = await db.collection('dailyPractice').doc(userId).get();
  
  if (!dpDoc.exists) {
    console.log('No dailyPractice doc');
    return;
  }
  
  const data = dpDoc.data();
  
  console.log('\n=== Wins List (raw) ===');
  const winsList = data.winsList || [];
  console.log('Total wins entries:', winsList.length);
  
  const byDate = {};
  winsList.forEach(w => {
    const d = w.date || 'no-date';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(w);
  });
  
  console.log('\nUnique dates:', Object.keys(byDate).length);
  console.log('Dates:', Object.keys(byDate).sort().reverse());
  
  console.log('\n=== Reps History ===');
  const repsHistory = data.repsHistory || [];
  console.log('Total reps entries:', repsHistory.length);
  const repDates = repsHistory.map(r => r.date).filter(Boolean);
  console.log('Unique rep dates:', [...new Set(repDates)].length);
  console.log('Rep dates:', [...new Set(repDates)].sort().reverse());
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
