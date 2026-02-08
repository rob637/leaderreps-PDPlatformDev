# Conditioning Layer V1 – UX Implementation Plan

> **Date:** February 8, 2026  
> **Status:** PLANNING (Not yet implemented)  
> **Source:** UX Feedback organized for design + boss directive  
> **Related:** [CONDITIONING-LAYER-ENHANCEMENT-PLAN.md](./CONDITIONING-LAYER-ENHANCEMENT-PLAN.md)

---

## Executive Summary

This plan addresses 12 UX feedback items organized for V1 implementation. The goal is to **simplify, not expand** – making Conditioning Real Rep the obvious, clickable, state-consistent primary action.

**Key Boss Directive:** Keep Conditioning on BOTH Dashboard AND RepUp entry points.

**V1 Wins By:**
- Making Conditioning Real Rep the clear primary behavior
- Eliminating "where do I start?" friction
- Fixing state confusion (prep / scheduled / done)
- Reducing debrief friction

---

## Table of Contents

1. [V1 Scope & Dashboard Simplification](#1-v1-scope--dashboard-simplification)
2. [Conditioning Card Visual & Affordance](#2-conditioning-card-visual--affordance)
3. [Entry Point Consistency](#3-entry-point-consistency)
4. [Commit Flow Improvements](#4-commit-flow-improvements)
5. [Form Validation & Feedback](#5-form-validation--feedback)
6. [Active Rep State & Progress Logic](#6-active-rep-state--progress-logic)
7. [Status Language & Progress Tracker](#7-status-language--progress-tracker)
8. [Debrief Experience](#8-debrief-experience)
9. [Loop Closure & Follow-Up](#9-loop-closure--follow-up)
10. [Completed Rep Visibility](#10-completed-rep-visibility)
11. [Locker & Conditioning History](#11-locker--conditioning-history)
12. [RepUp vs Conditioning Relationship](#12-repup-vs-conditioning-relationship)
13. [State Diagram](#state-diagram)
14. [Implementation Phases](#implementation-phases)
15. [File Impact Matrix](#file-impact-matrix)

---

## 1. V1 Scope & Dashboard Simplification

### Current State
Dashboard shows multiple widgets during Foundation:
- AM Bookend, PM Bookend, Scorecard, PM Reflection, Conditioning, This Week's Actions

### Target State (V1 Foundation Dashboard)
**SHOW ONLY:**
1. **Conditioning Real Rep** (top of dashboard)
   - Primary focus and anchor
   - Explicitly labeled: "Conditioning Real Rep"
2. **This Week's Actions**
   - Includes catch-up for this week
   - Action list that guides execution

**HIDE ENTIRELY for V1:**
- AM Bookend
- PM Bookend
- Scorecard
- PM Reflection

### Design Intent
- Reduce cognitive load
- Make conditioning rep the clear primary behavior
- Eliminate "where do I start?" friction

### Implementation Notes
```
Files to modify:
- src/components/screens/Dashboard.jsx
  - Update DASHBOARD_FEATURES array to control visibility
  - Add V1 mode flag or feature toggle
  
- Use existing dashboard visibility logic (checkVisibility function)
  to conditionally hide bookend widgets
```

### Decision Required
- [ ] **Feature flag approach:** Add `conditioning-v1-mode` feature flag?
- [ ] **Phase-based:** Tie to Foundation phase only?
- [ ] **Permanent:** Remove bookends from V1 entirely?

---

## 2. Conditioning Card Visual & Affordance

### Current Issues
1. Card looks different from others (missing left-side colored border)
2. Green/yellow bar looks like notification, not a button
3. Unclear that bar itself is clickable

### Target State

**Visual Consistency:**
- Add left-side colored border (like other cards)
- Even neutral gray border helps with depth/consistency

**CTA Clarity:**
- Treat the bar like a button (similar to Rep-Up)
- Suggested copy:
  - Yellow state: "Commit to your Real Rep"
  - Green state: "Commit to another Real Rep"
- Consider: Plus icon + clear action language
- Entire bar must be clickable

### Implementation Notes
```
Files to modify:
- src/components/conditioning/ConditioningCard.jsx
  - Add left border styling (border-l-4) for all states
  - Update bar to look like CTA button
  - Add Plus icon for commit action
  - Update copy based on state
  
- src/components/widgets/ConditioningWidget.jsx
  - Same changes for widget version
```

### Styling Reference
```jsx
// Current (inconsistent)
className={`cursor-pointer hover:shadow-md transition-shadow ${
  hasIssues ? 'border-l-4 border-l-amber-500' : 
  requiredRepCompleted ? 'border-l-4 border-l-green-500' : ''
}`}

// Target (always has border)
className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
  hasIssues ? 'border-l-amber-500' : 
  requiredRepCompleted ? 'border-l-green-500' : 'border-l-gray-300'
}`}
```

---

## 3. Entry Point Consistency

### Current State
- Clicking Conditioning on dashboard → **pop-up** (slide-in panel)
- Clicking Rep-Up → loads **within main frame**
- Two different UX patterns for same action

### Target State
Conditioning should behave like Rep-Up:
- Same navigation pattern
- Same screen treatment
- No modal/popup inconsistency

### Design Principle
**One action → One experience → One place**

### Implementation Options

**Option A: Remove popup, navigate to screen**
```
- Remove ConditioningPanel (slide-in) from ConditioningWidget
- Use navigate('conditioning') consistently
- Both Dashboard card AND RepUp route to Conditioning screen
```

**Option B: Keep popup but make it consistent**
```
- RepUp also uses popup/overlay pattern
- Both entry points use same overlay component
```

**Recommended: Option A** (simpler, more consistent)

### Files to Modify
```
- src/components/widgets/ConditioningWidget.jsx
  - Remove createPortal slide-in panel
  - Use navigate('conditioning') on click
  
- src/components/conditioning/ConditioningCard.jsx
  - Already uses onNavigate?.('conditioning')
  - No changes needed
  
- src/components/rep/RepUpOverlay.jsx
  - Update Conditioning entry to match
```

---

## 4. Commit Flow Improvements

### What Works Well
- Clear "type of rep" selection
- Reduces decision fatigue
- Good scaffolding

### Issues to Fix

**4.1 Rep Type Ordering**
Currently: Alphabetical/random order
Target: Ordered from easiest → hardest (intentional progression)

**4.2 Collapse After Selection (Critical)**
Current: After selecting rep, full list stays expanded
- Required fields pushed far down (bad on mobile)

Target: Once rep is selected:
1. Collapse the rep list
2. Show only selected rep (with "Change" option)
3. Bring required fields immediately into view

### Implementation Notes
```
Files to modify:
- src/services/repTaxonomy.js
  - Add sortOrder field to rep types
  - Or order by difficulty: level_1 → level_2 → level_3
  
- src/components/conditioning/RepTypePicker.jsx
  - Add collapsed state after selection
  - Show SelectedRepSummary with expand option
  - Auto-scroll to next section after selection
  
- src/components/conditioning/CommitRepForm.jsx
  - Handle collapse state
  - Scroll required fields into view
```

### Visual Flow
```
Before selection:
┌──────────────────────────────────┐
│ Choose rep type:                 │
│ ┌────────────────────────────┐   │
│ │ Category 1 (4 types)    >  │   │
│ └────────────────────────────┘   │
│ ┌────────────────────────────┐   │
│ │ Category 2 (3 types)    >  │   │
│ └────────────────────────────┘   │
│ ...                              │
└──────────────────────────────────┘

After selection:
┌──────────────────────────────────┐
│ Selected: Public Praise    [✎]  │
│ Category: Reinforcing            │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ Who is this rep with? *          │  ← Visible immediately
│ [                              ] │
└──────────────────────────────────┘
```

---

## 5. Form Validation & Feedback

### Current Issue
- Clicking "Commit" with missing required fields does nothing
- No error, no guidance, no feedback

### Target Behavior
1. Clear validation on submit
2. Highlight missing field(s)
3. Inline message or toast
4. Auto-scroll to missing field if needed

### Design Goal
**Never leave user wondering "did it break?"**

### Implementation Notes
```
Files to modify:
- src/components/conditioning/CommitRepForm.jsx
  - Add validation state
  - Add error display for each required field
  - Implement scroll-to-error
  - Add submit attempt tracking
  
Example validation:
const [errors, setErrors] = useState({});
const [submitAttempted, setSubmitAttempted] = useState(false);

const validate = () => {
  const newErrors = {};
  if (!person.trim()) newErrors.person = 'Required';
  if (!selectedRepType) newErrors.repType = 'Required';
  // ... other required fields
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = () => {
  setSubmitAttempted(true);
  if (!validate()) {
    // Scroll to first error
    const firstError = document.querySelector('.field-error');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  // Proceed with commit
};
```

---

## 6. Active Rep State & Progress Logic

### Current Issues
1. Some prep fields appear locked (unclear why)
2. After completing prep, UI still says "Prep required"
3. Progress does not advance after prep completion
4. User forced to manually advance to "Scheduled"

### Root Cause Analysis
```
Current state flow issue:
committed → (prep done) → ??? UI still shows "Prep required"

Expected:
committed → (prep done) → status changes to 'prepared' automatically
```

### Target Behavior
- Clear state transitions
- Prep complete → status automatically becomes "prepared"
- No contradictory signals (lock icons + "required" copy)
- Progress tracker reflects actual state

### Implementation Notes
```
Files to analyze:
- src/services/conditioningService.js
  - Check how prep completion triggers state change
  - Verify STATE_TRANSITIONS are being followed
  
- src/components/conditioning/RepProgressionTracker.jsx
  - Verify currentState is reading from rep correctly
  
- src/components/conditioning/RepPrepModal.jsx
  - Check onComplete callback updates rep status
  
- src/components/screens/Conditioning.jsx
  - Verify activeReps refresh after state change
```

### State Transition Fix
```javascript
// When prep is saved, should call:
conditioningService.updateRepState(db, userId, repId, {
  status: REP_STATUS.PREPARED,
  preparedAt: serverTimestamp()
});
```

---

## 7. Status Language & Progress Tracker

### Current Problem
- "Done" used twice (ambiguous)
- Unclear what each state means

### Target Language Model

| Current | New Label | Meaning |
|---------|-----------|---------|
| committed | Planned | Rep is set |
| prepared | Prepared | Prep complete |
| scheduled | Scheduled | Time/meeting set |
| executed | Delivered | Conversation happened |
| debriefed | Debriefed | Reflection complete |
| (missing) | Loop Closed | Follow-up confirmed |

### Implementation Notes
```
Files to modify:
- src/components/conditioning/RepProgressionTracker.jsx
  - Update STATE_CONFIG labels
  
Current:
executed: {
  label: 'Executed',
  shortLabel: 'Done',  // ← Ambiguous
  ...
},
debriefed: {
  label: 'Complete',
  shortLabel: 'Done',  // ← Ambiguous
  ...
}

Target:
executed: {
  label: 'Delivered',
  shortLabel: 'Delivered',
  description: 'Conversation happened, awaiting debrief'
},
debriefed: {
  label: 'Debriefed',
  shortLabel: 'Debriefed',
  description: 'Reflection complete, awaiting loop closure'
}
```

---

## 8. Debrief Experience

### What Works Well
- Step-by-step UX
- Clear flow
- Button-based responses
- Overall feel is excellent

### Major Friction Point
**"What did you say or do?" input**
- Bullet-by-bullet + "Add" is clunky
- Too slow, too much friction

### Target Solutions

**Option A: Single free-form text box** (Quick win)
```
Replace:
┌─────────────────────────────┐
│ • [              ] [Add]    │
│ • [              ] [Add]    │
└─────────────────────────────┘

With:
┌─────────────────────────────┐
│ What did you say or do?     │
│ [                         ] │
│ [          TEXTAREA       ] │
│ [                         ] │
└─────────────────────────────┘
```

**Option B: Voice input with transcription** (Ideal, more complex)
- Tap to record
- Auto-transcription
- Manual edit if needed

### Design Principle
**Debrief should be fast while memory is fresh**

### Implementation Notes
```
Files to modify:
- src/components/conditioning/EvidenceCaptureModal.jsx
  - Replace bullet-point input with textarea
  - Update EVIDENCE_FIELDS.what_said from 'bullets' to 'textarea'
  
- Future: Add voice recording component
  - Already has placeholder VoiceInput component
  - Needs MediaRecorder API implementation
  - Needs transcription service integration
```

---

## 9. Loop Closure & Follow-Up (NEW STEP)

### Current Gap
- After debrief, rep is marked "complete"
- But the loop is NOT actually closed yet
- No follow-up mechanism

### New Concept: Follow-Up Step
Questions to answer:
- Did behavior change?
- Did commitment hold?
- Was agreement honored?

### UX Requirements
1. Ability to set reminder
2. Add follow-up action to next week's action list
3. Explicitly "Close the Loop"
4. This is a separate state, not just "done"

### Implementation Notes
```
New state to add:
- 'follow_up_pending' or 'awaiting_follow_up'
- 'loop_closed' (terminal state)

Files to modify:
- src/services/conditioningService.js
  - Add new status values
  - Update STATE_TRANSITIONS
  - Add follow-up scheduling functions
  
- src/components/conditioning/RepProgressionTracker.jsx
  - Add new state nodes
  
- NEW: src/components/conditioning/LoopClosureModal.jsx
  - Capture follow-up outcome
  - Options: "Loop closed - behavior changed", "Needs another conversation"
  
- Integration with This Week's Actions
  - Follow-up items should appear in weekly action list
```

### State Machine Update
```javascript
export const REP_STATUS = {
  // ... existing
  FOLLOW_UP_PENDING: 'follow_up_pending',
  LOOP_CLOSED: 'loop_closed'
};

export const STATE_TRANSITIONS = {
  // ... existing
  debriefed: ['follow_up_pending', 'loop_closed'],
  follow_up_pending: ['loop_closed'],
  loop_closed: []  // Terminal
};
```

---

## 10. Completed Rep Visibility

### Current Issue
- Completed rep shows "0 of 4 dimensions completed"
- Cannot click
- Cannot inspect
- No feedback visibility

### Target Behavior (Future-Ready)
Clicking completed rep shows:
- CLEAR breakdown
- Rubric scoring (even if not finalized)
- Evidence & reflection

### Implementation Notes
```
Files to modify:
- src/components/screens/Conditioning.jsx
  - Make completed rep cards clickable
  - Open detail view modal
  
- NEW: src/components/conditioning/RepDetailModal.jsx
  - Read-only view of completed rep
  - Shows all captured data
  - Rubric dimensions (placeholder scores OK)
```

---

## 11. Locker & Conditioning History

### Current State
- Conditioning history visible in Locker
- Cannot drill into entries

### Target State
Click any historical rep to see:
- What was said/done
- Response
- Reflection
- Outcome
- Follow-up status

### Why This Matters
- Pattern recognition
- Learning over time
- Real leadership growth artifact

### Implementation Notes
```
Files to modify:
- src/components/widgets/ConditioningHistoryWidget.jsx
  - Make entries clickable
  - Open RepDetailModal on click
  
- Reuse RepDetailModal from item #10
```

---

## 12. RepUp vs Conditioning Relationship

### Observation
- RepUp button often just routes to Conditioning
- Feels redundant / overlapping

### Boss Directive
**Keep Conditioning on BOTH Dashboard AND RepUp**

### Design Clarification Needed
- Is Conditioning a subtype of Rep-Up?
- Or is Rep-Up the universal entry point?

### Recommended Approach
```
RepUp Overlay:
├── Coaching (AI chat)
└── Reps (Conditioning) ← Routes to same Conditioning experience

Dashboard:
└── Conditioning Widget ← Routes to same Conditioning experience

Both paths → Same destination → Same experience
```

### Implementation Notes
```
Files to maintain:
- src/components/rep/RepUpOverlay.jsx
  - Keep "Reps" option that routes to Conditioning
  
- src/components/widgets/ConditioningWidget.jsx
  - Keep as dashboard entry point
  
- src/components/conditioning/ConditioningCard.jsx
  - Keep as alternative entry point
  
Key principle: 
Different entry points can exist, but they must lead to 
identical experience once inside Conditioning flow.
```

---

## State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                 CONDITIONING REAL REP LIFECYCLE                  │
└─────────────────────────────────────────────────────────────────┘

0. IDLE / NO ACTIVE REP
   ├─ CTA: "Commit to your Real Rep" (yellow)
   └─ CTA: "Commit to another Real Rep" (green, if history)
   │
   ▼ [Click CTA]

1. COMMIT (Select & Define)
   ├─ Rep type selection (ordered: easy → hard)
   ├─ Collapse after selection
   ├─ Required fields visible
   └─ Validation: all required fields
   │
   ▼ [Commit button]

2. ACTIVE – PLANNED ────────────────────┐
   ├─ Status: "Planned"                  │
   ├─ Shows: rep type, due window        │
   ├─ CTA: Complete Prep (optional)      │
   ├─ CTA: Skip Prep (allowed)           │
   │                                     │
   ▼ [Prep complete]                     │ [Skip]
                                         │
3. ACTIVE – PREPARED                     │
   ├─ Status: "Prepared"                 │
   ├─ Prep indicator complete            │
   ├─ CTA: Schedule Rep                  │
   │                                     │
   ▼ [Scheduled] ◄───────────────────────┘

4. ACTIVE – SCHEDULED
   ├─ Status: "Scheduled"
   ├─ Date/time visible
   ├─ CTA: Mark as Delivered
   │
   ▼ [Clicked "Delivered"]

5. DELIVERED (Conversation Executed)
   ├─ Status: "Delivered"
   ├─ CTA: Add Debrief
   └─ Subtext: "Debrief while it's fresh"
   │
   ▼ [Enter Debrief]

6. DEBRIEFING (In Progress)
   ├─ Step-by-step flow
   ├─ Free-form text OR voice
   ├─ CLEAR-aligned prompts
   │
   ▼ [Submit Debrief]

7. DEBRIEF COMPLETE (Loop Still Open)
   ├─ Status: "Debriefed"
   ├─ CTA: Set Follow-Up
   ├─ Option: Add reminder
   ├─ Option: Push to next week's actions
   │
   ▼ [Follow-up scheduled]

8. AWAITING FOLLOW-UP (Loop Open)
   ├─ Status: "Follow-Up Pending"
   ├─ Appears in action list
   ├─ Appears in follow-up reminders
   │
   ▼ [Confirm outcome]

9. LOOP CLOSED (Fully Complete)
   ├─ Status: "Closed"
   ├─ Rubric summary visible (clickable)
   ├─ Dimension scores populated
   └─ CLEAR evidence accessible
   │
   ▼ [Moves to history]

10. HISTORICAL / LOCKER VIEW
    ├─ Click to review full rep
    ├─ Rep definition, evidence, outcome
    └─ Rubric scores
```

### Global Rules
1. Only ONE active rep at a time (unless explicitly changed later)
2. Same UX path from Dashboard or RepUp
3. Status language is unambiguous (Delivered ≠ Closed)
4. No silent failures – every action gives feedback

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Simplify dashboard, fix visual consistency

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Hide bookend widgets for V1 | High | Low | Dashboard.jsx |
| Add left border to Conditioning card | High | Low | ConditioningCard.jsx |
| Update CTA copy and styling | High | Medium | ConditioningCard.jsx, ConditioningWidget.jsx |
| Remove popup, use navigation | Medium | Medium | ConditioningWidget.jsx |

### Phase 2: Commit Flow (Week 2)
**Goal:** Streamline rep selection and form

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Order rep types by difficulty | High | Low | repTaxonomy.js |
| Collapse after rep selection | High | Medium | RepTypePicker.jsx, CommitRepForm.jsx |
| Add form validation | High | Medium | CommitRepForm.jsx |
| Scroll to errors | Medium | Low | CommitRepForm.jsx |

### Phase 3: State Logic (Week 3)
**Goal:** Fix state transitions and progress tracking

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Fix prep → prepared transition | Critical | Medium | conditioningService.js, RepPrepModal.jsx |
| Update status language | High | Low | RepProgressionTracker.jsx |
| Remove contradictory UI signals | High | Medium | Conditioning.jsx |

### Phase 4: Debrief (Week 4)
**Goal:** Reduce friction, speed up capture

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Replace bullet input with textarea | High | Low | EvidenceCaptureModal.jsx |
| Voice input (placeholder) | Low | High | EvidenceCaptureModal.jsx |

### Phase 5: Loop Closure (Week 5-6)
**Goal:** Add follow-up accountability

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Add new states to service | High | Medium | conditioningService.js |
| Create LoopClosureModal | High | High | NEW: LoopClosureModal.jsx |
| Integrate with actions | Medium | High | ThisWeeksActionsWidget, conditioningService |
| Update progress tracker | Medium | Medium | RepProgressionTracker.jsx |

### Phase 6: History & Visibility (Week 7)
**Goal:** Enable drilling into completed reps

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Create RepDetailModal | Medium | Medium | NEW: RepDetailModal.jsx |
| Make completed reps clickable | Medium | Low | Conditioning.jsx |
| Make history clickable | Medium | Low | ConditioningHistoryWidget.jsx |

---

## File Impact Matrix

| File | Changes | Phase |
|------|---------|-------|
| `src/components/screens/Dashboard.jsx` | Hide bookend widgets | 1 |
| `src/components/conditioning/ConditioningCard.jsx` | Visual updates, CTA styling | 1 |
| `src/components/widgets/ConditioningWidget.jsx` | Remove popup, visual updates | 1 |
| `src/services/repTaxonomy.js` | Add sortOrder to types | 2 |
| `src/components/conditioning/RepTypePicker.jsx` | Collapse behavior | 2 |
| `src/components/conditioning/CommitRepForm.jsx` | Validation, scroll-to-error | 2 |
| `src/services/conditioningService.js` | Fix state transitions, add states | 3, 5 |
| `src/components/conditioning/RepPrepModal.jsx` | Fix status update on complete | 3 |
| `src/components/conditioning/RepProgressionTracker.jsx` | Update labels, add states | 3, 5 |
| `src/components/screens/Conditioning.jsx` | Fix UI signals, click handlers | 3, 6 |
| `src/components/conditioning/EvidenceCaptureModal.jsx` | Simplify input | 4 |
| **NEW:** `src/components/conditioning/LoopClosureModal.jsx` | Follow-up capture | 5 |
| **NEW:** `src/components/conditioning/RepDetailModal.jsx` | Read-only rep view | 6 |
| `src/components/widgets/ConditioningHistoryWidget.jsx` | Make entries clickable | 6 |

---

## Summary: High-Level Design Takeaway

### V1 Wins By Simplifying, Not Expanding

**Conditioning Real Rep must be:**
- ✅ Obvious
- ✅ Clickable
- ✅ State-consistent

### Biggest UX Risks Right Now
1. State confusion (prep / scheduled / done)
2. Inconsistent navigation patterns
3. Too much friction during debrief

### Biggest Upside
> This already feels powerful. With tighter state logic and fewer steps, this becomes sticky fast.

---

## Open Questions for Design Review

1. **Dashboard Widget Hiding:** Feature flag vs phase-based vs permanent?
2. **Navigation Pattern:** Which screens should use full navigation vs overlay?
3. **Loop Closure Timeline:** How many days should follow-up be scheduled out?
4. **Voice Input:** Build in-house or integrate 3rd party transcription?
5. **Rubric Scores:** Placeholder values for V1, or hide entirely until ready?

---

## Next Steps

1. [ ] Review this plan with Rob
2. [ ] Confirm Phase 1 scope
3. [ ] Create GitHub issues for each task
4. [ ] Begin implementation (Phase 1 first)
