const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}

const db = admin.firestore();

async function check() {
  // Get Ryan's conditioning reps
  const ryanQuery = await db.collection('users')
    .where('email', '==', 'ryan@leaderreps.com')
    .get();
    
  if (ryanQuery.empty) {
    console.log('Ryan not found');
    process.exit(1);
  }
  
  const ryanId = ryanQuery.docs[0].id;
  const ryanData = ryanQuery.docs[0].data();
  console.log('Ryan userId:', ryanId);
  console.log('Ryan cohortId:', ryanData.cohortId);
  console.log('');
  
  const repsSnap = await db.collection('users').doc(ryanId).collection('conditioning_reps').get();
  
  console.log('Ryan conditioning_reps:');
  console.log('========================');
  repsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`  ${d.id}:`);
    console.log(`    weekId: ${data.weekId}`);
    console.log(`    cohortId: ${data.cohortId}`);
    console.log(`    status: ${data.status}`);
    console.log(`    person: ${data.person}`);
    console.log(`    createdAt: ${data.createdAt?.toDate?.()?.toISOString()?.slice(0,10) || 'N/A'}`);
    console.log('');
  });
  
  // What's the current week ID?
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now - startOfYear;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.ceil((diff / oneWeek) + startOfYear.getDay() / 7);
  console.log(`Current week ID calculation: ${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`);
  
  // Also show ISO week
  const date = new Date();
  const jan4 = new Date(date.getFullYear(), 0, 4);
  const dayDiff = (date - jan4) / 86400000;
  const isoWeek = Math.ceil((dayDiff + jan4.getDay() + 1) / 7);
  console.log(`ISO week: ${date.getFullYear()}-W${String(isoWeek).padStart(2, '0')}`);
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
