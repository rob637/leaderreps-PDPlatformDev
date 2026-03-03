# Conditioning Loop Redesign — Workplan (March 3, 2026)

## Source: Boss's Updated Process Notes (March 3, 2026)

---

## Implementation Status: ✅ PHASE 1 COMPLETE

**Completed March 3, 2026:**
- ✅ Admin ConditioningConfig extended with 4 new tabs (Prep, Debrief, Linked, Complete)
- ✅ Firestore rules added for new collections
- ✅ repTypeService extended with methods for prep prompts, debrief standards, linked reps, complete config
- ✅ RepTypeProvider loads and exposes all new conditioning loop data
- ✅ Copy updates in PlannedRepForm and InMomentRepForm aligned with boss spec
- ✅ System Debrief Service created (debriefService.js) with scoring logic
- ✅ Linked RR creation logic added to conditioningService.js

**New Files Created:**
- `src/services/debriefService.js` — System debrief with coaching-focused scoring

**Files Modified:**
- `src/components/admin/ConditioningConfig.jsx` — 4 new tabs
- `src/services/repTypeService.js` — 8 new methods for conditioning loop data
- `src/providers/RepTypeProvider.jsx` — Loads and exposes new data + helpers
- `src/services/conditioningService.js` — Linked RR creation functions
- `src/components/conditioning/PlannedRepForm.jsx` — Updated copy
- `src/components/conditioning/InMomentRepForm.jsx` — Updated copy
- `firestore.rules` — Rules for 4 new collections

---

## Executive Summary

This workplan aligns the Conditioning Layer with the **canonical Conditioning Loop**:

```
Commit → Prep (optional) → Execute → Capture Evidence → Debrief (system) → Complete
```

### Current State Analysis

The existing implementation has **most of the building blocks** already built:
- ✅ **Commit Flow** — `PlannedRepForm.jsx` (5 steps) and `InMomentRepForm.jsx` (4 steps) exist
- ✅ **Rep Type Taxonomy** — V2 taxonomy with Lead the Work/Team/Yourself (10 types) exists
- ✅ **Prep** — `QuickPrepModalV2.jsx` exists (60-120 second, 2 prompts max)
- ✅ **Evidence Capture** — `EvidenceCaptureWizard.jsx` exists
- ⚠️ **Debrief (System)** — Partially implemented, needs system scoring/assessment logic
- ⚠️ **Complete the Loop** — `LoopClosureModal.jsx` exists but needs refinement for RR linking

### Key Changes Required

| Area | Current State | Target State |
|------|---------------|--------------|
| **Loop Name** | Various names used | Canonical: "Conditioning Loop" |
| **Commit Flow** | Already built (2 flows) | Minor copy tweaks only |
| **Rep Categories** | "Lead the Work" (3), "Lead the Team" (4), "Lead Yourself" (2) | Update count display to match spec (4/4/2) |
| **Prep UX** | `QuickPrepModalV2` (good) | Already correct — 2 prompts max |
| **Execute** | "Mark as done" | Add simple "Mark as Executed" action |
| **Evidence Capture** | Wizard exists | Already correct |
| **Debrief (System)** | No automated scoring | Add rubric-based system assessment |
| **Complete** | `LoopClosureModal` | Rename/improve + add linked RR creation |

---

## Part 1: Gap Analysis by Loop Phase

### 1.1 COMMIT PHASE ✅

**Status: ALREADY BUILT — Minor copy changes only**

The commit flow is already implemented with:
- `CommitFlowSelector.jsx` — Entry point (Plan vs In-the-Moment)
- `PlannedRepForm.jsx` — 5-step flow (Type → Who → Situation → When → Commit)
- `InMomentRepForm.jsx` — 4-step flow (Type → Who → Situation → When)

#### Copy Changes Needed

| Screen | Current Copy | Target Copy |
|--------|--------------|-------------|
| Screen 1 header | "Commit to a Real Rep" | ✅ Already correct |
| Screen 1 question | "How would you like to log this rep?" | ✅ Already correct |
| Planned option | "Plan a Real Rep" | ✅ Already correct |
| In-Moment option | "Log In-the-Moment" | "Log an In-the-Moment Real Rep" |
| Planned Step 1 header | "Commit to your Real Rep" | ✅ Already correct |
| In-Moment Step 1 header | "Log a Real Rep" | "Commit to your Real Rep" |
| Planned Step 2 | "Who will you have this rep with?" | "Who will you complete this rep with?" |
| In-Moment Step 2 | "Who was involved?" | "Who did you complete this rep with?" |
| In-Moment When options | Various | "Just now", "Earlier today", "Yesterday", or specific |
| Planned CTA | "Commit" | "Commit to the RR" |
| In-Moment CTA | "Log In-the-moment RR" | ✅ Already correct |

#### Rep Type Display Update

The boss spec shows:
- Lead the Work (3) → Should show **(4)**: Set Clear Expectations, Make a Clean Handoff, Follow-up on the Work, Hold the Line
- Lead the Team (4) → **✅ Correct**: Deliver Reinforcing Feedback, Deliver Redirecting Feedback, Handle Pushback, Close the Loop
- Lead Yourself (2) → **✅ Correct**: Lead with Vulnerability, Be Curious

Wait — boss spec says "Lead the Work (3)" but taxonomy has 4. Need to ask or use taxonomy's 4.

**Action Items:**
| # | Task | File | Effort |
|---|------|------|--------|
| C1 | Update In-Moment option description | `CommitFlowSelector.jsx` | 5m |
| C2 | Update "Who" prompt copy for both flows | `PlannedRepForm.jsx`, `InMomentRepForm.jsx` | 10m |
| C3 | Add "Just now/Earlier today/Yesterday" options to In-Moment When step | `InMomentRepForm.jsx` | 30m |
| C4 | Update CTA text on Commit step | `PlannedRepForm.jsx` | 5m |

---

### 1.2 PREP PHASE (Optional) ✅

**Status: ALREADY BUILT — Matches spec exactly**

`QuickPrepModalV2.jsx` implements the 60-120 second alignment check with:
- Max 2 prompts per rep type ✅
- Hard character limits (100 chars) ✅
- Rep-type-specific prompts ✅
- "I'm Ready" / "Proceed to Rep" exit action ✅

#### Prep Exit Rule

Current: "I'm Ready" button → transitions to "prepared" status
Target: Same — no changes needed

**Current Prep Prompts by RR Type:**

| RR Type | Prompt 1 | Prompt 2 |
|---------|----------|----------|
| Reinforcing Feedback | What behavior are you reinforcing? | Why does it matter? |
| Redirecting Feedback | What behavior are you naming? | What standard are you holding? |
| Handle Pushback | What reaction might show up? | What boundary must you hold? |
| Hold the Line | What are you most tempted to fix? | What question will you ask instead? |
| Set Clear Expectations | What does "done" or "good" look like? | How will you confirm shared understanding? |

✅ **These match the boss's spec exactly — no changes needed!**

---

### 1.3 EXECUTE PHASE ⚠️

**Status: NEEDS SIMPLE UPDATE**

Currently: Execute is conflated with "Capture Evidence" in one action
Target: Execute should be a simple "mark as done" step with no logic

**Required Changes:**
- Add explicit "I did it" / "Mark as Executed" action that transitions status to `executed` 
- Evidence capture should be a **separate** step that happens after

**Action Items:**
| # | Task | File | Effort |
|---|------|------|--------|
| E1 | Add "Mark as Executed" button to rep card (separate from evidence) | `Conditioning.jsx` | 30m |
| E2 | Update status transition: committed/prepared → executed | `conditioningService.js` | 15m |

---

### 1.4 CAPTURE EVIDENCE PHASE ⚠️

**Status: ALREADY BUILT — Consider flow separation**

`EvidenceCaptureWizard.jsx` provides:
- Multi-screen evidence capture
- "What did you say/do?" (observable behavior)
- "How did they respond?"
- Camera Test reminder ✅

**Possible Improvement:**
- Ensure evidence capture is separate from the "Execute" action
- Evidence capture should open after "I did it" is clicked

**Action Items:**
| # | Task | File | Effort |
|---|------|------|--------|
| EV1 | Ensure "Capture Evidence" button appears after execute, not combined | `Conditioning.jsx` | 30m |
| EV2 | Review evidence prompts match RR-specific needs | `EvidenceCaptureWizard.jsx` | 30m |

---

### 1.5 DEBRIEF PHASE (System) 🔴

**Status: NEEDS SIGNIFICANT WORK — System assessment/scoring**

**Current State:**
- No automated system scoring exists
- `CloseRRModal.jsx` asks user for reflection, but no system assessment
- `QualityAssessmentCard.jsx` exists but is basic quality feedback

**Target State (Per Boss Spec):**
- System runs "quick debrief" and scores evidence vs. rubric/standard
- Debrief results should **surface questions** rather than tell them what to do
- Use Camera Test, behavior focus, and pass criteria
- If something is "wrong," prompt leader to think differently — don't correct

**Debrief Philosophy:**
```
❌ DON'T: "You should have stated something like, 'Three separate times during the meeting you rolled your eyes...'"
✅ DO: "Does your evidence pass the Camera Test?" or "How might you make your evidence more focused on observable behavior?"
```

**Action Items:**
| # | Task | File | Effort |
|---|------|------|--------|
| D1 | Create `SystemDebriefService.js` — scoring logic per RR rubric | `services/` | 3h |
| D2 | Create `SystemDebriefCard.jsx` — displays system assessment | `conditioning/` | 2h |
| D3 | Define pass criteria per RR type in `repTaxonomy.js` | `repTaxonomy.js` | 1h |
| D4 | Add coaching prompts (questions, not answers) | `repTaxonomy.js` | 1h |
| D5 | Integrate system debrief into post-evidence flow | `Conditioning.jsx` | 1h |

**System Debrief Standards (To Define):**

| RR Type | Pass Criteria | Coaching Prompt if Fails |
|---------|--------------|--------------------------|
| Reinforcing Feedback | Specific behavior named, impact stated | "Does your evidence name the specific behavior observed?" |
| Redirecting Feedback | CLEAR elements present, behavior observable | "Does your evidence pass the Camera Test?" |
| Handle Pushback | Emotion acknowledged, boundary maintained | "How did you acknowledge their reaction while holding the boundary?" |
| Close the Loop | Links to prior feedback, behavior change verified | "What behavior change did you observe?" |
| Hold the Line | Did not take back ownership | "Did you keep ownership with the other person?" |
| etc. | ... | ... |

---

### 1.6 COMPLETE PHASE (Loop Closure) ⚠️

**Status: NEEDS REFINEMENT — Add linked RR creation**

**Current State:**
- `LoopClosureModal.jsx` exists — asks outcome questions
- Has outcome options (behavior changed, partial change, needs another rep, etc.)
- Has "recommend follow-up" flag

**Target State:**
- Rename to avoid confusion (not "Close the Loop" RR type vs modal)
- When Redirecting Feedback is completed → auto-create a "Close the Loop" RR
- Other RRs may have similar linked follow-up logic

**Linked RR Logic:**

| Completed RR | Auto-Create Follow-Up |
|--------------|----------------------|
| Deliver Redirecting Feedback | Close the Loop |
| Set Clear Expectations | Follow-up on the Work |
| Make a Clean Handoff | Follow-up on the Work |
| Handle Pushback | (none — self-contained) |

**Action Items:**
| # | Task | File | Effort |
|---|------|------|--------|
| CL1 | Rename "LoopClosureModal" → "CompleteRepModal" | File rename | 15m |
| CL2 | Add linked RR creation logic to completeRep flow | `conditioningService.js` | 1h |
| CL3 | Create "Complete the Loop" step questions (lock in behavior) | `CompleteRepModal.jsx` | 30m |
| CL4 | Update UI to show linked follow-up RRs | `Conditioning.jsx` | 30m |

---

## Part 2: State Machine Update

### Current Status Flow
```
committed → prepared → executed → debriefed → loop_closed
                                   ↓
                                 missed
```

### Target Status Flow
```
committed → (prepared) → executed → evidence_captured → debriefed → completed
                                                        ↓
                                                      (system scoring happens here)
```

### Status Updates Needed

| Status | Current | New/Changed |
|--------|---------|-------------|
| `committed` | Rep created | ✅ Same |
| `prepared` | Prep completed (optional) | ✅ Same |
| `executed` | Rep marked as "done" | ⚠️ Add explicit transition |
| `evidence_captured` | N/A | 🆕 Add new status |
| `debriefed` | User reflection done | ⚠️ Now means system assessment done |
| `completed` | Alias for debriefed | ⚠️ Rename `loop_closed` → `completed` |

---

## Part 3: Implementation Priorities

### Phase 1: Quick Wins (Day 1) — 2-3 hours
- [ ] C1-C4: Copy updates for Commit flow
- [ ] E1-E2: Add explicit "Execute" step separation
- [ ] CL1: Rename LoopClosureModal

### Phase 2: System Debrief (Day 2-3) — 8 hours
- [ ] D1: Create SystemDebriefService.js
- [ ] D2: Create SystemDebriefCard.jsx  
- [ ] D3-D4: Define pass criteria and coaching prompts
- [ ] D5: Integrate into flow

### Phase 3: Loop Completion (Day 4) — 2-3 hours
- [ ] CL2-CL4: Linked RR creation and UI updates
- [ ] EV1-EV2: Evidence flow refinements

### Phase 4: Testing & Polish (Day 5) — 2-3 hours
- [ ] End-to-end flow testing
- [ ] Edge case handling
- [ ] Copy polish

---

## Part 4: Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/services/systemDebriefService.js` | System assessment/scoring logic |
| `src/components/conditioning/SystemDebriefCard.jsx` | Display system assessment results |
| `src/components/conditioning/CompleteRepModal.jsx` | Renamed from LoopClosureModal |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/conditioning/CommitFlowSelector.jsx` | Copy updates |
| `src/components/conditioning/PlannedRepForm.jsx` | Copy updates, CTA text |
| `src/components/conditioning/InMomentRepForm.jsx` | Copy updates, When options |
| `src/components/screens/Conditioning.jsx` | Execute/Evidence flow separation |
| `src/services/conditioningService.js` | Status transitions, linked RR creation |
| `src/services/repTaxonomy.js` | Pass criteria, coaching prompts |

---

## Part 5: Open Questions for Boss

1. **Rep Type Count Display:** The spec shows "Lead the Work (3)" but we have 4 types. Keep 4 or drop one?

2. **Make a Clean Handoff:** Is this still in the taxonomy, or was it intentionally dropped?

3. **System Debrief:** Should the system debrief run automatically after evidence capture, or require user action?

4. **Linked RRs:** When an In-the-Moment rep is logged, should we still auto-create linked follow-up RRs?

5. **Complete Step Questions:** What specific questions should we ask to "lock in future behavior"?

---

## Summary

The current implementation is **~70% complete**. Main gaps:

1. **System Debrief** — New feature needed (rubric-based scoring with coaching prompts)
2. **Execute/Evidence Separation** — Minor flow restructuring  
3. **Linked RR Creation** — Add auto-creation logic for follow-up reps
4. **Copy Updates** — Minor text changes throughout

Estimated total effort: **15-18 hours** over 5 days.
