const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  // Check legacy dev plan structure - Week 1
  const week1 = await db.collection('development_plan_v1').doc('week-01').get();
  console.log('=== LEGACY DEV PLAN WEEK 1 ===');
  if (week1.exists) {
    const data = week1.data();
    console.log('Fields:', Object.keys(data));
    console.log('weekNumber:', data.weekNumber);
    console.log('title:', data.title);
    console.log('topics count:', data.topics?.length);
    console.log('dailyReps count:', data.dailyReps?.length);
    if (data.topics?.[0]) {
      console.log('Sample topic:', JSON.stringify(data.topics[0], null, 2));
    }
    if (data.dailyReps?.[0]) {
      console.log('Sample dailyRep:', JSON.stringify(data.dailyReps[0], null, 2));
    }
  } else {
    console.log('Document does not exist');
    // Try numeric ID
    const numericWeek = await db.collection('development_plan_v1').doc('1').get();
    if (numericWeek.exists) {
      console.log('Found as numeric ID "1"');
      console.log(JSON.stringify(numericWeek.data(), null, 2));
    }
  }
  
  // List all docs
  console.log('\n=== ALL LEGACY DOCS ===');
  const all = await db.collection('development_plan_v1').get();
  all.forEach(doc => {
    const d = doc.data();
    console.log(`Doc ${doc.id}: weekNumber=${d.weekNumber}, title="${(d.title || '').substring(0,40)}..."`);
  });
}

main().then(() => process.exit(0));
