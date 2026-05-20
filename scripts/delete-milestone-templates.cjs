/**
 * Delete Milestone Communication Templates
 *
 * Removes the unused `milestone_completion` and `graduation` templates from
 * the `communication_templates` collection. Milestones and program graduation
 * are no longer part of the product.
 *
 * Usage:
 *   node scripts/delete-milestone-templates.cjs [--project=<project-id>]
 *
 * Options:
 *   --project=leaderreps-pd-platform  (DEV - default)
 *   --project=leaderreps-test         (TEST)
 *   --project=leaderreps-prod         (PROD)
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
  console.error(`   Valid options: ${Object.keys(serviceAccountFiles).join(', ')}`);
  process.exit(1);
}

const serviceAccount = require(path.join(__dirname, '..', serviceAccountFile));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId,
});

const db = admin.firestore();

const TEMPLATE_IDS = ['milestone_completion', 'graduation'];

async function run() {
  console.log(`\n🗑️  Deleting milestone templates from: ${projectId}\n`);

  let deleted = 0;
  let missing = 0;

  for (const id of TEMPLATE_IDS) {
    const ref = db.collection('communication_templates').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`   • ${id}: not found (skipped)`);
      missing += 1;
      continue;
    }
    await ref.delete();
    console.log(`   ✓ ${id}: deleted`);
    deleted += 1;
  }

  console.log(`\nDone. Deleted ${deleted}, missing ${missing}.\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
