const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();

async function fixCohort() {
  // Check dailyPlan collection
  const snap1 = await db.collection('dailyPlan').limit(5).get();
  console.log('dailyPlan collection:', snap1.size, 'docs');
  snap1.docs.forEach(d => console.log(' -', d.id));
  
  // Check daily_plan_days
  const snap2 = await db.collection('daily_plan_days').limit(5).get();
  console.log('\ndaily_plan_days collection:', snap2.size, 'docs');
  snap2.docs.forEach(d => console.log(' -', d.id));
  
  process.exit(0);
}

fixCohort();
