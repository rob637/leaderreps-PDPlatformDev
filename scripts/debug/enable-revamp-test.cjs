/**
 * Enable Ascent Revamp for ALL users in TEST environment.
 * Sets config/features.ascentRevamp = { enabled: true, cohorts: ['all'] }
 */
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.resolve(
  __dirname,
  '../../leaderreps-test-firebase-adminsdk.json'
));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

(async () => {
  const ref = db.collection('config').doc('features');
  const before = await ref.get();
  console.log('Before:', JSON.stringify(before.data()?.ascentRevamp || null, null, 2));

  await ref.set(
    { ascentRevamp: { enabled: true, cohorts: ['all'] } },
    { merge: true }
  );

  const after = await ref.get();
  console.log('After:', JSON.stringify(after.data()?.ascentRevamp, null, 2));
  console.log('✓ Ascent Revamp enabled for ALL users in TEST.');
})()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
