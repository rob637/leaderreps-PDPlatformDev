# Ascent Revamp — Implementation Plan

**Branch:** `Revamp`
**Target launch:** May 11, 2026 (Cohort 262 ends)
**Environments:** Build & test in **dev** and **test** only. **Prod untouched until launch.**
**Source of truth:** Discussion notes from Ryan + Conditioning Tool v1 spec (see end of doc).

---

## 1. Guiding Principles

1. **Dev-first, prod-frozen.** All work merges to `Revamp` branch. Deploy only to `dev` and `test` Firebase projects via existing `npm run deploy:dev` / `npm run deploy:test`. No prod deploys until cutover.
2. **Cohort 262 is invisible to changes** — they aren't logging in, so we have a real testing window.
3. **Simplify, don't add.** This revamp is a *reduction* of surface area, not an expansion. Default answer to scope creep is "no, post-launch."
4. **Feature-flag the cutover.** Every new screen/flow is gated behind a flag in `src/providers/FeatureProvider.jsx` so we can ship incrementally and roll back without redeploying.
5. **Preserve old code, don't delete.** Move legacy screens to `*.legacy.jsx.bak` (pattern already in use, e.g. `AscentArena.legacy.jsx.bak`). Delete after launch + 1 cohort.

---

## 2. Scope — Six Core Components

The Ascent MVP nav collapses to exactly six items:

| # | Component | Status | Notes |
|---|---|---|---|
| 1 | **Dashboard** | Keep as-is | Add visible "Ascent" label/badge for orientation |
| 2 | **Events** | NEW (replaces Community + Coaching split) | Unified registration for 1:1s, clinics, open gym, practice |
| 3 | **Content** | Keep | Minor polish only |
| 4 | **Conditioning Tool** | REBUILD (Light) | Single "Practice a Rep" button → voice/text → AI verdict |
| 5 | **Ask a Coach** | NEW | Message board; only Christina + Ryan reply, via short video |
| 6 | **Locker** | Keep + extend | Add SMS nudge as a notification setting |

Everything else (current Community screen, current Coaching screen, current full Conditioning Tool, etc.) gets retired or hidden behind the legacy flag.

---

## 3. Workstreams

### WS-1: Navigation & Shell
**Owner:** Rob
**Files:** `src/components/layout/MobileBottomNav.jsx`, `ArenaSidebar.jsx`, `src/routing/ScreenRouter.jsx`, `src/config/breadcrumbConfig.js`

- [ ] Reduce primary nav to the six items above.
- [ ] Add "Ascent" label in dashboard header (small badge top-right or near greeting).
- [ ] Hide legacy screens behind feature flag `ascentRevamp` (default `true` in dev/test, `false` in prod until launch).
- [ ] Update `breadcrumbConfig.js` for new screen keys: `events`, `ask-coach`, `conditioning-light`.
- [ ] Verify mobile bottom nav fits 6 items (currently sized for 5 — may need icon-only or 5 + "More").

### WS-2: Events (replaces Community + Coaching)
**Files:** `src/components/screens/Events.jsx` (new), `src/services/eventsService.js` (new, merges `communityService` + `coachingService`)

- [ ] Single `events` Firestore collection (or unified view over existing collections — TBD based on data audit).
- [ ] Event types as a simple tag: `one-on-one`, `clinic`, `open-gym`, `practice`.
- [ ] Single registration flow — no branching by type.
- [ ] Calendar/list toggle.
- [ ] Migration script in `scripts/migrations/` to tag existing community + coaching records into unified shape (dev/test only).
- [ ] Keep `communityService.js` and `coachingService.js` callable for legacy screens during transition.

### WS-3: Conditioning Tool Light
**Files:** `src/components/screens/ConditioningLight.jsx` (new), `src/services/conditioningLightService.js` (new), `functions/index.js` (new callable: `evaluateRep`)

This is the largest workstream. Per Ryan's v1 spec:

#### 3a. UI (single-screen flow)
- [ ] Big "Practice a Rep" button on entry.
- [ ] Step 1: Select RR type (DRF, RED, FUW, SCE).
- [ ] Step 2: One open text box with mic (voice → text via Web Speech API or Whisper proxy).
- [ ] Step 3: Submit → verdict screen.
- [ ] Verdict screen: `Pass` or `Not Yet` + Quick Read (per-condition: Strong/Adequate/Weak/Missing) + 1 observation + (1 question if not Strong Rep).
- [ ] **No** numeric scores shown to user.
- [ ] **No** planned-vs-logged distinction.

#### 3b. Universal Evaluation Engine (Cloud Function)
New callable `evaluateRep({ rrType, transcript })` in `functions/index.js`:

1. Validate rep (structure present?).
2. Parse & extract evidence (Gemini/Claude prompt).
3. Score each condition 0–3 (RR-specific config).
4. **Apply fail logic — overrides everything downstream.**
5. Determine Pass / Not Yet.
6. Check pattern triggers (last 5 reps for user).
7. Generate output via template selection.

#### 3c. RR Config Layer
Stored as JSON in `functions/conditioning/rrConfig.js`:
```
DRF: conditions [Behavior, Impact, Reinforcement], critical [Behavior], passThreshold 5
RED: conditions [Behavior, Impact, Request, DirectDelivery, DeliveryDiscipline], critical [Behavior, Impact, Request], passThreshold 9
FUW: conditions [WorkAnchored, ProgressVisibility, Ownership], critical [WorkAnchored], passThreshold 5
SCE: conditions [Expectation, Success, Understanding, Ownership], critical [Expectation, Success], passThreshold 6
```
Plus per-RR fail rules and Strong-Rep thresholds exactly per spec §3–4.

#### 3d. Internal Scoring Storage
Firestore: `users/{uid}/reps/{repId}` →
```
{ rrType, transcript, conditionScores: {...}, totalScore, result: 'pass'|'notYet',
  validity: 'valid'|'invalid', failReason?, patternTriggered?, createdAt }
```
Scores stored but **never displayed** in v1.

#### 3e. Template System
`functions/conditioning/templates.js` — 3–5 observation variants per condition gap, question banks grouped by gap type. Selection: random within set, suppress if used in last 2–3 reps for that user.

#### 3f. Pattern Detection
- Short-window: same condition lowest in 3 of last 5 → trigger.
- Escalation: condition never Strong in last 6 → escalate.
- RED-specific: Request ≤2 in 3 of last 5 → trigger.
- Suppression: same pattern not more than once per 3 reps; resets when condition hits Strong.

#### 3g. Anti-Drift Safeguards
- AI prompt explicitly forbids inference/filling gaps.
- Low-confidence input → `Not Yet` + "input insufficient" + clarification question.
- RED keeps Request strict; mixed feedback caps Behavior at 2.

### WS-4: Ask a Coach
**Files:** `src/components/screens/AskCoach.jsx` (new), `src/components/screens/AskCoachThread.jsx` (new), `src/services/askCoachService.js` (new), `functions/index.js` (notification on new post)

- [ ] Message board UI: list of posts, each with title + scenario body + tags.
- [ ] Post form: title, scenario text, optional RR-type tag.
- [ ] Response area: video player only (no text replies). MP4/WebM upload to Firebase Storage.
- [ ] Permission: any Ascent participant can post; only Christina + Ryan (by email allowlist in `metadata/config`) can respond.
- [ ] Tag system: scenario type → feeds video into a growing library on the **Content** screen (cross-link).
- [ ] Cloud Function: notify Christina/Ryan via email (and SMS once WS-5 is done) on new post.
- [ ] Long-term hook: tags drive a "Video Library" view in Content (post-launch nice-to-have, stub the data model now).

### WS-5: Locker — SMS Nudge Setting
**Files:** `src/components/screens/Locker.jsx` (or wherever notification settings live), `src/services/notificationService.js`, `functions/index.js`

- [ ] Add SMS toggle alongside existing notification toggles in Locker settings.
- [ ] Phone number capture + verification (reuse existing Telnyx integration — see `scripts/test-telnyx-sms.cjs`).
- [ ] Wire SMS into existing `scheduledNotificationCheck` Cloud Function as an additional channel.
- [ ] User preference stored at `users/{uid}/profile.notifications.sms = true|false`.

### WS-6: Dashboard Polish
**Files:** `src/components/screens/Dashboard.jsx` (or current dashboard root)

- [ ] Add "Ascent" label/badge for orientation.
- [ ] Verify all dashboard widgets still work with new nav targets (any "Go to Community" CTAs need to point to Events).

### WS-7: Data Migration & Cleanup
**Files:** `scripts/migrations/revamp-*.cjs`

- [ ] Audit existing community + coaching records → write migration to unify into events shape.
- [ ] Run on **dev first**, validate, then **test**, then **prod at cutover**.
- [ ] Backup before each run (we already have `data-exports/` pattern — extend `migrate-app-data.cjs`).

### WS-8: Testing
- [ ] Unit tests (Vitest) for: `evaluateRep` engine, RR config, fail logic, pattern detection, template selection.
- [ ] E2E (Playwright) suite: `e2e-tests/suites/revamp/` covering the six nav targets and the conditioning rep flow end-to-end.
- [ ] Manual QA pass on dev + test by Rob, then Ryan/Christina on test.

---

## 4. Timeline

Working backward from **May 11, 2026** (launch). Today is **April 28** → we have ~2 weeks.

| Week | Dates | Milestones |
|---|---|---|
| **Week 1** | Apr 28 – May 3 | Nav restructure (WS-1), Conditioning Light engine + UI scaffold (WS-3 a/b/c), Ask a Coach scaffold (WS-4), SMS toggle (WS-5). All deployed to **dev** by EOW. |
| **Week 2** | May 4 – May 10 | Events unification (WS-2), Conditioning templates + patterns (WS-3 e/f/g), data migration dry-runs (WS-7), full E2E suite (WS-8). Deployed to **test** by Wed May 6. Ryan + Christina QA on test Thu/Fri May 7–8. |
| **Cutover** | May 11 (Mon) | Final test sign-off AM, prod migration + deploy late afternoon (after 262's last session). Feature flag flipped on. Monitor. |

### Risk buffers
- If Conditioning Light engine slips, Events + Ask a Coach can ship first; old conditioning tool stays behind a flag for one more week.
- If SMS provider integration takes longer, ship Locker without it and fast-follow.

---

## 5. Decisions (locked April 28)

1. **Conditioning spec** — Full v1 design guide + Implementation Rules Addendum received. Captured verbatim in §6 below. Build to this spec exactly; default to stricter interpretation when ambiguous.
2. **Ask a Coach video hosting** — **Firebase Storage.** Keep self-contained; reuse existing storage rules + lifecycle.
3. **Events registration** — **Fully unified.** Single flow, no per-type branching. Type is just a tag.
4. **Cohort 262 communication** — **Yes, in-app announcement on launch (May 11).** Need a one-time banner/modal on first login post-cutover. Owner: Rob to draft, Ryan to approve copy.
5. **Legacy data** — **Hard-cut.** No admin-accessible legacy screens after launch. Old code stays in `*.legacy.jsx.bak` form for one cohort as rollback safety only, then deleted.

### New work added by these decisions
- **WS-1.5:** Build a one-time launch announcement modal/banner system (`users/{uid}/profile.seenAnnouncements.ascentLaunch`).
- **WS-7:** Migration must be irreversible-friendly — full data export before run, no dual-write period.

---

## 6. Conditioning Tool — Spec Reference (v1)

Full Ryan/Christina spec preserved here verbatim for build reference:

### Evaluation Order (must enforce exactly)
1. Validate Rep
2. Parse & Extract Evidence
3. Score Conditions (0–3 each)
4. **Apply Fail Logic — IMMEDIATE OVERRIDE**
5. Determine Result (Pass / Not Yet)
6. Check Pattern Triggers
7. Generate Output

### Critical Conditions (fail if ≤1)
- **DRF:** Behavior
- **RED:** Behavior, Request; Impact = 0 also fails
- **FUW:** Work Anchored
- **SCE:** Expectation, Success

### Strong Rep Thresholds (suppress question)
- **DRF:** Behavior + Impact + Reinforcement all ≥ Adequate, ≥2 Strong
- **RED:** Behavior ≥ Strong, Request ≥ Strong, Impact ≥ Adequate (else always include question)
- **FUW:** Work Anchored ≥ Strong, Progress + Ownership ≥ Adequate
- **SCE:** Expectation ≥ Strong, Success ≥ Strong, Ownership ≥ Adequate

### Pass Thresholds (total)
- DRF / FUW: ≥5
- RED: ≥9
- SCE: ≥6

### Pattern Triggers
- Same condition lowest in 3 of last 5 reps
- Condition never Strong in last 6 reps (escalation)
- RED: Request ≤2 in 3 of last 5 reps
- Suppression: max once per 3 reps; reset when condition hits Strong

### Output Rules
- Max 1 observation + max 1 question.
- Strong rep → 1 reinforcing observation, NO question.
- Pass-not-sharp → 1 observation + 1 question.
- Not Yet → 1 direct observation + 1 question targeting fail reason.
- Pattern triggered → replaces standard observation, does NOT stack.
- Never display numeric scores.
- Never explain framework.

### Anti-Drift
- AI may NOT infer missing structure.
- Vague input ≠ Adequate. Generic praise ≠ Pass.
- Low confidence → Not Yet + "input insufficient" + clarification ask.
- Mixed reinforcing/redirecting in RED → Behavior capped at 2.

---

## 7. Definition of Done (for cutover)

- [ ] Six-item nav live in dev + test, prod gated by flag.
- [ ] All four legacy services (community, coaching, full-conditioning) still callable but UI hidden.
- [ ] `evaluateRep` Cloud Function deployed to dev + test, latency <3s p95.
- [ ] Ask a Coach: post → notify → video reply → display loop verified.
- [ ] SMS opt-in works end-to-end on test.
- [ ] Migration script dry-run on prod data export shows zero data loss.
- [ ] Ryan + Christina sign-off on test environment.
- [ ] Rollback plan documented (flip flag, redeploy previous build).
