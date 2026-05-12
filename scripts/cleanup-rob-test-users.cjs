#!/usr/bin/env node
/**
 * Delete test users matching pattern: robMMDD<letter>@<domain>
 * (e.g. rob0314a@sagecg.com, rob0325a@sagecg.com)
 *
 * Deletes:
 *   - users/{uid} document + all subcollections
 *   - Firebase Auth account (if exists)
 *
 * Usage:
 *   node scripts/cleanup-rob-test-users.cjs            # DRY RUN (default)
 *   node scripts/cleanup-rob-test-users.cjs --execute  # actually delete
 */

const admin = require('firebase-admin');
const path = require('path');

const EXECUTE = process.argv.includes('--execute');
const SA = path.join(__dirname, '..', 'leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(require(SA)) });
const db = admin.firestore();
const auth = admin.auth();

// rob + 4 digits + 1+ letters @ anything (case-insensitive)
const PATTERN = /^rob\d{4}[a-z]+@/i;

async function deleteSubcollections(docRef) {
  const subs = await docRef.listCollections();
  for (const sub of subs) {
    const snap = await sub.get();
    let batch = db.batch();
    let count = 0;
    for (const d of snap.docs) {
      // Recurse into nested subcollections first
      await deleteSubcollections(d.ref);
      batch.delete(d.ref);
      count++;
      if (count % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    if (count % 400 !== 0) await batch.commit();
  }
}

(async () => {
  console.log(`\n${EXECUTE ? '🔥 EXECUTE' : '🧪 DRY RUN'} — pattern: ${PATTERN}\n`);
  const snap = await db.collection('users').get();
  const matches = [];
  snap.forEach(d => {
    const data = d.data() || {};
    const email = (data.email || '').trim();
    if (PATTERN.test(email)) {
      matches.push({ uid: d.id, email, name: data.name || data.displayName || '' });
    }
  });

  console.log(`Matched ${matches.length} users:`);
  matches.forEach(m => console.log(`  - ${m.email}  (${m.uid})`));

  if (!EXECUTE) {
    console.log(`\n[dry-run] Re-run with --execute to delete.\n`);
    process.exit(0);
  }

  console.log('\nDeleting…\n');
  let firestoreOk = 0, authOk = 0, authMissing = 0, errors = 0;
  for (const m of matches) {
    const ref = db.collection('users').doc(m.uid);
    try {
      await deleteSubcollections(ref);
      await ref.delete();
      firestoreOk++;
    } catch (e) {
      console.error(`  ✗ Firestore ${m.email}:`, e.message);
      errors++;
    }
    try {
      await auth.deleteUser(m.uid);
      authOk++;
    } catch (e) {
      if (e.code === 'auth/user-not-found') authMissing++;
      else { console.error(`  ✗ Auth ${m.email}:`, e.message); errors++; }
    }
    console.log(`  ✓ ${m.email}`);
  }
  console.log(`\nDone. Firestore: ${firestoreOk}/${matches.length}  Auth: ${authOk} (missing: ${authMissing})  Errors: ${errors}\n`);
  process.exit(errors ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
