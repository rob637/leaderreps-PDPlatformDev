const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function checkPrepActions() {
  for (let i = 1; i <= 5; i++) {
    const dayId = 'day-' + String(i).padStart(3, '0');
    const doc = await db.collection('dailyPlan').doc(dayId).get();
    if (doc.exists) {
      const data = doc.data();
      console.log('\n=== ' + dayId + ' ===');
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach(a => {
          console.log('  - ' + a.id + ': ' + a.label);
          console.log('    required:', a.required, '| optional:', a.optional, '| enabled:', a.enabled);
        });
      } else {
        console.log('  (no actions)');
      }
    } else {
      console.log('\n=== ' + dayId + ' === NOT FOUND');
    }
  }
  process.exit(0);
}
checkPrepActions();
