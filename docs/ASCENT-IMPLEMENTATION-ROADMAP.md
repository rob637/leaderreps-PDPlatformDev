# Ascent Implementation Roadmap
## Phased Delivery Plan

**Created:** March 10, 2026  
**Reference:** [ASCENT-MVP-PROPOSAL-V2.md](ASCENT-MVP-PROPOSAL-V2.md)

---

## Overview

Total MVP Timeline: **12 weeks** (Phases 1-4)  
Full Feature Set: **+4 weeks** (Phases 5-6)

```
PHASE 1          PHASE 2          PHASE 3          PHASE 4          PHASE 5
Foundation →     Sprint           Observer         Advanced Reps    Guide
Ascent Bridge    System           Pulses           + Situation      System
                                                   Room

Week 1-2         Week 3-5         Week 6-8         Week 9-10        Week 11-12
═══════════      ═══════════      ═══════════      ═══════════      ═══════════

[Graduation]     [Sprint UI]      [Observer        [Advanced        [Guide
 Modal            Templates        Invite]          Rep Unlocks]     Center]
[AI Summary]     [Selection]      [Pulse Gen]      [Situation       [Debrief
[Onboarding]     [Dashboard]      [Response        Room AI]         Matching]
[Data Model]     [Finale +        Page]           [Extended        [Moderation]
                 Unlocks]        [Trends]          Prep]

        ▼              ▼               ▼               ▼               ▼
    MILESTONE:     MILESTONE:      MILESTONE:      MILESTONE:      MILESTONE:
    Leaders        Leaders can     External        New challenges   Community
    enter          complete        validation      + crisis prep    contribution
    Ascent         sprints         active          unlocked         live
```

---

## Phase 1: Foundation → Ascent Bridge

**Duration:** 2 weeks  
**Goal:** No leader "falls off" after Foundation completion

### Deliverables

| # | Deliverable | Owner | Days | Dependencies |
|---|-------------|-------|------|--------------|
| 1.1 | Graduation celebration modal | Frontend | 2 | None |
| 1.2 | AI-generated Foundation summary | Backend + AI | 2 | Existing rep data |
| 1.3 | Ascent onboarding wizard (3 screens) | Frontend | 3 | 1.1 |
| 1.4 | `ascent_plan` Firestore structure | Backend | 1 | None |
| 1.5 | Feature flag: `ascent-enabled` | Backend | 0.5 | None |
| 1.6 | Phase detection in useDailyPlan | Frontend | 1 | 1.4 |

### Data Model: ascent_plan

```javascript
// users/{userId}/ascent_plan/current
{
  status: 'active',  // active | paused
  enteredAscentAt: Timestamp,
  
  foundationSummary: {
    completedAt: Timestamp,
    totalReps: 27,
    repBreakdown: { DRF: 12, SCE: 8, DRE: 5, DSC: 2 },
    strengthAreas: ['DRF'],
    growthAreas: ['DRE', 'DSC'],
    aiNarrative: '...'
  },
  
  currentSprintId: null,  // Set in Phase 2
  completedSprints: [],
  
  observerCount: 0,
  totalPulseResponses: 0,
  
  guideEligible: false,
  guideAreas: []
}
```

### UI: Graduation Modal

```
Location: Triggered when Foundation milestone 5 completed
Component: src/components/modals/FoundationGraduationModal.jsx

Features:
- Confetti animation
- Stats summary (reps, sessions, etc.)
- AI-generated growth narrative
- "Continue to Ascent" CTA
```

### Acceptance Criteria

- [ ] Foundation graduate sees celebration modal automatically
- [ ] AI narrative reflects actual rep history and patterns
- [ ] Leader can select initial focus area
- [ ] `ascent_plan` document created on Ascent entry
- [ ] Feature flag controls Ascent visibility

---

## Phase 2: Sprint System

**Duration:** 3 weeks  
**Goal:** Replace vague planning with focused 6-8 week challenges

### Deliverables

| # | Deliverable | Owner | Days | Dependencies |
|---|-------------|-------|------|--------------|
| 2.1 | Sprint template admin UI | Admin | 3 | Content Manager patterns |
| 2.2 | Sprint template data model | Backend | 1 | None |
| 2.3 | Sprint selection screen | Frontend | 2 | 2.2 |
| 2.4 | Sprint kickoff flow | Frontend | 1 | 2.3 |
| 2.5 | `AscentSprintWidget` (dashboard) | Frontend | 2 | 2.4 |
| 2.6 | Mid-sprint check-in modal | Frontend | 2 | 2.5 |
| 2.7 | Sprint finale + unlock celebration | Frontend | 3 | 2.5 |
| 2.8 | Weekly sprint nudge Cloud Function | Backend | 1 | 2.4 |
| 2.9 | Rep → Sprint tagging | Backend | 1 | 2.4 |

### Data Model: Sprint Templates (Admin-Managed)

```javascript
// ascent_sprint_templates/{templateId}
{
  id: 'direct-feedback-mastery',
  name: 'Direct Feedback Mastery',
  description: 'Master the art of giving clear, timely redirecting feedback',
  longDescription: '...',  // Rich text for selection screen
  
  duration: 8,  // weeks
  focusArea: 'direct-feedback',
  difficulty: 'intermediate',  // beginner | intermediate | advanced
  
  // Prerequisites
  requiresFoundationComplete: true,
  requiresPriorSprints: [],
  
  // Practice config
  linkedRepTypes: ['DRE', 'DSC'],
  weeklyRepTarget: 2,
  
  // Unlocks awarded on completion
  unlocks: [
    { type: 'advanced-rep', id: 'de-escalating-high-emotion' },
    { type: 'situation-room-module', id: 'termination-prep' },
    { type: 'badge', id: 'direct-feedback-master' }
  ],
  
  // Observer pulse config
  pulseQuestion: 'How often have you seen [Leader] give clear, direct feedback?',
  
  // Admin
  status: 'active',
  sortOrder: 1,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Data Model: User Sprints

```javascript
// users/{userId}/ascent_sprints/{sprintId}
{
  id: 'sprint-2026-q2-direct-feedback',
  templateId: 'direct-feedback-mastery',
  
  status: 'active',  // upcoming | active | completed | paused | abandoned
  startDate: Timestamp,
  endDate: Timestamp,
  currentWeek: 4,
  
  // Copied from template for historical accuracy
  name: 'Direct Feedback Mastery',
  focusArea: 'direct-feedback',
  weeklyRepTarget: 2,
  linkedRepTypes: ['DRE', 'DSC'],
  
  // Progress
  repsCompleted: 7,
  weeklyProgress: {
    '2026-W14': { reps: 2, selfRating: 3.0 },
    '2026-W15': { reps: 1, selfRating: 3.2 },
    '2026-W16': { reps: 2, selfRating: 3.5 },
    '2026-W17': { reps: 2, selfRating: 3.8 }
  },
  
  // Unlocks (tracked per sprint)
  unlocksEarned: [],  // Populated on completion
  
  // Check-ins
  midSprintCheckIn: {
    completedAt: null,
    reflection: null,
    adjustment: null
  },
  
  // Finale (generated on completion)
  finaleReport: null
}
```

### Widget: AscentSprintWidget

```
Location: Dashboard (replaces Foundation milestones widget in Ascent phase)
Component: src/components/widgets/AscentSprintWidget.jsx

Features:
- Current sprint name + week number
- Progress bar (reps completed / target)
- Next observer pulse date
- Quick "Log a Rep" CTA
- "View Sprint Details" link
```

### Admin: Sprint Template Manager

```
Location: Admin Portal → Content Manager → Ascent Sprints
Pattern: Similar to existing content type management

Features:
- CRUD for sprint templates
- Preview sprint selection card
- Configure linked rep types
- Set unlock rewards
- Reorder sprint library
```

### Acceptance Criteria

- [ ] Admin can create/edit sprint templates
- [ ] Leader sees personalized sprint recommendations
- [ ] Leader can start a sprint and see dashboard widget
- [ ] Real Reps automatically tagged to active sprint
- [ ] Mid-sprint check-in triggers at week 4
- [ ] Sprint finale generates AI summary + awards unlocks
- [ ] Leader receives weekly nudge if behind on reps

---

## Phase 3: Observer Pulses

**Duration:** 3 weeks  
**Goal:** External validation — the killer engagement feature

### Deliverables

| # | Deliverable | Owner | Days | Dependencies |
|---|-------------|-------|------|--------------|
| 3.1 | Observer invite flow | Frontend | 2 | Phase 2 |
| 3.2 | `ascent_observers` data model | Backend | 1 | None |
| 3.3 | Token-based response system | Backend | 2 | 3.2 |
| 3.4 | `scheduledPulseGeneration` Cloud Function | Backend | 2 | 3.3 |
| 3.5 | Observer email templates | Backend | 1 | 3.4 |
| 3.6 | Unauthenticated response page | Frontend | 2 | 3.3 |
| 3.7 | `PulseResultsWidget` (modal) | Frontend | 2 | 3.4 |
| 3.8 | Self vs. observer trend chart | Frontend | 2 | 3.7 |
| 3.9 | "Your team noticed!" push notification | Backend | 1 | 3.7 |

### Data Model: Observers

```javascript
// users/{userId}/ascent_observers/{observerId}
{
  id: 'obs-sarah-chen',
  email: 'sarah.chen@company.com',
  name: 'Sarah Chen',
  relationship: 'direct_report',
  
  status: 'active',
  invitedAt: Timestamp,
  acceptedAt: Timestamp,
  
  // Secure token for unauthenticated responses
  responseToken: 'abc123xyz789...',
  tokenExpiresAt: null,  // Tokens don't expire, but can be revoked
  
  // Stats
  pulsesReceived: 3,
  pulsesCompleted: 2,
  lastResponseAt: Timestamp,
  averageRating: 4.1
}
```

### Data Model: Pulses

```javascript
// users/{userId}/ascent_pulses/{pulseId}
{
  id: 'pulse-2026-04-direct-feedback',
  sprintId: 'sprint-2026-q2-direct-feedback',
  month: '2026-04',
  
  status: 'collecting',  // pending | collecting | complete
  sentAt: Timestamp,
  dueAt: Timestamp,  // 7 days after sent
  closedAt: null,
  
  question: 'How often have you seen [Leader] give clear, direct feedback?',
  scale: ['Never', 'Rarely', 'Sometimes', 'Often', 'Consistently'],
  
  observersSent: ['obs-sarah-chen', 'obs-mike-r', 'obs-jpark'],
  
  responses: [
    {
      observerId: 'obs-sarah-chen',
      relationship: 'direct_report',
      respondedAt: Timestamp,
      rating: 4,
      comment: 'The budget conversation was excellent.'
    }
  ],
  
  selfAssessment: {
    completedAt: Timestamp,
    rating: 4,
    reflection: '...'
  },
  
  // Computed when pulse closes
  results: {
    responseRate: 0.67,
    averageRating: 4.2,
    byRelationship: {
      direct_report: 4.0,
      peer: 4.5
    },
    calibration: 'aligned'
  }
}
```

### Cloud Function: scheduledPulseGeneration

```javascript
// Runs: 1st of each month at 9am
// Logic:
// 1. Find all active sprints
// 2. For each sprint, find leader's observers
// 3. Create pulse document
// 4. Queue emails to observers

exports.scheduledPulseGeneration = onSchedule('0 9 1 * *', async () => {
  // Implementation
});
```

### Response Page (Unauthenticated)

```
URL: /pulse/{responseToken}
Component: src/components/screens/PulseResponsePage.jsx

Features:
- No login required
- Mobile-optimized
- Single question with 5-point scale
- Optional comment field
- Thank you confirmation
- Explains anonymity (attributed by relationship type only)
```

### Acceptance Criteria

- [ ] Leader can invite observers from sprint dashboard
- [ ] Observer receives email with direct link (no login)
- [ ] Observer can respond in < 30 seconds
- [ ] Leader receives push notification when responses arrive
- [ ] Leader sees self vs. observer comparison
- [ ] Trend chart shows ratings over multiple months

---

## Phase 4: Advanced Reps + Situation Room

**Duration:** 2 weeks  
**Goal:** New challenges + immediate utility

### Deliverables

| # | Deliverable | Owner | Days | Dependencies |
|---|-------------|-------|------|--------------|
| 4.1 | Advanced rep type configs (admin) | Admin | 2 | Phase 2 |
| 4.2 | Advanced rep unlock system | Backend | 1 | Phase 2 unlocks |
| 4.3 | Extended prep flow for advanced reps | Frontend | 2 | 4.2 |
| 4.4 | Situation Room screen | Frontend | 3 | AI integration |
| 4.5 | Situation Room AI prep (extends Rep) | Backend + AI | 1 | Existing AI |
| 4.6 | Post-situation debrief | Frontend | 1 | 4.4 |

### Data Model: Advanced Reps

```javascript
// ascent_advanced_reps/{repTypeId}
{
  id: 'de-escalating-high-emotion',
  name: 'De-escalating High Emotion',
  category: 'difficult-conversations',
  
  description: 'The person becomes emotional — angry, defensive, tearful.',
  
  // Unlock requirements
  unlockedBy: ['direct-feedback-mastery'],
  
  // Extended prep content
  scenarioBrief: '...',
  languageFramework: '...',
  aiRolePlayEnabled: true,
  aiRolePlayPrompt: '...',
  
  // Enhanced debrief
  debriefQuestions: [
    'What emotional signals did you notice?',
    'How did you respond to their emotion?',
    'What would you do differently?'
  ],
  
  status: 'active'
}
```

### Data Model: Situation Room Logs

```javascript
// users/{userId}/ascent_situation_room/{situationId}
{
  id: 'sit-2026-04-15-termination',
  
  // Input
  description: 'I need to tell my top performer they didn\'t get the promotion...',
  timeUntil: '2 hours',
  createdAt: Timestamp,
  
  // AI-generated prep
  prepGenerated: {
    generatedAt: Timestamp,
    framework: '...',
    potentialReactions: [...],
    suggestedLanguage: '...',
    personalized: 'Based on your DRE patterns, you tend to over-explain...'
  },
  
  // Post-moment
  debrief: {
    completedAt: Timestamp,
    whatHappened: '...',
    whatWorked: '...',
    whatToImprove: '...',
    countAsRep: true,
    linkedRepId: 'rep-xyz-123'
  }
}
```

### Acceptance Criteria

- [ ] Completing a sprint unlocks configured advanced reps
- [ ] Advanced reps show in rep selection with unlock badge
- [ ] Advanced prep includes extended content + AI role-play option
- [ ] Situation Room accessible from dashboard
- [ ] AI prep references leader's past rep patterns
- [ ] Situation Room debriefs can optionally count as sprint reps

---

## Phase 5: Guide System

**Duration:** 2 weeks  
**Goal:** Community contribution for senior leaders

### Deliverables

| # | Deliverable | Owner | Days | Dependencies |
|---|-------------|-------|------|--------------|
| 5.1 | Guide eligibility rules | Backend | 1 | Phase 2-3 |
| 5.2 | `GuideCenterWidget` | Frontend | 2 | 5.1 |
| 5.3 | Anonymous debrief matching | Backend | 2 | Foundation debriefs |
| 5.4 | Encouragement submission flow | Frontend | 1 | 5.3 |
| 5.5 | Guide impact dashboard | Frontend | 1 | 5.4 |
| 5.6 | Moderation queue (admin) | Admin | 1 | 5.4 |

### Guide Eligibility Rules

```javascript
// Becomes guide-eligible when:
// 1. Completed at least 1 sprint with >70% completion
// 2. Observer rating average >= 4.0 for that focus area
// 3. No guideline violations

function checkGuideEligibility(userId) {
  // Implementation
}
```

### Acceptance Criteria

- [ ] Eligible leaders see Guide Center in Locker
- [ ] Foundation debriefs are anonymized before surfacing to guides
- [ ] Guides can leave 1-2 sentence encouragement
- [ ] Foundation leaders see encouragement attributed to "Guide Sarah"
- [ ] Admin can moderate flagged contributions

---

## Phase 6: Polish & Enterprise

**Duration:** Ongoing  
**Goal:** Production hardening + enterprise features

### Deliverables

| # | Deliverable | Owner | Days | Priority |
|---|-------------|-------|------|----------|
| 6.1 | Quarterly trend reports | Frontend | 2 | P2 |
| 6.2 | Export for performance reviews | Backend | 2 | P2 |
| 6.3 | Manager visibility dashboard (opt-in) | Frontend | 3 | P2 |
| 6.4 | Team analytics for enterprise | Frontend + Backend | 5 | P3 |
| 6.5 | Ascent admin analytics | Admin | 2 | P2 |

---

## Technical Dependencies

### Existing Systems to Extend

| System | Extension |
|--------|-----------|
| `useDailyPlan` | Add phase detection for 'ascent' |
| `conditioning_reps` | Add `sprintId`, `isAdvanced` fields |
| `FeatureProvider` | Add `ascent-*` feature flags |
| `NotificationService` | Add pulse + sprint notification types |
| `Content Manager` | Add sprint template management |
| `AI Coaching (Rep)` | Extend for Situation Room prep |

### New Infrastructure

| Component | Purpose |
|-----------|---------|
| Token generation utility | Secure observer response tokens |
| Response page hosting | Public unauthenticated page |
| Pulse scheduler | Monthly Cloud Function |
| Email templates | Observer invite + pulse request |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Observer response rates too low | Default to 2-3 observers; follow-up nudges; keep survey ultra-short |
| Sprint abandonment | Mid-sprint check-in; pause option; shorter 6-week sprints available |
| AI prep quality | Start with template-based prep; iterate with user feedback |
| Email deliverability | Use SendGrid/established service; test across email providers |
| Guide abuse | Moderation queue; rate limiting; reputation system |

---

## Launch Checklist

### Phase 1-2 Launch (MVP)
- [ ] Feature flag `ascent-enabled` tested
- [ ] Foundation → Ascent transition tested with real graduates
- [ ] Sprint template library has 5+ options
- [ ] Weekly nudge emails reviewed by legal/compliance

### Phase 3 Launch (Observers)
- [ ] Observer email templates approved
- [ ] Response page tested on mobile
- [ ] Token security audited
- [ ] GDPR/privacy considerations documented

### Phase 4 Launch (Advanced)
- [ ] Advanced rep content reviewed for quality
- [ ] Situation Room AI tested across scenarios
- [ ] Unlock system tested end-to-end

### Full Launch
- [ ] All phases tested in test environment
- [ ] Documentation for users + admins
- [ ] Support team trained
- [ ] Analytics dashboards configured

---

*This roadmap is a living document. Update as implementation progresses.*
