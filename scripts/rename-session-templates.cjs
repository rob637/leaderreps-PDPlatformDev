/**
 * Rename Session → Event in Communication Template Names
 *
 * Updates the `name` field on existing communication_templates docs to use
 * "Event Reminder" instead of "Session Reminder". Body content and IDs are
 * left untouched (IDs stay `coaching_*` for back-compat with Cloud Function
 * lookups).
 *
 * Usage:
 *   node scripts/rename-session-templates.cjs [--project=<project-id>]
 */

const admin = require('firebase-admin');
const path = require('path');

const args = process.argv.slice(2);
let projectId = 'leaderreps-pd-platform';

args.forEach((arg) => {
  if (arg.startsWith('--project=')) {
    projectId = arg.split('=')[1];
  }
});

const serviceAccountFiles = {
  'leaderreps-pd-platform': 'leaderreps-pd-platform-firebase-adminsdk.json',
  'leaderreps-test': 'leaderreps-test-firebase-adminsdk.json',
  'leaderreps-prod': 'leaderreps-prod-firebase-adminsdk.json',
};

const serviceAccountFile = serviceAccountFiles[projectId];
if (!serviceAccountFile) {
  console.error(`❌ Unknown project: ${projectId}`);
  process.exit(1);
}

const serviceAccount = require(path.join(__dirname, '..', serviceAccountFile));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId,
});

const db = admin.firestore();

const RENAMES = {
  coaching_reminder_leader_day_before: 'Event Reminder - Leader (24h)',
  coaching_reminder_leader_hour_before: 'Event Reminder - Leader (1h)',
  coaching_reminder_facilitator_day_before: 'Event Reminder - Facilitator (24h)',
  coaching_reminder_facilitator_hour_before: 'Event Reminder - Facilitator (1h)',
};

async function run() {
  console.log(`\n🔧 Renaming session → event templates in: ${projectId}\n`);

  let updated = 0;
  let missing = 0;

  for (const [id, name] of Object.entries(RENAMES)) {
    const ref = db.collection('communication_templates').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`   • ${id}: not found (skipped)`);
      missing += 1;
      continue;
    }
    await ref.update({ name, updatedAt: new Date().toISOString() });
    console.log(`   ✓ ${id}: → "${name}"`);
    updated += 1;
  }

  console.log(`\nDone. Updated ${updated}, missing ${missing}.\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
