/**
 * Audit + backfill resourceIds in daily_plan_v2/foundation-content and
 * daily_plan_v2/ascent-content from the legacy daily_plan_v1 source.
 *
 * Strategy
 * --------
 * For each contentItem in v2 missing a resourceId, look in:
 *   1. The original v1 source doc (item._source) — find a sibling item with
 *      a matching contentItemLabel and a real resourceId/contentItemId.
 *   2. ANY v1 doc — find any item with a matching label and a real id.
 *   3. content_library — match by `title` (or `details.title`) for one doc.
 *
 * Modes:
 *   --dry-run (default)   audit only; print what would change
 *   --apply               write merged contentItems back to v2
 *   --env=dev|test        target environment (prod blocked)
 */

const admin = require('firebase-admin');
const path = require('path');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const envArg = (args.find((a) => a.startsWith('--env=')) || '--env=dev').split('=')[1];

if (envArg === 'prod') {
  console.error('Blocked from prod.');
  process.exit(1);
}
const SA = {
  dev: '../../leaderreps-pd-platform-firebase-adminsdk.json',
  test: '../../leaderreps-test-firebase-adminsdk.json',
}[envArg];
if (!SA) {
  console.error(`Unknown env: ${envArg}`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(SA)),
});
const db = admin.firestore();

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const cleanId = (v) => (typeof v === 'string' ? v.trim() : v) || null;
const itemId = (it) => cleanId(it?.resourceId) || cleanId(it?.contentItemId);

// Artifact items use stable id constants instead of content_library docs.
// Matches src/hooks/useArtifactCompletion.js ARTIFACT_KINDS.
const ARTIFACT_BY_LABEL = {
  [norm('Leadership Identity Statement')]: 'leadership-identity-statement',
  [norm('Leadership Identity')]: 'leadership-identity-statement',
  [norm('Leader Profile')]: 'leader-profile',
  [norm('Complete Your Leader Profile')]: 'leader-profile',
  [norm('Leadership Skills Baseline')]: 'leadership-skills-baseline',
  [norm('Skills Baseline')]: 'leadership-skills-baseline',
  [norm('Take Baseline Assessment')]: 'leadership-skills-baseline',
};

(async () => {
  console.log(`\n=== Audit: ${envArg} (${apply ? 'APPLY' : 'DRY-RUN'}) ===\n`);

  // 1. Build label -> id map from daily_plan_v1 (scan ALL nested item arrays)
  const ITEM_PATHS = [
    ['contentItems'],
    ['actions'],
    ['content'],
    ['resources'],
    ['reps'],
    ['coaching'],
    ['community'],
    ['weeklyResources', 'weeklyContent'],
    ['weeklyResources', 'weeklyCoaching'],
    ['weeklyResources', 'weeklyCommunity'],
    ['weeklyResources', 'weeklyTools'],
    ['weeklyResources', 'weeklyWorkouts'],
    ['weeklyResources', 'weeklyDailyReps'],
  ];
  const getPath = (obj, p) => p.reduce((o, k) => (o == null ? o : o[k]), obj);
  const labelOf = (it) =>
    it?.contentItemLabel || it?.label || it?.title ||
    it?.resourceTitle || it?.toolName || it?.name;

  const v1Snap = await db.collection('daily_plan_v1').get();
  const v1ByLabel = new Map(); // norm(label) -> [{id, source, type}]
  const v1BySource = new Map(); // sourceId -> [items]
  v1Snap.docs.forEach((d) => {
    const data = d.data() || {};
    const allItems = [];
    ITEM_PATHS.forEach((p) => {
      const arr = getPath(data, p);
      if (Array.isArray(arr)) allItems.push(...arr);
    });
    if (allItems.length) v1BySource.set(d.id, allItems);
    allItems.forEach((it) => {
      const id = itemId(it);
      const label = labelOf(it);
      if (!id || !label) return;
      const k = norm(label);
      if (!v1ByLabel.has(k)) v1ByLabel.set(k, []);
      v1ByLabel.get(k).push({ id, source: d.id, type: it?.contentItemType || it?.resourceType || it?.type });
    });
  });
  console.log(`v1 indexed: ${v1ByLabel.size} unique labels across ${v1Snap.size} docs`);

  // 2. Build label -> id map from content_library
  const clSnap = await db.collection('content_library').get();
  const clByLabel = new Map();
  clSnap.docs.forEach((d) => {
    const data = d.data() || {};
    const titles = [
      data.title,
      data.label,
      data?.details?.title,
      data?.metadata?.title,
    ].filter(Boolean);
    titles.forEach((t) => {
      const k = norm(t);
      if (!clByLabel.has(k)) clByLabel.set(k, []);
      clByLabel.get(k).push({ id: d.id, type: data.type });
    });
  });
  console.log(`content_library indexed: ${clByLabel.size} unique titles across ${clSnap.size} docs`);

  // 3. Walk each phase doc and try to backfill
  for (const phaseId of ['foundation-content', 'ascent-content']) {
    console.log(`\n--- ${phaseId} ---`);
    const ref = db.doc(`daily_plan_v2/${phaseId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log('  (not found)');
      continue;
    }
    const data = snap.data();
    const items = Array.isArray(data.contentItems) ? [...data.contentItems] : [];
    let changed = 0;
    let stillMissing = 0;

    const updated = items.map((it) => {
      const existing = itemId(it);
      if (existing) return it;

      const label = it?.contentItemLabel || it?.label || it?.title || it?.resourceTitle;
      if (!label) {
        stillMissing++;
        return it;
      }
      const k = norm(label);
      const source = it?._source;

      // (0) Artifact items — use the stable artifact constant id.
      let candidate = null;
      if (ARTIFACT_BY_LABEL[k]) {
        const aid = ARTIFACT_BY_LABEL[k];
        console.log(`  ARTIFACT "${label.padEnd(28)}" -> ${aid}`);
        changed++;
        return {
          ...it,
          resourceId: aid,
          contentItemId: aid,
          resourceType: 'artifact',
        };
      }

      // (a) Same source doc
      if (source && v1BySource.has(source)) {
        const sib = v1BySource.get(source).find((s) => norm(labelOf(s)) === k && itemId(s));
        if (sib) candidate = { id: itemId(sib), via: `v1[${source}]` };
      }
      // (b) Any v1 doc
      if (!candidate && v1ByLabel.has(k)) {
        const hits = v1ByLabel.get(k);
        if (hits.length === 1) {
          candidate = { id: hits[0].id, via: `v1[${hits[0].source}]` };
        } else {
          // pick the one whose source matches if possible, else first
          const srcHit = hits.find((h) => h.source === source);
          candidate = { id: (srcHit || hits[0]).id, via: `v1(ambiguous: ${hits.length})` };
        }
      }
      // (c) content_library by title
      if (!candidate && clByLabel.has(k)) {
        const hits = clByLabel.get(k);
        if (hits.length === 1) {
          candidate = { id: hits[0].id, via: 'content_library(title)' };
        } else {
          candidate = { id: hits[0].id, via: `content_library(ambiguous: ${hits.length})` };
        }
      }

      if (!candidate) {
        console.log(`  MISSING  "${label}"`);
        stillMissing++;
        return it;
      }
      console.log(`  BACKFILL "${label.padEnd(28)}" -> ${candidate.id}  via ${candidate.via}`);
      changed++;
      return { ...it, resourceId: candidate.id, contentItemId: candidate.id };
    });

    console.log(`  changed: ${changed}, still missing: ${stillMissing}, total: ${items.length}`);

    if (apply && changed > 0) {
      await ref.update({ contentItems: updated, _backfilledAt: new Date().toISOString() });
      console.log('  ✓ written');
    }
  }

  console.log('\nDone.');
  process.exit(0);
})();
