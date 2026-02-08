# Conditioning Layer Enhancement Plan

## Executive Summary

This plan incorporates the detailed feedback from Ryan's notes (dated 020726) into the existing conditioning layer implementation. The notes contain three progressive sections:
1. **Initial Design Spec** - The high-level UX specification
2. **Pushback/Enhancements** - 8 critical gaps and fixes
3. **Rep Taxonomy** - The 16 canonical rep types

**Key insight:** Later sections supersede earlier ones. The Pushback section significantly upgrades the initial spec, and the 16 Rep Types replace the vague "skill area tags" mentioned initially.

---

## Current State Analysis

### What Already Exists ✅

| Component | Status | Location |
|-----------|--------|----------|
| Basic rep commitment flow | ✅ Built | `src/components/screens/Conditioning.jsx` |
| 4 generic rep types | ✅ Built (needs upgrade) | `conditioningService.js` (feedback/1:1/tension/other) |
| Rep states (Active/Completed/Missed/Canceled) | ✅ Built (needs expansion) | `conditioningService.js` |
| Evidence capture modal | ✅ Built (needs structured fields) | `src/components/conditioning/EvidenceCaptureModal.jsx` |
| Level 1/Level 2 evidence timing | ✅ Built | `conditioningService.js` |
| Quality assessment dimensions | ✅ Built | `conditioningService.js` |
| Trainer dashboard | ✅ Built (needs coach prompts) | `src/components/admin/ConditioningDashboard.jsx` |
| Pattern detection | ✅ Basic | `conditioningService.js` (analyzePatterns) |
| Prep support | ✅ Built | `src/components/conditioning/RepPrepModal.jsx` |
| Weekly tracking | ✅ Built | `conditioningService.js` |

### What Needs Upgrading 🔧

1. **Rep Types** - Replace 4 generic types with 16 canonical moments
2. **Evidence Structure** - Add concrete specifics (who, when, what, response)
3. **Rep States** - Add Prepared, Scheduled/Initiated states
4. **Risk-Based Prep** - Make prep required for high-risk reps
5. **Progression Rules** - Prevent plateau/vanity reps
6. **Missed Rep Debrief** - Structured accountability without guilt
7. **Coach Prompts** - Actionable trainer nudges
8. **Detection Heuristics** - Specific rules with thresholds

---

## Phase 1: Rep Taxonomy (Priority: High)

### 1.1 Replace Generic Rep Types with 16 Canonical Moments

**Current state:** `feedback`, `1:1`, `tension`, `other`

**Target state:** 16 distinct rep types organized into 4 categories

```javascript
export const REP_CATEGORIES = {
  REINFORCING_REDIRECTING: 'reinforcing_redirecting',
  AMBIGUOUS_EMOTIONAL: 'ambiguous_emotional', 
  STANDARDS_AUTHORITY: 'standards_authority',
  ESCALATION_DECISIONS: 'escalation_decisions'
};

export const REP_TYPES = [
  // A. Reinforcing & Redirecting
  { id: 'reinforce_public', category: 'reinforcing_redirecting', label: 'Reinforcing Behavior in Public', shortLabel: 'Public Praise', difficulty: 'low', riskLevel: 'low' },
  { id: 'redirect_moment', category: 'reinforcing_redirecting', label: 'Redirecting in the Moment', shortLabel: 'In-the-Moment Redirect', difficulty: 'high', riskLevel: 'high' },
  { id: 'redirect_prepared', category: 'reinforcing_redirecting', label: 'Redirecting After the Fact (Prepared)', shortLabel: 'Prepared Redirect', difficulty: 'medium', riskLevel: 'medium' },
  { id: 'redirect_pattern', category: 'reinforcing_redirecting', label: 'Redirecting a Pattern', shortLabel: 'Pattern Redirect', difficulty: 'high', riskLevel: 'high' },
  { id: 'adjust_mid_feedback', category: 'reinforcing_redirecting', label: 'Adjusting Mid-Feedback Due to Pushback', shortLabel: 'Recover from Pushback', difficulty: 'high', riskLevel: 'medium' },
  { id: 'close_loop', category: 'reinforcing_redirecting', label: 'Closing the Loop After Redirecting', shortLabel: 'Follow-Up', difficulty: 'medium', riskLevel: 'low' },
  
  // B. Ambiguous & Emotional Conversations
  { id: 'whats_going_on', category: 'ambiguous_emotional', label: 'The "What\'s Going On?" Conversation', shortLabel: 'Check-In', difficulty: 'medium', riskLevel: 'medium' },
  { id: 'receive_feedback', category: 'ambiguous_emotional', label: 'Receiving Redirecting Feedback Well', shortLabel: 'Receive Feedback', difficulty: 'high', riskLevel: 'low' },
  { id: 'lead_vulnerability', category: 'ambiguous_emotional', label: 'Leading with Vulnerability', shortLabel: 'Be Vulnerable', difficulty: 'high', riskLevel: 'medium' },
  
  // C. Standards, Boundaries, & Authority
  { id: 'delegate_clean', category: 'standards_authority', label: 'Delegating with a Clean Handoff', shortLabel: 'Delegate', difficulty: 'medium', riskLevel: 'medium' },
  { id: 'hold_line', category: 'standards_authority', label: 'Holding the Line After Pushback', shortLabel: 'Hold the Line', difficulty: 'high', riskLevel: 'high' },
  { id: 'let_consequence', category: 'standards_authority', label: 'Letting Someone Experience Consequences', shortLabel: 'Allow Consequences', difficulty: 'high', riskLevel: 'low' },
  { id: 'say_no', category: 'standards_authority', label: 'Saying No / Re-Prioritizing Work', shortLabel: 'Say No', difficulty: 'medium', riskLevel: 'medium' },
  
  // D. Escalation, Conflict, & Decisions
  { id: 'name_pattern_change', category: 'escalation_decisions', label: 'Naming a Pattern That Requires Change', shortLabel: 'Escalate Pattern', difficulty: 'high', riskLevel: 'high' },
  { id: 'coaching_to_consequence', category: 'escalation_decisions', label: 'Transitioning from Coaching to Consequence', shortLabel: 'Transition to PIP', difficulty: 'high', riskLevel: 'high' },
  { id: 'mediate_conflict', category: 'escalation_decisions', label: 'Mediating Conflict Between Two People', shortLabel: 'Mediate', difficulty: 'high', riskLevel: 'medium' }
];
```

### 1.2 Universal Rep Structure (All 16 Types)

Every rep must capture:

```javascript
export const UNIVERSAL_REP_FIELDS = {
  trigger: { label: 'Trigger / Context', prompt: 'What situation prompted this rep?', required: true },
  intended_outcome: { label: 'Intended Outcome', prompt: 'What does success look like?', required: true },
  standard: { label: 'Standard Being Enforced', prompt: 'What expectation, boundary, goal, or role?', required: true },
  hard_move: { label: 'The Hard Move', prompt: 'What specific leader behavior will you do?', required: true },
  close_next: { label: 'Close / Next Step', prompt: 'What happens after this conversation?', required: true }
};
```

### 1.3 Micro-Rubrics Per Rep Type

Each rep type has specific coaching questions (not scripts):

```javascript
export const REP_RUBRICS = {
  delegate_clean: [
    { id: 'done_definition', prompt: 'What does "done" look like?' },
    { id: 'constraints', prompt: 'What constraints apply?' },
    { id: 'check_back', prompt: 'How will you check back?' },
    { id: 'not_taking_back', prompt: 'What are you NOT taking back?' }
  ],
  redirect_pattern: [
    { id: 'pattern_specific', prompt: 'What specific pattern have you observed?' },
    { id: 'impact', prompt: 'What is the impact on the team/work?' },
    { id: 'consequence', prompt: 'What happens if the pattern continues?' },
    { id: 'commitment', prompt: 'What specific change are you asking for?' }
  ],
  whats_going_on: [
    { id: 'observation', prompt: 'What have you noticed (without accusation)?' },
    { id: 'genuine_curiosity', prompt: 'What are you genuinely curious about?' },
    { id: 'support_offer', prompt: 'What support can you offer?' },
    { id: 'next_check', prompt: 'When will you follow up?' }
  ],
  // ... (all 16 types)
};
```

**Files to Modify:**
- `src/services/conditioningService.js` - Add new constants
- `src/components/screens/Conditioning.jsx` - Update rep selection UI
- `src/components/conditioning/CommitRepForm.jsx` - New form with universal fields

---

## Phase 2: Evidence Structure (Priority: High)

### 2.1 Replace Weak Evidence with Structured Specifics

**Current:** Free-text responses to generic prompts

**Target:** Concrete fields that are hard to fake

```javascript
export const EVIDENCE_FIELDS = {
  // WHO
  person_name: { 
    label: 'Who was the rep with?', 
    type: 'text', // Could be team picker
    required: true,
    validation: 'Must be specific name, not "someone on my team"'
  },
  
  // WHEN
  when_happened: {
    label: 'When did this happen?',
    type: 'datetime',
    required: true,
    options: ['Today', 'Yesterday', 'This week']
  },
  
  // WHICH MOMENT
  context_moment: {
    label: 'Which moment was this tied to?',
    type: 'select',
    required: true,
    options: ['Scheduled 1:1', 'Team meeting', 'Hallway/Slack', 'Handoff/transition', 'Issue/incident response', 'Other']
  },
  
  // WHAT WAS SAID/DONE
  what_said: {
    label: 'What did you say/do?',
    type: 'bullets',
    required: true,
    minItems: 2,
    maxItems: 5,
    prompt: 'Be specific - 2-5 bullet points of what you actually said'
  },
  
  // RESPONSE
  their_response: {
    label: 'How did they respond?',
    type: 'select_plus_note',
    required: true,
    options: [
      'Accepted and agreed',
      'Asked clarifying questions',
      'Pushed back / resisted',
      'Became defensive',
      'Seemed surprised',
      'Was neutral / hard to read',
      'Other'
    ],
    notePrompt: 'Brief note on their response'
  },
  
  // COMMITMENT (existing but strengthened)
  commitment: {
    label: 'What commitment was made?',
    type: 'text',
    required: true,
    allowExplicitNone: true,
    prompt: 'Specific commitment OR explicitly note why none was made'
  }
};
```

**Files to Modify:**
- `src/services/conditioningService.js` - Add evidence field definitions
- `src/components/conditioning/EvidenceCaptureModal.jsx` - Rebuild with structured fields

---

## Phase 3: Rep States (Priority: Medium)

### 3.1 Expand State Machine

**Current:** Active → Completed/Missed/Canceled

**Target:** More granular states for tracking progress

```javascript
export const REP_STATUS = {
  COMMITTED: 'committed',           // Rep is set, nothing else done
  PREPARED: 'prepared',             // Optional prep completed
  SCHEDULED: 'scheduled',           // For reps requiring scheduling (1:1 launch, etc.)
  EXECUTED: 'executed',             // Real-world rep done, awaiting debrief
  DEBRIEFED: 'debriefed',          // Complete - debrief submitted
  MISSED: 'missed',                 // Past deadline without execution
  CANCELED: 'canceled'              // Rare, with reason
};

// State transitions
export const STATE_TRANSITIONS = {
  committed: ['prepared', 'scheduled', 'executed', 'missed', 'canceled'],
  prepared: ['scheduled', 'executed', 'missed', 'canceled'],
  scheduled: ['executed', 'missed', 'canceled'],
  executed: ['debriefed', 'missed'],  // Can still miss if no debrief
  debriefed: [],  // Terminal state
  missed: ['committed'],  // Roll forward
  canceled: []  // Terminal state
};
```

### 3.2 Activity Detection Per Rep Type

```javascript
export const ACTIVITY_SIGNALS = {
  // Feedback reps
  redirect_moment: ['executed'],  // No prep possible
  redirect_prepared: ['prepared', 'executed'],
  
  // 1:1 launch
  launch_1on1: ['prepared', 'scheduled', 'executed'],  // Scheduling is activity
  
  // Delegation
  delegate_clean: ['prepared', 'executed'],
  
  // Default
  default: ['prepared', 'executed']
};
```

**Files to Modify:**
- `src/services/conditioningService.js` - Update status constants and transitions
- `src/components/screens/Conditioning.jsx` - Update UI to show states

---

## Phase 4: Risk-Based Prep (Priority: Medium)

### 4.1 Prep Required for High-Risk Reps

```javascript
export const PREP_REQUIREMENTS = {
  redirect_moment: 'none',           // Can't prep - it's in the moment
  redirect_prepared: 'optional',
  redirect_pattern: 'required',      // High stakes
  hold_line: 'required',             // Emotional risk
  coaching_to_consequence: 'required', // Irreversible
  mediate_conflict: 'required',      // Triadic complexity
  name_pattern_change: 'required',   // Escalation
  
  // All others
  default: 'optional'
};

// Risk toggle at commitment
export const RISK_LEVELS = ['low', 'medium', 'high'];

// If leader selects high risk, prep questions required
export const HIGH_RISK_PREP_QUESTIONS = [
  { id: 'worst_case', prompt: 'What\'s the worst-case response?' },
  { id: 'recovery', prompt: 'How will you recover if it goes sideways?' },
  { id: 'support', prompt: 'What support do you need before this conversation?' },
  { id: 'timing', prompt: 'Is this the right moment? Why now?' }
];
```

**Files to Modify:**
- `src/components/conditioning/RepPrepModal.jsx` - Add risk-based questions
- `src/services/conditioningService.js` - Block execution without prep for required reps

---

## Phase 5: Progression Rules (Priority: High)

### 5.1 Prevent Plateau & Vanity Reps

```javascript
export const PROGRESSION_RULES = {
  // Only one "same as last time" rep per skill per week counts
  maxSameTypePerWeek: 1,
  
  // After X completions at difficulty, prompt stretch
  stretchThresholds: {
    low: 2,      // After 2 low-difficulty reps, prompt medium
    medium: 3,   // After 3 medium reps, prompt high
    high: null   // No cap on high-difficulty
  },
  
  // Stretch prompts offered when threshold hit
  stretchPrompts: {
    reinforce_public: [
      'Try reinforcing someone you don\'t know as well',
      'Reinforce in front of a larger group',
      'Reinforce a behavior that required courage from them'
    ],
    redirect_prepared: [
      'Try redirecting in the moment (unprepared)',
      'Address a pattern, not just an instance',
      'Redirect someone with more seniority'
    ]
    // ... all 16 types
  }
};
```

### 5.2 Difficulty Tracking

```javascript
export const DIFFICULTY_PROGRESSION = {
  reinforce_public: {
    level1: 'Reinforce a direct report for something obvious',
    level2: 'Reinforce publicly in a meeting',
    level3: 'Reinforce in front of stakeholders or senior leaders'
  },
  delegate_clean: {
    level1: 'Delegate a well-defined task',
    level2: 'Delegate with ambiguity (let them figure it out)',
    level3: 'Delegate something you could do better yourself'
  },
  redirect_pattern: {
    level1: 'Address 2-instance pattern with direct report',
    level2: 'Address chronic pattern with consequences',
    level3: 'Address pattern with peer or skip-level'
  }
  // ... all 16 types
};
```

**Files to Modify:**
- `src/services/conditioningService.js` - Add progression logic
- `src/components/screens/Conditioning.jsx` - Show stretch prompts

---

## Phase 6: Missed Rep Accountability (Priority: Medium)

### 6.1 Missed Rep Debrief (Not Punishment)

```javascript
export const MISSED_REP_DEBRIEF = {
  required: true,  // Can't commit new rep without this
  
  fields: {
    what_blocked: {
      label: 'What got in the way?',
      type: 'select',
      options: [
        'Ran out of time',
        'Opportunity didn\'t arise',
        'Avoided it (courage)',
        'Avoided it (clarity)',
        'Person was unavailable',
        'Priorities shifted',
        'Other'
      ]
    },
    standard_breakdown: {
      label: 'Which standard broke down?',
      type: 'select',
      options: ['Time management', 'Courage', 'Clarity', 'Support needed', 'External factors']
    },
    next_week_different: {
      label: 'What will you do differently next week?',
      type: 'text',
      required: true
    }
  }
};
```

**Files to Modify:**
- `src/components/conditioning/MissedRepDebrief.jsx` - New component
- `src/services/conditioningService.js` - Block new commitments until debrief

---

## Phase 7: Trainer Coach Prompts (Priority: High)

### 7.1 Actionable Coaching Suggestions

```javascript
export const COACH_PROMPTS = {
  low_risk_pattern: {
    detection: 'Same skill + low difficulty ≥3 times in 4 weeks',
    prompt: 'This leader is choosing low-risk reps repeatedly',
    coaching_question: 'What would it look like to try a harder version of this?'
  },
  
  avoidance_pattern: {
    detection: 'Commitment Monday, execution consistently after Thursday',
    prompt: 'This leader commits early but executes late (avoidance pattern)',
    coaching_question: 'What\'s getting in the way of acting sooner?'
  },
  
  prep_strong_followthrough_weak: {
    detection: 'High prep completion, low execution rate',
    prompt: 'This leader is strong in prep, weak in follow-through',
    coaching_question: 'Is prep becoming a way to avoid the actual conversation?'
  },
  
  no_close_pattern: {
    detection: 'Missing close/next step in ≥50% of debriefs',
    prompt: 'This leader misses "close/next step" consistently',
    coaching_question: 'How are you ensuring conversations aren\'t left hanging?'
  },
  
  consecutive_misses: {
    detection: '≥2 missed reps in last 4 weeks',
    prompt: 'This leader has missed multiple weeks',
    coaching_question: 'What support would help you complete your reps consistently?'
  }
};
```

### 7.2 Dashboard Integration

Add a "Coach Suggestions" card for each leader showing:
- Pattern detected
- Suggested coaching question
- History of similar patterns

**Files to Modify:**
- `src/components/admin/ConditioningDashboard.jsx` - Add coach prompts panel
- `src/services/conditioningService.js` - Add coach prompt detection

---

## Phase 8: Detection Heuristics (Priority: Medium)

### 8.1 Three Core Heuristics for v1

```javascript
export const DETECTION_HEURISTICS = {
  // 1. Difficulty repetition
  difficulty_repetition: {
    rule: 'Same skill + same difficulty ≥3 times in 4 weeks',
    trigger: (reps) => {
      const last4Weeks = reps.filter(r => isWithin4Weeks(r));
      const bySkillDifficulty = groupBy(last4Weeks, r => `${r.repType}-${r.difficulty}`);
      return Object.values(bySkillDifficulty).some(group => group.length >= 3);
    },
    action: 'Prompt stretch'
  },
  
  // 2. Latency pattern
  latency_pattern: {
    rule: 'Execution consistently after Thursday (3+ of last 4)',
    trigger: (reps) => {
      const last4Completed = reps.filter(r => r.status === 'debriefed').slice(0, 4);
      const lateCount = last4Completed.filter(r => getDayOfWeek(r.executedAt) > 4).length;
      return lateCount >= 3;
    },
    action: 'Flag avoidance pattern'
  },
  
  // 3. Non-completion rate
  non_completion: {
    rule: 'Missed ≥2 of last 4 weeks',
    trigger: (weeks) => {
      const last4Weeks = weeks.slice(0, 4);
      const missedCount = last4Weeks.filter(w => !w.requiredRepCompleted).length;
      return missedCount >= 2;
    },
    action: 'Flag for trainer follow-up'
  }
};
```

**Files to Modify:**
- `src/services/conditioningService.js` - Add detection functions
- `src/components/admin/ConditioningDashboard.jsx` - Display detected patterns

---

## Implementation Order

### Sprint 1: Foundation (Week 1-2)
1. **Rep Taxonomy** - Replace 4 types with 16, add universal structure
2. **Evidence Structure** - Replace weak evidence with concrete fields
3. **Data migrations** - Update existing reps to new schema

### Sprint 2: States & Progression (Week 3-4)
4. **Rep States** - Expand state machine
5. **Progression Rules** - Add stretch prompts, prevent vanity reps
6. **Risk-Based Prep** - Make prep required for high-risk reps

### Sprint 3: Accountability & Coaching (Week 5-6)
7. **Missed Rep Debrief** - Structured accountability
8. **Coach Prompts** - Actionable trainer suggestions
9. **Detection Heuristics** - Three core detection rules

---

## Data Model Changes

### conditioning_reps Collection (Updated)

```javascript
{
  // Identity
  id: string,
  userId: string,
  cohortId: string,
  weekId: string,
  
  // Rep Definition (NEW - Universal Structure)
  repType: string,  // One of 16 canonical types
  repCategory: string,  // One of 4 categories
  person: string,
  context: {
    trigger: string,
    intended_outcome: string,
    standard: string,
    hard_move: string,
    close_next: string
  },
  
  // Risk & Difficulty (NEW)
  riskLevel: 'low' | 'medium' | 'high',
  difficulty: 'level1' | 'level2' | 'level3',
  
  // Status (EXPANDED)
  status: 'committed' | 'prepared' | 'scheduled' | 'executed' | 'debriefed' | 'missed' | 'canceled',
  
  // Prep (Enhanced)
  prep: {
    savedAt: Timestamp,
    rubricResponses: { [questionId]: string },
    riskResponses: { [questionId]: string },  // NEW: High-risk prep
    inputMethod: 'written' | 'voice'
  },
  
  // Evidence (RESTRUCTURED)
  evidence: {
    level: 'level_1' | 'level_2',
    submittedAt: Timestamp,
    structured: {
      person_name: string,
      when_happened: Timestamp,
      context_moment: string,
      what_said: string[],  // Bullet points
      their_response: {
        type: string,
        note: string
      },
      commitment: string
    },
    reflection: {
      what_worked: string,
      what_didnt: string,
      next_time: string
    }
  },
  
  // Missed Rep Debrief (NEW)
  missedDebrief: {
    what_blocked: string,
    standard_breakdown: string,
    next_week_different: string,
    submittedAt: Timestamp
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  preparedAt: Timestamp,
  scheduledAt: Timestamp,
  executedAt: Timestamp,
  debriefedAt: Timestamp,
  missedAt: Timestamp,
  canceledAt: Timestamp,
  cancelReason: string
}
```

---

## Open Questions to Resolve with Ryan

### A. Rep Taxonomy Confirmation
- [ ] Confirm the 16 rep types are correct
- [ ] Prioritize which rep types to enable in v1 (all 16 or subset?)
- [ ] Define progression (Level 1 → Level 2 → Level 3) for each type

### B. Time Budgets
Fill in the max time per interaction:
- Commitment: ___ seconds (suggest: 60-90 seconds)
- Prep (if used): ___ minutes (suggest: 3-5 minutes)
- Debrief: ___ minutes (suggest: 2-3 minutes)

### C. Avoidance Stance
- Allow "safe reps" early for confidence building, or correct immediately?
- Suggested: Allow first 2 weeks unrestricted, then enforce progression

### D. Debrief Deadline
- What happens if leader marks "executed" but doesn't debrief for 48 hours?
- Suggested: Rep stays in "executed" state, blocks new rep commitment until debriefed

### E. Trainer Alert Threshold
- When should trainers be flagged for human follow-up?
- Suggested: 2+ consecutive missed weeks, OR 3+ low-risk reps in a row

---

## Success Criteria

The enhanced conditioning layer is successful if:

| Metric | Current | Target |
|--------|---------|--------|
| Leaders complete 1+ real rep/week | Unknown | 85%+ |
| Reps increase in difficulty over 8 weeks | Not tracked | Visible progression for 70%+ |
| Trainers use dashboard weekly | Unknown | 90%+ weekly engagement |
| Leaders describe system as "supportive not annoying" | Unknown | 4+/5 rating |
| Evidence is concrete (not generic journal entries) | Mixed | 80%+ structured |
| Missed reps have debrief | Not enforced | 100% |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/services/repTaxonomy.js` | 16 rep types, rubrics, progression |
| `src/components/conditioning/CommitRepFormV2.jsx` | New commitment form with universal fields |
| `src/components/conditioning/MissedRepDebrief.jsx` | Missed rep accountability modal |
| `src/components/conditioning/StructuredEvidenceForm.jsx` | New evidence capture with concrete fields |
| `src/components/admin/CoachPromptsCard.jsx` | Actionable coaching suggestions for trainers |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/conditioningService.js` | New states, progression logic, detection heuristics |
| `src/components/screens/Conditioning.jsx` | Use new rep types, show stretch prompts |
| `src/components/conditioning/EvidenceCaptureModal.jsx` | Integrate structured evidence |
| `src/components/conditioning/RepPrepModal.jsx` | Add risk-based prep questions |
| `src/components/admin/ConditioningDashboard.jsx` | Add coach prompts, pattern flags |

---

## Next Steps

1. **Review this plan with Ryan** - Get sign-off on approach before coding
2. **Answer open questions** - Especially time budgets and avoidance stance
3. **Create conditioning branch** - Ready for implementation
4. **Start Sprint 1** - Rep taxonomy and evidence structure
