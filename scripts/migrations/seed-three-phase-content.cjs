/**
 * Seed Three-Phase Content Model (May 2026 — refactor/three-phase-cleanup)
 * =========================================================================
 *
 * PURPOSE
 * -------
 * Aggregates the existing day/week/milestone-keyed content in `daily_plan_v1`
 * into two flat, self-paced content documents in a NEW collection
 * `daily_plan_v2`:
 *
 *   - daily_plan_v2/foundation-content   — All Foundation actions, reps,
 *                                          coaching items, and community items
 *                                          (sourced from milestone-1..5,
 *                                          day-15..70, session1..5-config)
 *
 *   - daily_plan_v2/ascent-content       — All Ascent actions, reps,
 *                                          coaching items, and community items
 *                                          (sourced from day-71..N)
 *
 * Onboarding (pre-start) content is NOT migrated — onboarding stays as it is
 * and continues to live in `daily_plan_v1` as `day-001`..`day-014` /
 * `onboarding-config` / `session1-config`. Only Foundation and Ascent are
 * being flattened.
 *
 * SAFETY
 * ------
 *  - DEV ONLY by default. Refuses to run against any other env unless `--env=test`
 *    is explicitly passed (production is blocked entirely).
 *  - Idempotent: writes are full document overwrites of the two seed docs only.
 *    Re-running produces the same result.
 *  - Non-destructive: leaves `daily_plan_v1` untouched. The new model can be
 *    rolled back simply by ignoring `daily_plan_v2`.
 *
 * USAGE
 * -----
 *   node scripts/migrations/seed-three-phase-content.cjs           # dev (default)
 *   node scripts/migrations/seed-three-phase-content.cjs --env=test
 *   node scripts/migrations/seed-three-phase-content.cjs --dry-run # show what would be written
 */

const admin = require('firebase-admin');
const path = require('path');

// ---- Args / env ----
const args = process.argv.slice(2);
const envArg = (args.find((a) => a.startsWith('--env=')) || '--env=dev').split('=')[1];
const dryRun = args.includes('--dry-run');

if (envArg === 'prod') {
  console.error('❌ This script is blocked from running against production.');
  process.exit(1);
}

const ENV_TO_SA = {
  dev: '../../leaderreps-pd-platform-firebase-adminsdk.json',
  test: '../../leaderreps-test-firebase-adminsdk.json'
};

const saRelPath = ENV_TO_SA[envArg];
if (!saRelPath) {
  console.error(`❌ Unknown env: ${envArg}. Use --env=dev or --env=test.`);
  process.exit(1);
}

const serviceAccount = require(saRelPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ---- Source identification ----
// The legacy daily_plan_v1 collection is keyed in three ways. We need to
// classify each doc into one of: 'onboarding' | 'foundation' | 'ascent' | 'skip'
function classifyLegacyDoc(docId, data) {
  const id = String(docId || '').toLowerCase();
  const phase = String(data?.phase || '').toLowerCase();

  // Onboarding (skip — not migrated)
  if (id === 'onboarding-config' || id === 'session1-config') return 'onboarding';
  if (id.startsWith('day-')) {
    const dayNum = parseInt(id.replace('day-', ''), 10);
    if (Number.isFinite(dayNum)) {
      if (dayNum >= 1 && dayNum <= 14) return 'onboarding';
      if (dayNum >= 15 && dayNum <= 70) return 'foundation';
      if (dayNum >= 71) return 'ascent';
    }
  }
  // Milestone docs are Foundation
  if (id.startsWith('milestone-')) return 'foundation';
  // Session prep configs (session2..5) belong to Foundation
  if (/^session[2-5]-config$/.test(id)) return 'foundation';

  // Fall back to phase field on the doc
  if (phase === 'pre-start') return 'onboarding';
  if (phase === 'start' || phase === 'foundation') return 'foundation';
  if (phase === 'post-start' || phase === 'ascent') return 'ascent';

  return 'skip';
}

// ---- Aggregation helpers ----
function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function tagWithSource(items, source) {
  return items.map((item) => ({
    ...item,
    _source: source // for traceability — easy to audit which legacy doc this came from
  }));
}

function dedupeById(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = item?.id;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(item);
  }
  return out;
}

// ---- Main ----
(async () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Three-Phase Content Seed`);
  console.log(`  Env:      ${envArg}`);
  console.log(`  Dry run:  ${dryRun}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const snap = await db.collection('daily_plan_v1').get();
  console.log(`📥 Loaded ${snap.size} docs from daily_plan_v1\n`);

  const buckets = {
    foundation: {
      // Top-level arrays from source docs
      actions: [], coaching: [], community: [], reps: [], content: [],
      resources: [],
      // Aggregated from weeklyResources.* nested arrays — these are where
      // most of the real content references live (videos/readings/etc.)
      contentItems: [],     // ← weeklyResources.weeklyContent[]
      coachingItems: [],    // ← weeklyResources.weeklyCoaching[]
      communityItems: [],   // ← weeklyResources.weeklyCommunity[]
      tools: [],            // ← weeklyResources.weeklyTools[]
      workouts: [],         // ← weeklyResources.weeklyWorkouts[]
      dailyReps: [],        // ← weeklyResources.weeklyDailyReps[]
      // Sets (deduped string values)
      coachingSessionTypes: new Set(),
      communitySessionTypes: new Set(),
      skills: new Set(),
      pillars: new Set(),
      // Provenance
      sourceDocs: []
    },
    ascent: {
      actions: [], coaching: [], community: [], reps: [], content: [],
      resources: [],
      contentItems: [], coachingItems: [], communityItems: [],
      tools: [], workouts: [], dailyReps: [],
      coachingSessionTypes: new Set(),
      communitySessionTypes: new Set(),
      skills: new Set(),
      pillars: new Set(),
      sourceDocs: []
    },
    onboarding: { count: 0 },
    skip: { count: 0, ids: [] }
  };

  snap.forEach((doc) => {
    const data = doc.data() || {};
    const target = classifyLegacyDoc(doc.id, data);

    if (target === 'onboarding') {
      buckets.onboarding.count += 1;
      return;
    }
    if (target === 'skip') {
      buckets.skip.count += 1;
      buckets.skip.ids.push(doc.id);
      return;
    }

    const bucket = buckets[target];
    bucket.sourceDocs.push(doc.id);

    // Top-level arrays
    bucket.actions.push(...tagWithSource(asArray(data.actions), doc.id));
    bucket.coaching.push(...tagWithSource(asArray(data.coaching), doc.id));
    bucket.community.push(...tagWithSource(asArray(data.community), doc.id));
    bucket.reps.push(...tagWithSource(asArray(data.reps), doc.id));
    bucket.content.push(...tagWithSource(asArray(data.content), doc.id));
    bucket.resources.push(...tagWithSource(asArray(data.resources), doc.id));
    asArray(data.coachingSessionTypes).forEach((t) => bucket.coachingSessionTypes.add(t));
    asArray(data.communitySessionTypes).forEach((t) => bucket.communitySessionTypes.add(t));

    // weeklyResources nested arrays — this is where most authored content
    // references live (videos, readings, coaching items, etc.). Flatten
    // them into phase-level arrays.
    const wr = (data.weeklyResources && typeof data.weeklyResources === 'object') ? data.weeklyResources : {};
    bucket.contentItems.push(...tagWithSource(asArray(wr.weeklyContent), doc.id));
    bucket.coachingItems.push(...tagWithSource(asArray(wr.weeklyCoaching), doc.id));
    bucket.communityItems.push(...tagWithSource(asArray(wr.weeklyCommunity), doc.id));
    bucket.tools.push(...tagWithSource(asArray(wr.weeklyTools), doc.id));
    bucket.workouts.push(...tagWithSource(asArray(wr.weeklyWorkouts), doc.id));
    bucket.dailyReps.push(...tagWithSource(asArray(wr.weeklyDailyReps), doc.id));
    asArray(wr.weekSkills).forEach((s) => bucket.skills.add(s));
    asArray(wr.weekPillars).forEach((p) => bucket.pillars.add(p));
  });

  // Dedupe array fields. Items from weeklyResources often lack stable
  // ids (resourceId/contentItemId can be ''), so we dedupe by a composite
  // key when id is missing.
  const dedupeContentItem = (items) => {
    const seen = new Set();
    const out = [];
    for (const item of items) {
      const key = item?.resourceId || item?.contentItemId
        || `${item?.contentItemLabel || ''}::${item?.resourceType || ''}::${item?.contentItemType || ''}`;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      out.push(item);
    }
    return out;
  };
  const dedupeNamed = (items, nameKey) => {
    const seen = new Set();
    const out = [];
    for (const item of items) {
      const key = item?.[nameKey] || item?.id;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      out.push(item);
    }
    return out;
  };

  for (const phaseKey of ['foundation', 'ascent']) {
    const b = buckets[phaseKey];
    b.actions = dedupeById(b.actions);
    b.coaching = dedupeById(b.coaching);
    b.community = dedupeById(b.community);
    b.reps = dedupeById(b.reps);
    b.content = dedupeById(b.content);
    b.resources = dedupeById(b.resources);
    b.contentItems = dedupeContentItem(b.contentItems);
    b.coachingItems = dedupeNamed(b.coachingItems, 'coachingItemLabel');
    b.communityItems = dedupeNamed(b.communityItems, 'communityItemLabel');
    b.tools = dedupeNamed(b.tools, 'toolName');
    b.workouts = dedupeNamed(b.workouts, 'workoutName');
    b.dailyReps = dedupeNamed(b.dailyReps, 'repName');
  }

  // Build target docs
  const now = admin.firestore.FieldValue.serverTimestamp();

  const buildPhaseDoc = (phaseKey, b, displayName) => ({
    id: `${phaseKey}-content`,
    phase: phaseKey,
    phaseKey,
    displayName,
    description: `Self-paced ${displayName} content (May 2026 three-phase model)`,
    // Top-level
    actions: b.actions,
    coaching: b.coaching,
    community: b.community,
    reps: b.reps,
    content: b.content,
    resources: b.resources,
    // Aggregated from each source doc's weeklyResources.* (this is where
    // the bulk of authored content references live in the legacy model)
    contentItems: b.contentItems,
    coachingItems: b.coachingItems,
    communityItems: b.communityItems,
    tools: b.tools,
    workouts: b.workouts,
    dailyReps: b.dailyReps,
    // Sets → arrays
    coachingSessionTypes: Array.from(b.coachingSessionTypes),
    communitySessionTypes: Array.from(b.communitySessionTypes),
    skills: Array.from(b.skills),
    pillars: Array.from(b.pillars),
    // Provenance
    _source: {
      collection: 'daily_plan_v1',
      docIds: b.sourceDocs.sort(),
      seededAt: now,
      seedScript: 'scripts/migrations/seed-three-phase-content.cjs'
    }
  });

  const foundationDoc = buildPhaseDoc('foundation', buckets.foundation, 'Foundation');
  const ascentDoc = buildPhaseDoc('ascent', buckets.ascent, 'Ascent');

  // Report
  console.log('📊 Aggregation summary:\n');
  console.log(`  Onboarding (skipped):  ${buckets.onboarding.count} docs`);
  for (const key of ['foundation', 'ascent']) {
    const b = buckets[key];
    console.log(`\n  ${key} ← ${b.sourceDocs.length} source docs`);
    console.log(`    actions:           ${b.actions.length}`);
    console.log(`    coaching:          ${b.coaching.length}`);
    console.log(`    community:         ${b.community.length}`);
    console.log(`    reps:              ${b.reps.length}`);
    console.log(`    content:           ${b.content.length}`);
    console.log(`    resources:         ${b.resources.length}`);
    console.log(`    contentItems:      ${b.contentItems.length}   (videos/readings — from weeklyContent)`);
    console.log(`    coachingItems:     ${b.coachingItems.length}   (from weeklyCoaching)`);
    console.log(`    communityItems:    ${b.communityItems.length}   (from weeklyCommunity)`);
    console.log(`    tools:             ${b.tools.length}   (from weeklyTools)`);
    console.log(`    workouts:          ${b.workouts.length}   (from weeklyWorkouts)`);
    console.log(`    dailyReps:         ${b.dailyReps.length}   (from weeklyDailyReps)`);
    console.log(`    skills:            [${Array.from(b.skills).slice(0, 8).join(', ')}${b.skills.size > 8 ? ', …' : ''}]`);
    console.log(`    pillars:           [${Array.from(b.pillars).join(', ')}]`);
    console.log(`    coachingSessionTypes: [${Array.from(b.coachingSessionTypes).join(', ')}]`);
    console.log(`    communitySessionTypes: [${Array.from(b.communitySessionTypes).join(', ')}]`);
  }
  if (buckets.skip.count > 0) {
    console.log(`\n  Skipped (unclassified): ${buckets.skip.count} docs`);
    console.log(`    ids: ${buckets.skip.ids.slice(0, 10).join(', ')}${buckets.skip.ids.length > 10 ? ', ...' : ''}`);
  }
  console.log('');

  if (dryRun) {
    console.log('🔍 Dry run — no writes performed.');
    process.exit(0);
  }

  // Write
  const batch = db.batch();
  batch.set(db.collection('daily_plan_v2').doc('foundation-content'), foundationDoc);
  batch.set(db.collection('daily_plan_v2').doc('ascent-content'), ascentDoc);
  await batch.commit();

  console.log('✅ Wrote daily_plan_v2/foundation-content');
  console.log('✅ Wrote daily_plan_v2/ascent-content');
  console.log('\nDone.');
  process.exit(0);
})().catch((err) => {
  console.error('💥 Seed failed:', err);
  process.exit(1);
});
