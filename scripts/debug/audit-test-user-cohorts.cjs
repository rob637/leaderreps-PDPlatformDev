/**
 * Audit users in TEST whose cohort reference points to a missing/invalid cohort,
 * or whose cohort doc has missing required fields used by useDailyPlan.
 *
 * Read-only.
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
  const cohortsSnap = await db.collection('cohorts').get();
  const cohorts = new Map();
  cohortsSnap.forEach((d) => cohorts.set(d.id, d.data() || {}));
  console.log(`Loaded ${cohorts.size} cohorts.`);

  const usersSnap = await db.collection('users').get();
  console.log(`Scanning ${usersSnap.size} users.\n`);

  let problems = 0;
  usersSnap.forEach((doc) => {
    const u = doc.data() || {};
    const cohortId = u.cohortId || u.currentCohortId;
    const issues = [];

    if (cohortId) {
      const c = cohorts.get(cohortId);
      if (!c) {
        issues.push(`cohortId="${cohortId}" not found in cohorts collection`);
      } else {
        if (!c.startDate) issues.push(`cohort "${cohortId}" missing startDate`);
        if (!c.name) issues.push(`cohort "${cohortId}" missing name`);
      }
    }

    if (issues.length) {
      problems++;
      console.log(`✗ user ${doc.id}  email="${u.email || ''}"`);
      issues.forEach((m) => console.log(`    - ${m}`));
    }
  });

  if (!problems) console.log('✓ No user/cohort reference issues.');
  else console.log(`\n${problems} user(s) with issues.`);
})()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
