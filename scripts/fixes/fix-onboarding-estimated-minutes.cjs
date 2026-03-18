/**
 * fix-onboarding-estimated-minutes.cjs
 * 
 * Adds estimatedMinutes to onboarding-config and session1-config items that are missing it.
 * 
 * Usage: node scripts/fixes/fix-onboarding-estimated-minutes.cjs [--env=dev|test|prod]
 */
const admin = require('firebase-admin');
const path = require('path');

const args = process.argv.slice(2);
const envArg = args.find(a => a.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : 'dev';

const saFiles = {
  dev: 'leaderreps-pd-platform-firebase-adminsdk.json',
  test: 'leaderreps-test-firebase-adminsdk.json',
  prod: 'leaderreps-prod-firebase-adminsdk.json'
};

const saFile = saFiles[env];
if (!saFile) { console.error('Invalid env:', env); process.exit(1); }

const sa = require(path.resolve(__dirname, '../../', saFile));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Estimated minutes for each item (by ID or label)
const ESTIMATED_MINUTES = {
  'action-1772035307572': { label: 'Watch Onboarding Videos', minutes: 15 },
  'action-1772035329163': { label: 'Complete Leader Profile', minutes: 5 },
  'action-1772035347712': { label: 'Complete Leadership Skills Baseline', minutes: 10 },
  'action-1773447952107': { label: 'Set Notifications', minutes: 2 },
  'action-1772034994580': { label: 'Watch Session 1 Prep Video', minutes: 10 },
};

async function fixConfig(docId) {
  const ref = db.collection('daily_plan_v1').doc(docId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.log(`  ${docId}: not found, skipping`);
    return;
  }
  const data = snap.data();
  const actions = data.actions || [];
  let updated = 0;

  const newActions = actions.map(action => {
    if (action.estimatedMinutes) return action; // Already has it
    const fix = ESTIMATED_MINUTES[action.id];
    if (fix) {
      console.log(`  ${docId}: Adding ${fix.minutes} min to "${fix.label}"`);
      updated++;
      return { ...action, estimatedMinutes: fix.minutes };
    }
    return action;
  });

  if (updated > 0) {
    await ref.update({ actions: newActions, updatedAt: new Date() });
    console.log(`  ${docId}: Updated ${updated} items`);
  } else {
    console.log(`  ${docId}: No items needed updating`);
  }
}

async function main() {
  console.log(`\n🔧 Fixing estimatedMinutes on ${env.toUpperCase()}...\n`);
  await fixConfig('onboarding-config');
  await fixConfig('session1-config');
  console.log('\n✅ Done\n');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
