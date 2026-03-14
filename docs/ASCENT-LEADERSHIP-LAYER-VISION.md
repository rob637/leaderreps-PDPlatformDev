# Ascent Leadership Layer — Vision & Brainstorm

**Date:** March 10, 2026  
**Status:** Brainstorm / Early Planning  
**Last Updated:** March 10, 2026 (Foundation baseline added)

---

## Current Foundation Architecture (Baseline for Ascent)

Before designing Ascent, here's what Foundation actually delivers today:

### Three-Phase System

| Phase | Duration | Model | Description |
|-------|----------|-------|-------------|
| **Pre-Start (Prep)** | ~14 days | Progress-based | Onboarding, profile setup, baseline assessment |
| **Start (Foundation)** | 8 weeks (56 days) | Cohort-based | Core leadership development program |
| **Post-Start (Ascent)** | Indefinite | Subscription | Continued growth (THIS DOCUMENT) |

### Foundation Daily Experience

Leaders experience Foundation through two primary widgets:

1. **This Week's Actions** — Weekly content delivery
   - Videos (prep videos, session recordings)
   - Workbook activities
   - Coaching session registrations
   - Real Rep assignments (milestone-linked)
   - Community events

2. **Conditioning Widget** — Real Rep practice hub
   - Quick access to commit new reps
   - Progress tracking (active reps, pending debriefs)
   - Follow-up reminder indicators

### Real Rep Flow (The Core Mechanic)

The "Real Rep" is Foundation's signature practice mechanism:

```
Commit → Prep → Execute → Debrief → Close Loop
   │                          │           │
   │                          │           └── Follow-up reminder (optional)
   │                          └── AI-assisted evidence capture + assessment
   └── Select rep type, situation, target person
```

**Rep Types in Foundation:**
- DRF — Deliver Reinforcing Feedback
- SCE — Set Clear Expectations
- DRE — Deliver Redirecting Feedback
- DSC — Difficult Conversations
- Others mapped to milestones

### What Foundation Tracks

- Rep completion counts (weekly, total)
- Evidence/debrief quality
- Action item completion (This Week's Actions)
- Coaching session attendance
- Milestone progression (8 milestones across 8 weeks)

### What Foundation Does NOT Track (Ascent Opportunities)

- Observer/stakeholder feedback on leader behavior
- Long-term behavior trend visualization
- Self-directed focus area selection
- Connection between practice and business outcomes
- Peer accountability structures

### Dormant/Configurable Widgets

These widgets exist in code but are disabled by default in daily config:
- AM Bookend Header (morning section divider)
- PM Bookend (evening reflection)
- Grounding Rep (identity statement read)
- Win the Day (3 daily priorities)
- Scorecard (daily completion tally)

These could be re-activated for Ascent or evolved into new features.

---

## Core Concept: "Leader-Led Growth"

Foundation teaches leaders *what* to practice through structured Real Reps. Ascent helps them decide *who they're becoming* and prove it to the people around them. The shift is from **curriculum-driven** (milestone-linked rep assignments) to **stakeholder-driven** (self-selected focus areas with external validation).

**Key Transition:** Foundation's Real Rep flow (Commit → Prep → Execute → Debrief → Close Loop) remains the core practice mechanic. Ascent adds the *why* (development plan) and the *proof* (observer feedback).

---

## Foundation → Ascent Graduation

### Graduation Criteria
- Complete all 8 Foundation milestones
- Minimum rep count threshold (TBD)
- Final assessment or reflection

### Graduation Experience
- **Celebration modal** — acknowledge Foundation completion
- **Growth Summary** — AI-generated narrative of their Foundation journey (rep types practiced, areas of strength, areas for growth)
- **Ascent Onboarding** — guided setup of their first Leadership Plan

### Data Continuity
Foundation data feeds directly into Ascent:
- Rep history → Pattern analysis for focus area recommendations
- Milestone performance → Suggested development goals
- Self-assessments → Baseline for observer feedback comparison

---

## Three Pillars

### 1. My Leadership Plan (The Spine)

- After graduating Foundation, the leader builds a personal development plan — not from scratch, but informed by their Foundation data (which reps were hardest, where friction showed up, what patterns emerged).
- Pick 2-3 **focus areas** for the next quarter (e.g., "Difficult conversations," "Delegation without micromanaging," "Strategic thinking in meetings").
- Each focus area maps to specific **rep types** they'll practice, plus measurable behavior goals.
- The plan is a living document — revisited monthly, adjusted quarterly.

### 2. 360° Feedback Loops (The Mirror)

- Leader invites 3-5 **observers** — peers, direct reports, their supervisor — to give lightweight, ongoing feedback on their focus areas.
- NOT a traditional 360 survey once a year. Instead: **micro-feedback pulses** — short (2-3 question) check-ins sent monthly or after specific moments.
- Example: "In the last 2 weeks, how often did you see [Leader] delegate effectively? Never / Sometimes / Consistently"
- The leader sees **trend lines** over time — are observers noticing the change?
- Supervisor gets a dashboard view of the leader's plan + progress (optional, org-dependent).

### 3. Challenge Sprints (The Engine)

- Builds on Foundation's **Real Rep flow** (Commit → Prep → Execute → Debrief → Close Loop), but now **anchored to the development plan** instead of milestones.
- Weekly rep recommendations aren't curriculum-based — they're based on the leader's focus areas + recent feedback.
- Monthly community sessions evolve from Foundation's coaching/community events into **peer accountability circles** where leaders share progress on their plans.
- AI coach (Rep) shifts from "here's your milestone rep" to "based on your plan and recent observer feedback, here's what to focus on this week."

---

## What Makes This Different from Generic LDP Software

| Generic LDP Tool | LeaderReps Ascent |
|---|---|
| Annual 360 survey → binder on shelf | Continuous micro-feedback → visible trends |
| HR-assigned development goals | Self-directed plan informed by real practice data |
| "Complete this course" | "Practice this rep, get feedback from your team" |
| Isolated from daily work | Embedded in real leadership moments |
| Manager reviews once/quarter | Observers see growth in real-time |

---

## The Killer Feature: Feedback-Practice Loop

The magic is connecting **what the leader practices** (Real Reps) with **what others observe** (feedback). No other platform does this well because they separate learning (LMS) from behavior (360 tools). We have both in one place.

### Flow

1. Leader sets focus area: "Give more direct feedback to my team"
2. Weekly rep recommendation: Practice a DRE (Deliver Redirecting Feedback) Real Rep
3. AI coach helps them prep before (Prep phase), debrief after (Evidence Capture)
4. Monthly pulse to their observers: "Have you seen improvement in direct feedback?"
5. Leader sees: rep completion frequency + self-assessment quality + observer ratings on one dashboard
6. Over 3-6 months: **irrefutable evidence of growth**

---

## Data Model Sketch

**Existing Foundation Collections (Continue to Use):**
- `users/{userId}/conditioning_reps/` — Real Rep records (commits, evidence, status)
- `users/{userId}/action_progress/` — Action item completions
- `users/{userId}/development_plan/` — Current plan data
- `cohorts/{cohortId}/` — Cohort membership, dates

**New Ascent Collections:**
- `users/{userId}/ascent_plan/` — Focus areas, goals, timeline, status
- `users/{userId}/ascent_observers/` — Invited observers, relationship type, status
- `users/{userId}/ascent_pulses/` — Micro-feedback responses, timestamps, focus area
- `ascent_challenges/` — Challenge library, linked to focus area tags (global)

---

## Open Questions

- **Org vs. Individual:** Is Ascent always self-directed, or can an org/supervisor assign focus areas?
- **Observer onboarding:** Do observers need an account, or can they respond via a simple link (no-auth micro-survey)?
- **Anonymity:** Should peer feedback be anonymous? (Probably yes for candor, with supervisor feedback attributed)
- **Gamification:** Does Arena carry into Ascent, or does it shift to a different reward model?
- **Monetization:** Ascent as subscription ($X/month) vs. bundled with Foundation?

---

---

## Additional Ascent Tools

### 4. Situation Room (Real-Time Leadership Prep Tool)

Foundation's Real Rep flow has Commit → Prep → Execute → Debrief → Close Loop. In Ascent, leaders face moments that *don't fit neatly into rep types*. The Situation Room is an on-demand tool for **any leadership moment**:

- Leader opens it when they're about to walk into something hard — a board meeting, a termination, a high-stakes negotiation, a team conflict
- They describe the situation in 60 seconds (voice or text)
- AI coach pulls from their **Foundation rep history** + **Ascent focus areas** to give tailored prep
- After the moment: quick 3-question debrief ("What did you say? How did they react? What would you change?")
- These moments get tagged to their development plan focus areas automatically
- Can optionally convert into a formal Real Rep for tracking

**Why it's cool:** It's the "coach in your pocket" that actually knows your history. Not generic advice — it's "Last time you handled pushback from Sarah in your DRE rep, you avoided the direct ask. This time, try..."

### 5. Leadership Replay (Pattern Visualization Engine)

Foundation gives you weekly stats. Ascent needs something deeper — a tool that shows you **who you're becoming over months**:

- **Heat map** of which rep types you gravitate toward vs. avoid (comfort zone detection)
- **Friction timeline** — plot your hardest moments over 3-6 months, see what triggers repeat
- **Observer feedback overlay** — your self-assessment vs. what your observers are saying (calibration gap)
- **Before/After comparisons** — "Month 1 you scored 2/5 on direct feedback. Month 4 you're at 4/5. Here's the evidence trail."
- **Identity narrative** — AI generates a quarterly "growth story" from your data: "You started avoiding redirecting feedback. By month 3, you were initiating it. Your team noticed — observer scores jumped 40%."

**Why it's cool:** Leaders can literally *show* their boss or their team how they've grown, backed by behavioral data + external feedback. That's career-changing ammunition for promotions, reviews, and self-confidence.

### 6. Leadership Lab (Safe Practice Simulator)

Foundation Real Reps are always *real* — you practice on actual people in actual moments (Execute phase). But some Ascent leaders want to **rehearse before the real thing**:

- AI-powered **role-play simulations** for high-stakes conversations
- Leader picks a scenario: "I need to tell my top performer they didn't get the promotion"
- AI plays the other person — pushes back, gets emotional, asks tough questions
- Leader practices their language, gets real-time coaching on tone, directness, empathy
- After the simulation: scorecard + suggestions + "Now commit a Real Rep and do it for real"

**Why it's cool:** It bridges the gap between knowledge and action. Leaders who freeze up in real moments can build muscle memory in a safe space first. The sim data feeds into their development plan. This could become an **enhanced Prep phase** option for Real Reps.

### 7. Peer Board (Mastermind Group Tool)

Foundation has community sessions. Ascent should have **structured peer advisory**:

- Groups of 4-6 leaders matched by industry, level, or focus area
- Monthly **hot seat** format: one leader presents a real challenge, others advise
- Built-in structure: Present (5 min) → Clarifying Questions (5 min) → Advice Round (10 min) → Commitment (2 min)
- The presenting leader logs a **commitment** from the session — what they'll do before next meeting
- Next meeting starts with accountability: "Did you do the thing?"
- AI summarizes the session and tracks commitments

**Why it's cool:** This is where leadership gets *social*. The loneliest part of being a leader is having no one to talk to about the hard stuff. Peer Boards create a trusted inner circle. And because commitments are tracked, it's not just talk.

### 8. Influence Map (Stakeholder Relationship Tool)

A visual, interactive tool for mapping and managing key relationships:

- Leader maps their **stakeholder universe** — boss, peers, direct reports, cross-functional partners, mentors
- For each person: relationship health (green/yellow/red), last meaningful interaction, friction points, development relevance
- AI nudges: "You haven't had a 1:1 with your skip-level in 6 weeks. Your focus area is 'managing up' — time for a touchpoint?"
- Connects to the feedback loop: observers on your plan are highlighted on the map
- Quarterly review: "Your relationship with the VP of Ops went from yellow to green. Here's what changed."

**Why it's cool:** Leadership is fundamentally about relationships, but no tool helps you *manage* them as a portfolio. This makes the invisible visible.

### 9. Legacy Journal (Reflective Leadership Identity Tool)

Foundation has the Leadership Identity Statement (LIS) and the dormant Grounding Rep widget. Ascent evolves identity work into something richer:

- Monthly **prompted journal entries** tied to deeper leadership questions:
  - "What kind of leader showed up this month?"
  - "What conversation are you still avoiding? Why?"
  - "Who did you develop this month? What did that cost you?"
  - "What would your team say about you if you left tomorrow?"
- AI tracks **themes** across journal entries over time — surfacing patterns the leader might not see
- Quarterly: AI generates a "Leadership Identity Evolution" narrative comparing where they started (Foundation LIS) to where they are now
- Optional: share selected entries with a coach or mentor for deeper processing
- Could re-activate Foundation's Grounding Rep as a daily identity touchpoint

**Why it's cool:** This is the *soul* of the platform. Real Reps build skills. The journal builds **identity**. Over a year, a leader has a genuine record of their transformation — not metrics, but meaning.

### 10. Impact Tracker (Business Results Connection)

The hardest thing about leadership development is proving ROI. This tool connects leadership behavior to business outcomes:

- Leader tracks 2-3 **team/business metrics** they care about (retention, engagement scores, project delivery, team NPS)
- Not automated — leader manually updates monthly (keeps it lightweight)
- Dashboard overlays: leadership behavior trends vs. business metric trends
- AI coaching: "Your team's engagement score jumped this quarter. You also doubled your reinforcing feedback reps. Coincidence?"
- Creates a **leadership impact narrative** for performance reviews

**Why it's cool:** This is what makes the CFO care. Leadership development isn't soft — it moves numbers. This tool helps leaders tell that story with data.

---

## How They All Connect

```
┌─────────────────────────────────────────────┐
│           MY LEADERSHIP PLAN                │
│     (Focus Areas + Quarterly Goals)         │
├──────────┬──────────┬───────────────────────┤
│          │          │                       │
▼          ▼          ▼                       ▼
Situation  Challenge  Leadership    Peer Board
Room       Sprints    Lab           (Accountability)
(Real)     (Weekly)   (Practice)    (Monthly)
│          │          │             │
▼          ▼          ▼             ▼
┌─────────────────────────────────────────────┐
│         FEEDBACK & EVIDENCE LAYER           │
│  Observer Pulses + Self-Assessment + Reps   │
├──────────┬──────────┬───────────────────────┤
│          │          │                       │
▼          ▼          ▼                       ▼
Leadership Impact     Influence     Legacy
Replay     Tracker    Map           Journal
(Patterns) (ROI)     (Relationships)(Identity)
└─────────────────────────────────────────────┘
```

The development plan is the **spine**. Everything either feeds INTO it (practice tools) or draws FROM it (reflection tools). The feedback layer is the **connective tissue** that makes it all evidence-based rather than self-reported.

---

## MVP Build Priority

If prioritizing for an Ascent launch:

1. **Foundation → Ascent Graduation Flow** — celebration, growth summary, smooth transition (minimal effort, high impact)
2. **My Leadership Plan** — the spine everything hangs on (new screen, extends existing dev plan data)
3. **Observer Feedback Pulses** — the differentiator no one else has (new system, highest value)
4. **Situation Room** — natural evolution of Real Rep's prep phase, highest daily utility (extends existing AI coaching)
5. **Leadership Replay** — the "wow" moment when a leader sees their growth visualized (reads existing rep data)
6. Everything else layers on from there

### Quick Wins (Leverage Existing Code)
- Re-enable dormant widgets (AM/PM Bookend, Grounding Rep) with Ascent-specific config
- Extend Real Rep flow with focus area tagging
- Use existing coaching session infrastructure for Peer Board

---

## Bottom Line

Foundation's Real Rep flow gives leaders **the practice habit**. Ascent's development plan gives them **structure without rigidity**. The observer feedback loops give them **external accountability** (not just self-reported debriefs). The challenge system gives them **continued daily engagement**. Together, they make Ascent the thing that turns an 8-week training program into a **leadership operating system** that grows with the leader indefinitely.

**The continuity is key:** Leaders don't start over in Ascent — they level up. Their Foundation rep history, their patterns, their growth trajectory all carry forward. Ascent just adds the external validation layer that makes it real.
