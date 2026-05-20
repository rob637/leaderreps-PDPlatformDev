#!/usr/bin/env node
// Final consolidation of daily_plan_v2 phase docs (May 2026):
//   - Promote any legacy `tools` entries into `contentItems` with resourceType='tool'
//   - Delete `actions`, `events`, `workouts`, `tools`, `coachingItems`,
//     `communityItems`, `dailyReps`, `coaching`, `community`, `reps`,
//     `content`, `resources` (all retired)
//   - Normalize `order` on each contentItem (preserves existing array order)
//   - Default `required: false` if missing
//
// Usage: node scripts/migrations/finalize-phase-content-schema.cjs

const admin = require('firebase-admin');
const path = require('path');
const SA = path.join(__dirname, '..', '..', 'leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(require(SA)) });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const DOCS = ['foundation-content', 'ascent-content'];

(async () => {
  for (const id of DOCS) {
    const ref = db.doc(`daily_plan_v2/${id}`);
    const snap = await ref.get();
    if (!snap.exists) { console.log(`[skip] ${id} missing`); continue; }
    const data = snap.data() || {};
    const existing = Array.isArray(data.contentItems) ? data.contentItems : [];
    const tools = Array.isArray(data.tools) ? data.tools : [];

    const promotedTools = tools.map((t) => ({
      ...t,
      contentItemLabel: t.toolName || t.contentItemLabel || t.label || t.title || 'Untitled tool',
      resourceType: t.resourceType || 'tool',
    }));

    const merged = [...existing, ...promotedTools].map((item, i) => ({
      ...item,
      required: typeof item.required === 'boolean' ? item.required
              : typeof item.isRequiredContent === 'boolean' ? item.isRequiredContent
              : false,
      order: i,
    }));

    await ref.update({
      contentItems: merged,
      // Retire legacy fields
      actions: FieldValue.delete(),
      events: FieldValue.delete(),
      workouts: FieldValue.delete(),
      tools: FieldValue.delete(),
      coachingItems: FieldValue.delete(),
      communityItems: FieldValue.delete(),
      dailyReps: FieldValue.delete(),
      coaching: FieldValue.delete(),
      community: FieldValue.delete(),
      reps: FieldValue.delete(),
      content: FieldValue.delete(),
      resources: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'finalize-phase-content-schema.cjs',
    });
    console.log(`[ok]  ${id} — contentItems=${merged.length} (was ${existing.length}; promoted ${tools.length} tools); legacy fields cleared`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
