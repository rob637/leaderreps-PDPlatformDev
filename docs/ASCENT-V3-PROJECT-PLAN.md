# Ascent v3 — Project Plan (Dev only)

**Status:** Plan, ready to execute. Dev environment (`leaderreps-pd-platform`) only.
**Branch:** `Foundation` (continue here; merge to `main` only after pilot)
**Date:** April 20, 2026
**Companion design doc:** [ASCENT-V3-DESIGN-APRIL-2026.md](ASCENT-V3-DESIGN-APRIL-2026.md)

---

## Guiding principles

1. **Dev-only.** No test/prod deploys. All work behind feature flags so dev can be safely shared.
2. **Build on what exists.** Reuse `coaching_sessions`, `conditioning_reps`, `conditioning_weeks`, `COACH_PROMPTS`, `ONE_ON_ONE`, `OPEN_GYM`, `RepUpCoach` (CLEAR). No parallel systems.
3. **Original vocabulary.** We borrow *patterns* from EOS, Vistage, and Heroic — not their words. Naming below.
4. **Shippable in slices.** Every milestone produces something a real Ascent leader can use end-to-end, even before SMS lands.
5. **No new chat UI, no new dashboard, no new rep taxonomy.** (Per design doc constraints.)

---

## Vocabulary — LeaderReps-native names

These are the *only* terms that should appear in UI copy, schemas, and code. The right column is the inspiration we are NOT using.

| LeaderReps term | Used for | (Inspired by — do not use) |
|---|---|---|
| **Anchor** | A 90-day leadership priority owned by one leader | EOS *Rock* |
| **Anchor Set** | The 1–3 Anchors a leader holds for a quarter | EOS *Rocks list* |
| **Anchor Reset** | The quarterly 1:1 where Anchors are reviewed and reset | EOS *Quarterly* |
| **Pulse** | The weekly numeric rollup (reps closed, missed, on-track Anchors) | EOS *Scorecard* |
| **Pulse Check** | The weekly SMS/in-app status ping per Anchor (on track / off / needs help) | EOS *Scorecard fill-in* |
| **Open Gym** | Existing 60-min cohort working session | (already ours — keep) |
| **Round** | The structured sequence inside an Open Gym (replaces "agenda") | EOS *L10* |
| **Round Steps:** Opener · Pulse · Headlines · Worklist · Commit | The five segments of a Round | EOS *Segue/Scorecard/Headlines/IDS/Conclude* |
| **Worklist** | Queue of issues members texted/submitted before the Open Gym | EOS *Issues List* |
| **Work the Issue** | The facilitated process: clarify → perspective → owner commits next step | Vistage *IDS* / Vistage process |
| **Perspective** (vs. *Advice*) | What the group offers — experience, not directives | Vistage *experience sharing* |
| **Field Note** | One-sentence post-rep reflection (already partly in debrief) | Heroic *journal* |
| **Streak** | Consecutive weeks with the required rep closed | (generic — keep) |
| **Arena** | The dashboard surface (already ours) | — |
| **Foundation / Ascent** | Program phases (already ours) | — |

**Code-level naming:** new fields/collections should use these names verbatim — `anchors`, `anchorSet`, `pulse`, `pulseChecks`, `worklist`, `rounds`. No `rocks`, `scorecard`, `ids`, anywhere in the codebase.

---

## What's in scope for v3 (dev)

- **M1 — Anchors (personal cadence)** — quarterly Anchor Set + weekly Pulse Check, in-app first
- **M2 — Pulse surfacing** — cohort + personal Pulse widget on Ascent Arena
- **M3 — Open Gym Round runner** — facilitator view with timer + Worklist + Work-the-Issue flow
- **M4 — Worklist intake (in-app)** — leader can submit an issue from anywhere; routes to next Open Gym
- **M5 — SMS layer** — *gated on phone number approval; spec only until then*
- **M6 — Anchor Reset 1:1 template** — agenda + carry-forward into the existing `ONE_ON_ONE` flow
- **M7 — Pilot polish** — copy pass, accessibility, empty states, Rep AI nudges to new surfaces

## Explicitly out of scope (v3)

- Observer pulses / 360s
- New rep taxonomies or rep types
- A separate Ascent dashboard (we add Ascent variants of existing widgets)
- Chatbot or conversational AI surface
- Test or prod deploys
- Anything that requires SMS until the number is approved

---

## Data model additions

All additive — no breaking changes to existing collections.

### `users/{uid}/anchors/{anchorId}`
```js
{
  anchorId,
  title,                  // "Close every direct's 1:1 loop weekly through Q3"
  description,
  quarter,                // "2026-Q3"
  startDate, endDate,
  status,                 // 'active' | 'done' | 'carried' | 'dropped'
  pulseTargets: [         // measurable definitions tied to existing rep data
    { metric: 'reps_closed_of_type', repType: 'redirecting_feedback', target: 12 },
    { metric: 'streak_weeks', target: 10 },
  ],
  createdInSessionId,     // ONE_ON_ONE id where it was set
  createdAt, updatedAt,
}
```

### `users/{uid}/pulse_checks/{weekId}`
```js
{
  weekId,                 // "2026-W17"
  perAnchor: {
    [anchorId]: { status: 'on_track' | 'off_track' | 'needs_help', note },
  },
  source: 'app' | 'sms',
  createdAt,
}
```

### Extend `coaching_sessions/{id}` (Open Gym docs only)
```js
{
  // existing fields unchanged
  round: {
    template: 'standard_v1',           // versioned
    segments: [                         // generated from template + cohort state at session start
      { key: 'opener',     minutes: 5 },
      { key: 'pulse',      minutes: 10 },
      { key: 'headlines',  minutes: 5 },
      { key: 'worklist',   minutes: 35 },
      { key: 'commit',     minutes: 5 },
    ],
    currentSegmentKey: 'opener',
    startedAt, endedAt,
  },
  worklist: [
    {
      itemId, submittedBy, submittedAt,
      summary,                          // one-sentence
      tags: ['feedback','pushback'],
      status: 'queued' | 'selected' | 'worked' | 'parked',
      ownerCommit: { text, repId },     // populated when Worked → leader commits next step
    },
  ],
}
```

### `cohorts/{cohortId}/worklist_inbox/{itemId}` (cohort-wide intake before any specific session)
```js
{
  itemId, submittedBy, summary, tags, createdAt,
  routedToSessionId: null,              // set when facilitator pulls into a Round
}
```

### Feature flag (root `config/featureFlags`)
```js
{
  ascentV3: { anchors: true, openGymRound: false, worklistIntake: true, sms: false },
}
```

---

## Milestones

Each milestone = one deployable slice to dev. Dependencies in parens. No time estimates per project convention.

### M1 — Anchors (personal cadence) — *no dependencies*
- New service: `src/services/anchorsService.js` (CRUD on `users/{uid}/anchors`, weekly `pulse_checks` write).
- New screen: `src/components/screens/Anchors.jsx` — list active Anchors, week-by-week Pulse Check grid.
- New widget: `src/components/widgets/MyAnchorsWidget.jsx` — Ascent-only, top of Arena.
- Hook: `src/hooks/useAnchors.js`.
- Wire into ScreenRouter as `'anchors'`. Add sidebar entry behind `featureFlags.ascentV3.anchors` and `isAscent`.
- Acceptance: an Ascent leader can create up to 3 Anchors, mark a weekly Pulse Check, see streak.

### M2 — Pulse surfacing — *(M1)*
- Extend `MyAnchorsWidget` with personal Pulse: weeks on-track per Anchor, current streak.
- New widget: `src/components/widgets/CohortPulseWidget.jsx` — aggregates `conditioning_weeks` across cohort (read-only). Reuses existing rollup; no new writes.
- Surface in existing Open Gym detail view as a read-only Pulse band.
- Acceptance: leader sees their Pulse + cohort Pulse on Arena; facilitator sees cohort Pulse on every Open Gym.

### M3 — Open Gym Round runner — *(M2)*
- Schema: extend `coaching_sessions` with `round` (writes only when facilitator starts a Round).
- New facilitator screen: `src/components/coaching/OpenGymRoundRunner.jsx` — timer per segment, advance/back, Pulse band, Worklist panel, Commit capture.
- "Run This Open Gym" button on `CoachingHub` for facilitators only.
- Commit step writes a `committed` rep per leader (reuses existing `commitRep` flow).
- Acceptance: facilitator can run a 60-min Round end-to-end against a real cohort and the timer/state persists across refresh.

### M4 — Worklist intake (in-app) — *(M3)*
- New component: `src/components/coaching/SubmitToWorklist.jsx` — small modal accessible from Arena and from Conditioning.
- Service: `src/services/worklistService.js` writes to `cohorts/{cohortId}/worklist_inbox`.
- Round runner pulls inbox into the session's `worklist` at start; facilitator can park/select.
- Acceptance: leader submits an issue Tuesday, facilitator sees it in Friday's Open Gym Worklist.

### M5 — SMS layer (spec + scaffold only, gated) — *(blocked on phone approval)*
- Cloud Function `smsWebhook` in `functions/index.js` (Gen 2). Stub + test harness now; live wiring after approval.
- Map keywords → existing services:
  - `REP <name>` → `commitRep`
  - `ISSUE <text>` → `worklistService.submit`
  - on-track/off-track replies → `pulse_checks` write
- Reuse `COACH_PROMPTS.nudgeMessage` strings for outbound copy.
- **No deploy until A2P 10DLC is live.** Land the code behind `featureFlags.ascentV3.sms = false`.
- Acceptance: unit-tested keyword router with Firestore writes mocked.

### M6 — Anchor Reset 1:1 template — *(M1)*
- Add `agendaTemplate: 'anchor_reset_v1'` option to `ONE_ON_ONE` create flow.
- Renders structured agenda inside the existing 1:1 view: Review → Carry-forward → Set new → Confirm Pulse Targets.
- Writes: closes prior quarter Anchors (`status: 'done' | 'carried' | 'dropped'`), creates new Anchor Set with `createdInSessionId`.
- Acceptance: facilitator runs an Anchor Reset and the new Anchor Set appears on the leader's Arena before they leave the call.

### M7 — Pilot polish — *(all above)*
- Copy review for new vocabulary (no leaked EOS/Vistage/Heroic terms — grep gate, see below).
- Empty states for first-week Ascent leaders with no Anchors yet.
- Rep AI navigation prompts: "Set your Anchor Set", "Submit an issue to Worklist", "Mark this week's Pulse".
- Accessibility pass on Round runner timer (live region for segment changes).
- Vitest coverage for `anchorsService`, `worklistService`, SMS keyword router.
- Playwright suite: Anchor create → Pulse Check → cohort surfacing → Open Gym Round → Worklist intake.

---

## Vocabulary guard (CI gate)

Add `scripts/check-ascent-vocabulary.sh` — fails CI on any of these tokens in `src/`, `functions/`, or new docs:

```
rocks?   scorecard   ids   level\s?10   l10   eos
quarterly\s+rocks    issues\s+list      vistage   issue\s+processing
heroic
```

(Existing references in legacy/historical docs are exempted via path filter.)

Run on lint stage. This is the cheapest way to keep us honest.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Vocabulary slips into UI | CI grep gate (above) + copy review in M7 |
| Round runner state loss on refresh | Persist `round.currentSegmentKey` and segment timestamps to Firestore on every advance |
| Facilitator vs leader permission confusion | Reuse existing `isAdmin` / cohort-trainer rules; no new roles |
| SMS slips and we feel pressure to ship without consent | Hard flag (`featureFlags.ascentV3.sms`) + functions-side consent check; no Twilio creds in dev until approved |
| Empty Ascent dashboard for early leaders | M1 ships an MyAnchorsWidget with a "Set your first Anchor" CTA so it's never empty |
| Leaders ignore weekly Pulse Check until SMS lands | In-app Pulse Check banner on Mondays for Ascent users; widget badge on Tuesdays |

---

## Definition of done (per milestone)

- Lint + vocabulary grep gate passes
- Vitest unit tests for new services
- Playwright happy-path test added
- Deployed to dev (`npm run deploy:dev`)
- Sanity check on dev with one real Ascent test user
- One-paragraph changelog entry in `docs/ASCENT-V3-CHANGELOG.md` (created with M1)

---

## What I'd build first

**M1 (Anchors) → M2 (Pulse) → M4 (Worklist intake) → M3 (Round runner) → M6 (Reset 1:1) → M7 (polish) → M5 lands when SMS is approved.**

Reasoning: M1+M2 give every Ascent leader something visible on day 1 of Ascent without any facilitator dependency. M4 before M3 lets us start collecting real Worklist items so the first Round runner test isn't empty.

---

## Open decisions (need your call before M1 starts)

1. **Anchor cap** — fixed at 3, or configurable per cohort?
2. **Quarter alignment** — calendar quarters (Jan/Apr/Jul/Oct), or rolling from each leader's Ascent start date?
3. **Pulse Check cadence** — Monday morning prompt, or Friday close-of-week? (Different psychology.)
4. **Facilitator model for pilot Open Gym** — paid coach, peer-rotated, or AI-assisted facilitator notes? (Drives how heavy the Round runner UI needs to be.)
