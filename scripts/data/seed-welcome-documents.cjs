/**
 * scripts/data/seed-welcome-documents.cjs
 *
 * Seeds two Content Library entries so an admin can attach them to a phase
 * via Phase Content Manager → Content (Required):
 *
 *   welcome-to-foundation   — Welcome to Foundation
 *   welcome-to-ascent       — Welcome to Ascent
 *
 * Both are created as DOCUMENT type, PUBLISHED, with an empty details.url
 * so they immediately appear in the Content Library picker. The admin can
 * upload the actual PDF (or change to VIDEO/READ_REP) later in
 * Content Manager / Media Vault — only `details.url` needs to be filled in.
 *
 * Idempotent: re-running merges into the existing docs without duplicating.
 *
 * Usage:
 *   node scripts/data/seed-welcome-documents.cjs            # dev (default)
 *   node scripts/data/seed-welcome-documents.cjs test
 *   node scripts/data/seed-welcome-documents.cjs prod
 */

const admin = require('firebase-admin');
const path = require('path');

const ENV = (process.argv[2] || 'dev').toLowerCase();
const ENV_TO_PROJECT = {
  dev: 'leaderreps-pd-platform',
  test: 'leaderreps-test',
  prod: 'leaderreps-prod',
};
const PROJECT_ID = ENV_TO_PROJECT[ENV];
if (!PROJECT_ID) {
  console.error(`Unknown env "${ENV}". Use: dev | test | prod`);
  process.exit(1);
}
const KEY_FILE = path.resolve(
  __dirname,
  '..',
  '..',
  `${PROJECT_ID}-firebase-adminsdk.json`
);

const sa = require(KEY_FILE);
admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: PROJECT_ID,
});
const db = admin.firestore();

const ITEMS = [
  {
    id: 'welcome-to-foundation',
    title: 'Welcome to Foundation',
    description:
      'Your starting point for the Foundation phase. Read this first to understand what to expect, how the daily reps work, and how to get the most out of your first weeks.',
    type: 'DOCUMENT',
    visibility: ['DOCUMENT'],
    difficulty: 'FOUNDATION',
    roleLevel: 'ALL',
    estimatedTime: '5',
    isHiddenUntilUnlocked: false,
    status: 'PUBLISHED',
    programs: [],
    workouts: [],
    skills: [],
    skillIds: [],
    details: {
      url: '', // attach PDF in Content Manager
    },
  },
  {
    id: 'welcome-to-ascent',
    title: 'Welcome to Ascent',
    description:
      'Your starting point for the Ascent phase. Read this first to understand what changes from Foundation, what new reps you will be running, and how to keep momentum.',
    type: 'DOCUMENT',
    visibility: ['DOCUMENT'],
    difficulty: 'FOUNDATION',
    roleLevel: 'ALL',
    estimatedTime: '5',
    isHiddenUntilUnlocked: false,
    status: 'PUBLISHED',
    programs: [],
    workouts: [],
    skills: [],
    skillIds: [],
    details: {
      url: '', // attach PDF in Content Manager
    },
  },
];

(async () => {
  console.log(`Seeding Welcome documents into ${PROJECT_ID} (env=${ENV})\n`);
  for (const item of ITEMS) {
    const ref = db.collection('content_library').doc(item.id);
    const snap = await ref.get();
    const now = admin.firestore.FieldValue.serverTimestamp();
    if (snap.exists) {
      // Preserve any admin-edited fields (e.g. details.url) — only fill in
      // missing top-level fields and refresh updatedAt.
      const existing = snap.data() || {};
      const merged = { ...item, ...existing };
      // Always refresh updatedAt; preserve original createdAt if present
      merged.updatedAt = now;
      if (!merged.createdAt) merged.createdAt = now;
      // Preserve nested details.url if admin already attached one
      merged.details = {
        ...(item.details || {}),
        ...(existing.details || {}),
      };
      await ref.set(merged, { merge: true });
      console.log(`  updated  content_library/${item.id}  (${item.title})`);
    } else {
      await ref.set({
        ...item,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  created  content_library/${item.id}  (${item.title})`);
    }
  }
  console.log('\nDone. Open Phase Content Manager → Foundation/Ascent → Content → Add to attach as Required.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
