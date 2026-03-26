# RED (Deliver Redirecting Feedback) Update Plan

**Date:** March 26, 2026  
**Status:** Planning/Discussion  
**Spec Source:** Boss's comprehensive RED + CTL specification

---

## Executive Summary

The boss has provided a comprehensive specification for updating the **Real Rep: Deliver Redirecting Feedback (RED)** system. This document outlines what currently exists, what's new, and a phased implementation plan.

### Key Changes Overview
| Area | Current State | New Spec | Effort |
|------|--------------|----------|--------|
| Evidence Capture | 4 fields (Behavior, Impact, Request, Response) | Same + Difficulty + Internal Gap + Scenario type | Medium |
| Evaluation Logic | 5 conditions, 0-3 scoring, auto-fail | Same structure, refined rules | Medium |
| Request Confirmation | Not tracked | Required when direct proposes solution | High |
| Intensity Scaling | In AI prompt only | Systematic with overrides | Medium |
| Pattern Tracking | None | Rolling 10-rep window | High |
| CTL System | Basic 3-criteria pass/fail | Thread-based with states | High |
| Analytics | None | 5 key metrics | Medium |

---

## Part 1: Current State Analysis

### 1.1 What EXISTS Already ✅

**Cloud Functions (`functions/index.js`):**
- `assessREDRep()` - Lines 2734-3116
  - 5 conditions: `behavior_named`, `impact_explained`, `request_made`, `direct_delivery`, `delivery_discipline`
  - 0-3 scoring per condition
  - Auto-fail logic (behavior ≤1, request ≤1, delivery=0, two conditions=1)
  - Intensity scaling (Levels 1-3)
  - Under-scaling detection ("light nudge")
  - Anti-gaming checks (Internal Gap cross-check, Difficulty mismatch)
  - Gibberish detection
  - Request type classification (Command/Challenge/Collaborate) - internal

- `assessCTLRep()` - Lines 3132-3275
  - 3 criteria: `real_check`, `usable_evidence`, `appropriate_response`
  - Pass/fail per criterion
  - Handles: changed, not_changed, not_observed
  - Basic coaching output

**Frontend Components (`src/components/conditioning/`):**
- `EvidenceCaptureWizard.jsx` - Multi-step evidence capture
- `QualityAssessmentCard.jsx` - Display AI evaluation results
- `LoopClosureModal.jsx` - Basic loop closure UI
- `VoiceTextarea.jsx` - Voice-to-text input

**Constants (`src/components/conditioning/constants.js`):**
- `RED_EVIDENCE_QUESTIONS` - Behavior, Impact, Request, Response detail
- `RED_RESPONSE_OPTIONS` - 7 options (acknowledged, agreed, defensive, denied, minimal, unclear, other)
- `RED_DIFFICULTY_OPTIONS` - Low, Moderate, High
- `RED_SELF_ASSESSMENT` - 4 reflection questions
- `RED_COMPLETE_LOOP` - Watch for, Next step, Reminder

**Services:**
- `conditioningService.js` - Rep state machine, CRUD
- `repTaxonomy.js` - Rep type definitions

**Data Model:**
- User reps: `users/{userId}/conditioning_reps/{repId}`
- Status flow: committed → prepared → executed → debriefed → loop_closed

### 1.2 What's PARTIALLY Implemented ⚠️

| Feature | Current | Needs |
|---------|---------|-------|
| Scenario type | Not captured at commit | Add step: one-time, repeated, team, high-stakes |
| Difficulty capture | Field exists, optional | Make prominent, required for analytics |
| Internal Gap | Single text field | Structured options + text |
| Response capture | 7 options | Exactly matches spec ✅ |
| Self-assessment | 4 questions | Match spec exactly |
| Request confirmation | Not tracked | Track when direct proposes + leader confirms |

### 1.3 What's NEW / Missing ❌

1. **Scenario Selection at Commit** (seeds intensity)
2. **Request Confirmation Logic** (critical for score=3)
3. **Pattern Tracking System** (rolling 10-rep window)
4. **Thread-Based CTL Model** (Open/Closed/Deferred states)
5. **CTL Continuation Logic** (automatic new RED scheduling)
6. **Analytics Dashboard** (5 key metrics)
7. **Enhanced Coaching Prioritization** (fail reason → lowest condition → closure check)

---

## Part 2: Detailed Changes

### 2.1 Evidence Capture Flow Updates

#### A. Add Scenario Selection (Pre-Commit)
**New Screen: "What type of situation?"**
```javascript
// Add to constants.js
export const RED_SCENARIO_OPTIONS = [
  { id: 'one_time', label: 'A one-time behavior miss', intensityDefault: 1 },
  { id: 'repeated', label: 'A repeated pattern or ongoing issue', intensityDefault: 2 },
  { id: 'team', label: 'A team or group behavior', intensityDefault: 2 },
  { id: 'high_stakes', label: 'A high-stakes or sensitive situation', intensityDefault: 3 }
];
```

**Impact:**
- Stored in `rep.scenario` field
- Seeds intensity level for AI evaluation
- Informs coaching tone

#### B. Update Internal Gap Capture
**Change from:** Single text field  
**Change to:** Structured options + optional text

```javascript
// Add to constants.js
export const RED_INTERNAL_GAP_OPTIONS = [
  { id: 'nothing', label: 'Nothing felt difficult' },
  { id: 'mild', label: 'Mild tension' },
  { id: 'strong', label: 'Strong emotion' },
  { id: 'avoided', label: 'I avoided saying something' }
];
```

**Fields:**
- `internal_gap_selection` (required): One of the above
- `internal_gap_detail` (optional): "What did you hold back?"

#### C. Update Self-Assessment Questions
Match spec exactly:

```javascript
export const RED_SELF_ASSESSMENT_V2 = [
  { 
    id: 'behavior_clear', 
    prompt: 'Did I clearly describe the behavior?',
    options: ['Observable and specific', 'Somewhat clear', 'Too vague']
  },
  { 
    id: 'impact_clear', 
    prompt: 'Did I clearly define why it matters?',
    options: ['Clear impact/standard', 'Somewhat clear', 'Unclear']
  },
  { 
    id: 'request_clear', 
    prompt: 'Did I clearly define what should change?',
    options: ['Specific behavior', 'Somewhat clear', 'Too vague']
  },
  { 
    id: 'delivery_composed', 
    prompt: 'Did I deliver it directly and with composure?',
    options: ['Yes', 'Somewhat', 'No']
  }
];
```

#### D. Add Reflection Prompt
Always shown after self-assessment:
```
"Next time I deliver redirecting feedback, I will ____________"
```
Stored in `rep.evidence.reflection_commitment`

### 2.2 Evaluation Logic Updates

#### A. Request Confirmation Tracking
**Critical Rule from Spec:**
> A Request can score 3 (Strong) ONLY IF the expected behavior is explicitly stated AND confirmed.

**Two paths to Request = 3:**
1. **Leader-Defined**: Leader states the expected behavior directly  
   Example: "Submit it by 3pm going forward."

2. **Direct-Defined + Leader Confirmed**: Direct states it, leader confirms  
   Example: Direct: "I'll send it before 3." → Leader: "Good—send it by 3pm."

**Implementation:**
- Add field: `request_confirmation_type`: `leader_stated` | `direct_stated_leader_confirmed` | `direct_stated_not_confirmed` | `none`
- AI must classify based on evidence
- If `direct_stated_not_confirmed` → Request max = 2 + trigger Closure Check coaching

#### B. Mixed Feedback Detection
**Rule:** If reinforcing + redirecting feedback mixed → Behavior capped at 2

Already in AI prompt, but needs:
- Explicit flag in response: `mixedFeedbackDetected: boolean`
- Surfaced in coaching output

#### C. Fail Logic Refinement
Current fail conditions are correct. Add explicit tracking:
```javascript
// In AI response
failTriggeredBy: 'behavior_one' | 'request_lte_one' | 'delivery_zero' | 'direct_delivery_zero' | 'two_conditions_one' | null
```

### 2.3 Debrief/Coaching Output Updates

#### A. Coaching Prioritization (MANDATORY ORDER)
1. Fail reason (if triggered)
2. Request weakness when Intensity ≥ 2 (forced priority)
3. Lowest scoring condition
4. Under-Scaling / Light Nudge
5. Closure Check
6. Anti-Gaming flags
7. Pattern Feedback (if triggered)

#### B. Output Selection Logic
| Case | Output |
|------|--------|
| Invalid Rep | Missing element + 1 corrective insight |
| Failed Rep | Primary fail reason + 1 improvement |
| Pattern Triggered | Pattern insight + 1 supporting |
| Standard Pass | Top 2-3 insights by priority |

#### C. Alignment Confirmation Coaching (NEW)
When Request = 2 AND expected behavior was stated by direct but not confirmed:

```
"You asked what they would do differently, and they identified a clear action. 
However, the expectation was not explicitly confirmed. How could you reinforce 
the standard so it is clearly owned going forward?"
```

### 2.4 Pattern Tracking System (NEW)

**Data Model:**
```javascript
// users/{userId}/red_pattern_metrics
{
  lastUpdated: timestamp,
  rollingWindow: [
    { repId, timestamp, scores: {...}, requestType, difficulty, internalGap }
  ], // Last 10 RED reps
  patterns: {
    request_weak_count: 0, // Request = 2 count
    behavior_weak_count: 0,
    delivery_weak_count: 0,
    request_never_strong: boolean // Request never = 3 in last 6
  }
}
```

**Trigger Rules:**
| Count | Trigger |
|-------|---------|
| After 4th RED | If Request = 2 in ≥3 of 4 → Request Pattern |
| After 4th RED | If same lowest condition in ≥3 of 4 → Condition Pattern |
| After 10th RED | If Request never = 3 in last 6 → Escalated Request Pattern |
| After 10th RED | If same limiting condition in ≥6 of 10 → Escalated Pattern |

**Pattern Feedback Examples:**
```
// 4th rep - Reflective tone
"You consistently open with questions but stop short of defining expectations. 
What behavior will you state next time?"

// 10th rep - Direct/Escalated tone
"You rely on collaboration without defining expectations. This is now limiting 
clarity and accountability. What exact behavior will you state next time?"
```

---

## Part 3: CTL (Close The Loop) System Overhaul

### 3.1 Current vs. New CTL

| Aspect | Current | New Spec |
|--------|---------|----------|
| Data model | Single CTL per rep | Thread model with multiple RED→CTL cycles |
| States | None | Open, Open-Continue, Deferred, Closed |
| Scheduling | Manual | Auto-schedule ~10 days after RED |
| New RED creation | Manual | System prompts/creates linked RED |
| Scoring | 3 pass/fail criteria | Same 3 criteria, enhanced logic |
| Analytics | None | 5 metrics tracked |

### 3.2 Thread Data Model (NEW)

```javascript
// users/{userId}/feedback_threads/{threadId}
{
  id: 'thread_xxx',
  state: 'open' | 'open_continue' | 'deferred' | 'closed',
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // Original RED that started the thread
  originalRedId: 'rep_xxx',
  originalBehavior: 'You interrupted the client twice...',
  originalRequest: 'Let them finish before responding.',
  person: 'John Smith',
  
  // Chain of RED → CTL cycles
  cycles: [
    {
      redId: 'rep_xxx',
      redTimestamp: timestamp,
      ctlId: 'ctl_xxx',
      ctlTimestamp: timestamp,
      ctlDecision: 'changed' | 'not_changed' | 'not_observed',
      ctlPassed: boolean
    }
  ],
  
  // Scheduling
  nextCtlDue: timestamp,
  ctlReminderSent: boolean
}
```

### 3.3 CTL Decision Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CTL CHECK TRIGGERED                       │
│              (~10 days after RED or manual)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│     "Did the behavior change?"                               │
│     ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│     │ Yes - Changed│ │No - Not     │ │Not observed yet     │ │
│     └──────┬──────┘ │  Changed    │ └──────────┬──────────┘ │
│            │        └──────┬──────┘            │             │
└────────────┼───────────────┼───────────────────┼─────────────┘
             │               │                   │
             ▼               ▼                   ▼
    ┌────────────────┐ ┌──────────────────┐ ┌─────────────────┐
    │ Capture what   │ │ Capture what     │ │ Select reason:  │
    │ you observed   │ │ you observed     │ │ - No opportunity│
    │ (observable)   │ │ (observable)     │ │ - Not recurred  │
    │                │ │                  │ │ - Other         │
    │ Optional:      │ │ Required:        │ │                 │
    │ - Gave DRF?    │ │ - Gave follow-up │ │ → Reschedule    │
    │                │ │   feedback? Y/N  │ │   reminder      │
    └───────┬────────┘ └────────┬─────────┘ └────────┬────────┘
            │                   │                    │
            │                   │                    │
            ▼                   ▼                    ▼
    ┌────────────────┐ ┌──────────────────┐ ┌─────────────────┐
    │ Thread State:  │ │ If Y: Launch new │ │ Thread State:   │
    │ → CLOSED       │ │   RED (linked)   │ │ → DEFERRED      │
    │                │ │                  │ │                 │
    │ AI evaluates   │ │ If N: Required:  │ │ Reminder reset  │
    │ CTL quality    │ │ "When will you   │ │                 │
    └────────────────┘ │  address this?"  │ └─────────────────┘
                       │                  │
                       │ Thread State:    │
                       │ → OPEN_CONTINUE  │
                       └──────────────────┘
```

### 3.4 CTL Evidence Requirements

**Observable Evidence (REQUIRED):**
- Specific actions seen or heard
- Named source if secondhand
- Fails if vague (e.g., "seems better")

```javascript
// CTL capture fields
{
  decision: 'changed' | 'not_changed' | 'not_observed',
  observation: {
    what_observed: string, // Required - observable behavior
    observation_context: string, // When/where
    is_secondhand: boolean,
    secondhand_source: string | null
  },
  // For 'changed' decision
  gave_reinforcing_feedback: boolean,
  // For 'not_changed' decision
  gave_followup_feedback: boolean,
  next_action_date: timestamp | null, // Required if no followup
  // For 'not_observed' decision
  not_observed_reason: 'no_opportunity' | 'not_recurred' | 'other',
  not_observed_detail: string | null
}
```

### 3.5 CTL Scoring (3 Criteria)

| Criterion | Pass | Fail |
|-----------|------|------|
| **Real Check** | Deliberate, intentional observation | Incidental, no effort, superficial |
| **Usable Evidence** | Specific, observable (camera test) | Vague, assumptions, "seems better" |
| **Appropriate Response** | Reinforced (if changed) OR gave feedback/has plan (if not changed) | No response, no plan, gave up |

### 3.6 CTL Anti-Gaming Checks

1. **Evidence Enforcement**: Vague evidence → Fail
2. **Drive-By Detection**: Minimal observation + no response → Fail/Flag
3. **Avoidance Pattern**: Repeated CTL without follow-up RED → Coaching escalation
4. **Over-Polished Pattern**: Strong REDs + weak CTLs → Coaching

---

## Part 4: Analytics/Metrics (NEW)

### 4.1 Key Metrics to Track

| Metric | Calculation | Purpose |
|--------|-------------|---------|
| **RED → CTL Conversion** | CTLs completed / REDs created | Measures follow-through |
| **CTL Outcomes** | % changed / % unchanged / % deferred | What's happening post-feedback |
| **Request Distribution** | % at 3 vs 2 vs 1 | Clarity strength |
| **Response Distribution** | Defensive/Denied trends | What leaders face |
| **Repeat Threads** | Threads requiring 2+ RED cycles | Stubborn issues |

### 4.2 Data Model for Analytics

```javascript
// global/red_analytics (admin view) or users/{userId}/red_analytics
{
  dateRange: { start, end },
  
  // Aggregate metrics
  totalReds: number,
  totalCtls: number,
  redToCtlRate: number, // %
  
  ctlOutcomes: {
    changed: number,
    not_changed: number,
    deferred: number
  },
  
  requestScores: {
    strong: number, // 3
    adequate: number, // 2
    weak: number // 1 or 0
  },
  
  responseTypes: {
    acknowledged: number,
    agreed: number,
    defensive: number,
    denied: number,
    minimal: number
  },
  
  repeatThreads: number,
  avgCyclesPerThread: number
}
```

---

## Part 5: Implementation Plan

### Phase 1: Evidence Capture Updates (Week 1-2)
**Priority: HIGH** — Foundation for everything else

| Task | Files | Est. Hours |
|------|-------|------------|
| Add scenario selection to commit flow | `PlannedRepForm.jsx`, `InMomentRepForm.jsx`, `constants.js` | 4h |
| Update Internal Gap to structured + text | `EvidenceCaptureWizard.jsx`, `constants.js` | 3h |
| Update self-assessment questions | `constants.js`, `EvidenceCaptureWizard.jsx` | 2h |
| Add reflection commitment field | `EvidenceCaptureWizard.jsx`, `constants.js` | 2h |
| Update rep data model | `conditioningService.js` | 2h |
| Add tests for new fields | New test file | 3h |

**Total: ~16 hours**

### Phase 2: Evaluation Logic Updates (Week 2-3)
**Priority: HIGH** — Core intelligence improvement

| Task | Files | Est. Hours |
|------|-------|------------|
| Add request confirmation classification | `functions/index.js` (assessREDRep) | 4h |
| Explicit mixed feedback detection flag | `functions/index.js` | 2h |
| Enhanced fail tracking | `functions/index.js` | 2h |
| Update coaching prioritization | `functions/index.js` | 4h |
| Add alignment confirmation coaching | `functions/index.js` | 2h |
| Update AI prompt per spec (line by line) | `functions/index.js` | 6h |
| Test all scenarios from spec | Manual + scripts | 8h |

**Total: ~28 hours**

### Phase 3: CTL System Overhaul (Week 3-5)
**Priority: HIGH** — Major new functionality

| Task | Files | Est. Hours |
|------|-------|------------|
| Design thread data model | Firestore schema | 4h |
| Create `feedbackThreadService.js` | New service file | 8h |
| Update `assessCTLRep()` function | `functions/index.js` | 6h |
| Create CTL scheduling function | `functions/index.js` | 4h |
| Build new CTL capture UI | New component or major `LoopClosureModal.jsx` update | 12h |
| Implement linked RED creation flow | `conditioningService.js`, UI | 8h |
| Thread state management | Service + UI | 6h |
| Update Firestore rules | `firestore.rules` | 2h |
| Tests for thread logic | New test file | 6h |

**Total: ~56 hours**

### Phase 4: Pattern Tracking (Week 5-6)
**Priority: MEDIUM** — Advanced feature

| Task | Files | Est. Hours |
|------|-------|------------|
| Create pattern metrics data model | Firestore schema | 2h |
| Create `redPatternService.js` | New service file | 6h |
| Update `assessREDRep()` to update patterns | `functions/index.js` | 4h |
| Implement pattern detection logic | Service/Function | 6h |
| Integrate pattern feedback into coaching | `functions/index.js` | 4h |
| Tests for pattern triggers | New test file | 4h |

**Total: ~26 hours**

### Phase 5: Analytics Dashboard (Week 6-7)
**Priority: MEDIUM** — Admin visibility

| Task | Files | Est. Hours |
|------|-------|------------|
| Design analytics data model | Firestore schema | 2h |
| Create analytics aggregation function | `functions/index.js` | 6h |
| Build admin analytics view | New admin component | 8h |
| Add user-level analytics (personal stats) | Service + UI | 6h |
| Tests for analytics | Test file | 3h |

**Total: ~25 hours**

### Phase 6: QA & Refinement (Week 7-8)
**Priority: HIGH** — Quality assurance

| Task | Est. Hours |
|------|------------|
| End-to-end testing of full RED → CTL flow | 8h |
| Test all 7 scenarios from spec | 6h |
| Test defensive scenarios | 4h |
| Performance testing (pattern tracking) | 4h |
| Bug fixes and refinements | 12h |
| Documentation updates | 4h |

**Total: ~38 hours**

---

## Grand Total Estimate

| Phase | Hours |
|-------|-------|
| Phase 1: Evidence Capture | 16h |
| Phase 2: Evaluation Logic | 28h |
| Phase 3: CTL Overhaul | 56h |
| Phase 4: Pattern Tracking | 26h |
| Phase 5: Analytics | 25h |
| Phase 6: QA | 38h |
| **TOTAL** | **~189 hours** |

**At 6-8 productive hours/day: 4-5 weeks of focused development**

---

## Part 6: Discussion Points

### 6.1 Questions for Boss

1. **Priority Order:** Is CTL overhaul more important than Pattern Tracking? Can we ship Phase 1-3 first and add Pattern Tracking in V2?

2. **Analytics Scope:** Is the admin analytics dashboard blocking, or can it be Phase 2? Personal user stats seem more immediately useful.

3. **Request Confirmation Capture:** The spec requires detecting whether the leader confirmed when the direct proposed the solution. This is complex — should we:
   - A) Try to infer from text analysis (current approach)
   - B) Add explicit UI question: "Did they propose the solution, or did you?"
   - C) Both — UI question + AI validation?

4. **CTL Scheduling:** Spec says ~10 days. Should this be:
   - Fixed 10 days?
   - Configurable per user/cohort?
   - Based on situation (high-stakes = sooner)?

5. **Pattern Tracking Window:** Spec says "last 10 reps" — does this mean:
   - Last 10 RED reps specifically?
   - Last 10 reps of any type?
   - Rolling time window vs. count window?

6. **Thread Persistence:** If behavior changes and thread closes, should we keep thread history indefinitely for analytics, or archive/purge after X months?

### 6.2 Known Technical Risks

1. **AI Consistency:** Request confirmation detection relies heavily on AI interpretation. May need few-shot examples in prompt.

2. **Pattern Calculation Performance:** Checking patterns on every RED submission could be slow. May need:
   - Background function (slightly delayed feedback)
   - Cached pattern metrics

3. **CTL Scheduling at Scale:** If many users have many open threads, scheduled functions could get expensive. May need batching.

4. **Backward Compatibility:** Existing RED reps don't have new fields. Need migration strategy or graceful handling.

### 6.3 Simplification Options (if time-constrained)

| Cut | Impact | Savings |
|-----|--------|---------|
| Pattern Tracking | Lose 4/10 rep pattern detection | ~26h |
| Admin Analytics | Lose aggregate metrics (keep personal) | ~15h |
| Thread continuation (auto-create new RED) | Leader must manually create linked RED | ~8h |
| Advanced anti-gaming | Keep basic, lose over-polished detection | ~4h |

**Minimal Viable Update: Phases 1-3 = ~100 hours (~2.5 weeks)**

---

## Part 7: Files to Modify

### Frontend

| File | Changes |
|------|---------|
| `src/components/conditioning/constants.js` | Add scenario options, update internal gap, self-assessment, reflection |
| `src/components/conditioning/PlannedRepForm.jsx` | Add scenario selection step |
| `src/components/conditioning/InMomentRepForm.jsx` | Add scenario selection |
| `src/components/conditioning/EvidenceCaptureWizard.jsx` | Update evidence capture per spec |
| `src/components/conditioning/LoopClosureModal.jsx` | Major overhaul → CTL capture flow |
| `src/components/conditioning/QualityAssessmentCard.jsx` | Update to show new fields |
| `src/services/conditioningService.js` | Update rep data model |
| `src/services/feedbackThreadService.js` | NEW — thread management |
| `src/services/redPatternService.js` | NEW — pattern tracking |
| `firestore.rules` | New collections/rules |

### Backend

| File | Changes |
|------|---------|
| `functions/index.js` | Major updates to assessREDRep, assessCTLRep, new scheduling functions |

### New Files Needed

| File | Purpose |
|------|---------|
| `src/services/feedbackThreadService.js` | Thread CRUD, state management |
| `src/services/redPatternService.js` | Pattern calculation, storage |
| `src/components/admin/RedAnalyticsDashboard.jsx` | Analytics view |
| `src/components/conditioning/ThreadStatusBadge.jsx` | Show thread state on rep cards |
| `src/components/conditioning/CTLCaptureWizard.jsx` | New CTL capture flow (possibly) |

---

## Appendix A: Test Scenarios from Spec

These scenarios should all be tested before go-live:

### Standard Scenarios
1. ✅ "Looks decent, but soft request" → FAIL (Request ≤1)
2. ✅ "Challenge request trap - no confirmation" → PASS but coached
3. ✅ "Challenge request trap - with confirmation" → PASS clean
4. ✅ "Mixed feedback dilution" → PASS with Behavior capped at 2
5. ✅ "Borderline behavior (interpretive leak)" → FAIL (Behavior ≤1)
6. ✅ "Indirect delivery avoidance" → FAIL (Direct Delivery = 0)
7. ✅ "High intensity, under-scaled" → PASS with coaching

### Defensive Scenarios
1. ✅ "Leader backs off under pushback" → FAIL (Request ≤1)
2. ✅ "Leader stays calm but stays vague" → FAIL (Request ≤1)
3. ✅ "Leader overcorrects (gets sharp)" → PASS with coaching
4. ✅ "Leader recovers and confirms standard" → PASS clean
5. ✅ "Leader retreats into collaboration" → FAIL (Request ≤1)
6. ✅ "Leader gets pulled into debate" → PASS with coaching

---

## Next Steps

1. **Review this plan together** — identify any misunderstandings
2. **Prioritize phases** — what ships first?
3. **Answer discussion questions** — especially request confirmation UX
4. **Create feature branch** — `feature/red-v2-update`
5. **Start Phase 1** — evidence capture is foundation

---

*Plan created: March 26, 2026*
*Author: Claude (GitHub Copilot)*
*Status: Ready for discussion*
