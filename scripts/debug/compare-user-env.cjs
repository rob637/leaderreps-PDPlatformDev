#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const env = process.argv[2];
const email = (process.argv[3] || '').toLowerCase();
const CRED = {
  dev: 'leaderreps-pd-platform-firebase-adminsdk.json',
  test: 'leaderreps-test-firebase-adminsdk.json',
  prod: 'leaderreps-prod-firebase-adminsdk.json',
};
const PID = { dev: 'leaderreps-pd-platform', test: 'leaderreps-test', prod: 'leaderreps-prod' };
if (!CRED[env] || !email) { console.error('usage: <dev|test|prod> <email>'); process.exit(1); }
admin.initializeApp({
  credential: admin.credential.cert(require(path.join(ROOT, CRED[env]))),
  projectId: PID[env],
});
const db = admin.firestore();
(async () => {
  console.log(`\n=== ${env.toUpperCase()} (${PID[env]}) ===`);
  const all = await db.collection('users').get();
  const userDoc = all.docs.find((d) => (d.data().email || '').toLowerCase() === email);
  if (!userDoc) { console.error('not found'); process.exit(2); }
  const u = userDoc.data();
  console.log('user.id:', userDoc.id);
  console.log('user.cohortId:', u.cohortId);
  console.log('user.startDate:', u.startDate);
  console.log('user.currentPhase:', u.currentPhase);
  console.log('user.foundationCompleted:', u.foundationCompleted);
  console.log('user.ascentApproved:', u.ascentApproved);
  console.log('user.graduated:', u.graduated);
  if (u.cohortId) {
    const cohort = await db.collection('cohorts').doc(u.cohortId).get();
    if (cohort.exists) {
      const c = cohort.data();
      console.log('\ncohort.id:', cohort.id);
      console.log('cohort.name:', c.name);
      const start = c.startDate?.toDate ? c.startDate.toDate() : new Date(c.startDate);
      console.log('cohort.startDate:', start.toISOString());
      const days = Math.floor((Date.now() - start.getTime()) / 86400000);
      console.log(`days since start: ${days}`);
    }
  }
  // dev plan
  const dp = await db.collection('users').doc(userDoc.id).collection('developmentPlan').doc('current').get();
  if (dp.exists) {
    const d = dp.data();
    console.log('\ndevPlan.startDate:', d.startDate);
    console.log('devPlan.cohortId:', d.cohortId);
  } else {
    console.log('\n(no developmentPlan/current)');
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
