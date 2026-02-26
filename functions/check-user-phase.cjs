const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  
  // Check both users
  const emails = ['rob+224l@sagecg.com', 'rob@sagecg.com'];
  
  for (const email of emails) {
    const usersSnap = await db.collection('users').where('email', '==', email).get();
    
    for (const doc of usersSnap.docs) {
      const data = doc.data();
      console.log(`\n=== ${email} ===`);
      console.log('cohortId:', data.cohortId);
      console.log('prepStatus:', JSON.stringify(data.prepStatus, null, 2));
      
      // Check cohort
      if (data.cohortId) {
        const cohortSnap = await db.collection('cohorts').doc(data.cohortId).get();
        if (cohortSnap.exists) {
          const cohort = cohortSnap.data();
          console.log('cohort startDate:', cohort.startDate);
          console.log('cohort name:', cohort.name);
        }
      }
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
