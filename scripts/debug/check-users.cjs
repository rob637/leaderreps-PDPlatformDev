const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function main() {
  // Create a test cohort
  console.log('Creating test cohort...');
  
  // Start date is Dec 30, 2024 - 14 days from now
  const startDate = new Date('2024-12-30T12:00:00Z');
  
  const cohortRef = await db.collection('cohorts').add({
    name: 'Winter 2025 Leaders',
    description: 'First cohort of 2025 leadership development program',
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    facilitator: {
      name: 'Robert Pfleghardt',
      email: 'rob@leaderreps.com'
    },
    settings: {
      maxCapacity: 25,
      allowLateJoins: true,
      lateJoinCutoff: 3
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('Created cohort:', cohortRef.id);
  
  // Assign Robert to this cohort
  const userRef = db.doc('users/18BmIs35txM4VkyfxiycGcDvXIA3');
  await userRef.update({
    cohortId: cohortRef.id
  });
  
  // Also update dev plan start date
  const devPlanRef = db.doc('modules/18BmIs35txM4VkyfxiycGcDvXIA3/development_plan/current');
  await devPlanRef.update({
    startDate: admin.firestore.Timestamp.fromDate(startDate)
  });
  
  console.log('Assigned Robert to cohort and updated start date');
  
  // Verify
  const cohortSnap = await cohortRef.get();
  console.log('\nCohort data:', cohortSnap.data());
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
