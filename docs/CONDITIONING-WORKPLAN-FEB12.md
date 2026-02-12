# Conditioning Layer — UX Overhaul Workplan (Feb 12, 2026)

## Source: Ryan Yeoman Feedback Review (Feb 11, 2026)

---

## The Core Problem

The conditioning layer was built feature-by-feature. Each modal, form, and screen was developed independently with different visual patterns. The result: **the app looks and feels like 6 different apps stitched together.** Meanwhile, the codebase already has a polished, consistent UI component library (`Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`, `FormField`, `Input`, `Textarea`, `Button`, `BottomSheet`) — but **zero conditioning components use it.** Every modal hand-rolls its own `<div className="fixed inset-0 ...">` with bespoke styling.

### What "Different Look and Feel" Actually Means

Here's a concrete matrix of every inconsistency across the 7 conditioning modals/forms:

| Component | Header Style | Close Button | Footer Style | Step Indicator | Inputs | Focus Ring | Submit Color |
|-----------|-------------|-------------|-------------|---------------|--------|-----------|-------------|
| `CommitRepForm` | White bg, plain text | Gray X on white | Gray bg, sticky | None | Hand-rolled textareas | `ring-corporate-navy` | Navy |
| `EvidenceCaptureModal` | **Navy gradient**, white text | White X on gradient | Gray bg | None | Textarea + mic | `ring-corporate-navy` | **Green** |
| `StructuredEvidenceModal` | **White bg**, navy text | Gray X on white | Gray bg | **Dots** | Tap grids + add/remove bullets | `ring-corporate-navy/20` | **Green** |
| `HighRiskPrepModal` | **White bg** + icon | Gray X on white | Gray bg | None | Hand-rolled textareas | `ring-indigo-200` (purple!) | **Indigo** (purple!) |
| `MissedRepDebriefModal` | **White bg** + amber icon | Gray X on white | Gray bg | **Numbered circles** | Tap selectors + textareas | `ring-corporate-navy/20` | **Changes per option** |
| `LoopClosureModal` | **Green gradient**, white text | White X on gradient | Gray bg | None | Selection cards + textareas | `ring-green-500` | **Green** |
| `RepDetailModal` | **Navy gradient**, white text | White X on gradient | None (read-only) | None | Read-only display | N/A | N/A |

**Problems visible to Ryan:**
1. Three different header treatments (navy gradient, green gradient, plain white)
2. Two different close button styles (white-on-dark, gray-on-white)
3. Two different step indicator patterns (dots vs numbered circles)
4. Purple/indigo colors bleeding in (HighRiskPrepModal, RepProgressionTracker)
5. Different focus ring colors across forms
6. Different submit button colors (green, navy, indigo, amber, gray)
7. Different textarea styling (some have mic buttons, most don't)
8. Different error display patterns
9. Different modal entry animations (none — they use raw `fixed inset-0`)
10. None use the app's own Modal component (which has focus trap, ESC handling, backdrop blur, etc.)

### Additional UX Issues Beyond Color
- **Mobile unfriendly:** `CommitRepForm` slides up from bottom (`flex items-end`) while all other modals center (`flex items-center justify-center`). No `BottomSheet` usage.
- **No focus trap:** Raw `div` modals don't trap focus — users can Tab into content behind the modal.
- **No ESC key handling:** Only the UI lib `Modal` component handles ESC.
- **Inconsistent padding:** `p-4` vs `p-6` across headers/footers.
- **RepTypePicker** uses `purple-50/200/700` for Ambiguous/Emotional category and `blue-50/200/700` for Reinforcing — neither are corporate colors.
- **RepProgressionTracker** uses 8 different Tailwind color families: blue, indigo, purple, teal, green, orange, emerald, amber, gray — a visual rainbow.
- **Action buttons** in RepProgressionTracker use `bg-indigo-600`, `bg-purple-600`, `bg-teal-600`, `bg-orange-600`, `bg-emerald-600` — all non-corporate.
- **"Today's Focus" card** has an indigo "Prep Now" button (`bg-indigo-600`) next to a corporate teal "Take Action" button.
- **Voice mic icon** shows `MicOff` (muted icon) when actively recording — highly confusing.

---

## Workplan: Unified UX Overhaul

### Phase 1: Build the Foundation (Do First)

#### 1.1 Create `ConditioningModal` — Shared Modal Wrapper
**Why:** Every modal should look identical in structure. Build once, use everywhere.

**Implementation:** Create `src/components/conditioning/ConditioningModal.jsx` that wraps the existing UI library's `Modal` + `ModalOverlay` + `ModalContent` with conditioning-specific defaults:

```jsx
// Standard conditioning modal with:
// - Navy gradient header (consistent)
// - White close X button
// - Optional step indicator (dots or numbered)
// - Scrollable body
// - Gray footer with Cancel left, Action right
// - Focus trap + ESC key handling (from UI lib Modal)
// - BottomSheet on mobile (optional)
```

**Pattern to enforce across all 6 modals:**
- Header: `bg-gradient-to-r from-corporate-navy to-corporate-navy/90`, white text, white X
- Footer: `bg-gray-50 border-t`, Cancel (outline) left, Primary action right
- Step indicator: Numbered circles with green checkmarks for completed (the `MissedRepDebriefModal` pattern — it's visually clearer than dots)
- Submit buttons: Always `bg-corporate-teal hover:bg-corporate-teal-dark text-white` for positive actions
- Cancel/destructive: `bg-corporate-navy hover:bg-corporate-navy/90 text-white`
- Body padding: `p-5` consistently

**Effort:** ~2 hours

#### 1.2 Create `VoiceTextarea` — Standard Voice-Enabled Input
**Why:** Every textarea should have a mic button. Build the pattern once.

**Implementation:** Create `src/components/conditioning/VoiceTextarea.jsx` — a wrapper around the UI lib's `Textarea` + `VoiceInputButton`:
- Label + help text above
- Textarea with mic button positioned bottom-right
- Character count / minimum indicator
- Error state handling
- Consistent focus ring: `focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal`
- Live recording indicator (red border + "Recording..." text)

```jsx
<VoiceTextarea
  label="What happened?"
  helpText="Quick capture: How did the conversation go?"
  value={text}
  onChange={setText}
  placeholder="I said..."
  minLength={20}
  error={errors.text}
/>
```

**Effort:** ~1.5 hours

#### 1.3 Fix Voice Button Icon UX
**Problem:** `MicOff` shown when recording = confusion. Ryan clicked multiple times.

**Fix in `VoiceInputButton.jsx`:**
- When idle: Show `Mic` icon (gray, inactive)
- When recording: Show `Square` (stop) icon (red pulsing) — universal "stop recording" UX
- Add visible "Recording..." label next to button when active
- Increase pulse animation visibility

**Effort:** ~30 min

---

### Phase 2: Migrate Every Modal to Shared Components

#### 2.1 Migrate `CommitRepForm.jsx`
**Current issues:**
- White plain header, slides up from bottom on mobile (different from everything else)
- Hand-rolled textareas with no voice input
- Uses `field-error` CSS class for validation (not from UI lib)
- Uses inline `border-red-400 bg-red-50` error styling
- Uses raw `<textarea>` elements, not UI lib's `Textarea`
- No mic button on any field

**Changes:**
1. Wrap in `ConditioningModal` (navy gradient header "Commit to a Rep")
2. Replace all `<textarea>` fields with `VoiceTextarea`
3. Replace the `<input>` for person name with UI lib `Input` + small `VoiceInputButton`
4. Use `FormField` from UI lib for label + error wrapping
5. Use consistent focus ring colors
6. Fix `bg-indigo-600` "Prep Now" / "Complete Prep First" button → `bg-corporate-navy`

**Effort:** ~2 hours

#### 2.2 Migrate `StructuredEvidenceModal.jsx` (Main Debrief)
**Current issues:**
- White header (no gradient) — different from EvidenceCaptureModal which has navy gradient
- Uses dot-style step indicator (different from MissedRepDebriefModal's numbered circles)
- `BulletPointsField` — confusing UX, should be voice-first "recite verbatim"
- No mic on any textarea (response note, commitment, reflection)
- Selection grids use `border-corporate-navy bg-corporate-navy/5` — correct color but inconsistent highlight pattern
- Close button is gray on white (different from EvidenceCaptureModal's white on navy)

**Changes:**
1. Wrap in `ConditioningModal` (navy gradient header "Debrief Your Rep")
2. Replace `StepIndicator` dots with numbered circles (matching MissedRepDebrief)
3. **Replace `BulletPointsField` with voice-first `VoiceTextarea`** — prompt: "Recite the feedback you gave, as close to verbatim as you can"
4. Add `VoiceTextarea` to response note, commitment, and reflection fields
5. Update data model: `what_said` from `string[]` → `string`
6. Update quality assessment to evaluate free-form verbatim text

**Effort:** ~3 hours

#### 2.3 Migrate `EvidenceCaptureModal.jsx` (Quick Debrief)
**Current issues:**
- Already has navy gradient header (good!) — but uses raw `div.fixed` not UI lib Modal
- Already has voice input (good!) — but positioned with raw absolute positioning
- Submit button is green (different from other modals)
- Two-column footer layout (Cancel | Submit) using `flex-1` sizing

**Changes:**
1. Wrap in `ConditioningModal` — preserves navy gradient, gains focus trap + ESC
2. Replace raw textarea + mic setup with `VoiceTextarea`
3. Standardize submit button to `bg-corporate-teal`
4. Standardize footer to match pattern

**Effort:** ~1 hour

#### 2.4 Migrate `HighRiskPrepModal.jsx`
**Current issues (worst offender for color):**
- White header with icon — different from every other modal
- Rubric section uses `indigo-50`, `indigo-200`, `indigo-400`, `indigo-600` throughout
- "Complete Prep" button is `bg-indigo-600` (purple!)
- Focus rings are `ring-indigo-200` (purple!)
- No voice input on any textarea
- Textareas use different padding/sizing than other modals

**Changes:**
1. Wrap in `ConditioningModal` (navy gradient header "Prep Your Rep")
2. Replace ALL `indigo-*` → corporate equivalents (navy/teal)
3. Replace all `<textarea>` with `VoiceTextarea`
4. "Complete Prep" button → `bg-corporate-teal`
5. Rubric section borders → `border-corporate-navy/20`, bg → `bg-corporate-navy/5`
6. Focus rings → `ring-corporate-teal`

**Effort:** ~1.5 hours

#### 2.5 Migrate `MissedRepDebriefModal.jsx`
**Current issues:**
- White header with amber icon — different from others
- Has the BEST step indicator (numbered circles with green checks) — should be the standard
- TextAreas have no voice input
- Different focus ring (`ring-corporate-navy/20`)
- Submit button changes color based on recommit option (green/amber/gray) — confusing

**Changes:**
1. Wrap in `ConditioningModal` (navy gradient header "Missed Rep Debrief")
2. Move step indicator to shared component (it's the one others should adopt)
3. Add `VoiceTextarea` to all text inputs (next week plan, cancel reason)
4. Standardize submit button: always `bg-corporate-teal` with text label changing
5. Fix missed rep persistence bug (status should change after debrief — see Phase 4)

**Effort:** ~1.5 hours

#### 2.6 Migrate `LoopClosureModal.jsx`
**Current issues:**
- **Green gradient** header — completely different from the navy gradient others use
- Focus ring is `ring-green-500` — different from everything else
- Already has voice buttons (good!) but manual integration

**Changes:**
1. Wrap in `ConditioningModal` (navy gradient header "Close the Loop")
2. Replace raw textareas with `VoiceTextarea`
3. Standardize focus rings to `ring-corporate-teal`
4. Standardize submit button to `bg-corporate-teal`

**Effort:** ~1 hour

---

### Phase 3: Fix Inline UI Components

#### 3.1 Fix `RepProgressionTracker.jsx` — Brand Color Palette
**Problem:** Uses 8+ Tailwind color families creating a visual rainbow. Action buttons use indigo, purple, teal, orange, emerald — none are corporate.

**Changes:**
1. Replace color scheme:
   - `prepared` → `indigo` → **corporate-navy** 
   - `scheduled` → `purple` → **corporate-navy** (lighter variant)
   - `executed` → `teal` → **corporate-teal**
   - `debriefed` → `green` is OK (universal success color)
   - `follow_up_pending` → `orange` → **corporate-orange** (it's a brand color)
   - `loop_closed` → `emerald` → `green` (consolidate)
   - `committed` → `blue` → **corporate-navy** (lighter variant)
2. Action buttons: All use `bg-corporate-navy` or `bg-corporate-teal` instead of rainbow
3. Replace `bg-indigo-600`, `bg-purple-600` action buttons with `bg-corporate-navy`
4. Replace `bg-teal-600`, `bg-emerald-600` with `bg-corporate-teal`

**Effort:** ~1.5 hours

#### 3.2 Fix `RepTypePicker.jsx` — Brand Colors for Categories
**Problem:** Categories use `purple-50/200/700` and `blue-50/200/700` — not corporate.

**Changes:**
1. `reinforcing_redirecting` → `blue` → corporate-teal background tints
2. `ambiguous_emotional` → `purple` → corporate-navy background tints  
3. `standards_authority` → `amber` → corporate-orange background tints
4. `escalation_decisions` → `red` → stays red (appropriate semantic color for danger/escalation)

**Effort:** ~1 hour

#### 3.3 Fix `Conditioning.jsx` Main Screen
**Problems:**
- "Complete Prep First" button uses `bg-indigo-600`
- "Today's Focus" has `bg-indigo-600` for "Prep Now" next to `bg-corporate-teal` for "Take Action" — two different colors for the same concept
- Missed reps section uses amber accents (fine as semantic color) but the "Debrief" button is `bg-amber-600` — should match the standard

**Changes:**
1. All "prep" buttons → `bg-corporate-navy` consistently
2. All "take action" buttons → `bg-corporate-teal` consistently
3. "Today's Focus" CTA → always `bg-corporate-teal`
4. Missed rep "Debrief" button → `bg-corporate-teal`

**Effort:** ~1 hour

#### 3.4 Fix `QualityAssessmentCard.jsx` — Performance Visibility
**Problem:** Ryan wants to see WHERE he failed. Card exists but may not be prominent enough.

**Changes:**
1. When `meetsStandard === false`, show expanded view by default (not collapsed)
2. Add prominent "Didn't Meet Standard" banner with corporate-orange accent
3. For each failed dimension, add 1-sentence coaching tip (not just "Practice this →")
4. Update dimension labels to match Ryan's language:
   - "Specific Language" → "Observable Behaviors" 
   - Keep "Clear Request", "Named Commitment", "Reflection"
5. Ensure card always shows in `RepDetailModal.jsx`

**Effort:** ~2 hours

---

### Phase 4: Flow & Logic Fixes

#### 4.1 Simplify Prep to CLEAR Framework
**Problem:** Too many prep fields (5 universal + 4 high-risk = 9 fields). Ryan wants 3: Observable Behavior, Impact, Clear Request.

**Changes:**
1. Update `UNIVERSAL_REP_FIELDS` in `repTaxonomy.js` → 3 fields
2. Update `CommitRepForm.jsx` state to match
3. Keep high-risk prep questions as supplemental in `HighRiskPrepModal.jsx`
4. Update `RepDetailModal.jsx` display labels

**Effort:** ~2 hours

#### 4.2 Fix "Commit to Another Rep" Navigation
**Problem:** Button takes user to conditioning page, then they have to find the commit button.

**Fix:** Pass `action=commit` in navigation state → auto-open `CommitRepForm` on arrival.

**Effort:** ~1 hour

#### 4.3 Fix "Today's Focus" Confusion
**Problem:** Users don't know what to do. Progress bar is informational, not actionable.

**Changes:**
1. Add single prominent CTA: "Next Step: [Complete Prep / Execute Rep / Debrief / Close Loop]"
2. Make progress bar label the next step clearly
3. Remove "Nervous? Talk it through with your coach first" (confusing as primary guidance)

**Effort:** ~1.5 hours

#### 4.4 Fix Persistent Missed Rep Bug
**Problem:** After recommitting/debriefing a missed rep, the missed notification stays forever.

**Root Cause:** `saveMissedRepDebrief()` doesn't change rep status. `rollForwardRep()` creates new rep but doesn't resolve old one. `getMissedReps()` has no exclusion filter.

**Fix:**
1. `rollForwardRep()` → also update old rep status to `'resolved'`
2. `saveMissedRepDebrief()` → if recommit_decision is 'cancel', set status to `'canceled'`
3. `getMissedReps()` → exclude reps with `missedDebrief` data
4. Same-day deadline → set to 11:59 PM, add warning

**Effort:** ~2 hours

#### 4.5 Add Multi-Select for Response Fields
**Problem:** Can only pick one response type, but multiple may apply.

**Changes:**
1. `ResponseField` in `StructuredEvidenceModal` → `selectedResponses: string[]`
2. `BLOCKER_OPTIONS` in `MissedRepDebriefModal` → allow multi-select

**Effort:** ~1.5 hours

---

### Phase 5: Admin & Reporting

#### 5.1 Fix Conditioning Dashboard Showing Zeros
**Problem:** Admin dashboard shows zeros for all leaders.

**Investigation needed:**
- Verify cohort ID matching in admin queries
- Check Firestore security rules for cross-user reads
- Debug aggregation logic vs actual document structure

**Effort:** ~2-3 hours

---

## Summary: Effort Estimate & Sequencing

### Sprint 1: Unified Look & Feel (Ship Feb 13 AM) — ~12 hrs

| # | Task | Effort | Files |
|---|------|--------|-------|
| 1.1 | Build `ConditioningModal` wrapper | 2 hrs | NEW: `ConditioningModal.jsx` |
| 1.2 | Build `VoiceTextarea` component | 1.5 hrs | NEW: `VoiceTextarea.jsx` |
| 1.3 | Fix voice mic icon (MicOff → Square stop) | 30 min | `VoiceInputButton.jsx` |
| 2.3 | Migrate `EvidenceCaptureModal` | 1 hr | `EvidenceCaptureModal.jsx` |
| 2.4 | Migrate `HighRiskPrepModal` (worst offender) | 1.5 hrs | `HighRiskPrepModal.jsx` |
| 2.5 | Migrate `MissedRepDebriefModal` | 1.5 hrs | `MissedRepDebriefModal.jsx` |
| 2.6 | Migrate `LoopClosureModal` | 1 hr | `LoopClosureModal.jsx` |
| 3.3 | Fix `Conditioning.jsx` inline colors | 1 hr | `Conditioning.jsx` |
| 4.4 | Fix persistent missed rep bug | 2 hrs | `conditioningService.js`, `MissedRepDebriefModal.jsx` |

### Sprint 2: Debrief & Prep Overhaul (Feb 13-14) — ~12 hrs

| # | Task | Effort | Files |
|---|------|--------|-------|
| 2.1 | Migrate `CommitRepForm` + voice on all fields | 2 hrs | `CommitRepForm.jsx` |
| 2.2 | Migrate `StructuredEvidenceModal` + voice-first | 3 hrs | `StructuredEvidenceModal.jsx` |
| 3.1 | Fix `RepProgressionTracker` colors | 1.5 hrs | `RepProgressionTracker.jsx` |
| 3.2 | Fix `RepTypePicker` colors | 1 hr | `RepTypePicker.jsx` |
| 3.4 | Enhanced `QualityAssessmentCard` visibility | 2 hrs | `QualityAssessmentCard.jsx`, `RepDetailModal.jsx` |
| 4.1 | Simplify prep to CLEAR (3 fields) | 2 hrs | `repTaxonomy.js`, `CommitRepForm.jsx` |
| 4.2 | Fix commit navigation | 1 hr | `ConditioningWidget.jsx`, `Conditioning.jsx` |

### Sprint 3: Flow Polish (Feb 15) — ~5 hrs

| # | Task | Effort | Files |
|---|------|--------|-------|
| 4.3 | Fix Today's Focus clarity | 1.5 hrs | `Conditioning.jsx`, `RepProgressionTracker.jsx` |
| 4.5 | Multi-select response fields | 1.5 hrs | `StructuredEvidenceModal.jsx`, `MissedRepDebriefModal.jsx` |
| 5.1 | Fix admin dashboard zeros | 2-3 hrs | `ConditioningDashboard.jsx` |

---

**Total Estimated Effort: ~29 hours**

## Files Affected (Complete List)

### NEW Shared Components
- `src/components/conditioning/ConditioningModal.jsx` — Unified modal wrapper
- `src/components/conditioning/VoiceTextarea.jsx` — Standard voice-enabled textarea

### Conditioning Modals (All 6 Migrated)
- `VoiceInputButton.jsx` — Fix MicOff → Square stop icon
- `CommitRepForm.jsx` — ConditioningModal wrap + VoiceTextarea + simplified CLEAR fields
- `StructuredEvidenceModal.jsx` — ConditioningModal + voice-first debrief + unified steps
- `EvidenceCaptureModal.jsx` — ConditioningModal wrap + standardized buttons
- `HighRiskPrepModal.jsx` — ConditioningModal + purge all indigo/purple + VoiceTextarea
- `MissedRepDebriefModal.jsx` — ConditioningModal + VoiceTextarea + fix persistence
- `LoopClosureModal.jsx` — ConditioningModal + standardized colors

### Inline Components
- `RepProgressionTracker.jsx` — Replace 8 color families with corporate palette
- `RepTypePicker.jsx` — Replace purple/blue categories with corporate colors
- `QualityAssessmentCard.jsx` — Enhanced visibility + updated dimension labels
- `RepDetailModal.jsx` — Purge indigo, add quality analysis display

### Services
- `conditioningService.js` — Fix missed rep status transitions, update quality assessment
- `repTaxonomy.js` — Simplify UNIVERSAL_REP_FIELDS to 3 CLEAR fields

### Screens & Widgets
- `Conditioning.jsx` — Fix inline colors, auto-open commit, Today's Focus clarity
- `ConditioningWidget.jsx` — Pass commit intent on navigation
- `ConditioningDashboard.jsx` — Fix admin reporting

### Key Design Decisions
- **Header:** Navy gradient (`from-corporate-navy to-corporate-navy/90`) + white text — everywhere
- **Primary action button:** `bg-corporate-teal hover:bg-corporate-teal-dark text-white` — everywhere
- **Secondary action button:** `bg-corporate-navy hover:bg-corporate-navy/90 text-white`
- **Focus ring:** `ring-corporate-teal` — everywhere
- **Step indicators:** Numbered circles with green checks (from MissedRepDebrief pattern)
- **Textarea:** Always includes mic button (VoiceTextarea)
- **Modal mechanics:** Focus trap + ESC + backdrop blur (from UI lib Modal)
