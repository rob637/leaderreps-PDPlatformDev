import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function run() {
  const miles = await db.collection('metadata').doc('development_journey').get();
  console.log(Object.keys(miles.data()));
  console.log(miles.data().milestone_2?.coachingSessionTypes);
  console.log(miles.data().milestone_3?.coachingSessionTypes);
  console.log(miles.data().milestone_4?.coachingSessionTypes);
}
run();
