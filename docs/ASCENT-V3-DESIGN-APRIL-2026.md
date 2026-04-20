# Ascent v3 — Design Notes (April 2026)

**Status:** Design proposal, awaiting SMS provider activation before any build work.
**Author:** Working session between Rob and Copilot, April 19–20, 2026.
**Supersedes:** All prior `ASCENT-*.md` design docs in this folder. Earlier docs are kept for history but should not be used as the source of truth.

---

## The actual problem this solves

It is **not** "what comes after Foundation."

The real problem (as stated by Rob): **Foundation classes are great. Attendance is strong. Reviews are strong. The leak is the time *between* classes.** That is true during Foundation itself, and it is the same root problem Ascent has to solve at a longer cadence.

So Ascent v3 is not a separate post-Foundation product. It is **the operating system for the time between any LeaderReps touchpoint** — and Foundation gets the immediate engagement fix while Ascent gets the longer-horizon structure layered on.

## Solution direction

Two prongs, both already in motion or already partly built:

1. **SMS as the between-session channel.** Phone number approval is in flight. SMS is how we reach leaders where they actually are (their phone, not the app), with two-way structured prompts that read and write to the existing rep schema.
2. **Open Gyms as the community engine, structured by methodologies the boss already trusts** — **Vistage** (peer advisory, issue processing) and **EOS** (Rocks, Scorecard, L10 meeting cadence, IDS).

---

## What's already in the codebase that maps to this brief

These are *facts from the running code*, not aspirations:

- **Open Gym is already a session type with variants** — see `CoachingHub.jsx` line ~19: `open_gym`, `open_gym_redirecting_feedback`, `open_gym_handling_pushback`. Default cap 20.
- **Coaching session infrastructure is fully built** — `useCoachingSessions.js` defines `ONE_ON_ONE`, `LEADER_CIRCLE`, `LIVE_WORKOUT`, `WORKSHOP`, `OPEN_GYM`. Registration, calendar view, Google Meet links, max attendees, all live.
- **The Conditioning Loop already has an EOS Scorecard data shape** — `users/{uid}/conditioning_weeks/{weekId}` rolls up `requiredRepCompleted`, `totalRepsCommitted`, `totalRepsCompleted`, `totalRepsMissed`, `consecutiveMissedWeeks` (see `conditioningService.js`). It just isn't surfaced as one.
- **Pattern detection for between-session coaching is already built** — `COACH_PROMPTS` in `conditioningService.js` defines: `low_risk_pattern` (Comfort Zone Loop), `avoidance_pattern` (Delayed Execution), `prep_strong_followthrough_weak` (Prep Without Action), `no_close_pattern`, `consecutive_misses`. Each has a `nudgeMessage` already written. **These were built for in-app trainer nudges; repointing them at SMS is a small change, not a new product.**
- **Community is already gated to Ascent** — `ArenaSidebar.jsx` line ~44: `enableCommunity: isAscent`.
- **Rep AI Coach is a navigation guide** — `RepCoach.jsx` line ~18 explicitly states *"Rep does NOT duplicate dashboard widgets — it guides TO them."* Don't replace Rep with a chatbot.
- **CLEAR is the product's existing coaching framework** — Context, Listen, Explore, Action, Review (see `RepUpCoach.jsx`). Use it; don't invent new vocabulary.
- **The universal rep schema** — Trigger, Intended Outcome, Standard, Hard Move, Close/Next — is what every rep is built on. SMS replies should map to these fields.

---

## The three layers

### Layer 1 — SMS as the between-session backbone

When the phone number is approved:

| Trigger | SMS sent | What the reply does |
|---|---|---|
| **Tuesday 9am** | "What's your one rep this week? Reply with the person's first name." | Creates a `committed` rep in `users/{uid}/conditioning_reps/{repId}`. Two follow-up texts over the next day fill in `standard` and `intended_outcome`. |
| **2 hrs before high-risk rep deadline** | "Heads up: your hard conversation with [person] is in 2 hours. One question: what's the standard you're holding?" | Reply is appended to `prep.rubricResponses` and rep transitions to `prepared`. |
| **Same evening as executed rep** | "How did it go with [person]? Reply 1–5 plus a sentence." | Triggers `executed → debriefed` with quality assessment fields. |
| **Pattern detected** (existing `COACH_PROMPTS`) | The existing `nudgeMessage` for that pattern. | Reply is logged as a coach interaction. |
| **Issue intake (any time, leader-initiated)** | Leader texts `ISSUE` + a sentence. | Adds to next Open Gym's `issues_queue` (see Layer 2). |
| **Sunday digest** | "You closed 1 rep, missed 0. Cohort closed 18 of 24. Tuesday: next rep nudge." | Read-only. Mirrors the EOS-style `conditioning_weeks` rollup. |

Routing keywords for leader-initiated texts: `REP`, `ISSUE`, `HELP`, `STOP`, `START`. Anything else gets parsed by Rep AI and routed.

**Critical design constraints:**
- This is **not a chatbot**. It's structured prompts with structured replies that write to the existing rep schema.
- All SMS infra must respect A2P 10DLC consent and STOP/HELP per US carrier rules.
- The leader should be able to do an entire week of conditioning **without opening the app** — and still have the app reflect everything they did.

### Layer 2 — Open Gyms structured by EOS L10 + Vistage IDS

Open Gym session type already exists. What we add is the **agenda structure**.

**Standard 60-minute Open Gym agenda:**

| Time | Borrowed from | What it looks like |
|---|---|---|
| 5 min | EOS — Segue | Each leader: one-sentence best leadership moment of the week. Pulled from their week's reps if they want a prompt. |
| 10 min | EOS — Scorecard | Cohort scorecard: how many reps closed this week across the room. Collective view, not individual shaming. *Existing data, just surfaced.* |
| 5 min | EOS — Headlines | One-line wins / one-line losses. |
| 35 min | EOS + Vistage — IDS | Issues members texted in during the week. Group votes top 1–2. **Vistage process:** issue-bringer states it; group asks **only clarifying questions** for ~5 min; group offers **experience and perspective** (not advice) for ~10 min; issue-bringer commits to a next step. |
| 5 min | EOS — Conclude | Each leader: one commitment for next week → auto-creates a `committed` rep. |

**Themed Open Gyms** (the existing variants like `open_gym_redirecting_feedback`) keep the same agenda but pre-filter the IDS queue to issues tagged with that rep type.

**Implementation footprint:**
- Extend session schema with `agenda` and `issues_queue` fields
- Add SMS path for issue intake → `issues_queue`
- Add a facilitator-facing "Run This Open Gym" view (timer, IDS workflow, scorecard surface)
- No new collections, no new screens for leaders

### Layer 3 — EOS Rocks as the personal Ascent structure

This is what gives Ascent a visible, structured cadence the boss will instantly recognize.

- Each Ascent leader has **1–3 Leadership Rocks per quarter** (90-day priorities). Rocks are sentences: *"Have weekly 1:1s with all 6 directs and close the loop on each by end of June."*
- Rocks are **set in a 1:1 with their facilitator** at the start of each quarter (existing `ONE_ON_ONE` session type).
- Each Rock has **measurable Scorecard items** that map to existing conditioning data — count of reps of type X, % closed-loop, etc. The `conditioning_weeks` rollup is ~90% of this already.
- **Weekly SMS check-in:** "On track / off track / needs help" for each Rock. Off-track Rocks become Open Gym IDS candidates automatically.
- **Quarterly Reset 1:1** — review Rocks, celebrate done, carry forward, set new ones.

This gives Ascent its rhythm: **weekly reps + monthly Open Gym + quarterly Rocks reset**. Same machinery as Foundation, just with a 90-day horizon layered on.

### Vistage cultural layer (no new feature, just guard-rails)

Three Vistage practices that show up as copy/prompt rules across all surfaces:

1. **Clarifying questions before solutions** — built into Open Gym facilitator agenda and Rep AI system prompt
2. **Experience and perspective, not advice** — facilitator script + AI tone setting
3. **Issue-bringer owns the next step** — no "you should"; always "here's what I'll try"

---

## Day-in-the-life

**Foundation week 4 leader (Sarah):**
- Tue 9am SMS → "What's your rep this week?" → "Carlos. The budget thing." → 2 follow-up texts fill in standard + outcome
- Wed: live class
- Thu 2pm SMS → "Carlos meeting in 2 hrs. What's the standard?"
- Thu 5pm SMS → "How'd it go with Carlos? 1–5 + a sentence"
- Fri noon Open Gym → someone else's IDS issue mirrors hers from last month; she offers experience
- Sun digest SMS → week summary + cohort scorecard

**Ascent leader (post day 71):**
- Same weekly rhythm as above
- *Plus* monthly 1:1 to review 3 Rocks
- *Plus* weekly Rock check-in SMS
- *Plus* standing seat in monthly Open Gym
- *Plus* quarterly Rocks reset 1:1 + digest

---

## What NOT to build

- ❌ A new chat UI. Rep AI Coach already exists with a defined navigation-guide role. Don't replace it.
- ❌ New "field reports" or new weekly artifacts. The `conditioning_weeks` doc already rolls up state — surface that better instead.
- ❌ New rep taxonomies. V2 is settling in (`USE_V2_COMMIT_FLOW = true` in `Conditioning.jsx`).
- ❌ Observer pulses / 360s as a first-class subsystem for v1. Add a lightweight "send them one question after the rep" to the existing DEBRIEFED → LOOP_CLOSED transition if needed.
- ❌ A separate Ascent dashboard. Add Ascent-aware variants of existing widgets and Ascent-specific daily plan docs.

---

## Open questions to resolve before build

1. **SMS provider & consent setup** — Twilio? A2P 10DLC campaign status? Opt-in flow for existing users?
2. **Open Gym facilitation model** — paid coach, peer-led, or AI-assisted? Vistage works because the chair is paid and trained. Drives how much guard-railing the agenda needs.
3. **Rocks vocabulary** — use EOS terminology as-is ("Rocks"), or rename to fit LeaderReps voice? Need this locked before naming downstream surfaces.

---

## Sequenced next steps

Once SMS is live and the three open questions are answered, in order:

1. **Wire two-way SMS to the conditioning rep schema** — Tuesday nudge, prep ping, debrief ping. Reuse existing `COACH_PROMPTS` `nudgeMessage` strings.
2. **Issue intake via SMS → Open Gym `issues_queue`** — minimal Firestore extension to session schema.
3. **Run a Rocks pilot with one Ascent cohort** — quarterly 1:1 + weekly Rocks SMS check-in. No new UI required for the pilot; can be Firestore docs + facilitator-managed.
4. **Build the facilitator "Run This Open Gym" view** with EOS L10 timer + IDS workflow + scorecard surface.
5. **Surface the cohort scorecard** in Open Gym and in a weekly leader digest (in-app and SMS).

Each step is shippable on its own and demonstrates value before the next is built.

---

## File / code references

- `src/components/screens/CoachingHub.jsx` — Open Gym session type with variants
- `src/hooks/useCoachingSessions.js` — `SESSION_TYPES` registry
- `src/services/conditioningService.js` — rep state machine, weekly rollup, `COACH_PROMPTS`
- `src/services/repTaxonomy.js` — V1 + V2 rep types, universal rep fields
- `src/components/conditioning/CommitRepForm.jsx` — rep commit flow (mirror this for SMS)
- `src/components/screens/RepCoach.jsx` — Rep AI navigation guide (don't replace)
- `src/components/rep/RepUpCoach.jsx` — CLEAR coaching framework
- `src/components/layout/ArenaSidebar.jsx` — Community gating to Ascent
- `src/components/screens/Conditioning.jsx` — `USE_V2_COMMIT_FLOW = true` flag

---

## Status as of April 20, 2026

- [x] Diagnosis confirmed with Rob
- [x] Solution direction confirmed (SMS + Open Gyms + EOS/Vistage methodology)
- [ ] **Waiting on SMS phone number approval before any build**
- [ ] Three open questions above to be answered
- [ ] Then sequence above
