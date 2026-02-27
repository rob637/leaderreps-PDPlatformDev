# Conditioning Layer Redesign — Workplan (Feb 27, 2026)

## Source: Ryan Yeoman Design Notes (Feb 2026)

---

## Executive Summary

This workplan restructures the entire Conditioning Layer (Real Reps system) based on Ryan's design specifications. The changes affect:

1. **Rep Type Taxonomy** — New categories (Lead the Work, Lead the Team, Lead Yourself) with 10 canonical rep types
2. **Two Commitment Flows** — Planned RR (5 steps) vs In-the-Moment RR (4 steps)  
3. **Contextual Situations** — Per-rep-type suggested situations with conditional logic
4. **Behavior Focus Reminders** — Rep-type-specific reminders at commitment and on active rep cards
5. **Simplified Prep UX** — 60-120 second alignment check with 2 prompts max
6. **Close RR Flow** — Renamed from "Debrief" to "Close RR" to avoid confusion

---

## Part A: New Rep Type Taxonomy

### Current State
- 16 rep types across 4 categories (Reinforcing/Redirecting, Ambiguous/Emotional, Standards/Authority, Escalation/Decisions)
- Categories use abstract groupings, not action-oriented names
- Difficulty labels: "Level 1", "Level 2", "Level 3" (or "Easier", "Medium", "Hard")

### Target State
- **10 rep types** across **3 categories**
- Categories are action-oriented: Lead the Work, Lead the Team, Lead Yourself
- **No difficulty labels** shown to users (remove "Easier", "Medium", "Hard")
- All Prep is optional by default

### New Category Structure

```
LEAD THE WORK (4 types)
├── Set Clear Expectations
│   └── "Define the work and what success looks like"
├── Make a Clean Handoff  
│   └── "Explicitly transfer ownership of the work"
├── Follow-up on the Work
│   └── "Check progress, remove obstacles, and reinforce ownership"
└── Hold the Line
    └── "Support development without taking back ownership"

LEAD THE TEAM (4 types)
├── Deliver Reinforcing Feedback
│   └── "Build the noticing muscle and normalize feedback"
├── Deliver Redirecting Feedback
│   └── "Address performance gaps early, clearly, and directly"
├── Close the Loop
│   └── "Verify that feedback actually drives behavior change"
└── Handle Pushback
    └── "Stay composed and adapt when met with pushback"

LEAD YOURSELF (2 types)
├── Lead with Vulnerability
│   └── "Model vulnerability and build psychological safety"
└── Be Curious
    └── "Lead with a coach-like mindset and create space"
```

### Implementation Tasks

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| A1 | Create new `REP_CATEGORIES_V2` with 3 categories | `repTaxonomy.js` | 1h |
| A2 | Create new `REP_TYPES_V2` with 10 canonical types | `repTaxonomy.js` | 2h |
| A3 | Add `SUGGESTED_SITUATIONS` mapping per rep type | `repTaxonomy.js` | 1h |
| A4 | Add `BEHAVIOR_FOCUS_REMINDERS` mapping per rep type | `repTaxonomy.js` | 30m |
| A5 | Add `ACTIVE_REP_REMINDERS` mapping (5 types only) | `repTaxonomy.js` | 30m |
| A6 | Create migration mapping from old 16 types to new 10 | `repTaxonomy.js` | 1h |
| A7 | Update `RepTypePicker.jsx` for new 3-category drill-down | `RepTypePicker.jsx` | 2h |
| A8 | Remove difficulty labels from picker UI | `RepTypePicker.jsx` | 30m |

---

## Part B: Two Commitment Flows

### Overview

| Flow | When Used | Steps |
|------|-----------|-------|
| **Planned RR** | Committing to a rep you'll do in the future | 5: Type → Who → Situation → When → Commit |
| **In-the-Moment RR** | Logging a rep you just completed | 4: Type → Who → Situation → When (+ log) |

### B.1: Planned RR Flow (5 Steps)

#### Screen 1 — Type
- **Header:** "Commit to your Real Rep"
- **Prompt:** "Select the type of Real Rep" (bold)
- **UI:** Category drill-down (Lead the Work → 4 types, etc.)
- No difficulty labels shown
- Note: All Prep is optional

#### Screen 2 — Who
- **Prompt:** "Who will you have this rep with?"
- **UI:** Text input (current implementation is good)

#### Screen 3 — Situation/Context (NEW)
- **Prompt:** "Which best describes this situation?"
- **Conditional logic:**
  - Show 2 pre-populated situation options (per rep type) + "Something else"
  - If user selects a suggested situation → free-form text is optional
  - If user selects "Something else" → free-form text is **required**
- **Free-form label:** "One sentence of context (optional but encouraged)" or "(required)" for "Something else"

#### Screen 4 — When
- **Same as current:** Default to end of week checkbox, or set custom date/time
- **Good as-is**

#### Screen 5 — Behavior Focus + Commit
- **Conditional display:** Show behavior focus reminder based on selected rep type
- **CTA:** "Commit" button (or "Cancel")
- **Behavior focus reminders** (see data table below)

### B.2: In-the-Moment RR Flow (4 Steps)

#### Screen 1 — Type
- **Header:** "Log a Real Rep"
- **Prompt:** "What Real Rep did you just run?"
- **UI:** Same category drill-down
- **Additionally:** Show behavior focus reminder above "Next" CTA (confirms they did it right)

#### Screen 2 — Who
- **Prompt:** "Who was involved?"
- **Allow:** "Solo rep" option (for Lead Yourself types)

#### Screen 3 — Situation
- **Prompt:** "Which best describes what was happening?"
- **Same conditional logic** as Planned flow

#### Screen 4 — When + Log
- **Header:** "When did this rep happen?"
- **Default:** "Just now" (pre-selected)
- **Allow:** Backdating (select specific day/time)
- **CTA:** "Log In-the-moment RR"

### Implementation Tasks

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| B1 | Create `PlannedRepForm.jsx` — 5-step flow | `conditioning/` | 4h |
| B2 | Create `InMomentRepForm.jsx` — 4-step flow | `conditioning/` | 3h |
| B3 | Create `SituationStep.jsx` — reusable situation picker | `conditioning/` | 2h |
| B4 | Create `BehaviorFocusReminder.jsx` — inline reminder component | `conditioning/` | 1h |
| B5 | Update `ConditioningCard.jsx` to support both flows | `conditioning/` | 1h |
| B6 | Update `ConditioningWidget.jsx` entry points | `widgets/` | 1h |
| B7 | Deprecate/refactor `CommitRepForm.jsx` | `conditioning/` | 1h |

---

## Part C: Contextual Data Tables

### C.1: Suggested Situations (Per Rep Type)

```javascript
export const SUGGESTED_SITUATIONS = {
  'deliver_reinforcing_feedback': [
    'A behavior I want to see repeated',
    'Someone did something right that I don\'t want to overlook'
  ],
  'set_clear_expectations': [
    'Work or outcomes need to be defined before starting',
    'I\'ve seen confusion or missed expectations like this before'
  ],
  'make_clean_handoff': [
    'Responsibility or work is being assigned or delegated',
    'Ownership needs to be explicitly transferred'
  ],
  'follow_up_work': [
    'Checking progress on previously assigned work',
    'A task or project is in motion and needs accountability'
  ],
  'lead_with_vulnerability': [
    'I need to own a miss, mistake, or impact',
    'I need to name uncertainty or a learning edge first'
  ],
  'deliver_redirecting_feedback': [
    'A behavior or result missed the standard',
    'A pattern is starting to show up'
  ],
  'close_the_loop': [
    'Checking whether prior feedback changed behavior',
    'Reinforcing or re-addressing a previously named issue'
  ],
  'handle_pushback': [
    'I expect defensiveness or resistance to feedback',
    'Feedback has already met disagreement or emotion'
  ],
  'hold_the_line': [
    'Someone is struggling after an assignment or feedback',
    'I\'m tempted to fix or take over to move things forward'
  ],
  'be_curious': [
    'Something feels off, but I don\'t know why yet',
    'Early signals before jumping to conclusions'
  ]
};
```

### C.2: Behavior Focus Reminders (Per Rep Type)

```javascript
export const BEHAVIOR_FOCUS_REMINDERS = {
  'deliver_reinforcing_feedback': 
    'Notice the specific behavior and name why it matters so it gets repeated.',
  'set_clear_expectations': 
    'Be explicit about what success looks like and confirm shared understanding.',
  'make_clean_handoff': 
    'Transfer ownership clearly and confirm it is accepted.',
  'follow_up_work': 
    'Check progress against expectations without fixing or taking back ownership.',
  'lead_with_vulnerability': 
    'Go first and model vulnerability by owning a miss, asking for help, etc.',
  'deliver_redirecting_feedback': 
    'Name the behavior gap, its impact, and the expected change directly.',
  'close_the_loop': 
    'Verify that behavior actually changed and respond intentionally.',
  'handle_pushback': 
    'Acknowledge the reaction and hold the standard without arguing or retreating.',
  'hold_the_line': 
    'Support thinking while keeping ownership with the other person.',
  'be_curious': 
    'Seek to understand what\'s really happening without correcting or fixing.'
};
```

### C.3: Active Rep Card Reminders (5 Types Only)

These show on the active rep card after commitment:

```javascript
export const ACTIVE_REP_REMINDERS = {
  'set_clear_expectations': 
    'You\'ll need to define what "good" or "done" looks like when submitting evidence.',
  'make_clean_handoff': 
    'This rep presumes expectations were clearly set. Ownership must be explicitly accepted to pass.',
  'follow_up_work': 
    'This rep should reference a prior handoff. Fixing or re-owning the work will fail this rep.',
  'deliver_redirecting_feedback': 
    'All CLEAR elements are required for this rep to pass.',
  'close_the_loop': 
    'This should link to a prior feedback rep. Closure must be based on observed behavior.'
};
```

### Implementation Tasks

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| C1 | Add `SUGGESTED_SITUATIONS` constant | `repTaxonomy.js` | 30m |
| C2 | Add `BEHAVIOR_FOCUS_REMINDERS` constant | `repTaxonomy.js` | 30m |
| C3 | Add `ACTIVE_REP_REMINDERS` constant | `repTaxonomy.js` | 30m |
| C4 | Create `SituationPicker.jsx` component | `conditioning/` | 2h |
| C5 | Update `ConditioningCard.jsx` to show active reminders | `conditioning/` | 1h |

---

## Part D: Prep UX Redesign

### Design Principles
- Prep is a **60-120 second alignment check** — NOT rehearsal or scripting
- Maximum **2 prompts** per rep type, always behavior-focused
- **Hard character limits** to prevent over-thinking
- Must end with a single forward action: "Proceed to Rep" or "I'm ready"
- **No save-and-linger** — no looping back to edit

### Prep Prompts by Rep Type

```javascript
export const PREP_PROMPTS = {
  'deliver_reinforcing_feedback': [
    { prompt: 'What behavior are you reinforcing?', maxChars: 100 },
    { prompt: 'Why does it matter?', maxChars: 100 }
  ],
  'deliver_redirecting_feedback': [
    { prompt: 'What behavior are you naming?', maxChars: 100 },
    { prompt: 'What standard are you holding?', maxChars: 100 }
  ],
  'handle_pushback': [
    { prompt: 'What reaction might show up?', maxChars: 100 },
    { prompt: 'What boundary must you hold?', maxChars: 100 }
  ],
  'hold_the_line': [
    { prompt: 'What are you most tempted to fix?', maxChars: 100 },
    { prompt: 'What question will you ask instead?', maxChars: 100 }
  ],
  // ... other types with similar 2-prompt structure
};
```

### Prep Exit Rule
- Single CTA: "Proceed to Rep" or "I'm ready"
- No back button to edit
- If abandoned, that's a signal (not a UX failure)

### Implementation Tasks

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| D1 | Add `PREP_PROMPTS` constant | `repTaxonomy.js` | 1h |
| D2 | Create new `QuickPrepModal.jsx` — 2-prompt design | `conditioning/` | 2h |
| D3 | Deprecate/refactor `RepPrepModal.jsx` and `HighRiskPrepModal.jsx` | `conditioning/` | 1h |
| D4 | Add character limit enforcement to prep inputs | `QuickPrepModal.jsx` | 30m |
| D5 | Remove edit/back functionality from prep | `QuickPrepModal.jsx` | 30m |

---

## Part E: Close RR Flow (Renamed from Debrief)

### Naming Change
- **"Debrief"** → **"Close RR"** (avoids confusion with other uses of "debrief")
- **"RepUp Review"** → needs new name (TBD, possibly "Coach Review" or "AI Feedback")

### Open Questions (From Ryan's Notes)
1. Should "Capture Evidence" and "Debrief/Reflection" be separate steps or combined?
2. What constitutes "pass" vs "fail" — evidence only? Reflection quality?
3. Should the step label be centered or under the step number?
4. What is "Level 1 Evidence (Same day)"? Need clarification
5. Do we need to tie evidence to a specific "moment"? Different for Planned vs In-the-Moment?

### Current Debrief Steps (For Reference)
1. When — When did the rep happen?
2. Context — Tie to a moment
3. What did you say — Capture the conversation
4. How did they respond — Their reaction
5. Commitment — What was committed to?

### Recommended Close RR Steps (Proposed)

```
Step 1: When (if not In-the-Moment)
  - When did this rep happen?
  - Default: Just now / Today
  - Allow: Specific date/time

Step 2: Capture Evidence
  - What did you say? (required)
  - How did they respond? (required)
  - What was the outcome? (optional)

Step 3: Quick Reflection
  - What went well?
  - What would you do differently?

Step 4: Close
  - CTA: "Close RR"
  - System marks rep as complete
```

### Implementation Tasks

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| E1 | Rename "Debrief" → "Close RR" throughout UI | Multiple | 1h |
| E2 | Rename modal/button labels | `EvidenceCaptureModal`, `ConditioningCard` | 30m |
| E3 | Update step labels from "Debrief" to "Close" | `StructuredEvidenceModal` | 30m |
| E4 | Consolidate evidence capture into `CloseRRModal.jsx` | `conditioning/` | 3h |
| E5 | Remove/simplify Loop Closure modal (merge into Close RR) | `LoopClosureModal.jsx` | 1h |

---

## Part F: Data Model Updates

### New Rep Document Structure

```javascript
// /users/{uid}/conditioning_reps/{repId}
{
  // === Core Fields ===
  repType: 'deliver_reinforcing_feedback',  // One of 10 canonical types
  category: 'lead_the_team',                // Parent category
  commitmentType: 'planned' | 'in_moment',  // NEW: Which flow was used
  
  // === Who ===
  person: 'Jane Smith',
  allowSoloRep: false,  // true for Lead Yourself types
  
  // === Situation (NEW) ===
  situation: {
    selected: 'A behavior I want to see repeated',  // Or 'something_else'
    customContext: 'Noticed Sarah handled the escalation well',
    isRequired: false  // true if "Something else" selected
  },
  
  // === When ===
  scheduledFor: Timestamp,     // For Planned RR
  occurredAt: Timestamp,       // For In-the-Moment RR
  deadline: Timestamp,         // End of week default
  weekId: '2026-W09',
  
  // === Behavior Focus ===
  behaviorFocus: 'Notice the specific behavior and name why it matters...',
  activeReminder: 'You\'ll need to define what "good" looks like...',  // If applicable
  
  // === Prep (Simplified) ===
  prep: {
    prompt1: { question: 'What behavior...?', answer: 'Her calm tone...' },
    prompt2: { question: 'Why does it matter?', answer: 'Sets example...' },
    completedAt: Timestamp,
    durationSeconds: 45
  },
  
  // === Status ===
  status: 'committed' | 'prepared' | 'executed' | 'closed' | 'missed' | 'canceled',
  
  // === Close RR (Evidence + Reflection) ===
  closeRR: {
    whatYouSaid: 'I told Sarah...',
    howTheyResponded: 'She appreciated hearing...',
    outcome: 'She\'s going to continue...',
    reflection: {
      whatWentWell: '...',
      whatDifferent: '...'
    },
    closedAt: Timestamp
  },
  
  // === Metadata ===
  cohortId: 'foundation-cohort-1',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Migration Strategy
- Keep existing rep data intact
- Add new fields alongside existing ones
- Map old `repType` values to new taxonomy via `LEGACY_REP_TYPE_MAPPING`
- Gradually phase out old field names

### Implementation Tasks

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| F1 | Update `conditioningService.js` data model | `services/` | 2h |
| F2 | Add `situation` field support | `conditioningService.js` | 1h |
| F3 | Add `commitmentType` field | `conditioningService.js` | 30m |
| F4 | Add `closeRR` field structure | `conditioningService.js` | 1h |
| F5 | Create migration script for existing reps | `scripts/migrations/` | 2h |
| F6 | Update Firestore queries for new fields | `conditioningService.js` | 1h |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** New data structures and taxonomy without breaking existing functionality

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | A1-A4: New taxonomy constants | 4h |
| 2 | A5-A6: Reminders + migration mapping | 2h |
| 2 | F1-F4: Service data model updates | 4h |
| 3 | C1-C3: Add situation/reminder constants | 1.5h |
| 3 | Test existing flows still work | 2h |

**Phase 1 Total:** ~13.5 hours

### Phase 2: Commit Flows (Week 2)
**Goal:** Build new Planned and In-the-Moment commit flows

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | A7-A8: Update RepTypePicker | 2.5h |
| 1 | B3: SituationStep component | 2h |
| 2 | B4: BehaviorFocusReminder component | 1h |
| 2 | B1: PlannedRepForm (5 steps) | 4h |
| 3 | B2: InMomentRepForm (4 steps) | 3h |
| 3 | B5-B6: Update widget/card entry points | 2h |

**Phase 2 Total:** ~14.5 hours

### Phase 3: Prep & Close RR (Week 3)
**Goal:** Simplified Prep and renamed Close RR flow

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | D1-D2: Prep prompts + QuickPrepModal | 3h |
| 1 | D3-D5: Deprecate old prep modals | 2h |
| 2 | E1-E3: Rename Debrief → Close RR | 2h |
| 2 | E4: CloseRRModal.jsx | 3h |
| 3 | E5: Merge LoopClosure into Close RR | 1h |
| 3 | C4-C5: SituationPicker + active reminders | 3h |

**Phase 3 Total:** ~14 hours

### Phase 4: Polish & Migration (Week 4)
**Goal:** Clean up, migrate data, comprehensive testing

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | F5-F6: Migration script + queries | 3h |
| 1 | B7: Deprecate old CommitRepForm | 1h |
| 2 | Update conditioning tutorial widget | 2h |
| 2 | End-to-end testing of all flows | 4h |
| 3 | Bug fixes and edge cases | 4h |

**Phase 4 Total:** ~14 hours

---

## Total Estimated Effort

| Phase | Hours |
|-------|-------|
| Phase 1: Foundation | 13.5h |
| Phase 2: Commit Flows | 14.5h |
| Phase 3: Prep & Close RR | 14h |
| Phase 4: Polish & Migration | 14h |
| **Total** | **~56 hours** |

---

## Open Questions for Ryan

1. **Close RR vs Evidence Capture**: Are these two separate user-facing steps, or should evidence capture BE the Close RR process?

2. **Pass/Fail Criteria**: Is pass/fail determined solely by evidence quality, or does reflection matter? Who decides — the system, AI coach, or human trainer?

3. **"Level 1 Evidence (Same day)"**: Need clarification on what this means in the current UI.

4. **RepUp Review Rename**: What should we call the AI-generated feedback review? Options: "Coach Review", "AI Feedback", "Rep Analysis"?

5. **Planned vs In-the-Moment tracking**: Do we differentiate these in analytics/progression differently?

6. **Solo Reps**: Which rep types allow solo reps? Just Lead Yourself (2 types), or are there others?

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/services/repTaxonomyV2.js` | New 10-type taxonomy + constants |
| `src/components/conditioning/PlannedRepForm.jsx` | 5-step planned rep flow |
| `src/components/conditioning/InMomentRepForm.jsx` | 4-step logging flow |
| `src/components/conditioning/SituationStep.jsx` | Reusable situation picker |
| `src/components/conditioning/BehaviorFocusReminder.jsx` | Inline reminder display |
| `src/components/conditioning/QuickPrepModal.jsx` | Simplified 2-prompt prep |
| `src/components/conditioning/CloseRRModal.jsx` | Combined evidence + close flow |
| `scripts/migrations/migrate-rep-types-v2.cjs` | Data migration script |

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/repTaxonomy.js` | Add V2 exports, mapping |
| `src/services/conditioningService.js` | New data model fields |
| `src/components/conditioning/RepTypePicker.jsx` | 3-category drill-down |
| `src/components/conditioning/ConditioningCard.jsx` | Active reminders, dual flow entry |
| `src/components/widgets/ConditioningWidget.jsx` | Entry point updates |
| `src/components/widgets/ConditioningTutorialWidget.jsx` | Updated terminology |

## Files to Deprecate

| File | Replacement |
|------|-------------|
| `CommitRepForm.jsx` | `PlannedRepForm.jsx` + `InMomentRepForm.jsx` |
| `RepPrepModal.jsx` | `QuickPrepModal.jsx` |
| `HighRiskPrepModal.jsx` | `QuickPrepModal.jsx` |
| `EvidenceCaptureModal.jsx` | `CloseRRModal.jsx` |
| `StructuredEvidenceModal.jsx` | `CloseRRModal.jsx` |
| `LoopClosureModal.jsx` | Merge into `CloseRRModal.jsx` |

---

## Success Criteria

1. [ ] User can commit to a Planned RR in 5 clear steps
2. [ ] User can log an In-the-Moment RR in 4 steps
3. [ ] Situation picker shows 2 suggested options + "Something else" per rep type
4. [ ] Behavior focus reminder displays at commitment and on active card
5. [ ] Prep is max 2 prompts with character limits
6. [ ] "Close RR" replaces "Debrief" terminology throughout
7. [ ] All 10 rep types display correctly in 3 categories
8. [ ] No difficulty labels visible to users
9. [ ] Existing reps continue working via migration mapping
10. [ ] Tutorial reflects new terminology and flow
