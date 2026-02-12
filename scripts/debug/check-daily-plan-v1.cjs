const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function main() {
  console.log('=== daily_plan_v1 collection ===');
  const snapshot = await db.collection('daily_plan_v1')
    .where('phase', '==', 'pre-start')
    .get();
  
  console.log(`Found ${snapshot.size} prep phase days`);
  
  snapshot.forEach(doc => {
    const day = doc.data();
    console.log(`\nDay: ${doc.id} (dayNumber: ${day.dayNumber})`);
    if (day.actions) {
      console.log(`  Actions: ${day.actions.length}`);
      day.actions.forEach((action, idx) => {
        const isRequired = action.required === true || (action.required !== false && action.optional !== true);
        const isDailyRep = action.type === 'daily_rep';
        console.log(`    [${idx}] id="${action.id}" label="${action.label}"`);
        console.log(`         type=${action.type} required=${action.required} optional=${action.optional} => counted=${isRequired && !isDailyRep}`);
      });
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
