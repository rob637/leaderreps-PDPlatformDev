const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-prod-firebase-adminsdk.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0320d@sagecg.com').get();
  if (usersSnap.empty) { console.log('User not found'); return; }
  const user = usersSnap.docs[0];
  console.log('User ID:', user.id);
  console.log('Cohort ID:', user.data().cohortId);
  
  if (user.data().cohortId) {
    const cohortSnap = await db.collection('cohorts').doc(user.data().cohortId).get();
    if (cohortSnap.exists) {
      const c = cohortSnap.data();
      console.log('Cohort:', c.name);
      const start = c.startDate?.toDate?.() || new Date(c.startDate);
      const end = c.endDate?.toDate?.() || new Date(c.endDate);
      const now = new Date();
      console.log('Start:', start);
      console.log('Now:', now);
      if (now < start) console.log('*** PHASE: pre-start - carryover will NOT show yet');
      else if (now > end) console.log('PHASE: post-program');
      else console.log('PHASE: start (active) - carryover SHOULD show');
    }
  } else {
    console.log('*** NO COHORT - user needs to be assigned to a cohort');
  }
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
