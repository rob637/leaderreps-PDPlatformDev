const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function check() {
  // Check days 15-21 (week 1 of START phase)
  for (let day = 15; day <= 21; day++) {
    const dayId = 'day-' + String(day).padStart(3, '0');
    const doc = await db.collection('daily_plan_v1').doc(dayId).get();
    if (doc.exists) {
      const d = doc.data();
      console.log(dayId, '- weekNumber:', d.weekNumber, '- dayOfWeek:', d.dayOfWeek, '- actions:', (d.actions || []).length);
    }
  }
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
