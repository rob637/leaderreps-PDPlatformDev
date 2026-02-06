# LeaderReps Platform Blueprint
## A Ground-Up Rebuild for Leadership Development

**Document Version:** 1.0  
**Date:** February 2, 2026  
**Purpose:** Comprehensive plan for rebuilding the LeaderReps platform with clear phase separation

---

## Executive Summary

This document outlines a complete rebuild of the LeaderReps platform, architected around three distinct phases of leader development: **Prep**, **Foundation**, and **Ascent**. The key insight driving this redesign is that Foundation and Ascent serve fundamentally different purposes, require different UX patterns, different engagement models, and different success metrics.

**The Core Distinction:**
- **Foundation** = The Fort (structured, time-bound, high-touch training)
- **Ascent** = The Wilderness (open-ended, self-directed, lifelong growth)

Trying to make one app do both equally well creates the "blended and fuzzy" experience that has plagued previous iterations.

---

## Part 1: Phase Definitions

### 1.1 PREP Phase
**Duration:** 2 weeks before Foundation begins  
**Purpose:** Ensure leaders arrive ready for Day 1

#### What It Is
- Asynchronous, self-paced onboarding
- Assessment and profile building
- Content consumption and workbook access
- Expectation setting

#### Key Activities
| Activity | Required | Format |
|----------|----------|--------|
| Leadership assessments (PDQ, etc.) | Yes | Online forms |
| Leadership Identity profile | Yes | Guided input |
| Watch intro videos | Yes | Video content |
| Access workbook for Session 1 | Yes | PDF/Digital |
| Complete pre-work exercises | Yes | Written/reflective |

#### UX Requirements
- **Platform:** Optimized for PC/laptop (forms, videos, longer exercises)
- **Tone:** Welcoming, professional, preparatory
- **Guidance Level:** High - clear instructions, progress tracking
- **Notifications:** Email-based reminders with deadlines

#### Success Metrics
- Assessment completion rate
- Profile completion rate
- Pre-work completion before Session 1
- Time-to-complete vs. deadline

#### What Prep Is NOT
- Training on leadership skills
- Coach interaction
- Real leadership reps
- Pattern analysis

---

### 1.2 FOUNDATION Phase
**Duration:** Target 4-6 weeks (reduced from 8 weeks for scalability)  
**Purpose:** Build baseline competence and habit formation

> "This person can now function as a capable manager"

#### What It Is
- Time-bound, cohort-based experience
- High-touch, high-structure, high-guidance
- Instructor-led training sessions (synchronous)
- Conditioning layer (asynchronous accountability)
- Teaches **how to lead**

#### The Three Pillars of Foundation

##### Pillar 1: Synchronous Training Sessions
- Live, instructor-led (Ryan/Christina)
- Video-based teaching (scalable content)
- Roleplay and practice
- Socratic exploration
- Social normalization ("everyone's bad at this at first")

##### Pillar 2: Conditioning Layer
- Deliberate practice between sessions
- Real rep accountability (minimum 1/week)
- Evidence capture and quality assessment
- Nudges and escalation logic
- Trainer visibility dashboard

##### Pillar 3: Coach-in-the-Moment (Light Version)
- Prep assistance before real conversations
- Structured prompts, not scripts
- No answer-giving, questions only
- Routes back to action

#### Foundation Content Modules
1. **Clear Feedback Framework** - Core skill, practiced extensively
2. **1:1 Structure and Execution** - Regular touchpoint discipline
3. **Tension/Conflict Navigation** - Difficult conversation handling
4. **Leadership Identity** - Self-awareness foundation
5. **Accountability Conversations** - Commitment and follow-through

#### UX Requirements
- **Platform:** Hybrid - sessions on any device, conditioning mobile-optimized
- **Tone:** Instructional, encouraging, structured
- **Guidance Level:** Very high - clear expectations, deadlines, feedback
- **Notifications:** Daily nudges, weekly rep reminders, session reminders

#### The Conditioning Layer - Detailed Specification

##### A. Weekly Rep Commitment (Core Rule)
```
Requirement: Each leader completes ≥ 1 real leadership rep per week
- Completing early does NOT require another
- Additional reps are optional
- System never forces "always-on" active reps
```

**Rep Definition Requirements:**
- Person (who)
- Rep type (feedback / 1:1 / tension / other)
- Deadline (defaults to end of week)

**Rep Rules:**
- Leaders MAY edit a rep
- Leaders MAY add additional reps
- Leaders MAY NOT delete a rep to avoid it
- Cancellation requires stated reason (e.g., person left role)

**Missed Rep Logic:**
```
If rep not completed by deadline:
  → Status = "Missed"
  → Rep rolls forward to next week
  → Leader must recommit or cancel with reason
```

##### B. Rep Prep (Optional)
- Voice or written input
- Short, structured prompts:
  - Opening language
  - Behavior to address
  - Commitment to request
- **NO rewriting by AI**
- **NO validation**
- **NO suggested scripts**

##### C. Rep Status Tracking
| Status | Description |
|--------|-------------|
| Active | In progress, not yet completed |
| Completed | Finished and debriefed |
| Missed | Past deadline, still active |
| Canceled | Rare, reason required |

Weekly requirement turns **green** once ≥1 rep completed.

##### D. Evidence Capture & Debrief
**Required after each real rep**

Input: Voice or written

Structured prompts:
1. What I said (actual language or close paraphrase)
2. How the other person responded
3. What commitment (if any) was made
4. What I'd do differently next time

**Evidence Levels:**
- **Level 1:** Submitted same business day (preferred)
- **Level 2:** Submitted ≥24 hours later (different prompt set)

##### E. Rep Quality Assessment
System-owned first-pass check against Clear Framework rubric:

**Checks for presence of:**
- Specific language
- Clear request
- Named commitment (or explicit absence)
- Reflection

**Outcomes:**
- Meets standard ✓
- Does not meet standard (dimensions shown)

**Retry Logic:**
- No re-doing real conversations
- If below standard:
  - Practice retry (written or voice), OR
  - Next rep must explicitly target missing dimension

##### F. Nudges & Escalation
```
Week 1: Light nudges
Week 2+ consecutive misses: Pattern named to leader
3+ weeks pattern: Trainer flagged for human follow-up
```

##### G. Trainer Visibility Dashboard
| Data Point | Visibility |
|------------|------------|
| Reps per leader | Full |
| Completion / missed status | Full |
| Evidence timeliness (L1 vs L2) | Full |
| Quality flags by dimension | Full |
| Repeated patterns | Full |

##### H. Rep History
- Persists for entire time in LR ecosystem
- Accessible to: Leader + Trainers

#### Foundation Success Metrics
| Metric | Target |
|--------|--------|
| Session attendance | 90%+ |
| Weekly rep completion | 85%+ |
| Evidence submission rate | 80%+ |
| Quality assessment "meets standard" | 70%+ by week 4 |
| Practice attempt rate | 100% |

#### The Graduation Moment
**What signals "ready to leave the fort":**
- Completed all Foundation sessions
- Demonstrated feedback rep meeting quality standard
- Self-authored leadership identity statement
- Trainer sign-off on readiness
- Confidence + competence threshold met

#### What Foundation Is NOT
- Long-term pattern detection
- Career narratives
- Monthly summaries
- Deep analytics
- Self-directed exploration
- Heavy AI coaching

---

### 1.3 ASCENT Phase
**Duration:** Open-ended, lifelong  
**Purpose:** Continuous growth and self-improvement

> "This person keeps getting better without us pushing them"

#### What It Is
- Self-directed, pull-based engagement
- Lightweight, reflective, adaptive
- Helps leaders continue becoming
- Optimizes for self-awareness + pattern recognition + growth over time
- **Assumes baseline competence from Foundation**

#### Core Assumptions About Ascent Users
- Leader already knows what good looks like
- Leader can recognize moments worth logging
- Leader has baseline feedback literacy
- Leader can self-direct reflection
- Leader wants insight, not instruction

#### Ascent Components

##### 1. Continued Conditioning (Evolved)
- Rep logging continues (self-directed pace)
- Evidence capture (lighter prompts)
- Quality self-assessment
- Pattern recognition over time

##### 2. Coach-in-Your-Pocket (Full Version)
- Real-time prep assistance
- Post-conversation debrief
- Situation analysis
- Pattern surfacing
- **Still no answer-giving** - questions that prompt leader to do the work

##### 3. Community Events (Monthly)
| Event Type | Description | Duration |
|------------|-------------|----------|
| Training Sessions | New skill introduction | 60 min |
| Conditioning Sessions | Practice and accountability | 60 min |
| Peer Processing | Group reflection and sharing | 60 min |

**Total monthly commitment:** ~3 hours

##### 4. Pattern Recognition Engine
- Longitudinal analysis of reps
- Friction pattern identification
- Confidence calibration tracking
- Feedback quality trending
- Identity stability monitoring

#### UX Requirements
- **Platform:** Mobile-first (lightweight, in-the-moment)
- **Tone:** Adult, respectful, non-directive
- **Guidance Level:** Low - autonomy is sacred
- **Notifications:** Minimal, pull-based, user-controlled

#### Ascent Success Metrics
| Metric | Timeframe |
|--------|-----------|
| Pattern shift indicators | Quarterly |
| Friction resolution rate | Monthly |
| Confidence calibration | Quarterly |
| Feedback quality improvement | Monthly |
| Identity stability score | Quarterly |
| Voluntary engagement rate | Monthly |

#### What Ascent Is NOT
- Training or instruction (that's Foundation)
- High-touch guidance
- Prescriptive next steps
- Required daily engagement
- Comparison with others (except anonymized/optional)

---

## Part 2: Coach-in-Your-Pocket Specification

### 2.1 Core Philosophy
**On the spectrum from:**
- "I'll tell you exactly what to say" → "Figure it out yourself"

**We fall toward the "figure it out" end, WITH guidance:**
- Uses rubrics (Clear Framework) as assessment
- Asks questions that prompt the leader to do the work
- Never does the work for the leader
- Never rewrites their language
- Never gives the answer

### 2.2 Interaction Flow (Example: Redirecting Feedback)

```
User: [Opens app, selects "Give Redirecting Feedback"]

Coach: Great. Tell me about the scenario.
       - Who are you giving feedback to?
       - What observable behaviors have you noticed?

User: [Provides scenario via voice or text]

Coach: Using the Clear Framework, let's break this down.
       - What specific, observable behaviors will you address?
       - Do they pass the camera test?

User: [Describes behaviors]

Coach: [Assesses against Clear Framework rubric]
       - If meets standard: "Solid. What commitment will you ask for?"
       - If doesn't meet: "Think about your observable behaviors. 
         Does 'being disrespectful' pass the camera test? 
         What would a camera actually capture?"

User: [Refines their approach]

Coach: What's your opening line going to be?

User: [States opening]

Coach: [Does NOT rewrite]
       You're ready. Go have the conversation.
       Come back and debrief when you're done.
```

### 2.3 Guardrails (Critical)
- Cannot complete reps for the user
- Cannot mark reps as done
- Cannot reduce requirements
- Always routes back to action
- Never rescues or jumps in with answers
- Maintains Clear Framework standards

### 2.4 Behavior Drift Prevention
**Known Issue:** AI tends to become "overly nice" and agreeable over time

**Mitigation Strategies:**
- Regular system prompt reinforcement
- Clear rubric-based assessment (not subjective)
- User feedback mechanism for AI behavior
- Weekly reset/recalibration checks
- Explicit instruction for "radical candor" in prompts

---

## Part 3: Technical Architecture

### 3.1 Platform Decision: One App or Three?

**Recommendation:** One app with three distinct "modes" or "paths"

**Rationale:**
- Single sign-on and identity
- Unified data model (rep history flows from Foundation to Ascent)
- Different UX surfaces within same shell
- Easier maintenance and deployment
- Natural progression through phases

**Implementation:**
```
LeaderReps App
├── Prep Mode (pre-Foundation)
│   └── Desktop-optimized web experience
├── Foundation Mode (during program)
│   ├── Session content (web)
│   ├── Conditioning (mobile-optimized)
│   └── Coach-in-Moment (mobile)
└── Ascent Mode (post-Foundation)
    ├── Ongoing conditioning (mobile)
    ├── Full Coach-in-Pocket (mobile)
    └── Community events (web/calendar)
```

### 3.2 Core Entities (ERD Concepts)

```
┌─────────────────┐     ┌─────────────────┐
│     Leader      │────→│     Cohort      │
│                 │     │                 │
│ - profile       │     │ - start_date    │
│ - identity      │     │ - trainer       │
│ - phase         │     │ - sessions[]    │
└────────┬────────┘     └─────────────────┘
         │
         │ has many
         ▼
┌─────────────────┐     ┌─────────────────┐
│      Rep        │────→│    Evidence     │
│                 │     │                 │
│ - person        │     │ - content       │
│ - type          │     │ - level (1/2)   │
│ - deadline      │     │ - submitted_at  │
│ - status        │     │ - quality_score │
└─────────────────┘     └─────────────────┘
         │
         │ may have
         ▼
┌─────────────────┐
│    RepPrep      │
│                 │
│ - opening       │
│ - behavior      │
│ - commitment    │
└─────────────────┘
```

### 3.3 Module Breakdown

| Module | Built? | Status | Notes |
|--------|--------|--------|-------|
| Content Management | ✓ | Arena | Reusable |
| User/Leader Management | ✓ | Arena | Reusable |
| Assessments | ✓ | Arena | Reusable |
| Calendar/Events | ✗ | New | Registration system needed |
| Rep Tracking | Partial | Rebuild | Core conditioning layer |
| Evidence Capture | ✗ | New | Voice + text |
| Quality Assessment | ✗ | New | Rubric-based AI |
| Trainer Dashboard | ✗ | New | Visibility layer |
| Coach-in-Pocket | ✗ | New | Guardrailed AI |
| Pattern Recognition | ✗ | New | Ascent feature |
| Community Events | ✗ | New | Ascent feature |

### 3.4 Data Flow

```
PREP                    FOUNDATION                 ASCENT
─────                   ──────────                 ──────
Assessments ──────────→ Leader Profile ──────────→ Ongoing Profile
                              │
                              ▼
                        Rep Commitment
                              │
                        ┌─────┴─────┐
                        │           │
                        ▼           ▼
                    Rep Prep    Real Rep
                        │           │
                        │     ┌─────┴─────┐
                        │     │           │
                        │     ▼           ▼
                        │  Evidence    Debrief
                        │     │           │
                        │     └─────┬─────┘
                        │           │
                        │           ▼
                        │     Quality Assessment
                        │           │
                        │           ▼
                        └────→ Rep History ──────→ Pattern Analysis
                                    │
                                    ▼
                           Trainer Dashboard
```

---

## Part 4: Implementation Roadmap

### Phase 1: Core Accountability (MVP)
**Timeline:** 4-6 weeks  
**Outcome:** Accountability works even with no prep or reflection

| Feature | Priority | Effort |
|---------|----------|--------|
| Weekly Rep Commitment | P0 | M |
| Rep Status & Deadlines | P0 | M |
| Missed Rep Logic | P0 | S |
| Basic Nudges | P0 | S |
| Trainer Visibility (basic) | P0 | M |

**Exit Criteria:**
- Leaders can commit to weekly reps
- System tracks completion/misses
- Trainers can see who's on track

### Phase 2: Rep Quality & Learning
**Timeline:** 4-6 weeks  
**Outcome:** Rep quality and learning speed improve

| Feature | Priority | Effort |
|---------|----------|--------|
| Evidence Capture (text + voice) | P0 | M |
| Level 1 vs Level 2 Logic | P1 | S |
| Quality Assessment Engine | P0 | L |
| Dimension Feedback | P0 | M |
| Practice Retry Flow | P1 | M |

**Exit Criteria:**
- Leaders submit evidence after reps
- AI assesses against Clear Framework
- Below-standard reps get actionable feedback

### Phase 3: Pattern Recognition
**Timeline:** 3-4 weeks  
**Outcome:** Facilitators get signal without chasing

| Feature | Priority | Effort |
|---------|----------|--------|
| Pattern Detection | P0 | L |
| Trainer Flagging | P0 | M |
| Leader Pattern Visibility | P1 | M |

**Exit Criteria:**
- System identifies avoidance patterns
- Trainers flagged for intervention
- Leaders see their own patterns

### Phase 4: Assistive Support
**Timeline:** 4-6 weeks  
**Outcome:** Better prep/reflection without human time

| Feature | Priority | Effort |
|---------|----------|--------|
| Coach-in-Pocket (guardrailed) | P0 | L |
| Prep Flow | P0 | M |
| Debrief Flow | P0 | M |
| Behavior Drift Prevention | P1 | M |

**Exit Criteria:**
- Leaders can prep conversations with AI
- AI follows guardrails strictly
- No answer-giving, only questions

### Phase 5: Ascent Features
**Timeline:** 6-8 weeks  
**Outcome:** Post-Foundation engagement system

| Feature | Priority | Effort |
|---------|----------|--------|
| Community Event Calendar | P0 | M |
| Event Registration | P0 | M |
| Ongoing Rep Tracking | P0 | S |
| Full Pattern Engine | P0 | L |
| Longitudinal Analytics | P1 | L |

---

## Part 5: Lessons Learned (Arena & Preppy)

### What Worked
1. **Content Management System** - Reusable, well-structured
2. **Assessment Integration** - PDQ and profile building solid
3. **Firebase/Firestore Foundation** - Scalable data layer
4. **User Management Basics** - Authentication, profiles work

### What to Avoid
1. **Feature Creep** - Adding Ascent features to Foundation UX
2. **Blended Phases** - Unclear when user is in which phase
3. **Over-engineering** - Building for scale before product-market fit
4. **AI Overpromising** - Chatbot giving answers instead of questions

### Design Principles for Rebuild

1. **Phase Clarity First**
   - User always knows which phase they're in
   - Features appropriate to phase only
   - Clear graduation moments

2. **Mobile-First for Action, Desktop for Learning**
   - Prep/content consumption: Desktop
   - Real-time coaching: Mobile
   - Evidence capture: Mobile
   - Trainer dashboard: Desktop

3. **Accountability Before Features**
   - Core rep tracking must work perfectly
   - Don't add coach-in-pocket until basics solid
   - Trainer visibility is non-negotiable

4. **AI as Coach, Not Oracle**
   - Questions, not answers
   - Rubrics, not opinions
   - Routes to action, not dependency

5. **Scalability Through Conditioning**
   - Live sessions can shrink if conditioning works
   - Video teaching + AI conditioning = trainer leverage
   - Community events replace some 1:1 touch

---

## Part 6: Pricing & Business Model Alignment

### Current Structure
| Product | Price | Duration |
|---------|-------|----------|
| Foundation | $3,000 | 4-6 weeks |
| Foundation + Ascent (12 mo) | $4,500 | ~14 months |

### Recommended Approach
1. **Sell Foundation at $3,000**
2. **Offer Ascent as free trial** (while building it out)
3. **2027:** Price Ascent separately once proven
4. **Early cohorts:** Longer free Ascent access as incentive

### Fill Strategy for Early Cohorts
- Scholarship sponsorships for key connectors
- Reduced rate ($500) for sponsored seats
- "Coaching the Coaches" workshop as lead gen
- Association presentations for exposure

---

## Part 7: Critical Design Decisions

### Decision 1: Foundation Duration
**Options:**
- 8 weeks (current) - Too long, scaling issue
- 6 weeks - Moderate reduction
- 4 weeks - Aggressive, requires excellent conditioning

**Recommendation:** Start with 6 weeks, iterate based on:
- Can we move content to video effectively?
- Does conditioning actually create behavior change?
- What's the minimum viable live touch?

### Decision 2: Session Reduction Candidates
- Week 5: Confirmed removable
- Week 6 or 7: One likely removable
- Remaining: Cannot reduce without quality loss

### Decision 3: One App vs. Multiple
**Recommendation:** One app, three modes

### Decision 4: Trainer Dashboard MVP
Start with:
- Completion/miss rates per leader
- Evidence timeliness
- Quality flags

Add later:
- Pattern detection
- Predictive indicators

---

## Appendix A: Clear Framework Rubric

For AI quality assessment, the Clear Framework checks:

| Component | Definition | Camera Test |
|-----------|------------|-------------|
| **C**ontext | Set the stage | N/A |
| **L**anguage | Observable behavior | Must be specific |
| **E**vidence | What you saw/heard | Passes camera test |
| **A**nchor | Impact/why it matters | Connects to goal |
| **R**equest | What you need | Clear commitment |

**Quality Assessment Logic:**
```
IF evidence.passes_camera_test 
   AND request.is_specific 
   AND anchor.connects_to_impact
THEN quality = "meets_standard"
ELSE quality = "below_standard"
     flag dimensions that failed
```

---

## Appendix B: Notification Cadence

### Foundation Phase
| Trigger | Message Type | Channel |
|---------|--------------|---------|
| No rep committed by Tuesday | Nudge | Push/SMS |
| Deadline approaching (24h) | Reminder | Push |
| Rep completed | Celebration | Push |
| Rep missed | Roll-forward notice | Push/Email |
| 2 weeks consecutive miss | Pattern flag | Email |
| Session reminder (24h) | Calendar | Email/Push |

### Ascent Phase
| Trigger | Message Type | Channel |
|---------|--------------|---------|
| Monthly event reminder | Calendar | Email |
| Pattern insight available | Insight | Push (optional) |
| Community event live | Alert | Push (optional) |

---

## Appendix C: Voice Input Specifications

### Evidence Capture Voice Flow
1. User taps "Record Debrief"
2. System prompts: "Tell me what happened"
3. User speaks freely (no time limit)
4. Speech-to-text transcription
5. AI parses into structured debrief:
   - What was said
   - Response received
   - Commitment made
   - Reflection
6. User confirms/edits
7. Quality assessment runs

### Technical Requirements
- Real-time transcription
- Speaker diarization (optional, for future)
- Offline capability for capture, sync later
- Privacy: Audio not stored, only transcript

---

## Next Steps

1. **Ryan:** Finalize Foundation session structure (which sessions can be cut/combined)
2. **Ryan:** Complete conditioning layer detailed specs (send to Rob)
3. **Rob:** Begin Phase 1 build (Core Accountability)
4. **Rob:** Identify reusable Arena components
5. **Team:** Define graduation criteria precisely
6. **Team:** Create Foundation Promise and Ascent Promise (one paragraph each)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-02 | Rob/Claude | Initial comprehensive plan |

---

*"Foundation should feel like: 'I'm learning how to do this.'  
Ascent should feel like: 'I'm learning how I do this.'"*
