const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  // Find user rob44@test.com
  const usersSnap = await db.collection('users').where('email', '==', 'rob44@test.com').get();
  
  if (usersSnap.empty) {
    console.log('User rob44@test.com not found');
    process.exit(1);
  }
  
  const user = usersSnap.docs[0].data();
  console.log('User cohortId:', user.cohortId);
  
  // Get cohort
  if (user.cohortId) {
    const cohortDoc = await db.collection('cohorts').doc(user.cohortId).get();
    if (cohortDoc.exists) {
      const cohort = cohortDoc.data();
      console.log('Cohort startDate:', cohort.startDate);
      
      // Calculate day number
      const now = new Date();
      const startDate = cohort.startDate?.toDate?.() || new Date(cohort.startDate);
      const diffTime = now - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      console.log('Calculated day number:', diffDays + 1); // Day 1 = first day
    }
  }
  
  process.exit(0);
}

check().catch(console.error);
