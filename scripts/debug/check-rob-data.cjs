const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUser() {
  // Find the user by email
  const usersSnap = await db.collection('users').where('email', '==', 'rob@sagecg.com').get();
  
  if (usersSnap.empty) {
    console.log('No user found with email rob@sagecg.com');
    return;
  }
  
  for (const doc of usersSnap.docs) {
    console.log('=== USER PROFILE ===');
    console.log('Doc ID:', doc.id);
    const data = doc.data();
    console.log(JSON.stringify(data, null, 2));
    
    // Check dailyPractice subcollection
    console.log('\n=== DAILY PRACTICE DATA ===');
    const dpSnap = await db.collection('users').doc(doc.id).collection('dailyPractice').doc('data').get();
    if (dpSnap.exists) {
      const dpData = dpSnap.data();
      console.log('repsHistory count:', dpData.repsHistory?.length || 0);
      console.log('Last 5 reps entries:', JSON.stringify(dpData.repsHistory?.slice(-5), null, 2));
      
      // Check for any unusual data
      if (dpData.repsHistory) {
        const badEntries = dpData.repsHistory.filter(e => !e.date || typeof e.completedCount !== 'number');
        if (badEntries.length > 0) {
          console.log('BAD ENTRIES FOUND:', badEntries.length);
          console.log(JSON.stringify(badEntries.slice(0, 3), null, 2));
        }
      }
    } else {
      console.log('No dailyPractice/data document');
    }
  }
}

checkUser().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
