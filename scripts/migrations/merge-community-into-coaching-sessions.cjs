/**
 * Migrate community_sessions + community_registrations → coaching_sessions + coaching_registrations
 *
 * Part of the May 2026 Events consolidation. The user-facing "Community"
 * concept was retired for sessions; everything now lives under "Events".
 *
 * Field mapping (community → coaching):
 *   host          → coach
 *   hostEmail     → coachEmail
 *   meetingLink   → zoomLink   (only if zoomLink is empty)
 *   topicFocus    → skillFocus
 *   topic         → kept as-is (extra metadata, harmless)
 *   recurrence    → kept as-is
 *
 * Registration doc ID format flips:
 *   community: ${userId}_${sessionId}
 *   coaching:  ${sessionId}_${userId}
 *
 * Usage:
 *   node scripts/migrations/merge-community-into-coaching-sessions.cjs \
 *     --project=leaderreps-pd-platform [--dry-run] [--delete-source]
 *
 * Flags:
 *   --dry-run        Preview only; no writes.
 *   --delete-source  After successful copy, delete the original
 *                    community_sessions and community_registrations docs.
 *                    OFF by default (safe; you can re-run as a backfill).
 */

const admin = require('firebase-admin');
const path = require('path');

const args = process.argv.slice(2);
let projectId = 'leaderreps-pd-platform';
let dryRun = false;
let deleteSource = false;

for (const arg of args) {
  if (arg.startsWith('--project=')) projectId = arg.split('=')[1];
  else if (arg === '--dry-run') dryRun = true;
  else if (arg === '--delete-source') deleteSource = true;
}

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

const serviceAccount = require(path.join(__dirname, '..', '..', serviceAccountFile));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId,
});

const db = admin.firestore();

const COMMUNITY_SESSIONS = 'community_sessions';
const COMMUNITY_REGISTRATIONS = 'community_registrations';
const COACHING_SESSIONS = 'coaching_sessions';
const COACHING_REGISTRATIONS = 'coaching_registrations';

/**
 * Map a community session doc to coaching schema.
 * Pure function — returns { id, data } for the new doc.
 * Doc ID is preserved (still globally unique across the merged collection).
 */
function mapCommunitySession(id, src) {
  const out = { ...src };

  // Renames
  if (src.host !== undefined) {
    out.coach = src.coach ?? src.host;
    delete out.host;
  }
  if (src.hostEmail !== undefined) {
    out.coachEmail = src.coachEmail ?? src.hostEmail;
    delete out.hostEmail;
  }
  if (src.meetingLink !== undefined) {
    out.zoomLink = src.zoomLink || src.meetingLink;
    delete out.meetingLink;
  }
  if (Array.isArray(src.topicFocus)) {
    out.skillFocus = Array.isArray(src.skillFocus) && src.skillFocus.length
      ? src.skillFocus
      : src.topicFocus;
    delete out.topicFocus;
  }

  // Cohort access — community sessions had no cohort gating; default to 'all'.
  if (out.cohortAccess === undefined) out.cohortAccess = 'all';
  if (!Array.isArray(out.cohortIds)) out.cohortIds = [];

  // Provenance flag for support / debugging.
  out.migratedFrom = 'community_sessions';
  out.migratedAt = admin.firestore.FieldValue.serverTimestamp();

  return { id, data: out };
}

/**
 * Map a community registration doc to coaching schema.
 * Doc ID flips from `${userId}_${sessionId}` → `${sessionId}_${userId}`.
 */
function mapCommunityRegistration(id, src) {
  const userId = src.userId;
  const sessionId = src.sessionId;
  if (!userId || !sessionId) {
    return { skip: true, reason: 'missing userId or sessionId' };
  }

  const newId = `${sessionId}_${userId}`;
  const out = { ...src };

  if (src.host !== undefined && out.coach === undefined) out.coach = src.host;
  if (src.hostEmail !== undefined && out.coachEmail === undefined) out.coachEmail = src.hostEmail;
  delete out.host;
  delete out.hostEmail;

  out.migratedFrom = 'community_registrations';
  out.migratedAt = admin.firestore.FieldValue.serverTimestamp();

  return { id: newId, oldId: id, data: out };
}

async function copyCollection(sourceName, targetName, mapper) {
  console.log(`\n📦  ${sourceName} → ${targetName}`);
  const snap = await db.collection(sourceName).get();
  console.log(`   Found ${snap.size} source docs.`);

  let copied = 0;
  let skipped = 0;
  let alreadyExists = 0;
  let collisions = 0;
  const collisionIds = [];

  // Process in batches of 400 (Firestore limit is 500).
  let batch = db.batch();
  let batchOps = 0;

  for (const docSnap of snap.docs) {
    const mapped = mapper(docSnap.id, docSnap.data());
    if (mapped.skip) {
      skipped += 1;
      console.log(`   • skip ${docSnap.id}: ${mapped.reason}`);
      continue;
    }

    const targetRef = db.collection(targetName).doc(mapped.id);
    const targetSnap = await targetRef.get();

    if (targetSnap.exists) {
      const existing = targetSnap.data();
      // Tolerate idempotent re-runs: if the existing doc was already migrated
      // from this source, treat as already-done (no-op).
      if (existing.migratedFrom === mapped.data.migratedFrom) {
        alreadyExists += 1;
        continue;
      }
      // Otherwise we have a real ID collision with native coaching data.
      collisions += 1;
      collisionIds.push(mapped.id);
      console.warn(`   ⚠ collision at ${targetName}/${mapped.id} — leaving existing doc untouched`);
      continue;
    }

    if (!dryRun) {
      batch.set(targetRef, mapped.data, { merge: false });
      batchOps += 1;
      if (batchOps >= 400) {
        await batch.commit();
        batch = db.batch();
        batchOps = 0;
      }
    }
    copied += 1;
  }

  if (!dryRun && batchOps > 0) await batch.commit();

  console.log(`   ${dryRun ? '(dry-run) would copy' : 'copied'}: ${copied}`);
  console.log(`   already migrated (skipped): ${alreadyExists}`);
  console.log(`   skipped (bad data): ${skipped}`);
  console.log(`   collisions (left as-is): ${collisions}`);
  if (collisions > 0) {
    console.log(`   collision IDs:`, collisionIds);
  }

  return { copied, alreadyExists, skipped, collisions };
}

async function deleteSourceCollection(name) {
  console.log(`\n🗑  Deleting ${name} (--delete-source set)...`);
  const snap = await db.collection(name).get();
  let batch = db.batch();
  let ops = 0;
  let deleted = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    ops += 1;
    deleted += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  console.log(`   deleted ${deleted} docs from ${name}`);
}

async function main() {
  console.log(`\n🔄 Community → Coaching session merge`);
  console.log(`   Project: ${projectId}`);
  console.log(`   Mode:    ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`   Cleanup: ${deleteSource ? 'DELETE source after copy' : 'keep source (safe)'}`);

  const sessionsResult = await copyCollection(
    COMMUNITY_SESSIONS,
    COACHING_SESSIONS,
    mapCommunitySession,
  );

  const regsResult = await copyCollection(
    COMMUNITY_REGISTRATIONS,
    COACHING_REGISTRATIONS,
    mapCommunityRegistration,
  );

  if (deleteSource && !dryRun) {
    if (sessionsResult.collisions > 0 || regsResult.collisions > 0) {
      console.warn(`\n⚠  Skipping --delete-source because there were collisions.`);
    } else {
      await deleteSourceCollection(COMMUNITY_REGISTRATIONS);
      await deleteSourceCollection(COMMUNITY_SESSIONS);
    }
  }

  console.log(`\n✅ Done.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
