#!/usr/bin/env node
/**
 * Three-Phase Refactor — Commit 4
 * User data wipe & seed (DEV ONLY).
 *
 * What this does, per user in `users/`:
 *   1. Backup full doc + listed subcollections to data-exports/users-dev-pre-c4-<ts>.json
 *   2. Delete legacy day/milestone gating fields
 *   3. Delete legacy day-based subcollections (daily_logs, daily_practice,
 *      dailyPractice, pulse_checks, reps_light)
 *   4. Seed `phaseKey` based on prep + foundation/ascent flags
 *      - graduated || (foundationCompleted && ascentApproved) → 'ascent'
 *      - prepStatus.isComplete                                → 'foundation'
 *      - else                                                  → 'onboarding'
 *
 * Preserves:
 *   - profile, displayName, email, photoURL, role, adminLevel, isAdmin
 *   - cohortId, prepStatus, foundationCommitment, foundationCompleted/At/By
 *   - ascentApproved/At/By, graduated/At, ascentWelcomeShown
 *   - notificationSettings, dismissedAnnouncements, sessionAttendance
 *   - Subcollections: action_progress, videoProgress, rep_drafts, anchors,
 *     ascent_journey, commitment_data, developmentPlan, conditioning_*
 *
 * SAFETY:
 *   - Refuses to run unless --confirm-dev is passed
 *   - Hard-coded to leaderreps-pd-platform service account
 *   - Dry-run by default; pass --apply to write
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const SERVICE_ACCOUNT_PATH = path.resolve(
  __dirname,
  '../../leaderreps-pd-platform-firebase-adminsdk.json'
);
const EXPECTED_PROJECT = 'leaderreps-pd-platform';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const CONFIRMED = args.includes('--confirm-dev');

if (!CONFIRMED) {
  console.error('REFUSING TO RUN — pass --confirm-dev to acknowledge dev-only scope.');
  process.exit(1);
}

const sa = require(SERVICE_ACCOUNT_PATH);
if (sa.project_id !== EXPECTED_PROJECT) {
  console.error(`Service account project_id=${sa.project_id}, expected ${EXPECTED_PROJECT}. Aborting.`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Fields to delete from each user doc (legacy day/milestone gating)
const FIELDS_TO_DELETE = [
  'milestoneProgress',
  'currentDayNumber',
  'currentMilestone',
  'unlockedContentIds',
  'unlockedDays',
  'currentWeek',
  'weekProgress',
  'dayProgress',
];

// Subcollections to delete entirely (legacy day-based logs)
const SUBCOLLECTIONS_TO_DELETE = [
  'daily_logs',
  'daily_practice',
  'dailyPractice',
  'pulse_checks',
  'reps_light',
];

// Subcollections to back up before any change (in addition to top-level doc)
const SUBCOLLECTIONS_TO_BACKUP = [
  ...SUBCOLLECTIONS_TO_DELETE,
  'action_progress',
];

function derivePhaseKey(user) {
  const graduated = user.graduated === true;
  const foundationDone = user.foundationCompleted === true;
  const ascentApproved = user.ascentApproved === true;
  if (graduated || (foundationDone && ascentApproved)) return 'ascent';
  const prepComplete = user.prepStatus && user.prepStatus.isComplete === true;
  if (prepComplete) return 'foundation';
  return 'onboarding';
}

async function backupSubcollection(userRef, name) {
  const snap = await userRef.collection(name).get();
  if (snap.empty) return null;
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function deleteSubcollection(userRef, name) {
  const snap = await userRef.collection(name).get();
  if (snap.empty) return 0;
  const docs = snap.docs;
  const writer = db.bulkWriter();
  docs.forEach((d) => writer.delete(d.ref));
  await writer.close();
  return docs.length;
}

(async () => {
  const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const backupPath = path.resolve(
    __dirname,
    `../../data-exports/users-dev-pre-c4-${ts}.json`
  );

  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} users in dev (${EXPECTED_PROJECT}).`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log('');

  const backup = { timestamp: ts, project: EXPECTED_PROJECT, users: {} };
  const phaseTally = { onboarding: 0, foundation: 0, ascent: 0 };
  const fieldDeletionsTally = {};
  const subDeletionsTally = {};

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const userBackup = { doc: data, subcollections: {} };
    for (const sub of SUBCOLLECTIONS_TO_BACKUP) {
      const rows = await backupSubcollection(doc.ref, sub);
      if (rows) userBackup.subcollections[sub] = rows;
    }
    backup.users[doc.id] = userBackup;

    const updates = {};
    for (const f of FIELDS_TO_DELETE) {
      if (Object.prototype.hasOwnProperty.call(data, f)) {
        updates[f] = admin.firestore.FieldValue.delete();
        fieldDeletionsTally[f] = (fieldDeletionsTally[f] || 0) + 1;
      }
    }

    const newPhaseKey = derivePhaseKey(data);
    if (data.phaseKey !== newPhaseKey) {
      updates.phaseKey = newPhaseKey;
    }
    phaseTally[newPhaseKey]++;

    if (APPLY) {
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
      }
      for (const sub of SUBCOLLECTIONS_TO_DELETE) {
        const n = await deleteSubcollection(doc.ref, sub);
        if (n > 0) subDeletionsTally[sub] = (subDeletionsTally[sub] || 0) + n;
      }
    } else {
      // Dry-run: just count what *would* be deleted
      for (const sub of SUBCOLLECTIONS_TO_DELETE) {
        const snap = await doc.ref.collection(sub).get();
        if (!snap.empty) {
          subDeletionsTally[sub] = (subDeletionsTally[sub] || 0) + snap.size;
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup written: ${backupPath}`);
  console.log('');
  console.log('Phase distribution (post-seed):', phaseTally);
  console.log('Field deletions (count of users):', fieldDeletionsTally);
  console.log('Subcollection doc deletions:', subDeletionsTally);
  console.log('');
  if (!APPLY) {
    console.log('DRY-RUN complete. Re-run with --apply to write.');
  } else {
    console.log('APPLY complete.');
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
