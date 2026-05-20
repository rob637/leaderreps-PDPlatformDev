#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
admin.initializeApp({
  credential: admin.credential.cert(require(path.join(ROOT, 'leaderreps-test-firebase-adminsdk.json'))),
  projectId: 'leaderreps-test',
});
const db = admin.firestore();
const email = (process.argv[2] || '').toLowerCase();
(async () => {
  const all = await db.collection('users').get();
  const userDoc = all.docs.find((d) => (d.data().email || '').toLowerCase() === email);
  if (!userDoc) { console.error('not found'); process.exit(2); }
  const u = userDoc.data();
  console.log('user.id:', userDoc.id);
  console.log('user.email:', u.email);
  console.log('user.cohortId:', u.cohortId);
  console.log('user.startDate:', u.startDate);
  console.log('user.foundationCompleted:', u.foundationCompleted);
  console.log('user.ascentApproved:', u.ascentApproved);
  console.log('user.graduated:', u.graduated);
  if (u.cohortId) {
    const cohort = await db.collection('cohorts').doc(u.cohortId).get();
    if (cohort.exists) {
      const c = cohort.data();
      console.log('\ncohort.id:', cohort.id);
      console.log('cohort.name:', c.name);
      console.log('cohort.startDate:', c.startDate);
      console.log('cohort.timezone:', c.timezone);
      const start = c.startDate?.toDate ? c.startDate.toDate() : new Date(c.startDate);
      const days = Math.floor((Date.now() - start.getTime()) / 86400000);
      console.log(`days since cohort start: ${days}`);
      console.log(`→ phase: ${days < 0 ? 'Onboarding' : days <= 55 ? 'Foundation' : 'Ascent'}`);
    } else {
      console.log('\ncohort doc missing for', u.cohortId);
    }
  }
  // also peek at devplan
  const dp = await db.collection('users').doc(userDoc.id).collection('developmentPlan').doc('current').get();
  if (dp.exists) {
    const d = dp.data();
    console.log('\ndevPlan.startDate:', d.startDate);
    console.log('devPlan.cohortId:', d.cohortId);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
