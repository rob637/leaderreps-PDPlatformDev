# Ascent — Repositioning as the "Lead Team" Layer

**Date:** April 22, 2026
**Status:** Draft for review (Rob, Ryan, Cristina)
**Branch:** `Foundation` (dev only — no test/prod impact)
**Companion docs:**
- [ASCENT-V3-PROJECT-PLAN.md](ASCENT-V3-PROJECT-PLAN.md)
- [ASCENT-V3-DESIGN-APRIL-2026.md](ASCENT-V3-DESIGN-APRIL-2026.md)
- [ASCENT-PHASE-STRATEGY.md](ASCENT-PHASE-STRATEGY.md)

---

## TL;DR

Ascent stays **gated behind Foundation**. We are not redefining who Ascent is for or how someone gets in. We're sharpening **what Ascent is about** so it slots cleanly into the Lead Work → Lead Team → Lead Self framework, and so the day-to-day experience matches how busy frontline managers actually use the app.

This is a **focus + framing** change, not a teardown. ~80% of the existing Ascent v3 plan (Anchors, Pulse, Open Gym Rounds, Worklist, SMS heartbeat) carries forward unchanged. What changes is the **organizing story**, the **home screen**, and the **content spine**.

---

## The framework we're committing to

LeaderReps teaches three layers of leadership. Each gets its own course/program over time:

| Layer | Course | Status | What it teaches |
|---|---|---|---|
| **Lead Work** | Foundation | ✅ Built | Run the work — priorities, execution, accountability, the basics of leading output |
| **Lead Team** | *(future course)* | 🔜 Planned | Run the people — conversations, decisions, coaching, conflict, trust |
| **Lead Self** | *(future course)* | 🔜 Planned | Run yourself — energy, identity, presence, growth as a leader |

**Ascent is the indefinite phase that lives after Foundation.** Until the dedicated Lead Team and Lead Self courses exist, Ascent's job is to:

1. **Reinforce Foundation** (Lead Work) — keep the reps and habits alive
2. **Introduce Lead Team** — give frontline managers the conversations, frameworks, and community they need *right now*
3. **Tee up Lead Self** — surface previews, reflections, and assessments that point toward the future course
4. **Keep them connected** — Open Gyms, Leader Circles, and SMS check-ins so Foundation isn't where the relationship ends

When Lead Team and Lead Self ship as full courses, Ascent gets re-scoped again — but the rails we build now (Anchors, Pulse, Open Gym, SMS) all survive.

---

## Why this isn't a teardown

Reading the existing Ascent docs side-by-side with the Lead Work/Team/Self framing, the overlap is large:

| Already in the Ascent v3 plan | Maps to |
|---|---|
| Anchors (90-day priorities) | Reinforces **Lead Work** discipline |
| Pulse / Pulse Checks | Reinforces **Lead Work** rhythm |
| Open Gym Rounds + Worklist | Pure **Lead Team** practice — peers working real people-issues |
| Anchor Reset 1:1 | **Lead Team** — the conversation container |
| Weekly SMS check-in (`labAscentScheduledSms`) | Heartbeat across all three |
| Leader Circles | **Lead Team** — community + accountability |

The bones are right. What's missing is an **explicit Lead Team content spine** sitting on top, and a **simpler home screen** that respects how little time these users have.

---

## The three changes we're actually making

### Change 1 — Add a "Conversations & Frameworks" content spine (the Lead Team layer)

Frontline managers don't fail because they lack theory. They fail because they avoid or fumble specific conversations. Ascent's content shelf should be organized around a **small, named library** of those conversations + a **tiny set of frameworks** they can recall under stress.

**Conversation library (start with 5, expand to 7):**

1. The **Expectation** Conversation — setting and resetting clarity
2. The **Feedback** Conversation — in-the-moment + corrective
3. The **Coaching** Conversation — asking vs. telling
4. The **Decision** Conversation — how to make one + how to communicate it
5. The **1:1** Conversation — the recurring container
6. *(later)* The **Delegation** Conversation
7. *(later)* The **Difficult** Conversation — conflict, pushback, performance

**Frameworks (pick 3, reuse everywhere):**

- **Decision-making:** Reversible vs. Irreversible + Who-Decides / Who-Inputs
- **Feedback:** SBI (Situation – Behavior – Impact) or LeaderReps variant
- **Conversation Prep:** 4-question card — *What outcome? What's true? What might they hear? What do I ask first?*

**Unit of content for each conversation:**
- 2–3 min video
- 1-page printable framework card (mobile-friendly)
- Prep tool (the 4-question card, prefilled by AI if they want)
- Debrief prompt (sent via SMS the next day)
- Tied to a matching **Open Gym** ("Open Gym: Practice the Feedback Conversation")

This becomes the **content pool** that feeds the existing weekly challenge model in [ASCENT-PHASE-STRATEGY.md](ASCENT-PHASE-STRATEGY.md). We don't invent a new content engine — we give it a spine.

### Change 2 — Simplify the Ascent home screen around three jobs-to-be-done

The current Ascent Arena ([src/components/screens/AscentArena.jsx](../src/components/screens/AscentArena.jsx)) is conceptually rich (Anchors, Pulse Checks, Streak, Worklist, Open Gym preview). For a busy frontline manager opening the app between meetings, that's too much above the fold.

Replace the top of the screen with **three obvious entry points**:

1. **"I have a conversation coming up"** → conversation picker → prep tool
2. **"I need to make a decision"** → decision framework
3. **"I want to connect with people"** → Open Gym / Leader Circle registration

Below that:
- **Continue where you left off** (one card)
- **Your Anchors / Pulse** (existing, but collapsed by default)
- **On-Demand Library** (one row, searchable by *situation*, not topic)
- **Coming soon: Lead Self** (a single teaser card — see Change 3)

Same data model, same widgets, just re-prioritized for the frontline-manager use case.

### Change 3 — Queue up Lead Self (and a richer Lead Team) as visible "coming soon"

We don't have the courses yet, but we should make the **journey visible** so users know Ascent isn't the end of the road. Two lightweight surfaces:

- **A persistent "What's Next" card** on the Ascent home: shows Lead Team and Lead Self as upcoming courses with a "Notify me" button (writes to a waitlist collection — reuses the assessment-waitlist pattern in [functions/index.js](../functions/index.js#L11320)).
- **A monthly Lead Self preview** — one reflection, one assessment, or one short video tied to identity / energy / presence. This becomes part of the weekly challenge rotation as a "Self Week" every 4–6 weeks.

This costs almost nothing to ship and dramatically changes the *story* the user tells themselves about being in Ascent.

---

## What stays exactly the same

- Foundation completion → Ascent transition (functions: `cohort completion → phase: "ascent"`)
- Phase gating in [ArenaSidebar.jsx](../src/components/layout/ArenaSidebar.jsx) (Community unlocked in Ascent)
- AscentWelcomeModal trigger logic in [Dashboard.jsx](../src/components/screens/Dashboard.jsx)
- Anchors / Pulse / Worklist data model from the v3 plan
- Open Gym + Leader Circle infrastructure ([coachingService.js](../src/services/coachingService.js), [communityService.js](../src/services/communityService.js))
- SMS infrastructure (`labAscentScheduledSms`, Twilio, opt-in in [LeaderProfileForm.jsx](../src/components/profile/LeaderProfileForm.jsx))
- Vocabulary from [ASCENT-V3-PROJECT-PLAN.md](ASCENT-V3-PROJECT-PLAN.md): Anchor, Pulse, Open Gym, Round, Worklist, Field Note
- Pricing / packaging assumptions from [ASCENT-MVP-PROPOSAL.md](ASCENT-MVP-PROPOSAL.md)

---

## SMS plan — three jobs only

The SMS infrastructure exists. Use it for these and nothing else (busy users will silence us if we over-text):

1. **Pre-conversation nudge** — *"1:1 with Jamie tomorrow — want a 60-sec prep?"* → link to prep tool
2. **Weekly rep / Pulse Check** — one question, reply by text, AI replies (already built — `ascent-checkin` interactionType)
3. **Event reminder** — *"Open Gym tonight at 7"* → 1-tap RSVP

**Cap: 2 messages per week per leader.** Pre-conversation nudges are opt-in per conversation, not blanket.

---

## Open questions for Ryan & Cristina

1. **Conversation library — which 5 do we start with?** Proposal above is Expectation / Feedback / Coaching / Decision / 1:1. Want to swap any?
2. **Frameworks — are SBI and Reversible/Irreversible the right "muscle memory" choices,** or do you have proprietary frameworks you'd prefer to teach?
3. **Lead Self preview cadence** — every 4 weeks? Every 6? Or only after the first Anchor cycle completes?
4. **"Coming soon" waitlist** — do we want to gate it behind a short interest survey to inform Lead Team / Lead Self course design?
5. **Naming** — do "Lead Work / Lead Team / Lead Self" get used in user-facing UI, or do we keep Foundation/Ascent as the user-facing names and use the three-layer framing only in marketing & internal docs?

---

## Recommended next steps (small, sequential)

1. **Review & sign off on this doc** with Ryan and Cristina (no code yet).
2. **Lock the conversation library v1** (5 conversations) and the 3 frameworks.
3. **Pick one conversation to build end-to-end as the template** — recommend **Feedback**, since the Open Gym already exists ([coachingService.js](../src/services/coachingService.js#L280)). Ship the full unit: video + framework card + prep tool + Open Gym tie-in + SMS nudge.
4. **Implement the home-screen reshuffle** (Change 2) — pure UI work in [AscentArena.jsx](../src/components/screens/AscentArena.jsx), no schema changes.
5. **Add the "Coming soon: Lead Self" card and waitlist write** — small, isolated.
6. **Continue the existing Ascent v3 milestones** (M1–M7) on the original timeline — they're still right.

---

## Bottom line

The Ascent v3 plan is solid. This doc doesn't replace it — it gives it a **clearer story** ("the Lead Team layer of a three-part leadership journey"), a **content spine** (conversations + frameworks), and a **simpler front door** for the busy frontline manager. Foundation grads still graduate into Ascent. The infrastructure stays. The reps stay. We just stop making them hunt for what to do next.
