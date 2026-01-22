const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./leaderreps-pd-platform-firebase-adminsdk.json'))
  });
}
const db = admin.firestore();

(async () => {
  const userId = 'Njk0VesNQzaXhyDUqgHTqFBiRPx1';
  
  // Check all possible locations for wins data
  console.log('Checking users/{uid}/dailyLogs...');
  const logsSnap = await db.collection('users').doc(userId).collection('dailyLogs').limit(20).get();
  console.log('dailyLogs count:', logsSnap.size);
  logsSnap.docs.forEach(d => {
    const data = d.data();
    console.log('  -', d.id, '| keys:', Object.keys(data));
    if (data.morningBookend) {
      console.log('    morningBookend wins:', data.morningBookend.wins?.length || 0);
    }
  });
  
  console.log('\nChecking users/{uid} doc fields...');
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  console.log('User doc keys:', Object.keys(userData || {}));
  
  console.log('\nChecking developmentPlans/{uid}...');
  const devPlanDoc = await db.collection('developmentPlans').doc(userId).get();
  if (devPlanDoc.exists) {
    console.log('devPlan keys:', Object.keys(devPlanDoc.data() || {}));
  } else {
    console.log('No devPlan doc');
  }
  
  process.exit(0);
})();
