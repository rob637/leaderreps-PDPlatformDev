# Ascent Revamp — Implementation Plan

**Branch:** `Revamp`
**Target launch:** May 11, 2026 (Cohort 262 ends)
**Environments:** Build & test in **dev** and **test** only. **Prod untouched until launch.**
**Source of truth:** Discussion notes from Ryan + Conditioning Tool v1 spec (see end of doc).

> ⚠ **READ FIRST:** [§8 Pre-Flight Audit Findings & Hardening](#8-pre-flight-audit-findings--hardening) and [§9 Top Risks Mitigation Matrix](#9-top-risks-mitigation-matrix). The audit surfaced coupling that changes how WS-1 through WS-7 must be sequenced.

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

---

## 8. Pre-Flight Audit Findings & Hardening

Audit run April 28 against the live `Revamp` branch. Each finding includes the concrete file/line evidence and the corresponding mitigation folded into the workstreams.

### 8.1 Navigation — `navigate()` callsites are scattered
**Finding.** At least 50+ screen keys are registered in `src/routing/ScreenRouter.jsx`. Hardcoded `navigate('xxx')` calls live in widget templates ([src/config/widgetTemplates.js](src/config/widgetTemplates.js)), modals ([src/components/modals/TwoMinuteChallengeModal.jsx](src/components/modals/TwoMinuteChallengeModal.jsx)), gates ([src/components/ui/PrepGate.jsx](src/components/ui/PrepGate.jsx)), and the auth flow ([src/App.jsx](src/App.jsx)). Renaming/removing any screen breaks these silently.

**Mitigation (added to WS-1).**
- **Step 1: build a screen-key alias map** in `src/routing/screenAliases.js` so old keys (`community-hub`, `coaching-hub`, `community-feed`, `conditioning`) redirect to new keys (`events`, `events`, `events`, `conditioning-light`). Aliases are evaluated inside `ScreenRouter` before the lookup.
- **Step 2: do NOT delete old screen keys** in `ScreenRouter.jsx` during revamp — keep them registered, point them at the new components via the alias map, and only delete one cohort post-launch.
- **Step 3: grep enforcement.** Add a check in `scripts/ui-architecture-check.sh` that fails CI if any `navigate('community...'|'coaching...'|'conditioning')` reference is added without going through the alias map.

### 8.2 Mobile bottom nav only fits 5 items
**Finding.** [src/components/layout/MobileBottomNav.jsx](src/components/layout/MobileBottomNav.jsx) hardcodes 5 slots and filters out the active screen (so 4 visible at a time). Six-item nav won't fit without a UX choice.

**Decision required (default chosen).** Default = **5 in bottom bar + Locker accessed from header avatar** (Locker is settings-like, not a primary action). Bottom bar order: Dashboard, Events, Content, Conditioning, Ask a Coach. **Confirm with Ryan before WS-1 starts.**

### 8.3 Coaching & Community are top-level Firestore collections (not user subcollections)
**Finding.** Per [src/data/Constants.js](src/data/Constants.js) and the two services:
- Top-level: `coaching_session_types`, `coaching_sessions`, `coaching_registrations`
- Top-level: `community_session_types`, `community_sessions`, `community_registrations`
- Indexes exist for `content_coaching` and `content_community` collection groups in [firestore.indexes.json](firestore.indexes.json).

**Mitigation (rewrites WS-2 strategy).**
- **Do NOT migrate data on day one.** Build `eventsService.js` as a **read-aggregator** over both `coaching_sessions` and `community_sessions` collections, normalizing on read into a single `Event` shape with a `sourceType` discriminator (`coaching`|`community`).
- **Writes go to a new `events` top-level collection** with a `legacySourceType` field for compatibility.
- **Migration is a separate, post-launch task** — not blocking May 11. We freeze writes to old collections at cutover; reads continue from both indefinitely.
- **Indexes:** add a unified `events` composite index in `firestore.indexes.json` (cohort + startTime + status). Keep old indexes.

### 8.4 `onCoachingRegistrationEvent` Cloud Function sends ICS calendar + email
**Finding.** [functions/index.js#L639](functions/index.js) triggers on writes to `coaching_registrations` and produces calendar invites. Community has no equivalent today.

**Mitigation (added to WS-2).**
- Wrap the existing handler in `onEventRegistration` that listens to the new `events` collection's `registrations` subcollection. Reuse the ICS + email builders.
- Keep `onCoachingRegistrationEvent` listener active so legacy `coaching_registrations` writes still send emails during the read-aggregation phase.

### 8.5 Conditioning has a 9-state machine and rich Firestore schema
**Finding.** [src/services/conditioningService.js](src/services/conditioningService.js) writes to `users/{uid}/conditioning_reps` and `users/{uid}/conditioning_weeks` with 9 states (COMMITTED → DEBRIEFED → LOOP_CLOSED, plus MISSED/CANCELED). Light has only Pass/Not Yet.

**Mitigation (rewrites WS-3 strategy).**
- **Light writes to a NEW collection:** `users/{uid}/reps_light` with the schema in §6 (rrType, conditionScores, result, validity, transcript, createdAt). **Do NOT touch `conditioning_reps`.**
- Old `conditioning_reps` data stays read-only for historical reference; legacy widgets (`ConditioningHistoryWidget`) get hidden behind the `ascentRevamp` flag.
- This means **zero data migration** for conditioning. Zero risk of corrupting old reps. Old data archived in place.
- Pattern detection queries `reps_light` only — clean slate, no need to back-translate old states.

### 8.6 `useDailyPlan` may auto-inject removed entities
**Finding.** [src/hooks/useDailyPlan.js](src/hooks/useDailyPlan.js) generates the day-by-day roadmap. Audit didn't fully confirm whether it queries coaching/community/conditioning collections to populate the plan.

**Mitigation (added to WS-7).**
- **Block before WS-2 ships:** grep `useDailyPlan.js` and any `services/dailyLogService.js`, `dataUtils.js`, `unifiedContentService.js` for direct queries to `coaching_sessions`, `community_sessions`, `conditioning_reps`. If found, route through the new aggregator/light collections behind the feature flag.
- **Smoke test:** a user on day 30 (Foundation) and day 60 (Ascent) of a seeded cohort must see the same daily plan zones before vs after revamp toggle.

### 8.7 Phase model — "Ascent" is computed, not stored
**Finding.** [src/hooks/useDailyPlan.js#L999](src/hooks/useDailyPlan.js) computes `currentPhase` from `programDay > 50`. There is no `user.ascentLabel` or cohort-level Ascent attribute. Community is gated to `currentPhase?.id === 'post-start'` ([ArenaSidebar.jsx#L53](src/components/layout/ArenaSidebar.jsx)).

**Mitigation (clarifies WS-1 / WS-6).**
- The "Ascent" badge on the dashboard simply renders when `currentPhase?.id === 'post-start'`. **No new user attribute needed.**
- Events must be available to **Foundation phase users too** (they currently have coaching access). Drop the `isAscent` gate for Events; gate by `enableEvents` feature flag instead.

### 8.8 Feature flag system is hybrid (Firestore + hardcoded)
**Finding.** [src/providers/FeatureProvider.jsx](src/providers/FeatureProvider.jsx) reads `config/features` from Firestore. But sidebar feature gates ([ArenaSidebar.jsx#L39-54](src/components/layout/ArenaSidebar.jsx)) are **hardcoded JS variables**, not from Firestore. There is **no per-user or per-cohort flag**.

**Mitigation (rewrites WS-1 flag strategy).**
- Add `ascentRevamp` to `config/features` doc (Firestore-driven, environment-scoped via the env's project ID).
- New flag: `ascentRevampCohorts: string[]` — array of cohort IDs that should see the revamp. Default `[]`. Add `'all'` to enable globally. **This gives us cohort-level rollout** that the existing system lacks.
- Refactor sidebar's hardcoded `enableX` block to read these flags, falling back to current phase logic if flag missing.
- **Cutover:** flip `ascentRevampCohorts: ['all']` in prod's `config/features`. Instant rollback by setting back to `[]`. No redeploy needed.

### 8.9 No production SMS function exists; phone field missing on user
**Finding.** [scripts/test-telnyx-sms.cjs](scripts/test-telnyx-sms.cjs) is script-only. No `sendSms` Cloud Function. `users/{uid}` has no `phoneNumber` field. The accountability-assessment sub-app has its own SMS opt-in flow targeting a different collection.

**Mitigation (rewrites WS-5).**
- Build a new `sendSms` callable Cloud Function in `functions/index.js` reading Telnyx secrets from Firebase Secret Manager (same pattern as the test script).
- Add `users/{uid}/profile.phone` and `profile.phoneVerified` and `profile.notifications.sms` fields. Update `firestore.rules` to allow user self-write for these fields only.
- **OTP verification required.** Send 6-digit code via `sendSms`, verify via callable `verifyPhone`. Store verification timestamp.
- Wire SMS into `scheduledNotificationCheck` as an additional channel. **Verify what `scheduledNotificationCheck` currently sends** before extending — could already reference removed entities.
- **Out of scope for v1:** unifying with accountability-assessment phone collection. Note in §10 follow-ups.

### 8.10 Ask a Coach is fully greenfield
**Finding.** Audit confirms zero existing message-board / threads / comments code in main app. CommunityFeed is mock data only.

**Mitigation (clarifies WS-4).**
- New top-level collection `coach_questions/{questionId}` and subcollection `coach_questions/{id}/responses/{responseId}`. Video files at `users/{askerId}/coach-questions/{id}/video.mp4` (Storage).
- **Firestore rules additions:**
  - Any authenticated Ascent participant can `create` a question.
  - Only users in admin allowlist (existing `isAdmin()` rule) can write `responses`.
  - All Ascent participants can read all questions/responses.
- **Storage rules:** new path `coach-responses/{questionId}/` writable by admins only, readable by all authenticated users.
- **Notification:** Cloud Function `onCoachQuestionCreated` notifies admin emails by email + (later) SMS.
- **No moderation tools v1.** Admins can delete via Firestore console if needed. Add a moderation UI as fast-follow.

### 8.11 Service worker won't auto-update users
**Finding.** [vite.config.mjs#L27-29](vite.config.mjs) has `clientsClaim: false` and `skipWaiting: false`. Existing users see the old UI until they manually click an update prompt.

**Mitigation (added to WS-1.5).**
- The launch announcement modal **must** be backed by a hard version check (`version.json` network-only) so even users on stale SWs see the banner saying "New Ascent experience available — refresh to update."
- For the May 11 cutover specifically: temporarily flip `skipWaiting: true` for that one build. Revert immediately after.

### 8.12 Cloud Functions audit incomplete
**Finding.** `functions/index.js` is large (4500+ lines). Confirmed: `scheduledDailyRollover`, `scheduledNotificationCheck`, `onCoachingRegistrationEvent`, `onCoachingCancellationEvent`, `geminiProxy`. Other functions touching coaching/community/conditioning may exist.

**Mitigation (Action item before WS-2 starts).**
- Run a complete audit of `functions/index.js`: list every export, what collection it reads/writes, whether it touches the three legacy domains. Document in `docs/CLOUD-FUNCTIONS-INVENTORY.md`. Estimated ~2 hours; blocking for migration design.

### 8.13 RepUp & Reppy sub-apps may share collections
**Finding.** [reppy/src/data/communityContent.js](reppy/src/data/communityContent.js) exists. RepUp uses the main app build via [scripts/deploy-repup.sh](scripts/deploy-repup.sh).

**Mitigation.**
- **Confirm with Ryan:** does RepUp deploy point at the same Firebase project as main? If yes, freezing legacy `coaching_sessions` writes affects RepUp.
- Reppy is a separate PWA with its own Firebase config (per copilot instructions) — read its `firebaseConfig.js` to confirm. If it queries main project's data, we have a cross-app dependency to track.

### 8.14 Test coverage gaps
**Finding.** Existing E2E suites (`01-authentication` through `07-zones`) don't cover community, coaching, conditioning, or any of the new features.

**Mitigation (rewrites WS-8).**
- New suite: `e2e-tests/suites/08-revamp/` with subfiles:
  - `nav-shell.spec.js` — six-item nav, alias redirects work for old keys.
  - `events.spec.js` — list, register, see in own events, cancel.
  - `conditioning-light.spec.js` — submit rep (text + voice mock), get verdict, fail path, pattern path.
  - `ask-coach.spec.js` — post question, admin uploads video reply, asker sees it.
  - `locker-sms.spec.js` — opt in, OTP flow, opt out.
- Vitest unit tests for: `evaluateRep` engine (RR config, fail logic, scoring, pattern detection, template selection — at least 40 cases covering all spec edge cases).

### 8.15 Cohort 262 cutover — single-day migration risk
**Finding.** May 11 has a hard deadline; final 262 session ends that morning. No room to slip if migrations fail.

**Mitigation.**
- **Two staging passes minimum:** dev → test → "test-prod-mirror." Set up a third Firebase project (`leaderreps-prod-mirror`) populated from a fresh prod export and run the cutover dry-run there at least once before May 11.
- **Cutover script.** A single bash script `scripts/cutover-revamp.sh` performs: prod export backup → flip `ascentRevampCohorts: ['all']` → flip `skipWaiting: true` → deploy → smoke test → done. Reversible by re-running with `--rollback`.

---

## 9. Top Risks Mitigation Matrix

| # | Risk | Severity | Mitigation | Owned in WS |
|---|---|---|---|---|
| 1 | Renaming screens breaks `navigate()` calls | High | Screen alias map in router, no key deletion | WS-1 |
| 2 | Cloud Functions break when collections change | High | No collection deletion v1; full functions inventory before WS-2 | WS-2, action item §8.12 |
| 3 | `useDailyPlan` injects removed entities | High | Verify via grep before WS-2; route through aggregator | WS-7 |
| 4 | Conditioning state machine migration | High | Skip migration; new `reps_light` collection only | WS-3 |
| 5 | Cohort 262 cutover slippage | High | Dry-run on prod-mirror project; reversible cutover script | WS-7 |
| 6 | Mobile nav can't fit 6 items | Medium | 5 in bar + Locker via header avatar (confirm with Ryan) | WS-1 |
| 7 | No per-cohort feature flags | Medium | Add `ascentRevampCohorts` to `config/features` | WS-1 |
| 8 | No production SMS function | Medium | Build `sendSms` + OTP `verifyPhone` callable | WS-5 |
| 9 | Service worker doesn't auto-update | Medium | One-time `skipWaiting: true` for cutover build + version banner | WS-1.5 |
| 10 | Admin/facilitator role split missing | Medium | Use existing `isAdmin()` for v1; defer facilitator role | WS-4 |
| 11 | RepUp/Reppy data sharing unknown | Medium | Confirm Firebase project boundaries with Ryan | Action item §8.13 |
| 12 | Test coverage gap on new features | Medium | New `08-revamp` E2E suite + Vitest engine tests | WS-8 |
| 13 | Two phone-number sources (main app + accountability-assessment) | Low | Defer unification; document in §10 follow-ups | Post-launch |
| 14 | Storage cache 50MB limit with videos | Low | Don't cache Ask-a-Coach videos in PWA | WS-4 |
| 15 | Email templates hardcoded to `coaching_registrations` | Low | Reuse template builders for `events`; new templates for Ask a Coach | WS-2, WS-4 |

---

## 10. Action Items Before Coding Starts

These must be done (or explicitly waived) before any WS begins. Estimated 1 day of work total.

- [ ] **Confirm with Ryan:** mobile nav layout (5+avatar vs 6-item compact). [§8.2] — *Code currently ships 5-bar layout; awaiting Ryan sign-off before launch.*
- [x] ~~**Confirm with Ryan:** RepUp Firebase project boundary. [§8.13]~~ — **Resolved 2026-04-28.** Reppy uses `leaderreps-pd-platform` (shared) but isolates writes under `reppy_*` prefixed collections (`reppy_users`, `reppy_invitations`, `reppy_config`) with dedicated rules in [firestore.rules](../firestore.rules) lines 107–120. **No collision with revamp.**
- [x] ~~**Cloud Functions inventory:** complete list in `docs/CLOUD-FUNCTIONS-INVENTORY.md`. [§8.12]~~ — **Updated 2026-04-28** with post-WS-5 truth: 109 exports total, 7 touched by revamp, 6 adjacent (must not regress), 96 out of scope.
- [x] ~~**Daily-plan grep:** confirm `useDailyPlan` does not directly query the three legacy domains. [§8.6]~~ — **Verified 2026-04-28.** [src/hooks/useDailyPlan.js](../src/hooks/useDailyPlan.js) imports `collection`/`getDocs` only for `daily_plan_v1`. References to `coaching` / `community` are static onboarding copy strings (line 171–172), not Firestore queries.
- [x] ~~**Reppy firebaseConfig review:** confirm separate Firebase project. [§8.13]~~ — **Verified 2026-04-28.** Same project as main app; safe via collection prefixing (see §8.13 entry above).
- [ ] **Spin up `leaderreps-prod-mirror`** Firebase project for cutover dry-runs. [§8.15] — *Infra task; pending.*
- [ ] **Lock the cohort 262 communication copy** (announcement modal text). [WS-1.5] — *Awaiting Ryan/Christina sign-off on modal copy.*
- [x] ~~**CI guardrail:** screen-key registry check.~~ — **Added 2026-04-28.** `npm run check:screens` runs [scripts/check-screen-keys.cjs](../scripts/check-screen-keys.cjs); also wired into `precommit`. Verifies every value in `REVAMP_SCREEN_ALIASES` resolves to a registered key in `ScreenRouter.jsx`.
- [x] ~~**Vitest engine suite** for Conditioning Light.~~ — **Added 2026-04-28.** [src/test/conditioning-engine.test.js](../src/test/conditioning-engine.test.js) — 38 cases covering validity, fail logic per RR, pass thresholds, strong-rep eligibility, Quick Read labels, pattern detection (short-window, escalation, RED-Request, reset, suppression), and pattern-skip-on-fail.

## 11. Post-Launch Follow-Ups (Explicitly Deferred)

Listed so they aren't forgotten but kept out of v1 scope:

- Unify accountability-assessment phone collection with main app `users/{uid}.profile.phone`.
- Migrate legacy `coaching_sessions` and `community_sessions` data into the new `events` collection (currently aggregated on read).
- Delete `*.legacy.jsx.bak` files after one cohort runs successfully on revamp.
- Build Ask a Coach moderation UI (delete, hide, flag responses).
- Build "Video Library" view in Content surfacing tagged Ask a Coach answers.
- Introduce true `facilitator` role distinct from `admin` in Firestore rules.
- Conditioning analytics dashboard for Christina/Ryan (trend graphs over `reps_light`).
- Service worker auto-update strategy (`skipWaiting: true` permanently with proper update UX).

