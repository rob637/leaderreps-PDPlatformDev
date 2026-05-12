const admin = require('firebase-admin');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require(path.join(process.cwd(), 'leaderreps-pd-platform-firebase-adminsdk.json'))) });
const db = admin.firestore();
(async () => {
  const snap = await db.doc('daily_plan_v2/foundation-content').get();
  const data = snap.data() || {};
  const actions = data.actions || [];
  console.log('Total actions:', actions.length);
  console.log('---');
  actions.slice(0, 60).forEach((a, i) => {
    console.log(i, JSON.stringify(a));
  });
  console.log('---');
  console.log('keys on doc:', Object.keys(data));
  console.log('_source:', JSON.stringify(data._source || null, null, 2));
})();
