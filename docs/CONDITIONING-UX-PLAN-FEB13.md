# Conditioning Layer UX Plan — Feb 13, 2026

## Source: Rob/Ryan Meeting Notes (Feb 13, 2026)

This plan consolidates issues from the Feb 13 discussion and extends the existing [CONDITIONING-WORKPLAN-FEB12.md](CONDITIONING-WORKPLAN-FEB12.md).

---

## Executive Summary

### Key Issues from Feb 13 Meeting

| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 1 | **Locker icon** suggests feature is locked | High | 15 min |
| 2 | **"Commit to this Rep" button** visible before selection | High | 30 min |
| 3 | **Form inconsistency** — different colors, layouts, patterns | High | Already in workplan |
| 4 | **Rep creation flow** — guide users based on existing reps | Medium | 1 hr |
| 5 | **Color consistency** — different greens for buttons | High | Already in workplan |
| 6 | **Microphone not working** — only captures ~5 chars | Critical | 1 hr |
| 7 | **Rep gating/progression** — users can attempt hardest reps first | High | 3-4 hrs |
| 8 | **AI coaching philosophy** — AI gives prescriptive answers, should ask questions | High | 4-6 hrs |
| 9 | **Admin nudges** — not being received | Medium | 1-2 hrs |

---

## Issue 1: Locker Icon Change

### Problem
The current "Locker" navigation item uses a `Lock` icon from Lucide, which suggests the feature is locked/inaccessible rather than a storage space.

### Current Code
**File:** `src/components/layout/ArenaSidebar.jsx` (line 85)
```jsx
{ id: 'locker', label: 'Your Locker', icon: Lock },
```

**File:** `src/components/layout/MobileBottomNav.jsx`
```jsx
{ id: 'locker', label: 'Locker', icon: Lock, ... }
```

### Solution
Replace `Lock` with a more appropriate icon. Options:
1. **`Briefcase`** — Professional storage, holds your work items
2. **`Archive`** — Storage/history connotation
3. **`FolderOpen`** — Personal files/storage
4. **`Vault`** — Premium storage feel (but might still suggest "locked")
5. **`Package`** — Stored items

**Recommended:** `Archive` or `FolderOpen` for clarity

### Implementation
```jsx
// ArenaSidebar.jsx - change import
import { Archive } from 'lucide-react';
// Change line 85
{ id: 'locker', label: 'Your Locker', icon: Archive },

// MobileBottomNav.jsx - same change
import { Archive } from 'lucide-react';
{ id: 'locker', label: 'Locker', icon: Archive, ... }
```

### Effort
15 minutes

---

## Issue 2: Hide "Commit to this Rep" Button Until Selection Made

### Problem
The "Commit to this Rep" button is visible in the initial category selection screen (see screenshot 1), even though clicking it shows an error. Ryan's feedback: "button should not be surfaced until a selection is made."

### Current Behavior
**File:** `src/components/conditioning/CommitRepForm.jsx`
- Button is always rendered in the modal footer
- Validation error shows when clicked without selection
- Button is disabled but still visible

### Screenshot Reference
- Image 1: Shows "Commit to This Rep" button at bottom of category selection
- Image 2: Shows subtypes after category selection — button makes sense here
- Image 3: Shows full form — button appropriate here

### Solution
Only show the button when `repTypeId` is selected (after drilling into a category AND selecting a specific rep type).

### Implementation
In `CommitRepForm.jsx`, the footer currently shows the button unconditionally. Modify to:

```jsx
// In the modal footer section (around line 380-400)
// Only render the button when a rep type is selected
{selectedRepType ? (
  <Button
    onClick={handleSubmit}
    disabled={isLoading}
    className="w-full bg-corporate-teal hover:bg-corporate-teal-dark text-white py-3"
  >
    {isLoading ? 'Committing...' : 'Commit to This Rep'}
  </Button>
) : (
  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
    Select a rep type to continue
  </p>
)}
```

### Effort
30 minutes

---

## Issue 3: Form Consistency

### Status
**Already covered in [CONDITIONING-WORKPLAN-FEB12.md](CONDITIONING-WORKPLAN-FEB12.md)**

Key points from workplan:
- `ConditioningModal.jsx` — unified wrapper (✅ already built)
- `VoiceTextarea.jsx` — unified input component (✅ already built)
- Migration of all 6 modals to use shared components
- Consistent navy gradient headers, teal buttons

See Sprint 1 & 2 in the existing workplan.

---

## Issue 4: Rep Creation Flow Based on Existing Reps

### Problem
Ryan's feedback: "If a user has no reps, clicking create a commit takes them into creating a rep. If they already have some reps, the system needs to take them to a screen that allows them to choose between finishing an old rep or creating a new one."

### Current Behavior
- Dashboard widget always shows same CTA regardless of state
- Clicking "Commit to Rep" always opens the commit form directly
- No intermediate decision screen for users with existing reps

### Desired Flow

```
User clicks "Commit to Rep" from Dashboard
   │
   ├─► IF no active reps:
   │       → Open CommitRepForm immediately
   │
   └─► IF has active/incomplete reps:
           → Show decision modal:
             "You have 1 rep in progress (Feedback with Jordan)"
             [Continue with this rep] ← Primary
             [Start a new rep] ← Secondary
```

### Implementation

1. **Create `RepGateModal.jsx`** — Decision modal when user has active reps
2. **Modify `ConditioningCard.jsx`** — Check for active reps before opening commit form
3. **Modify `Conditioning.jsx`** — Same logic for the main screen

**File:** `src/components/conditioning/RepGateModal.jsx` (NEW)
```jsx
// Simple decision modal
// Shows active rep summary with "Continue" button
// "Start new rep anyway" link below
```

**Modify:** `src/components/conditioning/ConditioningCard.jsx`
```jsx
const handleCommitClick = async () => {
  const activeReps = await conditioningService.getActiveReps(db, userId, cohortId);
  if (activeReps.length > 0) {
    // Open gate modal
    setShowGateModal(true);
  } else {
    // Open commit form directly
    onNavigate?.('conditioning', { action: 'commit' });
  }
};
```

### Note on One Active Rep Per Week
Ryan confirmed: "Keeping it to the week is acceptable" — current limit of 1 active rep per week is OK. But users should be guided to complete their current rep before starting a new one.

### Effort
1 hour

---

## Issue 5: Color Consistency

### Status
**Already covered in [CONDITIONING-WORKPLAN-FEB12.md](CONDITIONING-WORKPLAN-FEB12.md)**

The workplan identifies:
- "Mark Executed" button uses `bg-teal-600` 
- "Add Debrief" button uses `bg-green-600`
- Different greens across the app

Solution from workplan: Standardize all primary action buttons to `bg-corporate-teal`.

### Current Button Colors in Conditioning.jsx

| Button | Current Color | Should Be |
|--------|---------------|-----------|
| Mark Executed | `bg-teal-600` | `bg-corporate-teal` |
| Complete Prep First | `bg-indigo-600` | `bg-corporate-navy` |
| Add Debrief to Complete | `bg-green-600` | `bg-corporate-teal` |
| Close the Loop | `bg-emerald-600` | `bg-corporate-teal` |

**Key Decision:** All positive action buttons should use `bg-corporate-teal` to train users to look for one consistent color.

---

## Issue 6: Microphone Not Working (Critical)

### Problem
Ryan reported: "Microphone feature is not working fully, only captures very short duration of audio before stopping." Rob observed "it seemed to only capture five characters."

### Current Code
**File:** `src/components/conditioning/VoiceInputButton.jsx`

```javascript
const VoiceInputButton = ({ 
  onTranscription, 
  onPartialTranscription,
  disabled = false,
  size = 'default',
  continuous = false,
  autoStop = true,
  autoStopDelay = 1500 // ms of silence before auto-stop
}) => {
```

### Likely Issues

1. **`continuous = false` by default** — Recognition stops after first utterance
2. **`autoStopDelay = 1500`** — Very short silence threshold
3. **Recognition ending prematurely** — Browser SpeechRecognition has quirks

### Investigation Steps

1. Check Chrome DevTools console for SpeechRecognition errors
2. Test on different browsers (Safari has different behavior)
3. Check if `recognition.continuous` is being set correctly
4. Verify `onresult` handler is accumulating transcripts properly

### Potential Fix

```javascript
// VoiceInputButton.jsx - line ~45
const recognition = new SpeechRecognition();
recognition.continuous = true;  // Keep listening
recognition.interimResults = true;
recognition.lang = 'en-US';
recognition.maxAlternatives = 1;

// Increase auto-stop delay
autoStopDelay = 3000 // 3 seconds of silence
```

Also verify in `onresult` handler that transcripts are being accumulated properly:
```javascript
recognition.onresult = (event) => {
  let finalTranscript = '';
  let interimTranscript = '';
  
  // Process ALL results, not just from resultIndex
  for (let i = 0; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript;
    } else {
      interimTranscript += transcript;
    }
  }
  // ... rest of handler
};
```

### Effort
1 hour (investigation + fix + testing)

---

## Issue 7: Rep Gating/Progression System

### Problem
Ryan: "The foundations program is moving toward a progression-based model rather than a strictly time-based one, where a user must complete easier tasks before accessing harder ones." 

Currently, users can attempt any rep type at any difficulty level — there's no gating.

### What Ryan Will Provide
- Rules for gating the reps
- 10 real reps with specific sequence/unlocks
- Rubrics and materials for assessing reps

### Required Implementation

1. **Rep Unlock Rules** — Define which reps are available based on user's history
2. **Progression Tracking** — Track which rep types/difficulties user has completed
3. **UI Gating** — Show locked reps with visual indicator and unlock requirements
4. **Service Layer** — `canAccessRepType(userId, repTypeId, difficulty)` function

### Data Model Extension

**File:** `src/services/repTaxonomy.js`
```javascript
export const REP_PROGRESSION_RULES = {
  // Start with these unlocked
  tier_1: ['reinforce_public', 'redirect_prepared'],
  
  // Unlocks after completing 2 tier_1 reps
  tier_2: ['reinforce_private', 'followup', 'whats_going_on'],
  tier_2_unlock: { tier_1_completed: 2 },
  
  // Unlocks after completing 3 tier_2 reps
  tier_3: ['redirect_moment', 'performance_concern', 'hold_line'],
  tier_3_unlock: { tier_2_completed: 3 },
  
  // And so on...
};

export const DIFFICULTY_PROGRESSION = {
  // Level 1 always unlocked
  level_1: { unlocked: true },
  // Level 2 requires 1 completed rep at level 1
  level_2: { level_1_completed: 1 },
  // Level 3 requires 1 completed rep at level 2
  level_3: { level_2_completed: 1 }
};
```

**File:** `src/services/conditioningService.js` — New functions
```javascript
/**
 * Check if user can access a specific rep type at a specific difficulty
 */
export const canAccessRepType = async (db, userId, repTypeId, difficulty) => {
  // Get user's completed reps
  const completedReps = await getCompletedReps(db, userId);
  
  // Check progression rules
  // ... logic based on REP_PROGRESSION_RULES
  
  return { allowed: true/false, reason: 'Complete X to unlock' };
};

/**
 * Get unlocked rep types for user
 */
export const getUnlockedRepTypes = async (db, userId) => {
  // Returns list of { repTypeId, maxDifficulty } user can access
};
```

### UI Changes

**File:** `src/components/conditioning/RepTypePicker.jsx`
- Add lock icons to locked rep types
- Show unlock requirements on hover/tap
- Gray out locked items
- Show progress toward unlocking (e.g., "1/2 reps to unlock")

**File:** `src/components/conditioning/CommitRepForm.jsx`
- Pass progression context to `RepTypePicker`
- Show encouraging message for unlocking progression

### Effort
3-4 hours (pending Ryan's rules document)

**Blocked:** Waiting for Ryan to provide the 10 real reps and unlock sequence

---

## Issue 8: AI Coaching Philosophy Shift

### Problem
Ryan: "The current review process violates their principles because the AI is giving prescriptive answers or scripts, which is contrary to teaching leaders not to rescue and save and fix the problem for their directs."

Current behavior (in `QualityAssessmentCard.jsx`):
- AI provides specific feedback like "Try something like this: [example script]"
- AI tells user what they should have said
- This is "rescuing" — the opposite of coaching

### Desired Behavior
AI should:
- **Ask questions** instead of giving answers
- **Prompt reflection** instead of providing scripts
- **Challenge thinking** instead of solving the problem

### Example Transformation

**Before (Prescriptive):**
```
❌ Your feedback lacked specificity.
Try something like this: "Jordan, I noticed you interrupted Sarah 
three times in today's meeting..."
```

**After (Coaching Questions):**
```
✓ Reflection prompt: Think about the specific observable behavior 
you addressed. Could you describe exactly what you saw or heard, 
as if you were watching a video replay?

What specific words did you use to describe the behavior?
How might you make this even more objective and observable?
```

### Files to Modify

1. **`src/services/conditioningService.js`** — `assessEvidence()` and `assessPracticeResponse()` functions
2. **`src/components/conditioning/QualityAssessmentCard.jsx`** — Display coaching questions instead of examples
3. **Backend/Cloud Functions** — If Gemini is used for assessment, update prompts

### Prompt Engineering Changes

**File:** `functions/index.js` (if using Gemini for assessment)
```javascript
// OLD prompt
const prompt = `Assess this leadership feedback and provide 
specific improvement suggestions...`;

// NEW prompt  
const prompt = `You are a leadership coach. Never give direct answers 
or example scripts. Instead, ask reflective questions that help the 
leader discover the answer themselves.

For this rep debrief, generate 2-3 coaching questions that:
1. Prompt self-reflection on what they did
2. Challenge them to think about impact
3. Help them discover what they might do differently

Do NOT provide example phrases or scripts.
Do NOT tell them what to say.
DO ask questions that lead to insight.`;
```

### Canonical Document
Ryan mentioned creating a "Canon one version one" document containing all the truths and frameworks. This should be:
1. Created as `docs/LEADERREPS-COACHING-CANON.md`
2. Referenced in all AI prompts
3. Used as the source of truth for coaching language

### Effort
4-6 hours (significant prompt engineering + UI changes)

---

## Issue 9: Admin Nudges Not Being Received

### Problem
Rob sent nudges from the admin command center, but Ryan did not receive them immediately.

### Current Implementation
**File:** `src/services/conditioningService.js` — `sendBulkNudges()`, `sendCoachingNudge()`
**File:** `src/components/admin/ConditioningDashboard.jsx` — Admin UI for sending nudges
**File:** `src/components/conditioning/TrainerNudgeNotification.jsx` — User-facing notification

### Investigation Steps

1. **Check Firestore writes** — Are nudges being saved to `users/{userId}/nudges`?
2. **Check real-time subscription** — Is `TrainerNudgeNotification` subscribed?
3. **Check notification permissions** — Are push notifications enabled?
4. **Check timing** — Is there a delay in polling?

### Potential Issues

1. **Real-time subscription not active** — Component may not be mounted
2. **Firestore security rules** — May be blocking cross-user writes
3. **Notification display** — Component may render but be hidden

### Debugging Steps

```javascript
// Add to conditioningService.js sendCoachingNudge
console.log('Attempting to send nudge:', { userId, nudgeData });
// After write
console.log('Nudge saved successfully:', result);

// Add to TrainerNudgeNotification useEffect
console.log('Nudge subscription active for user:', userId);
// On snapshot
console.log('Received nudge data:', data);
```

### Effort
1-2 hours (investigation + fix)

---

## Additional Items from Meeting

### Sales Enablement / Basic CRM
Ryan requested a basic CRM/contact management system to replace Excel for tracking pipeline stages. This is a **separate project** — not part of conditioning fixes.

**Action:** Rob to build basic pipeline tracker (side project)

### First Cohort Timeline
- **Pushed to:** March 10, 2026
- Program evolution: More async teaching, more live conditioning/coaching
- Progress-based model (not strictly time-based)

### Conference Call
- All 4 team members to walk through system from beginning
- Target: Within next 2 weeks (before Feb 27)

---

## Prioritized Implementation Plan

### Sprint 1: Critical Fixes (Feb 13-14)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 1 | Fix microphone capture bug | 1 hr | Rob |
| 2 | Hide commit button until selection | 30 min | Rob |
| 3 | Change locker icon | 15 min | Rob |
| 4 | Complete form consistency (from Feb 12 workplan) | 8 hrs | Rob |

### Sprint 2: Flow Improvements (Feb 15-17)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 5 | Rep creation flow with existing rep gate | 1 hr | Rob |
| 6 | Color consistency for buttons | 1 hr | Rob |
| 7 | Debug admin nudges | 1-2 hrs | Rob |

### Sprint 3: Coach Philosophy (Feb 17-19)

| # | Task | Effort | Blocked By |
|---|------|--------|-----------|
| 8 | Create canonical coaching document | 2 hrs | Ryan input |
| 9 | Update AI prompts to use questioning | 4-6 hrs | Canon doc |
| 10 | Update QualityAssessmentCard UI | 2 hrs | Prompt changes |

### Sprint 4: Progression Gating (Feb 20-24)

| # | Task | Effort | Blocked By |
|---|------|--------|-----------|
| 11 | Design progression data model | 1 hr | Ryan's rules |
| 12 | Implement canAccessRepType() | 2 hrs | Data model |
| 13 | Update RepTypePicker with locks | 2 hrs | Service layer |
| 14 | Test progression flow | 1 hr | Full implementation |

---

## Files Summary

### Must Modify
- `src/components/layout/ArenaSidebar.jsx` — Locker icon
- `src/components/layout/MobileBottomNav.jsx` — Locker icon
- `src/components/conditioning/CommitRepForm.jsx` — Hide button until selection
- `src/components/conditioning/VoiceInputButton.jsx` — Fix microphone
- `src/components/conditioning/RepTypePicker.jsx` — Add gating UI
- `src/components/conditioning/QualityAssessmentCard.jsx` — Coaching questions
- `src/components/screens/Conditioning.jsx` — Button colors, flow
- `src/services/conditioningService.js` — Progression, nudges, AI coaching
- `src/services/repTaxonomy.js` — Progression rules

### May Create
- `src/components/conditioning/RepGateModal.jsx` — Decision modal for existing reps
- `docs/LEADERREPS-COACHING-CANON.md` — Canonical coaching framework

---

## Blockers & Dependencies

1. **Ryan to provide:**
   - 10 real reps with unlock sequence
   - Rubrics for rep assessment
   - Canonical coaching frameworks document

2. **Testing environment:**
   - Need Ryan's account for nudge testing
   - Need cohort data for progression testing

---

## Meeting Action Items Tracker

- [ ] Ryan will provide gating rules + 10 real reps with unlock sequence
- [ ] Ryan will provide rubrics and materials for rep assessment
- [ ] Rob will fix consistency issues and microphone
- [ ] Rob will remove commit button when no rep type selected
- [ ] Rob will change locker icon
- [ ] Conference call with all 4 members (target: before Feb 27)
- [ ] Ryan to text Jack's draft pick result to Rob 🏈
