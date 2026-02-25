# Rep: AI Leadership Coach - Development Plan

> **Vision**: Transform LeaderReps from a content-delivery app into an AI-coached leadership development experience, where "Rep" guides users through their daily 10-minute development journey.

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [The Three Pillars](#the-three-pillars)
3. [Core Principles](#core-principles)
4. [Architecture Overview](#architecture-overview)
5. [Community Integration](#community-integration)
6. [Phase 1: Foundation (MVP)](#phase-1-foundation-mvp)
7. [Phase 2: Intelligence](#phase-2-intelligence)
8. [Phase 3: Full Integration](#phase-3-full-integration)
9. [Technical Requirements](#technical-requirements)
10. [UI/UX Design Direction](#uiux-design-direction)
9. [Data Model](#data-model)
10. [Content Requirements](#content-requirements)
11. [Risk Mitigation](#risk-mitigation)
12. [Success Metrics](#success-metrics)

---

## Executive Summary

### What is Rep?
Rep is an AI Leadership Coach that **leads** users through their daily development, rather than waiting for them to navigate the app. Rep:
- Greets users when they open the app
- Knows their history, struggles, and progress
- Orchestrates the existing app components (bookends, reps, reflections, videos, readings)
- Asks meaningful questions and provides personalized feedback
- Maintains continuity across months and years of development

### Key Differentiator
**Rep leads; it doesn't just respond.** Unlike ChatGPT or generic AI assistants, Rep has:
- A **curriculum** (the Development Plan)
- A **memory** (years of conversation and progress history)
- A **mission** (make users better leaders in 10 minutes/day)

### Development Approach
- **Protect the current app**: Rep is built alongside, not replacing
- **Shared data**: Rep reads/writes to the same Firestore collections
- **Incremental rollout**: Start with opt-in, prove value, then expand
- **No mock data**: Use placeholders where content is missing

---

## The Three Pillars

LeaderReps is built on three interconnected pillars. Rep must weave all three together:

```
              ┌─────────────────────────────────────┐
              │              REP                     │
              │    (The Intelligent Bridge)         │
              └───────────┬─────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ COMMUNITY │◄─►│  CONTENT  │◄─►│ COACHING  │
    │           │   │           │   │           │
    │ • Cohorts │   │ • Videos  │   │ • Rep AI  │
    │ • Peers   │   │ • Readings│   │ • Human   │
    │ • Wins    │   │ • Reps    │   │   Coach   │
    │ • Events  │   │ • Library │   │ • Self    │
    └───────────┘   └───────────┘   └───────────┘
```

### Pillar 1: Community
Leaders don't develop in isolation. After COVID, people are yearning for connection. Rep creates belonging:
- **Cohort awareness**: "4 leaders in your cohort already did today's rep"
- **Shared struggles**: "You're not alone—73% of your cohort is working on delegation"
- **Collective wisdom**: Surface anonymized insights from peers
- **Peer connections**: Facilitate introductions between leaders with shared goals
- **Events integration**: Connect daily work to live community experiences

### Pillar 2: Content
The curriculum and content library are the foundation. Rep adapts as content grows:
- **Dynamic curriculum**: As new content is added, Rep incorporates it
- **Content matching**: Rep suggests content based on user's current struggles
- **Variety**: Videos, readings, reflections, assessments—never monotonous
- **Depth over breadth**: Go deep on what matters to this user

### Pillar 3: Coaching
Rep IS the coach, augmented by human coaching when needed:
- **AI-first**: Daily touchpoints are Rep-led
- **Human escalation**: "This feels bigger than our daily work. Want to talk to your coach?"
- **Self-coaching**: Rep teaches users to coach themselves
- **Accountability**: Rep remembers commitments and follows up

### The Integration Principle
**No pillar stands alone.** Every Rep interaction should touch at least two pillars:
- Content + Coaching: "Watch this video, then tell me your reflection"
- Community + Content: "Here's what leaders who mastered this concept recommend"
- Coaching + Community: "You and Sarah both struggle with this. Want to connect?"

---

## Core Principles

### 1. The 10-Minute Contract
Rep's job is to make 10 minutes feel like enough. No doom-scrolling, no decision fatigue, no guilt. Just: "Here's today. You did it. See you tomorrow."

### 2. Conductor, Not Instrument
Rep doesn't replace widgets—Rep orchestrates them. The existing UI components (video players, reflection inputs, bookend flows, assessments) are the "instruments." Rep decides which to play and when.

### 3. Leading, Not Answering
Rep drives the conversation. It asks questions, assigns work, checks in on progress. Users can deviate, but Rep gently guides them back to the curriculum.

### 4. Memory is the Moat
Rep remembers everything—struggles, wins, patterns, growth. This continuity over months and years is impossible with generic AI and creates genuine coaching relationship.

### 5. Beautiful and Varied
Rep is NOT a chat box. It's a rich, visual experience that uses the full power of modern UI—cards, videos, animations, progress visualizations—threaded together by Rep's conversational guidance.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Rep Chat   │  │  Content    │  │  Current App        │  │
│  │  Interface  │  │  Widgets    │  │  (unchanged)        │  │
│  │             │  │  (embedded) │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   REP ORCHESTRATION LAYER                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Session    │  │  Curriculum │  │  Memory             │  │
│  │  Manager    │  │  Engine     │  │  Manager            │  │
│  │             │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      AI SERVICE LAYER                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  LLM Integration (Claude/GPT-4)                         ││
│  │  - Context assembly from memory + curriculum            ││
│  │  - Response generation with personality                 ││
│  │  - Action/widget triggering                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Firestore)                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐  │
│  │  Users    │ │  Content  │ │  Progress │ │  Rep Memory │  │
│  │(existing) │ │(existing) │ │(existing) │ │   (new)     │  │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Community Integration

Community is not an afterthought—it's woven into every Rep interaction. Here's how:

### Community Touchpoints in Daily Sessions

| Session Moment | Community Integration |
|----------------|----------------------|
| **Morning Greeting** | "Good morning! 4 leaders in your cohort have already started today. Ready to join them?" |
| **Before Content** | "Leaders who found this video most valuable were working on similar challenges to yours." |
| **During Reflection** | "What insight would you share with other leaders facing this?" |
| **After Completion** | "Nice work! Your cohort is now 67% complete for today." |
| **Weekly Summary** | "This week your cohort collectively logged 47 wins. Here are 3 that stood out..." |

### Community Features Rep Orchestrates

#### 1. Cohort Pulse
Real-time awareness of your peer group:
```
"Your Cohort This Week"
├── 12/15 leaders active
├── Top focus area: Delegation (40%)
├── Collective wins: 23
└── Next live event: Thursday 2pm
```

#### 2. Anonymous Wisdom Surfacing
Rep shares relevant insights from other leaders (with permission):
- "A leader in Week 8 said this about delegation: 'The breakthrough came when I realized...'"
- "73% of leaders who completed this assessment scored lowest on 'Letting Go'"
- Never identifies individuals without consent

#### 3. Peer Connection Facilitation
Rep identifies connection opportunities:
- "You and Marcus both marked 'executive presence' as a focus area. Want me to suggest a peer chat?"
- "Three leaders in your cohort are working on the same skill. Want to start a study group?"

#### 4. Collective Wins Celebration
Wins become community property:
- "Beautiful win! Mind if I share this (anonymously) with leaders working on the same skill?"
- Weekly "Wins Digest" curated by Rep
- Cohort leaderboard (opt-in, focused on completion not competition)

#### 5. Live Event Integration
Rep connects daily work to synchronous experiences:
- "There's a community call Thursday on exactly what you're working on. Reminder set?"
- "In yesterday's call, a leader shared something relevant to your reflection..."
- Post-event: "What's one thing from the call you want to apply this week?"

#### 6. Accountability Partners
Rep facilitates 1:1 peer accountability:
- "Want an accountability partner for this 30-day challenge?"
- Weekly check-ins: "How did your call with Sarah go?"
- Rep can prompt both partners with shared reflections

### Community Data Rep Needs

| Data | Source | Privacy Level |
|------|--------|---------------|
| Cohort membership | `users/{id}` | Private |
| Completion status | `dailyPlanProgress` | Aggregated only |
| Wins | `users/{id}/wins` | Shared with permission |
| Reflections | `users/{id}/reflections` | Never shared (except opt-in quotes) |
| Focus areas | Assessment + progress | Aggregated only |
| Availability | User preferences | For peer matching |

### Privacy Principles
1. **Aggregate by default**: "73% of leaders" not "John, Sarah, and Mike"
2. **Opt-in sharing**: Users choose what to share
3. **No surveillance**: Rep doesn't report to managers/admins
4. **Psychological safety**: Struggles are normalized, not exposed

---

## Phase 1: Foundation (MVP)
**Timeline**: 4-6 weeks  
**Goal**: Prove the concept with a minimal but compelling experience

### 1.1 Rep Entry Point
- Add "Rep" button/tab to navigation (alongside existing app)
- Users can choose: traditional app OR Rep-guided experience
- Both update the same underlying data

### 1.2 Basic Session Flow
```
User opens Rep → 
  Rep greets user by name →
    Rep presents today's agenda →
      User completes items (using existing widgets) →
        Rep acknowledges completion →
          Session ends with encouragement
```

### 1.3 MVP Features
| Feature | Description |
|---------|-------------|
| **Greeting** | Personalized hello with user's name and current streak |
| **Daily Agenda** | Shows today's items from Development Plan |
| **Widget Embedding** | Embed existing components (Bookends, Daily Rep, etc.) within Rep's flow |
| **Simple Memory** | Store session summaries, key user statements |
| **Completion Tracking** | Mark items complete (writes to existing progress data) |

### 1.4 MVP Screens
1. **Rep Home** - Greeting + today's session preview
2. **Active Session** - Rep's guidance + embedded widget
3. **Session Complete** - Summary + streak celebration

### 1.5 Technical Tasks
- [ ] Create `/rep` route and navigation entry
- [ ] Build `RepChat` component (conversation interface)
- [ ] Build `RepSession` component (orchestrates widgets)
- [ ] Create `repMemory` Firestore collection
- [ ] Integrate with existing hooks (`useDailyPlan`, `useProgress`, etc.)
- [ ] Set up LLM API integration (Claude or GPT-4)
- [ ] Build prompt templates for different session moments

---

## Phase 2: Intelligence
**Timeline**: 6-8 weeks after Phase 1  
**Goal**: Make Rep genuinely intelligent and personalized

### 2.1 Deep Memory
- Store and retrieve conversation history
- Track user patterns (time of day, completion rates, struggle areas)
- Reference past conversations naturally ("Last week you mentioned...")

### 2.2 Adaptive Curriculum
- Rep adjusts pacing based on user engagement
- Skipped content gets re-offered contextually
- Mastered areas get acknowledged and built upon

### 2.3 Rich Responses
- Rep can show different content types:
  - Video recommendations
  - Reading excerpts
  - Reflection prompts
  - Assessment questions
  - Community quotes
  - Coach feedback

### 2.4 Deviation Handling
- User can say "I need help with something else"
- Rep helps with the deviation
- Rep gracefully returns to curriculum when appropriate

### 2.5 Technical Tasks
- [ ] Build vector database for semantic memory search
- [ ] Create curriculum state machine
- [ ] Implement adaptive pacing algorithm
- [ ] Build rich response rendering system
- [ ] Create deviation detection and handling

---

## Phase 3: Full Integration
**Timeline**: 8-12 weeks after Phase 2  
**Goal**: Rep becomes the primary (optional) interface

### 3.1 Complete Widget Library
All existing app features accessible through Rep:
- Morning/Evening Bookends
- Daily Reps (video + reflection)
- Development Plan navigation
- Content Library browsing
- Wins recording
- Coach messaging
- Assessment retakes
- Community features

### 3.2 Proactive Engagement
- Push notifications with Rep's voice
- "Check-in" sessions triggered by patterns
- Milestone celebrations with context

### 3.3 Voice Option (Stretch)
- Text-to-speech for Rep's messages
- Speech-to-text for user responses
- Hands-free morning routine

### 3.4 Analytics Dashboard
- Admin view of Rep effectiveness
- User engagement patterns
- Content performance through Rep

---

## Technical Requirements

### LLM Integration
**Recommended**: Claude API (Anthropic) or GPT-4 API (OpenAI)

```javascript
// Example: Rep response generation
const generateRepResponse = async (context) => {
  const systemPrompt = REP_PERSONALITY + CURRICULUM_CONTEXT + USER_MEMORY;
  
  const response = await llm.complete({
    system: systemPrompt,
    messages: context.conversationHistory,
    user: context.latestUserInput
  });
  
  return parseRepResponse(response); // Extract text + actions
};
```

### Memory Architecture
```javascript
// Firestore: users/{userId}/rep_memory
{
  conversations: [
    {
      date: "2026-01-23",
      summary: "User completed morning bookend, expressed frustration with delegation",
      keyInsights: ["struggles with letting go of control", "team member named Sarah"],
      completedItems: ["morning_bookend", "daily_rep_w3d4"]
    }
  ],
  patterns: {
    preferredTime: "morning",
    avgSessionLength: 8.5, // minutes
    struggleAreas: ["delegation", "difficult conversations"],
    strengths: ["consistency", "reflection quality"]
  },
  milestones: [
    { date: "2026-01-10", type: "streak_7", celebrated: true },
    { date: "2026-01-20", type: "first_delegation_win", celebrated: true }
  ]
}
```

### API Costs (Estimates)
| Model | Cost per 1K tokens | Est. daily cost per user |
|-------|-------------------|-------------------------|
| Claude 3 Opus | $0.015 input / $0.075 output | ~$0.05-0.10 |
| Claude 3 Sonnet | $0.003 input / $0.015 output | ~$0.01-0.03 |
| GPT-4 Turbo | $0.01 input / $0.03 output | ~$0.03-0.06 |

Recommendation: Start with Claude Sonnet or GPT-4 Turbo for cost efficiency.

---

## UI/UX Design Direction

### Color Palette (Extended)
```css
/* Existing Corporate Colors */
--corporate-navy: #002E47;
--corporate-teal: #47A88D;
--corporate-orange: #E04E1B;
--corporate-light-gray: #FCFCFA;

/* NEW: Light Variants for Rep */
--rep-navy-light: #E8EEF2;      /* Rep message backgrounds */
--rep-teal-light: #E5F5F0;      /* Success, positive states */
--rep-coral-light: #FDE8E4;     /* Attention, CTAs */
--rep-warm-white: #FFFAF8;      /* Conversation background */

/* NEW: Accent Colors */
--rep-text-primary: #1A3A4A;    /* Darker navy for readability */
--rep-text-secondary: #5A7A8A;  /* Muted for secondary text */
```

### Visual Language
- **Rep's Avatar**: Friendly but professional icon/character
- **Message Bubbles**: Soft, rounded, with subtle shadows
- **Embedded Widgets**: Cards that "float" within the conversation
- **Transitions**: Smooth, purposeful animations
- **Progress Indicators**: Visual celebration of completion

### Layout Concept
```
┌──────────────────────────────────────┐
│  ← Back           Rep           ⚙️   │  Header
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🎯 Good morning, Rob!          │  │  Rep Message
│  │    Ready for Day 23?           │  │  (soft navy bg)
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ╔══════════════════════════╗  │  │  Embedded Widget
│  │  ║   Morning Bookend        ║  │  │  (full component)
│  │  ║   [Interactive content]  ║  │  │
│  │  ╚══════════════════════════╝  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ✨ Nice intentions! Now let's │  │  Rep Response
│  │    watch today's rep...       │  │
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│  💬 Type a message...         Send   │  Input (optional)
└──────────────────────────────────────┘
```

---

## Data Model

### New Collections

#### `rep_memory` (per user)
```javascript
// Path: users/{userId}/rep_memory/{sessionId}
{
  date: Timestamp,
  sessionType: "morning" | "evening" | "deviation" | "check-in",
  duration: Number, // minutes
  conversationLog: [
    { role: "rep", content: "...", timestamp: Timestamp },
    { role: "user", content: "...", timestamp: Timestamp }
  ],
  summary: String, // LLM-generated summary
  keyInsights: [String],
  itemsCompleted: [String], // IDs of completed items
  itemsSkipped: [String],
  sentiment: "positive" | "neutral" | "struggling",
  metadata: {}
}
```

#### `rep_user_profile` (per user)
```javascript
// Path: users/{userId}/rep_profile
{
  firstSessionDate: Timestamp,
  totalSessions: Number,
  preferredSessionTime: String,
  communicationStyle: "brief" | "detailed" | "encouraging",
  knownStruggles: [String],
  knownStrengths: [String],
  significantMoments: [
    { date: Timestamp, description: String, type: String }
  ],
  lastSessionSummary: String,
  currentCurriculumPosition: {
    week: Number,
    day: Number,
    phase: String
  }
}
```

### Integration with Existing Data
Rep reads from and writes to:
- `users/{userId}` - Profile data
- `users/{userId}/progress` - Completion data
- `users/{userId}/dailyPlanProgress` - Day-by-day progress
- `users/{userId}/reflections` - Reflection content
- `users/{userId}/wins` - Recorded wins
- `content_*` collections - All content

**No changes to existing collections** - Rep is additive only.

---

## Content Requirements

### What Rep Needs to Function

| Content Type | Status | Notes |
|--------------|--------|-------|
| Development Plan structure | ✅ Exists | 8-week curriculum |
| Daily Rep videos | ⚠️ Partial | Need video content |
| Daily Rep reflections | ⚠️ Partial | Need reflection prompts |
| Bookend prompts | ✅ Exists | Morning/evening flows |
| Assessment questions | ✅ Exists | Leadership Skills Baseline |
| Reading content | ⚠️ Partial | Content library items |
| Video content | ⚠️ Partial | Content library items |

### Placeholder Strategy
Where content is missing, Rep will:
1. Acknowledge placeholder: "Today's video is being prepared..."
2. Offer alternative: "Let's do a reflection instead"
3. Track gap: System logs missing content for admin

---

## Risk Mitigation

### Risk 1: AI Says Wrong Things
**Mitigation**: 
- Strict system prompts with boundaries
- Rep stays "in lane" (leadership development only)
- Escalation phrases trigger: "Talk to your coach" or "This is beyond what I can help with"

### Risk 2: Costs Spiral
**Mitigation**:
- Start with cost-efficient models (Sonnet, GPT-4 Turbo)
- Cache common responses
- Limit session length (10-minute target helps)
- Monitor per-user costs

### Risk 3: Users Prefer Old App
**Mitigation**:
- Both options available indefinitely
- No forced migration
- Learn from usage patterns

### Risk 4: Technical Complexity
**Mitigation**:
- Phase 1 is intentionally simple
- Prove value before adding intelligence
- Leverage existing widget infrastructure

---

## Success Metrics

### Phase 1 (MVP)
- [ ] 50% of test users complete at least 5 Rep sessions
- [ ] Average session completion rate > 80%
- [ ] Qualitative feedback: "This feels like coaching"

### Phase 2 (Intelligence)
- [ ] Rep successfully references past conversations
- [ ] Users report feeling "known" by Rep
- [ ] Deviation handling feels natural

### Phase 3 (Full Integration)
- [ ] 70% of active users prefer Rep over traditional app
- [ ] Daily engagement increases by 20%
- [ ] User retention improves

---

## Next Steps

### Immediate (This Week)
1. ✅ Create `rep` branch
2. [ ] Review and refine this plan
3. [ ] Confirm light color palette with team
4. [ ] Set up LLM API account (Claude or OpenAI)
5. [ ] Create basic Rep route and navigation

### Week 2-3
6. [ ] Build `RepHome` component (greeting + agenda)
7. [ ] Build `RepSession` component (conversation flow)
8. [ ] Create first prompt templates
9. [ ] Integrate with existing `useDailyPlan` hook

### Week 4-6
10. [ ] Build widget embedding system
11. [ ] Implement basic memory storage
12. [ ] Create `RepComplete` component
13. [ ] Internal testing and iteration

---

## Questions for Team Discussion

1. **Rep's Name**: Is "Rep" the right name? Alternatives: "Coach", "Guide", or a human name?

2. **Avatar/Visual Identity**: What should Rep look like? Abstract icon? Character? Just text?

3. **Onboarding**: How does Rep introduce itself to new users?

4. **Existing Users**: How do we introduce Rep to users already in the program?

5. **Content Priorities**: Which missing content should we create first for Rep?

6. **LLM Provider**: Claude vs. GPT-4 vs. other?

---

*This document is a living plan. Update as decisions are made and learnings emerge.*

**Last Updated**: January 23, 2026  
**Branch**: `rep`  
**Status**: Planning Phase
