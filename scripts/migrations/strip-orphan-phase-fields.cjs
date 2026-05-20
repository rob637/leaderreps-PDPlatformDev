/**
 * Strip orphan fields from daily_plan_v2 phase docs.
 *
 * Removes: skills, pillars, coachingSessionTypes, communitySessionTypes
 *
 * These fields were defined in the original three-phase model but never
 * consumed by any widget or screen. PhaseContentManager UI for them was
 * removed May 2026; this script cleans the Firestore data to match.
 *
 * Usage:
 *   node scripts/migrations/strip-orphan-phase-fields.cjs --env=dev
 *   node scripts/migrations/strip-orphan-phase-fields.cjs --env=test
 *   node scripts/migrations/strip-orphan-phase-fields.cjs --env=dev --dry-run
 */
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const envArg = (args.find((a) => a.startsWith('--env=')) || '--env=dev').split('=')[1];
const dryRun = args.includes('--dry-run');

if (envArg === 'prod') {
  console.error('❌ Blocked from running against production.');
  process.exit(1);
}

const SA = {
  dev: '../../leaderreps-pd-platform-firebase-adminsdk.json',
  test: '../../leaderreps-test-firebase-adminsdk.json',
};
if (!SA[envArg]) {
  console.error(`❌ Unknown env: ${envArg}`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(SA[envArg])) });
const db = admin.firestore();

const FIELDS_TO_REMOVE = [
  'skills',
  'pillars',
  'coachingSessionTypes',
  'communitySessionTypes',
];

const DOCS = ['foundation-content', 'ascent-content'];

(async () => {
  console.log(`\nEnvironment: ${envArg}${dryRun ? ' (dry run)' : ''}`);
  console.log(`Stripping fields: ${FIELDS_TO_REMOVE.join(', ')}\n`);

  for (const id of DOCS) {
    const ref = db.collection('daily_plan_v2').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`daily_plan_v2/${id}: MISSING — skipping`);
      continue;
    }
    const data = snap.data() || {};
    const present = FIELDS_TO_REMOVE.filter((f) => f in data);
    if (present.length === 0) {
      console.log(`daily_plan_v2/${id}: already clean`);
      continue;
    }
    console.log(`daily_plan_v2/${id}: removing ${present.join(', ')}`);
    if (!dryRun) {
      const update = {};
      for (const f of present) update[f] = admin.firestore.FieldValue.delete();
      await ref.update(update);
      console.log(`  ✓ updated`);
    }
  }

  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
