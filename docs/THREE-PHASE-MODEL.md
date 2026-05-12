# Three-Phase Model — Architecture Notes

**Date:** May 12, 2026
**Branch:** `refactor/three-phase-cleanup`
**Status:** Shipped to dev (not yet deployed to test/prod)

---

## What changed

The day/week/milestone gating model has been replaced with a flat three-phase
model:

| Phase | `phaseKey` | Legacy id | Description |
|---|---|---|---|
| Onboarding | `onboarding` | `pre-start` | Prep activities before the program (Leader Profile, Baseline) |
| Foundation | `foundation` | `start` | Four-rep core program; trainer signs off when leader is ready |
| Ascent | `ascent` | `post-start` | Ongoing maintenance; trainer must explicitly approve |

A leader's current phase is now determined by trainer state, not by elapsed
time since cohort start:

```
graduated || (foundationCompleted && ascentApproved) → Ascent
prepStatus.isComplete                                → Foundation
else                                                  → Onboarding
```

`useDailyPlan.currentPhase` retains its 56-day window for legacy display
purposes only; gating logic should call `phaseKey()` and `isAscentApproved()`
from the same module.

---

## New data shape

### Firestore

- **`daily_plan_v2/foundation-content`** — single doc with all Foundation
  resources (actions, contentItems, coachingItems, communityItems, tools,
  workouts, dailyReps, skills, pillars, coachingSessionTypes,
  communitySessionTypes).
- **`daily_plan_v2/ascent-content`** — same shape, for Ascent.
- **`daily_plan_v1/*`** — legacy day docs, untouched (kept for one cycle).

### Per-user fields (added by Commit 4 migration)

- `phaseKey` — derived from prep + foundationCompleted + ascentApproved
- `foundationCompleted`, `foundationCompletedAt`, `foundationCompletedBy`
- `ascentApproved`, `ascentApprovedAt`, `ascentApprovedBy`
- `ascentWelcomeShown`

### Per-user fields (removed by Commit 4 migration)

- `milestoneProgress`, `currentDayNumber`, `currentMilestone`
- `unlockedContentIds`, `unlockedDays`, `currentWeek`
- `weekProgress`, `dayProgress`

### Per-user subcollections (deleted by Commit 4 migration)

- `daily_logs`, `daily_practice`, `dailyPractice`, `pulse_checks`, `reps_light`

### Per-user subcollections (preserved)

- `action_progress`, `videoProgress`, `rep_drafts`, `anchors`, `ascent_journey`,
  `commitment_data`, `developmentPlan`, `conditioning_*`

---

## New code surface

| Module | Purpose |
|---|---|
| `src/hooks/useDailyPlan.js` | Exports `PHASES`, `PHASE_KEYS`, `phaseKey()`, `isAscentApproved()` |
| `src/hooks/useThreePhaseContent.js` | Read-side hook; returns `phaseKey`, `phaseContent`, `foundationContent`, `ascentContent`, `updatePhaseContent`, `isLoading` |
| `src/services/threePhaseContentService.js` | Subscribe + write helpers for `daily_plan_v2/*` |
| `src/components/widgets/MyActionsWidget.jsx` | Dashboard widget (id `my-actions`) — replaces `this-weeks-actions` |
| `src/components/admin/FoundationCompletionQueue.jsx` | Trainer marks Foundation done; triggers `sendFoundationCompletionEmail` |
| `src/components/admin/AscentApprovalQueue.jsx` | Trainer approves Ascent; triggers `sendAscentApprovalEmail` |
| `src/components/admin/PhaseContentManager.jsx` | Admin editor for the two `daily_plan_v2` docs |

## Cloud Functions

- `sendFoundationCompletionEmail` (callable) — congratulations email
- `sendAscentApprovalEmail` (callable) — welcome to Ascent email
- `sendMilestoneCompletionEmail` (callable, **DEPRECATED**) — no-op stub kept
  for the legacy `LevelSignOffQueue.jsx` until that screen is removed.

Both new emails:
- Look up `email_templates/{foundation_completion|ascent_approval}` first
- Fall back to inline HTML if no template document exists
- Are best-effort: client wraps the call in try/catch and logs warnings

---

## Migration & rollback

**Migration script:** `scripts/migrations/three-phase-user-wipe-and-seed.cjs`

```bash
# Dev only. Always dry-run first.
node ./scripts/migrations/three-phase-user-wipe-and-seed.cjs --confirm-dev
node ./scripts/migrations/three-phase-user-wipe-and-seed.cjs --confirm-dev --apply
```

The script:
- Refuses to run unless `--confirm-dev` is passed
- Hard-coded to the `leaderreps-pd-platform` service account
- Backs up every user doc + legacy subcollections to
  `data-exports/users-dev-pre-c4-<ts>.json` (gitignored)
- Uses Firestore `BulkWriter` so large subcollections (450+ docs) succeed

**Rollback path:**
1. Read the backup JSON written above
2. `git revert` commits in reverse order: C4 → C3 → C2b → C2a → C1
3. Re-import users from backup using a small helper script
4. Or restore from the daily Firestore auto-backup at
   `gs://leaderreps-prod-firestore-backups/<date>/`

**Pre-refactor safety net:** git tag `prod-backup-2026-05-12` at `b430462e`
plus `data-exports/app-data-prod-2026-05-12.json`.

---

## Commit log

| Commit | Title |
|---|---|
| `b000af1f` | C1: phase model rename + content seed |
| `f6d2acc0` | C2a: MyActionsWidget + admin queues + service |
| `070e1be6` | C2b: PhaseContentManager |
| `384698cd` | C3: demolish day-based gating |
| `4fcdf05f` | C4: user data wipe & seed (dev) |
| _(pending)_ | C5: tests, docs, Cloud Functions |

---

## What is intentionally kept for one more cycle

- `src/components/widgets/ThisWeeksActionsWidget.jsx` — kept for Widget Lab
- `src/components/admin/LevelSignOffQueue.jsx` — kept; its nav entry is hidden
- `src/components/admin/DailyPlanManager.jsx` — kept; its nav entry is hidden
- `daily_plan_v1/*` Firestore docs — kept for re-seeding

Remove these after one full cycle of dev → test → prod with no regressions.
