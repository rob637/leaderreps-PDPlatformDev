# Ascent: The Leadership Operating System
## MVP Proposal for Post-Foundation Experience

**Prepared:** March 10, 2026  
**Status:** Ready for Review  
**Audience:** LeaderReps Leadership Team, Product Stakeholders

---

## Executive Summary

**Foundation** is an 8-week structured leadership program. Leaders complete it. Then what?

**Ascent** is the answer: a self-directed, evidence-based leadership development system that turns a training program into a **leadership operating system** — one that grows with the leader indefinitely.

The core innovation: Leaders don't just practice leadership skills — they **prove they've changed** to the people who work with them every day.

---

## The Problem We're Solving

### After Foundation, Leaders Face Three Challenges

1. **Loss of Structure**  
   "I had a clear path during Foundation. Now I don't know what to focus on."

2. **No External Validation**  
   "I think I've improved, but I have no proof. My self-assessment isn't enough."

3. **Habit Decay**  
   "Without weekly assignments, I stopped practicing. The Real Rep habit faded."

### The Market Gap

| What Exists | What's Missing |
|-------------|----------------|
| Annual 360 surveys | Continuous, lightweight feedback |
| LMS courses | Connection between learning and observed behavior |
| Generic development goals | Personalized plans informed by real practice data |
| Self-reported progress | External validation from stakeholders |

**Ascent fills every one of these gaps.**

---

## The Ascent Model: Three Connected Systems

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    MY LEADERSHIP PLAN                           │
│              (The Spine — Everything Connects Here)             │
│                                                                 │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │ Focus Area 1│    │ Focus Area 2│    │ Focus Area 3│      │
│     │  "Direct    │    │  "Strategic │    │  "Building  │      │
│     │  Feedback"  │    │   Thinking" │    │    Trust"   │      │
│     └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│            │                  │                  │              │
└────────────┼──────────────────┼──────────────────┼──────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     REAL REP PRACTICE                           │
│           (The Engine — Same Foundation Mechanic)               │
│                                                                 │
│         Commit → Prep → Execute → Debrief → Close Loop          │
│                                                                 │
│     Reps are now recommended based on YOUR focus areas,         │
│     not curriculum milestones. You choose what to practice.     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    OBSERVER FEEDBACK                            │
│            (The Mirror — External Validation)                   │
│                                                                 │
│     Monthly micro-pulses to 3-5 people who see your work:       │
│     "Have you noticed [Leader] giving more direct feedback?"    │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐     │
│     │  YOUR SELF-ASSESSMENT  ───vs───  OBSERVER RATINGS   │     │
│     │        ████████░░               ██████████          │     │
│     │         7/10                       9/10             │     │
│     │                                                     │     │
│     │  "Your team sees more change than you do."          │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## System 1: My Leadership Plan

### What It Is

A personalized, quarterly development plan that the leader creates and owns. Unlike Foundation's curriculum-driven milestones, Ascent is **self-directed** — but informed by data.

### How It Works

#### Step 1: Foundation Graduation → Plan Creation

When a leader completes Foundation, they're guided through plan creation:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🎉 CONGRATULATIONS! YOU'VE COMPLETED FOUNDATION                │
│                                                                 │
│  Over 8 weeks, you completed 27 Real Reps:                      │
│  • 12 Reinforcing Feedback (DRF) — Your strongest area          │
│  • 8 Setting Expectations (SCE)                                 │
│  • 5 Redirecting Feedback (DRE) — Room for growth               │
│  • 2 Difficult Conversations (DSC)                              │
│                                                                 │
│  Your debrief patterns suggest you're most comfortable with     │
│  positive conversations, but avoid direct confrontation.        │
│                                                                 │
│  RECOMMENDED FOCUS AREAS FOR ASCENT:                            │
│  ☐ Direct Feedback — Based on your DRE avoidance pattern        │
│  ☐ Difficult Conversations — You attempted only 2 in 8 weeks    │
│  ☐ Delegation — Not practiced yet                               │
│                                                                 │
│  [ Choose 1-2 focus areas to start your Ascent journey → ]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2: Focus Area → Behavior Goals

Each focus area becomes a concrete behavior goal:

| Focus Area | Behavior Goal | Target |
|------------|---------------|--------|
| Direct Feedback | Deliver redirecting feedback within 24 hours of observing an issue | 2x per week |
| Difficult Conversations | Initiate (not avoid) one difficult conversation per month | 1x per month |
| Strategic Thinking | Share strategic context in team meetings | Every team meeting |

#### Step 3: Living Plan → Quarterly Review

The plan isn't static:

- **Weekly:** AI recommends Real Reps based on focus areas
- **Monthly:** Quick check-in — "How's progress on your goals?"
- **Quarterly:** Full plan review — What's working? What to change? New focus areas?

### The Data Model

```javascript
// users/{userId}/ascent_plan (single document, updated over time)
{
  status: 'active',
  createdAt: Timestamp,
  currentQuarter: 'Q2-2026',
  
  focusAreas: [
    {
      id: 'direct-feedback',
      name: 'Direct Feedback',
      description: 'Deliver redirecting feedback promptly and clearly',
      behaviorGoal: 'Give redirecting feedback within 24 hours of issue',
      targetFrequency: '2x per week',
      status: 'active',
      startDate: Timestamp,
      
      // Linked to rep types for recommendations
      linkedRepTypes: ['DRE', 'DSC'],
      
      // Progress tracking
      weeklyRepCounts: { '2026-W10': 2, '2026-W11': 1, ... },
      monthlyReflections: [
        { month: '2026-03', reflection: '...', rating: 4 }
      ]
    }
  ],
  
  // Foundation carryover data
  foundationSummary: {
    completedAt: Timestamp,
    totalReps: 27,
    repBreakdown: { DRF: 12, SCE: 8, DRE: 5, DSC: 2 },
    strengthAreas: ['DRF'],
    growthAreas: ['DRE', 'DSC'],
    aiNarrative: '...'
  },
  
  quarterlyReviews: [
    { quarter: 'Q2-2026', completedAt: Timestamp, notes: '...', planChanges: [] }
  ]
}
```

---

## System 2: Real Rep Practice (Enhanced)

### What Changes from Foundation

| Foundation | Ascent |
|------------|--------|
| Reps assigned by milestone | Reps recommended by focus area |
| Weekly curriculum drives practice | Self-motivated practice drives progress |
| "Complete this rep for Milestone 3" | "This DRE rep aligns with your Direct Feedback goal" |
| Evidence = self-assessment only | Evidence = self-assessment + observer feedback |

### The Enhanced Rep Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ASCENT: RECOMMENDED REP                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Based on your focus area "Direct Feedback", we recommend:       │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ 💬 DELIVER REDIRECTING FEEDBACK (DRE)                   │     │
│ │                                                         │     │
│ │ You haven't logged a DRE rep this week.                 │     │
│ │ Last week you completed 1, targeting 2.                 │     │
│ │                                                         │     │
│ │ Situations to consider:                                 │     │
│ │ • A team member who missed a deadline                   │     │
│ │ • Behavior in a meeting that needs correction           │     │
│ │ • Quality issue that's been lingering                   │     │
│ │                                                         │     │
│ │ [ Commit to This Rep → ]                                │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                 │
│ Or choose a different rep type...                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rep → Focus Area Tagging

Every completed rep is automatically tagged to the relevant focus area(s):

```javascript
// users/{userId}/conditioning_reps/{repId}
{
  type: 'DRE',
  status: 'loop_closed',
  // ... existing fields ...
  
  // NEW: Ascent fields
  ascentFocusAreas: ['direct-feedback'],  // Auto-tagged based on rep type
  ascentQuarter: 'Q2-2026'
}
```

This enables:
- Weekly progress tracking per focus area
- Trend visualization over quarters
- AI-powered pattern recognition

---

## System 3: Observer Feedback

### The Innovation

Traditional 360 feedback is:
- Annual (too infrequent to drive change)
- Long surveys (observer fatigue)
- Disconnected from actual practice (no link to behavior change efforts)

Ascent Observer Feedback is:
- Monthly (frequent enough to show trends)
- 2-3 questions max (30 seconds to complete)
- Tied directly to the leader's focus areas

### How It Works

#### Step 1: Invite Observers

After creating their plan, the leader invites 3-5 people who see their work:

```
┌─────────────────────────────────────────────────────────────────┐
│ WHO SEES YOUR LEADERSHIP?                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ For your focus area "Direct Feedback", invite people who        │
│ would notice if you're giving more direct feedback:             │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 👤 Sarah Chen                              [Direct Report] │   │
│ │    sarah.chen@company.com                                 │   │
│ │    ✓ Invited — Accepted                                   │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ 👤 Mike Rodriguez                                  [Peer] │   │
│ │    mike.r@company.com                                     │   │
│ │    ✓ Invited — Pending                                    │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ 👤 Jennifer Park                             [Supervisor] │   │
│ │    jpark@company.com                                      │   │
│ │    ✓ Invited — Accepted                                   │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ [ + Invite Another Observer ]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Design Decision:** Observers respond via a simple link — no account required. This maximizes response rates.

#### Step 2: Monthly Micro-Pulse

Each month, observers receive a brief, focused request:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Hi Sarah,                                                      │
│                                                                 │
│  [Leader Name] is working on their leadership development       │
│  and values your perspective. This takes 30 seconds.            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  FOCUS AREA: Direct Feedback                                    │
│                                                                 │
│  In the past month, how often did you observe [Leader]          │
│  giving clear, direct feedback (positive or corrective)?        │
│                                                                 │
│  ○ Never                                                        │
│  ○ Rarely (1-2 times)                                           │
│  ○ Sometimes (3-4 times)                                        │
│  ○ Often (5+ times)                                             │
│  ○ Consistently (this is now typical behavior)                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Optional: Any specific example or feedback?                    │
│  [ ____________________________________________ ]                │
│                                                                 │
│  [ Submit → ]                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3: Trend Dashboard

The leader sees their progress over time:

```
┌─────────────────────────────────────────────────────────────────┐
│ DIRECT FEEDBACK — 6 MONTH TREND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  YOUR REPS         │  YOUR SELF-RATING  │  OBSERVER RATING      │
│  (frequency)       │  (1-5 scale)       │  (1-5 scale)          │
│                    │                    │                       │
│       ▲            │       ▲            │       ▲               │
│   8 ─┼──────██     │   5 ─┼─────────██  │   5 ─┼─────────██─    │
│   6 ─┼────██│█     │   4 ─┼───────██│█  │   4 ─┼──────██│██     │
│   4 ─┼──██│███     │   3 ─┼────██│████  │   3 ─┼───██│█████     │
│   2 ─┼██│█████     │   2 ─┼─██│███████  │   2 ─┼██│███████─     │
│   0 ─┼──────────   │   1 ─┼───────────  │   1 ─┼───────────     │
│      └──────────▶  │      └──────────▶  │      └──────────▶     │
│      M A M J J A   │      M A M J J A   │      M A M J J A      │
│                    │                    │                       │
├────────────────────┴────────────────────┴───────────────────────┤
│                                                                 │
│  💡 INSIGHT: Your observer ratings have increased 47% over      │
│     6 months. Your team is noticing the change.                 │
│                                                                 │
│  📊 CALIBRATION: You rate yourself lower than your observers.   │
│     You may be harder on yourself than warranted.               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Data Model

```javascript
// users/{userId}/ascent_observers/{observerId}
{
  email: 'sarah.chen@company.com',
  name: 'Sarah Chen',
  relationship: 'direct_report',  // direct_report | peer | supervisor | other
  invitedAt: Timestamp,
  acceptedAt: Timestamp,
  status: 'active',  // pending | active | declined | removed
  focusAreas: ['direct-feedback', 'strategic-thinking'],  // Which focus areas they observe
  responseToken: 'abc123...',  // For unauthenticated responses
}

// users/{userId}/ascent_pulses/{pulseId}
{
  month: '2026-03',
  focusArea: 'direct-feedback',
  sentAt: Timestamp,
  
  responses: [
    {
      observerId: 'abc123',
      respondedAt: Timestamp,
      rating: 4,  // 1-5 scale
      comment: 'Noticed improvement in team meeting feedback',
      relationship: 'direct_report'
    }
  ],
  
  // Leader's self-assessment for same period
  selfRating: 3,
  selfReflection: 'I gave 4 redirecting conversations this month...'
}
```

---

## The Complete User Journey

### Week 8 of Foundation → Ascent Onboarding

```
┌─────────────────────────────────────────────────────────────────┐
│ DAY 56: FOUNDATION COMPLETE                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎉 CONGRATULATIONS!                                            │
│                                                                 │
│  You've completed Foundation. Here's your journey:             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 27 Real Reps │ 8 Coaching │ 6 Community │ 100% Actions │   │
│  │   Completed  │  Sessions  │   Events    │   Complete   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  YOUR GROWTH STORY (AI-Generated):                              │
│  ─────────────────────────────────────────────────────────────  │
│  "You started Foundation with a self-assessment that rated      │
│  your feedback skills at 2.5/5. Over 8 weeks, you completed     │
│  12 reinforcing feedback reps — building confidence in          │
│  positive recognition. Your redirecting feedback reps (5)       │
│  showed a pattern: initial hesitation, followed by stronger     │
│  execution by week 6. Your debrief reflections indicate you     │
│  still find confrontation uncomfortable, but you're taking      │
│  action despite the discomfort. That's growth."                 │
│                                                                 │
│  [ Continue to Ascent → ]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ASCENT ONBOARDING: STEP 1 OF 3                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WELCOME TO ASCENT                                              │
│                                                                 │
│  Foundation gave you the habit. Ascent proves you've changed.   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Based on your Foundation journey, we recommend:                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☐ DIRECT FEEDBACK                      ⭐ Recommended   │   │
│  │   You avoided redirecting conversations. Time to lean in.│   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ☐ DIFFICULT CONVERSATIONS              ⭐ Recommended   │   │
│  │   Only 2 attempts in 8 weeks. This is your growth edge. │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ☐ STRATEGIC COMMUNICATION                               │   │
│  │   Share more context and vision with your team.          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ☐ DELEGATION                                            │   │
│  │   Empower others to own outcomes.                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ☐ BUILDING TRUST                                        │   │
│  │   Deepen psychological safety on your team.              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Select 1-2 focus areas for your first quarter:                 │
│                                                                 │
│  [ Next → ]                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ASCENT ONBOARDING: STEP 2 OF 3                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SET YOUR BEHAVIOR GOALS                                        │
│                                                                 │
│  For each focus area, define what success looks like:           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  FOCUS: DIRECT FEEDBACK                                         │
│                                                                 │
│  Behavior Goal:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Deliver redirecting feedback within 24 hours of issue   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  💡 Suggestion based on your pattern                            │
│                                                                 │
│  Target Frequency:                                              │
│  ○ 1x per week   ● 2x per week   ○ Daily                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  FOCUS: DIFFICULT CONVERSATIONS                                 │
│                                                                 │
│  Behavior Goal:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Initiate one difficult conversation I've been avoiding  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Target Frequency:                                              │
│  ● 1x per month   ○ 2x per month   ○ Weekly                    │
│                                                                 │
│  [ Next → ]                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ASCENT ONBOARDING: STEP 3 OF 3                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHO SEES YOUR LEADERSHIP?                                      │
│                                                                 │
│  Invite 3-5 people to give you monthly micro-feedback.          │
│  They'll spend 30 seconds/month answering 2-3 questions.        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Add observers (you can do this later too):                     │
│                                                                 │
│  Email: [ sarah.chen@company.com     ]  Role: [Direct Report ▼] │
│  Email: [ mike.r@company.com         ]  Role: [Peer ▼]          │
│  Email: [ _________________________  ]  Role: [Select... ▼]     │
│                                                                 │
│  [ + Add Another ]                                              │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ☐ Skip for now — I'll add observers later                      │
│                                                                 │
│  [ Launch My Ascent Journey → ]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Monthly Rhythm in Ascent

```
WEEK 1 ─────────────────────────────────────────────────────────────

  MON    TUE    WED    THU    FRI    SAT    SUN
   │      │      │      │      │      │      │
   │      │      │      │      │      │      │
   ▼      │      │      ▼      │      │      │
  ┌───┐   │      │    ┌───┐   │      │      │
  │AI │   │      │    │Rep│   │      │      │
  │Rec│   │      │    │Log│   │      │      │
  └───┘   │      │    └───┘   │      │      │
  Weekly  │      │    Complete │      │      │
  Rep     │      │    Real Rep │      │      │
  Nudge   │      │             │      │      │

WEEK 2-3 ───────────────────────────────────────────────────────────

  Continue Real Rep practice aligned to focus areas...

WEEK 4 (MONTH END) ─────────────────────────────────────────────────

   │      │      │      │     │      │      │
   │      │      │      │     │      │      │
   │      │      │      │     ▼      │      │
   │      │      │      │   ┌─────────────┐ │
   │      │      │      │   │ MONTHLY     │ │
   │      │      │      │   │ CHECK-IN    │ │
   │      │      │      │   │             │ │
   │      │      │      │   │ 1. Self-rate│ │
   │      │      │      │   │ 2. Reflect  │ │
   │      │      │      │   │ 3. Observers│ │
   │      │      │      │   │    notified │ │
   │      │      │      │   └─────────────┘ │
   │      │      │      │                   │
   │      │      │      │   Observers have  │
   │      │      │      │   7 days to       │
   │      │      │      │   respond to      │
   │      │      │      │   micro-pulse     │
```

### Quarterly Review

```
┌─────────────────────────────────────────────────────────────────┐
│ QUARTERLY PLAN REVIEW                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Q1 2026 SUMMARY                                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  FOCUS AREA: DIRECT FEEDBACK                                    │
│                                                                 │
│  Your Goal: 2 redirecting conversations per week                │
│  Your Actual: 1.5 per week average                              │
│                                                                 │
│  Self-Rating Trend:    2.8 → 3.2 → 3.8 → 4.0  📈 +43%          │
│  Observer Rating Trend: 2.5 → 3.0 → 3.5 → 4.2  📈 +68%         │
│                                                                 │
│  💬 Observer Comment Highlights:                                │
│  • "The feedback in our 1:1 last week was really helpful"      │
│  • "I've noticed you addressing issues sooner than before"      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  FOCUS AREA: DIFFICULT CONVERSATIONS                            │
│                                                                 │
│  Your Goal: 1 difficult conversation per month                  │
│  Your Actual: 2 in Q1 (met goal!)                              │
│                                                                 │
│  Self-Rating Trend:    1.5 → 2.0 → 2.5 → 3.0  📈 +100%         │
│  Observer Rating Trend: 2.0 → 2.2 → 2.8 → 3.2  📈 +60%         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  WHAT'S NEXT?                                                   │
│                                                                 │
│  ○ Continue with current focus areas                            │
│  ○ Add a new focus area                                         │
│  ○ Replace a focus area (you've made progress!)                 │
│                                                                 │
│  [ Update My Plan for Q2 → ]                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This Works

### For the Leader

| Pain Point | How Ascent Solves It |
|------------|---------------------|
| "I don't know what to focus on" | AI recommends focus areas based on Foundation data |
| "I have no proof I've changed" | Observer feedback provides external validation |
| "I stopped practicing" | Weekly rep recommendations + monthly check-ins maintain rhythm |
| "Self-assessment isn't enough" | See yourself vs. how others see you — calibration gaps revealed |

### For the Organization

| Pain Point | How Ascent Solves It |
|------------|---------------------|
| "Training doesn't stick" | Continuous practice + accountability extends the habit |
| "We can't measure ROI" | Observer trend data shows behavior change over time |
| "Leaders don't get real feedback" | Micro-pulses bypass annual survey problems |
| "Development is disconnected from work" | Reps happen in real work situations, observers see real behavior |

### For LeaderReps (The Business)

| Opportunity | How Ascent Captures It |
|-------------|------------------------|
| Post-Foundation revenue | Ascent subscription ($X/month) |
| Stickiness | Monthly rhythms, observer relationships, trend data = switching cost |
| Data moat | Longitudinal behavior + feedback data is defensible |
| Enterprise upsell | Manager dashboards, team analytics, org-wide insights |

---

## MVP Scope & Timeline

### Phase 1: Foundation Graduation (Week 1)

| Deliverable | Effort | Notes |
|-------------|--------|-------|
| Graduation celebration modal | 2 days | Confetti, stats summary |
| AI-generated growth narrative | 2 days | Uses existing rep history |
| "Foundation Complete" badge | 0.5 day | Visual milestone |

### Phase 2: Leadership Plan (Week 2)

| Deliverable | Effort | Notes |
|-------------|--------|-------|
| Focus area selection screen | 2 days | With AI recommendations |
| Behavior goal setting | 1 day | Simple text + frequency |
| Ascent Plan data model | 1 day | Firestore structure |
| My Leadership Plan screen | 2 days | View/edit current plan |

### Phase 3: Observer Feedback (Weeks 3-4)

| Deliverable | Effort | Notes |
|-------------|--------|-------|
| Observer invite flow | 2 days | Email-based, no auth required |
| Observer data model | 1 day | Token-based response system |
| Monthly micro-pulse generation | 2 days | Cloud Function, email send |
| Pulse response page (unauth) | 2 days | Simple, mobile-friendly form |
| Pulse data storage | 1 day | Store responses |
| Basic trend display | 2 days | Self vs. observer over time |

### Phase 4: Enhanced Reps (Week 5)

| Deliverable | Effort | Notes |
|-------------|--------|-------|
| Focus area → rep type mapping | 1 day | Configuration |
| Weekly rep recommendations | 2 days | AI nudge based on plan |
| Rep tagging to focus areas | 1 day | Auto-tag on completion |
| Progress dashboard | 2 days | Reps per focus area over time |

### Phase 5: Polish & Launch (Week 6)

| Deliverable | Effort | Notes |
|-------------|--------|-------|
| Monthly check-in flow | 2 days | Self-rating + reflection prompt |
| Quarterly review flow | 2 days | Plan adjustment wizard |
| Edge cases & testing | 3 days | Error handling, email deliverability |
| Documentation | 1 day | User guide, admin notes |

**Total MVP Timeline: 6 weeks**

---

## Open Questions for Discussion

### 1. Observer Anonymity

**Options:**
- **A) Fully anonymous:** Leader never sees which observer said what
- **B) Attributed by relationship:** "Your direct reports say X, your peers say Y"
- **C) Fully attributed:** Leader sees each observer's response

**Recommendation:** Option B — provides useful context without dampening candor.

### 2. Supervisor Visibility

**Options:**
- **A) Leader-only:** Ascent is private. Supervisor never sees it.
- **B) Opt-in sharing:** Leader can choose to share plan/progress with supervisor
- **C) Supervisor dashboard:** Automatic visibility for manager

**Recommendation:** Option B for MVP — keeps it leader-driven while enabling transparency.

### 3. Pricing Model

**Options:**
- **A) Included with Foundation:** Ascent is the post-program experience
- **B) Separate subscription:** $X/month to continue after Foundation
- **C) Tiered:** Basic Ascent free, premium features (more observers, AI coaching) paid

**Recommendation:** Defer decision, but design for Option C flexibility.

### 4. AI Coach Integration

Should Ascent include enhanced AI coaching (situation prep, debrief analysis)?

**Recommendation:** Phase 2. MVP focuses on the plan + feedback loop. AI enhancements layer on later.

---

## Success Metrics

### Leading Indicators

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Foundation → Ascent conversion | >70% | Smooth transition |
| Focus areas created | >1.5 avg | Leaders are engaging with planning |
| Observers invited | >2.5 avg | Feedback system in use |
| Observer response rate | >60% | Micro-pulses are working |

### Lagging Indicators

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Monthly rep completion | >3 reps/month | Habit sustained |
| Observer rating improvement | +0.5 over 6mo | Visible behavior change |
| Quarterly plan renewal | >80% | Long-term retention |
| Net Promoter Score | >50 | Product-market fit |

---

## Appendix: Competitive Landscape

| Competitor | What They Do | Ascent Advantage |
|------------|--------------|------------------|
| **BetterUp** | 1:1 coaching with coaches | We have peer + stakeholder feedback at scale |
| **15Five** | Manager check-ins, OKRs | We connect feedback to specific behaviors |
| **Culture Amp** | Annual 360 surveys | Our monthly micro-pulses show trends |
| **LinkedIn Learning** | Courses, badges | We measure real behavior change, not completion |
| **Torch** | Coaching + peer learning | We have the Real Rep practice mechanic |

**Our unique position:** The only platform that connects **what leaders practice** with **what others observe**, creating irrefutable evidence of growth over time.

---

## Next Steps

1. **Review this proposal** — Does the vision resonate?
2. **Prioritize scope** — What's essential for MVP vs. later phases?
3. **Validate with users** — Talk to Foundation graduates about their needs
4. **Technical scoping** — Detailed engineering estimates
5. **Design sprint** — UI/UX for key flows

---

*Prepared by the LeaderReps Product Team*
