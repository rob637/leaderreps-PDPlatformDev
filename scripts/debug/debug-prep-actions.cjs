const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log('=== Checking Prep Phase Actions ===\n');
  
  // Get all prep days (weekNumber < 1)
  const snapshot = await db.collection('daily_plan_v1').orderBy('dayNumber', 'asc').get();
  
  const prepDays = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(d => d.weekNumber < 1);
  
  console.log('Prep Days found:', prepDays.length);
  
  let totalActions = 0;
  prepDays.forEach(day => {
    const actions = day.actions || [];
    if (actions.length > 0) {
      console.log(`\nDay ${day.dayNumber} (Week ${day.weekNumber}):`);
      actions.forEach((a, i) => {
        console.log(`  ${i+1}. ${a.id || 'NO ID'} | "${a.label}" | required: ${a.required !== false}`);
        totalActions++;
      });
    }
  });
  
  console.log(`\nTotal prep actions: ${totalActions}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
