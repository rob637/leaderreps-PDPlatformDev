#!/usr/bin/env node
// Reset Foundation/Ascent flags on a single user in TEST so the phase
// override turns off and they fall back to calendar-driven phase logic.
//
// Usage:
//   node scripts/debug/reset-user-phase-test.cjs rob@sagecg.com           # show only
//   node scripts/debug/reset-user-phase-test.cjs rob@sagecg.com --apply   # write

const admin = require('firebase-admin');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const email = process.argv[2];
const apply = process.argv.includes('--apply');
if (!email) {
  console.error('Usage: node scripts/debug/reset-user-phase-test.cjs <email> [--apply]');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.join(ROOT, 'leaderreps-test-firebase-adminsdk.json'))),
  projectId: 'leaderreps-test',
});
const db = admin.firestore();

(async () => {
  const lc = email.toLowerCase();
  const snap = await db.collection('users').where('email', '==', lc).get();
  if (snap.empty) {
    // try any-case match by scanning (test envs only)
    const all = await db.collection('users').get();
    const match = all.docs.find((d) => (d.data().email || '').toLowerCase() === lc);
    if (!match) {
      console.error(`No user found in TEST with email ${email}`);
      process.exit(2);
    }
    snap.docs = [match];
  }
  for (const doc of snap.docs) {
    const u = doc.data();
    console.log(`\nuser: ${doc.id}  email=${u.email}`);
    console.log(`   graduated:           ${u.graduated}`);
    console.log(`   foundationCompleted: ${u.foundationCompleted}`);
    console.log(`   ascentApproved:      ${u.ascentApproved}`);
    console.log(`   currentPhase (raw):  ${u.currentPhase || '(none)'}`);

    if (!apply) {
      console.log('   (dry-run — pass --apply to clear graduated/foundationCompleted/ascentApproved)');
      continue;
    }

    await doc.ref.update({
      graduated: false,
      foundationCompleted: false,
      ascentApproved: false,
      _phaseResetAt: admin.firestore.FieldValue.serverTimestamp(),
      _phaseResetBy: 'reset-user-phase-test.cjs',
    });
    console.log('   ✅ flags cleared');
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
