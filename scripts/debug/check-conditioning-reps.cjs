const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function checkConditioningReps() {
  const email = 'rob@sagecg.com';
  
  // Get user
  console.log(`Checking conditioning data for: ${email}`);
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();
  
  if (usersSnapshot.empty) {
    console.log('User not found');
    return;
  }
  
  const userDoc = usersSnapshot.docs[0];
  const uid = userDoc.id;
  console.log('UID:', uid);
  
  // Check user's cohortId
  const userData = userDoc.data();
  console.log('\n=== User Profile ===');
  console.log('cohortId:', userData.cohortId || 'NOT SET');
  console.log('displayName:', userData.displayName || userData.name);
  
  // Check development plan for cohortId
  const devPlanRef = db.doc(`user_data/${uid}/developmentPlan/current`);
  const devPlanSnap = await devPlanRef.get();
  if (devPlanSnap.exists) {
    const devPlan = devPlanSnap.data();
    console.log('\n=== Development Plan ===');
    console.log('cohortId:', devPlan.cohortId || 'NOT SET');
  }
  
  // Check conditioning_reps subcollection
  console.log('\n=== Conditioning Reps ===');
  const repsSnapshot = await db.collection(`users/${uid}/conditioning_reps`).get();
  console.log(`Total reps: ${repsSnapshot.size}`);
  
  if (repsSnapshot.empty) {
    console.log('No conditioning reps found');
  } else {
    repsSnapshot.forEach(doc => {
      const rep = doc.data();
      console.log(`\n--- Rep ID: ${doc.id} ---`);
      console.log('  status:', rep.status);
      console.log('  person:', rep.person);
      console.log('  repType:', rep.repType);
      console.log('  weekId:', rep.weekId);
      console.log('  cohortId:', rep.cohortId);
      console.log('  createdAt:', rep.createdAt?.toDate?.() || rep.createdAt);
      console.log('  updatedAt:', rep.updatedAt?.toDate?.() || rep.updatedAt);
      if (rep.completedAt) console.log('  completedAt:', rep.completedAt?.toDate?.() || rep.completedAt);
      if (rep.executedAt) console.log('  executedAt:', rep.executedAt?.toDate?.() || rep.executedAt);
      if (rep.debriefedAt) console.log('  debriefedAt:', rep.debriefedAt?.toDate?.() || rep.debriefedAt);
    });
  }
  
  // Check conditioning_weeks subcollection
  console.log('\n=== Conditioning Weeks ===');
  const weeksSnapshot = await db.collection(`users/${uid}/conditioning_weeks`).get();
  console.log(`Total weeks: ${weeksSnapshot.size}`);
  
  weeksSnapshot.forEach(doc => {
    const week = doc.data();
    console.log(`\n--- Week: ${doc.id} ---`);
    console.log('  totalRepsCompleted:', week.totalRepsCompleted);
    console.log('  requiredRepCompleted:', week.requiredRepCompleted);
    console.log('  cohortId:', week.cohortId);
  });
  
  // Check feature flags
  console.log('\n=== Feature Flags (Locker) ===');
  const featuresDoc = await db.collection('config').doc('features').get();
  const features = featuresDoc.data() || {};
  ['locker-conditioning-history', 'locker-reps-history', 'conditioning'].forEach(fid => {
    const val = features[fid];
    if (val === undefined) {
      console.log(`${fid}: NOT SET (defaults to enabled)`);
    } else if (typeof val === 'object') {
      console.log(`${fid}: enabled=${val.enabled}`);
    } else {
      console.log(`${fid}: ${val}`);
    }
  });
}

checkConditioningReps()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
