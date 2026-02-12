# The LeaderReps Companion
## The Definitive Leadership Operating System

> **Version:** 3.0 FINAL  
> **Date:** January 27, 2026  
> **Contributors:** Rob (Vision), Cristina (Philosophy), Jeff (Utility), Ryan (Skill Measurement)  
> **Status:** The plan. The only plan.

---

## Why This Must Be World-Class

Leadership development is broken. Not a little broken—fundamentally broken.

$366 billion is spent annually on corporate training. 90% of it has no measurable impact. Leaders attend workshops, read books, complete courses—and nothing changes. The knowing-doing gap persists because **we've been measuring the wrong things, at the wrong times, in the wrong ways.**

This app doesn't fix leadership development. It replaces it with something that actually works.

---

## The Foundational Insight

Leadership isn't a skill you learn. It's a **capability system** that develops through:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     EXPERIENCE  ──────►  REFLECTION  ──────►  PATTERN RECOGNITION          │
│         │                    │                       │                      │
│         │                    │                       │                      │
│         ▼                    ▼                       ▼                      │
│                                                                             │
│     CHALLENGE   ◄──────  IDENTITY SHIFT  ◄──────  BEHAVIORAL CHANGE        │
│                                                                             │
│                                                                             │
│     This is a FLYWHEEL. It compounds. Over months and years, small         │
│     shifts become transformational capability growth.                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**The app's job is to accelerate this flywheel—to make it spin faster and more consistently than it would naturally.**

---

## The Architecture of Excellence

### Three Engines, One System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                      THE LEADERREPS COMPANION                               │
│                                                                             │
│          "The system that makes leadership development actually work"       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │                    ENGINE 1: CAPTURE                                  │ │
│  │                    ─────────────────                                  │ │
│  │                                                                       │ │
│  │    The Memory Layer                                                   │ │
│  │    Every leadership moment, preserved and structured                  │ │
│  │                                                                       │ │
│  │    • Decisions made                                                   │ │
│  │    • Feedback given                                                   │ │
│  │    • Friction experienced                                             │ │
│  │    • Wins achieved                                                    │ │
│  │    • Conversations had                                                │ │
│  │    • Skills practiced                                                 │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │                    ENGINE 2: INTELLIGENCE                             │ │
│  │                    ──────────────────────                             │ │
│  │                                                                       │ │
│  │    The Pattern Layer                                                  │ │
│  │    AI that sees what humans can't see about themselves                │ │
│  │                                                                       │ │
│  │    • Pattern detection across time                                    │ │
│  │    • Skill development trajectory (Ryan's model)                      │ │
│  │    • Emotional regulation mapping                                     │ │
│  │    • Decision quality analysis                                        │ │
│  │    • Relationship health tracking                                     │ │
│  │    • Growth prediction                                                │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │                    ENGINE 3: EVOLUTION                                │ │
│  │                    ───────────────────                                │ │
│  │                                                                       │ │
│  │    The Growth Layer                                                   │ │
│  │    Evidence of transformation, not just activity                      │ │
│  │                                                                       │ │
│  │    • Skill mastery progression                                        │ │
│  │    • Identity evolution                                               │ │
│  │    • Capability compound effect                                       │ │
│  │    • Leadership fingerprint                                           │ │
│  │    • Predictive development                                           │ │
│  │    • Legacy documentation                                             │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ENGINE 1: CAPTURE

### The Memory Layer

**Purpose:** Create a complete, structured record of the leader's journey.

**Philosophy:** You can't improve what you can't remember. And humans are terrible at remembering accurately. The app becomes an extension of the leader's memory—capturing moments in real-time so they can be analyzed, connected, and learned from.

### The Six Moment Types

| Moment | What It Captures | Why It Matters |
|--------|------------------|----------------|
| **Decision** | Choices made under uncertainty | Leadership is fundamentally about decisions |
| **Feedback** | Communication given to others | The primary lever for developing teams |
| **Friction** | Struggles, tensions, challenges | Where growth opportunities live |
| **Win** | Successes and achievements | Evidence of capability in action |
| **1:1** | Structured conversations | The atomic unit of management |
| **Skill Practice** | Deliberate practice moments | Ryan's insight: track skill development explicitly |

### 1. DECISION Moment

```typescript
interface DecisionMoment {
  // Core capture (30 seconds)
  description: string;              // "Promoted Sarah to team lead"
  confidence: 1 | 2 | 3 | 4 | 5;   // Self-rated confidence
  stakes: 'low' | 'medium' | 'high';
  
  // AI-enriched (automatic)
  decisionType: DecisionType;       // people, process, strategy, conflict, delegation, etc.
  aiConfidenceScore: number;        // 0-100 from language analysis
  emotionalTone: EmotionalTone;     // confident, anxious, conflicted, etc.
  certaintyMarkers: string[];       // Words indicating certainty/doubt
  relatedDecisions: string[];       // Similar past decisions
  skillsInvolved: SkillTag[];       // Which leadership skills were exercised
  
  // Outcome tracking (added later)
  outcome?: {
    status: 'pending' | 'positive' | 'negative' | 'mixed' | 'unknown';
    reflection?: string;
    lessonsLearned?: string[];
    wouldDoAgain?: boolean;
    recordedAt: Date;
  };
  
  // Longitudinal (system tracks over time)
  decisionQualityScore?: number;    // Based on process + outcome + learning
  comparedToSimilar?: string;       // How this compares to past similar decisions
}

enum DecisionType {
  PEOPLE = 'people',
  PROCESS = 'process',
  STRATEGY = 'strategy',
  RESOURCE = 'resource',
  CONFLICT = 'conflict',
  DELEGATION = 'delegation',
  BOUNDARY = 'boundary',
  COMMUNICATION = 'communication',
  RISK = 'risk',
  PRIORITY = 'priority'
}
```

### 2. FEEDBACK Moment

```typescript
interface FeedbackMoment {
  // Core capture (30 seconds)
  recipient: string;                // Person or "Team"
  feedbackType: 'positive' | 'constructive' | 'mixed';
  description?: string;             // What was said
  deliveryConfidence: 1 | 2 | 3 | 4 | 5;
  
  // AI-enriched (automatic)
  feedbackCategory: FeedbackCategory;
  specificityScore: number;         // 0-100: concrete vs vague
  actionabilityScore: number;       // 0-100: clear next steps
  emotionalSafety: number;          // 0-100: how safe was the delivery
  skillsInvolved: SkillTag[];
  
  // Relationship tracking
  runningRatio: number;             // Positive:constructive with this person
  relationshipHealth: number;       // 0-100 based on feedback patterns
  
  // Outcome (optional)
  perceivedReception?: 'positive' | 'neutral' | 'negative' | 'unknown';
  observedChange?: string;          // Did behavior change?
}
```

### 3. FRICTION Moment

```typescript
interface FrictionMoment {
  // Core capture (45 seconds)
  description: string;
  primaryEmotion: Emotion;
  emotionalIntensity: 1 | 2 | 3 | 4 | 5;
  
  // AI-enriched (automatic)
  frictionCategory: FrictionCategory;
  rootCauseHypothesis: string;      // AI's guess at underlying cause
  relatedFriction: string[];        // Similar past friction
  triggerPatterns: string[];        // Recurring triggers
  skillGaps: SkillTag[];            // Skills that would help
  
  // Resolution tracking
  resolution?: {
    status: 'unresolved' | 'partially_resolved' | 'resolved' | 'accepted';
    whatHelped?: string;
    timeToResolve?: number;         // Days
    recurringRisk: number;          // 0-100: likelihood of recurrence
  };
}

enum FrictionCategory {
  DELEGATION = 'delegation',
  CONFLICT_AVOIDANCE = 'conflict_avoidance',
  DIFFICULT_CONVERSATION = 'difficult_conversation',
  OVERCOMMITMENT = 'overcommitment',
  BOUNDARY_VIOLATION = 'boundary_violation',
  TEAM_DYNAMICS = 'team_dynamics',
  UPWARD_MANAGEMENT = 'upward_management',
  IMPOSTER_SYNDROME = 'imposter_syndrome',
  PERFECTIONISM = 'perfectionism',
  CONTROL = 'control',
  COMMUNICATION_BREAKDOWN = 'communication_breakdown',
  TRUST = 'trust',
  ACCOUNTABILITY = 'accountability',
  PRIORITY_CONFLICT = 'priority_conflict',
  EMOTIONAL_REGULATION = 'emotional_regulation'
}
```

### 4. WIN Moment

```typescript
interface WinMoment {
  // Core capture (20 seconds)
  description: string;
  significance: 'small' | 'medium' | 'big';
  yourRole: 'led' | 'contributed' | 'enabled' | 'observed';
  whoContributed?: string[];
  
  // AI-enriched (automatic)
  winCategory: WinCategory;
  leadershipBehaviors: string[];    // What leadership actions made this happen
  skillsDemonstrated: SkillTag[];
  
  // Growth connection (crucial)
  relatedFriction?: string[];       // Connects to previous struggles
  growthEvidence?: string;          // How this shows development
}
```

### 5. ONE-ON-ONE Moment

```typescript
interface OneOnOneMoment {
  // Identity
  withPerson: string;
  phase: 'prep' | 'complete';
  
  // Prep phase
  prep?: {
    intention: string;              // "Address the deadline concern"
    questionsToAsk?: string[];
    feedbackToGive?: string;
    topicsToAvoid?: string[];       // Awareness of avoidance
    energyGoingIn: 1 | 2 | 3 | 4 | 5;
    
    // AI-suggested (based on history)
    suggestedTopics: string[];
    openThreads: string[];          // Unresolved from previous 1:1s
    relationshipContext: string;    // Summary of recent interactions
  };
  
  // Complete phase
  complete?: {
    howItWent: 1 | 2 | 3 | 4 | 5;
    intentionMet: 'yes' | 'partially' | 'no';
    feedbackGiven: boolean;
    difficultTopicAddressed: boolean;
    surprises?: string;
    followUps: string[];
    energyAfter: 1 | 2 | 3 | 4 | 5;
    keyTakeaway?: string;
  };
  
  // AI analysis
  analysis?: {
    conversationEffectiveness: number;  // 0-100
    relationshipTrend: 'improving' | 'stable' | 'declining';
    avoidanceDetected?: string[];
    suggestionsForNext: string[];
  };
}
```

### 6. SKILL PRACTICE Moment (Ryan's Contribution)

This is the key to measuring skill development over time.

```typescript
interface SkillPracticeMoment {
  // Core capture (30 seconds)
  skill: SkillTag;                  // Which skill was practiced
  context: string;                  // The situation
  practiceType: 'intentional' | 'situational';  // Planned vs. arose naturally
  
  // Self-assessment
  executionQuality: 1 | 2 | 3 | 4 | 5;  // How well did you execute?
  comfortLevel: 1 | 2 | 3 | 4 | 5;      // How natural did it feel?
  
  // AI-enriched
  behavioralEvidence: string[];     // Specific behaviors demonstrated
  comparedToBaseline: string;       // How this compares to early attempts
  skillStageIndicator: SkillStage;  // Where they are in skill development
  
  // Outcome
  outcome?: {
    effective: boolean;
    whatWorked?: string;
    whatToAdjust?: string;
  };
}

// Ryan's Skill Development Model
enum SkillStage {
  UNCONSCIOUS_INCOMPETENCE = 'unconscious_incompetence',  // Don't know what you don't know
  CONSCIOUS_INCOMPETENCE = 'conscious_incompetence',      // Aware of the gap
  CONSCIOUS_COMPETENCE = 'conscious_competence',          // Can do it with effort
  UNCONSCIOUS_COMPETENCE = 'unconscious_competence'       // Natural/automatic
}

// The skill taxonomy
enum SkillTag {
  // Foundational
  ACTIVE_LISTENING = 'active_listening',
  CLEAR_COMMUNICATION = 'clear_communication',
  GIVING_FEEDBACK = 'giving_feedback',
  RECEIVING_FEEDBACK = 'receiving_feedback',
  ASKING_QUESTIONS = 'asking_questions',
  
  // Team Leadership
  DELEGATION = 'delegation',
  COACHING = 'coaching',
  RECOGNITION = 'recognition',
  ACCOUNTABILITY = 'accountability',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  DIFFICULT_CONVERSATIONS = 'difficult_conversations',
  MOTIVATION = 'motivation',
  TEAM_BUILDING = 'team_building',
  
  // Strategic
  DECISION_MAKING = 'decision_making',
  PRIORITIZATION = 'prioritization',
  STRATEGIC_THINKING = 'strategic_thinking',
  PROBLEM_SOLVING = 'problem_solving',
  CHANGE_LEADERSHIP = 'change_leadership',
  
  // Self-Management
  EMOTIONAL_REGULATION = 'emotional_regulation',
  STRESS_MANAGEMENT = 'stress_management',
  BOUNDARY_SETTING = 'boundary_setting',
  SELF_AWARENESS = 'self_awareness',
  PRESENCE = 'presence',
  
  // Influence
  PERSUASION = 'persuasion',
  STAKEHOLDER_MANAGEMENT = 'stakeholder_management',
  EXECUTIVE_PRESENCE = 'executive_presence',
  BUILDING_TRUST = 'building_trust',
  MANAGING_UP = 'managing_up'
}
```

---

## ENGINE 2: INTELLIGENCE

### The Pattern Layer

**Purpose:** See what humans can't see about themselves.

**Philosophy:** The brain is wired to protect the ego. We rationalize, forget selectively, and miss patterns that are obvious to outside observers. The AI has no ego. It sees everything, connects everything, and reflects it back without judgment.

### The Five Intelligence Systems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    INTELLIGENCE ARCHITECTURE                                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. PATTERN DETECTION                                               │   │
│  │  ─────────────────────                                              │   │
│  │  • Recurring friction themes                                        │   │
│  │  • Person-specific tensions                                         │   │
│  │  • Time-based patterns (Monday friction, Friday wins)               │   │
│  │  • Emotional escalation trends                                      │   │
│  │  • Avoidance behaviors                                              │   │
│  │  • Decision type preferences/aversions                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  2. SKILL TRAJECTORY (Ryan's Model)                                 │   │
│  │  ──────────────────────────────────                                 │   │
│  │  • Current stage for each skill                                     │   │
│  │  • Progression velocity                                             │   │
│  │  • Practice frequency and quality                                   │   │
│  │  • Contextual competence (skill varies by situation)                │   │
│  │  • Skill interdependencies                                          │   │
│  │  • Development readiness                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  3. DECISION QUALITY ANALYSIS                                       │   │
│  │  ────────────────────────────────                                   │   │
│  │  • Process quality (how they decided)                               │   │
│  │  • Outcome tracking (what happened)                                 │   │
│  │  • Confidence calibration (self vs reality)                         │   │
│  │  • Decision type strengths/weaknesses                               │   │
│  │  • Speed vs quality tradeoffs                                       │   │
│  │  • Learning from decisions                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  4. RELATIONSHIP HEALTH                                             │   │
│  │  ──────────────────────                                             │   │
│  │  • Feedback ratios per person                                       │   │
│  │  • 1:1 effectiveness trends                                         │   │
│  │  • Friction concentration                                           │   │
│  │  • Trust indicators                                                 │   │
│  │  • Investment balance (who gets attention)                          │   │
│  │  • Relationship trajectory                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  5. EMOTIONAL INTELLIGENCE MAP                                      │   │
│  │  ─────────────────────────────────                                  │   │
│  │  • Emotional range (what emotions surface)                          │   │
│  │  • Trigger patterns (what causes what)                              │   │
│  │  • Recovery time (how long emotions linger)                         │   │
│  │  • Regulation effectiveness                                         │   │
│  │  • Emotional impact on decisions                                    │   │
│  │  • Growth in emotional capacity                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ryan's Skill Development Tracking Model

This is the breakthrough that makes skill evaluation rigorous:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    SKILL DEVELOPMENT FRAMEWORK                              │
│                         (Ryan's Model)                                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SKILL: Difficult Conversations                                             │
│                                                                             │
│  STAGE PROGRESSION:                                                         │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │ UNCONSCIOUS │    │  CONSCIOUS  │    │  CONSCIOUS  │    │ UNCONSCIOUS │ │
│  │INCOMPETENCE │───►│INCOMPETENCE │───►│ COMPETENCE  │───►│ COMPETENCE  │ │
│  │             │    │             │    │             │    │             │ │
│  │"I don't see │    │"I know I    │    │"I can do it │    │"It's just   │ │
│  │ the issue"  │    │ avoid these"│    │ if I try"   │    │ who I am"   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                                             │
│  EVIDENCE MARKERS:                                                          │
│                                                                             │
│  Stage 1 → 2: First friction logged about avoidance                        │
│  Stage 2 → 3: First successful difficult conversation logged               │
│  Stage 3 → 4: Multiple successes, decreasing prep time, natural comfort    │
│                                                                             │
│  MEASUREMENT:                                                               │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Frequency:     How often skill is practiced                        │  │
│  │  Quality:       Self-rated + AI-assessed execution                  │  │
│  │  Comfort:       Reported ease/naturalness                           │  │
│  │  Outcomes:      Did the practice achieve its goal?                  │  │
│  │  Transfer:      Does skill show up in new contexts?                 │  │
│  │  Recovery:      How quickly do they bounce back from poor execution?│  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  SKILL DEVELOPMENT SCORE (0-100):                                          │
│                                                                             │
│  Current: 62/100 (Conscious Competence, advancing)                         │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ████████████████████████████████████████████████████████░░░░░░░░░░░ │  │
│  │ 0        25        50        75        100                          │  │
│  │          │         │         │                                      │  │
│  │         UI       CI        CC        UC                             │  │
│  │                            ▲                                        │  │
│  │                         You are here                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  TRAJECTORY: +8 points over 6 weeks (Strong growth)                        │
│                                                                             │
│  EVIDENCE:                                                                  │
│  • Week 1: Avoided conversation with Marcus (friction logged)              │
│  • Week 3: Had conversation with Marcus, "awkward but did it" (practice)   │
│  • Week 5: Had conversation with Sarah, "felt more natural" (practice)     │
│  • Week 6: Initiated hard conversation proactively (skill practice)        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Confidence Calibration System

**The gap between how confident you feel and how confident you should be is one of the most important things to track.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    CONFIDENCE CALIBRATION                                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  THREE-LAYER MEASUREMENT:                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 1: SELF-REPORT                                               │   │
│  │  "How confident are you?" (1-5)                                     │   │
│  │  Captures: In-the-moment feeling                                    │   │
│  │  Limitation: Subject to ego, mood, recency bias                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 2: AI INFERENCE                                              │   │
│  │  Language analysis for certainty markers                            │   │
│  │  Captures: Unconscious signals of confidence/doubt                  │   │
│  │  Factors: Hedging words, justification depth, emotional tone        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 3: BEHAVIORAL EVIDENCE                                       │   │
│  │  What actually happened over time                                   │   │
│  │  Captures: Outcome quality, similar past decisions, pattern match   │   │
│  │  This is the ground truth                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CALIBRATION SCORE:                                                         │
│                                                                             │
│  Perfect calibration: Self-report ≈ AI inference ≈ Outcomes                │
│                                                                             │
│  Common patterns:                                                           │
│  • Overconfident: Self > AI > Outcomes (Dunning-Kruger territory)          │
│  • Underconfident: Self < AI < Outcomes (Imposter syndrome)                │
│  • Well-calibrated: All three align (The goal)                             │
│                                                                             │
│  YOUR CALIBRATION (January):                                                │
│                                                                             │
│  People decisions:    Self: 4.2  AI: 3.8  Outcomes: 3.5  [Slightly over]   │
│  Process decisions:   Self: 3.5  AI: 3.7  Outcomes: 4.0  [Underconfident]  │
│  Conflict decisions:  Self: 2.8  AI: 2.5  Outcomes: 3.2  [Well calibrated] │
│                                                                             │
│  INSIGHT: "You're more capable with conflict than you give yourself        │
│            credit for. Your process decisions are better than you think."  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Relationship Health Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    RELATIONSHIP HEALTH: SARAH                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OVERALL HEALTH: 82/100 (Strong) ▲ +8 from last month                      │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ ████████████████████████████████████████████████████████████████░░│    │
│  │ 0        25        50        75        100                        │    │
│  │                                                    ▲               │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  COMPONENTS:                                                                │
│                                                                             │
│  Feedback Balance          ████████████████████░░░░░░  4.2:1 (Target: 5:1) │
│  1:1 Effectiveness         ████████████████████████░░  4.1/5 average       │
│  Friction Level            ████░░░░░░░░░░░░░░░░░░░░░░  Low (good!)        │
│  Trust Signals             ████████████████████████░░  High               │
│  Development Investment    ██████████████████████████  High               │
│                                                                             │
│  RECENT HIGHLIGHTS:                                                         │
│  • "Sarah led her first client call" (Jan 24 - Win)                        │
│  • "Career growth conversation" (Jan 21 - 1:1)                             │
│  • "Praised client presentation" (Jan 20 - Feedback)                       │
│                                                                             │
│  TRAJECTORY: This relationship has strengthened significantly since        │
│              you started intentionally investing in her development        │
│              (Week 3). She's moved from individual contributor to          │
│              emerging leader.                                               │
│                                                                             │
│  SUGGESTION: Consider what's next for Sarah. She may be ready for          │
│              more significant leadership opportunities.                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    RELATIONSHIP HEALTH: MARCUS                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OVERALL HEALTH: 58/100 (Needs Attention) ▲ +12 from last month            │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│    │
│  │ 0        25        50        75        100                        │    │
│  │                              ▲                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  COMPONENTS:                                                                │
│                                                                             │
│  Feedback Balance          ████████████████████░░░░░░  4:1 (improved!)    │
│  1:1 Effectiveness         ████████████░░░░░░░░░░░░░░  3.2/5 average      │
│  Friction Level            ██████████████░░░░░░░░░░░░  Moderate           │
│  Trust Signals             ██████████████░░░░░░░░░░░░  Moderate           │
│  Development Investment    ██████████░░░░░░░░░░░░░░░░  Moderate           │
│                                                                             │
│  ⚠️ PATTERN DETECTED:                                                       │
│                                                                             │
│  3 friction moments in 4 weeks involved Marcus:                            │
│  • "Marcus dominated the meeting" (Jan 8)                                  │
│  • "Should have redirected Marcus" (Jan 15)                                │
│  • "Avoided conversation about meeting behavior" (Jan 22)                  │
│                                                                             │
│  GOOD NEWS: Your feedback ratio with Marcus improved from 2:1 to 4:1.      │
│  You're investing more positively in the relationship.                     │
│                                                                             │
│  THE OPEN THREAD: You haven't yet addressed his meeting behavior           │
│  directly. The avoidance pattern suggests this might be the key           │
│  conversation to have.                                                      │
│                                                                             │
│  [Prepare for this conversation →]                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ENGINE 3: EVOLUTION

### The Growth Layer

**Purpose:** Make transformation visible and undeniable.

**Philosophy:** Growth that isn't seen isn't believed. Leaders need evidence—not metrics, not dashboards, but narrative evidence that shows them who they're becoming.

### The Leadership Fingerprint

Every leader has a unique pattern—strengths, tendencies, growth edges. The Leadership Fingerprint captures this in a living document that evolves over time.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    YOUR LEADERSHIP FINGERPRINT                              │
│                    January 2026                                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  "A leader who is learning to trust her team, give direct feedback,        │
│   and have the hard conversations that matter."                             │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CORE STRENGTHS                                                             │
│  ───────────────                                                            │
│                                                                             │
│  ⭐ Recognition & Celebration                                               │
│     You naturally notice and acknowledge others' contributions.             │
│     Evidence: 73% of your feedback is positive, specificity score 78.       │
│                                                                             │
│  ⭐ Strategic Decision-Making                                               │
│     You excel at big-picture decisions with limited information.            │
│     Evidence: Your strategy decisions have 85% positive outcome rate.       │
│                                                                             │
│  ⭐ Team Development                                                        │
│     You invest heavily in growing others (especially Sarah).                │
│     Evidence: 2 team members have taken on leadership roles.                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GROWTH EDGES                                                               │
│  ────────────                                                               │
│                                                                             │
│  🔄 Difficult Conversations (ACTIVELY DEVELOPING)                           │
│     Skill Stage: Conscious Competence (62/100)                             │
│     6-week trajectory: +8 points                                           │
│     Status: Strong growth. You're doing the hard thing.                    │
│                                                                             │
│  🔄 Delegation (RECENTLY RESOLVED)                                          │
│     Skill Stage: Conscious Competence (71/100)                             │
│     Evidence: Sarah's client call, "stepped back" moment                   │
│     Status: Major progress. Friction down 60%.                             │
│                                                                             │
│  ⚡ Meeting Facilitation (EMERGING)                                         │
│     Skill Stage: Conscious Incompetence (38/100)                           │
│     Pattern: Multiple friction moments about meetings                      │
│     Status: Awareness is building. Ready for focus.                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DECISION PROFILE                                                           │
│  ────────────────                                                           │
│                                                                             │
│  Decisions this quarter: 47                                                 │
│                                                                             │
│  By type:                                                                   │
│  People     ████████████████████████████░░░░  38%  (confident)             │
│  Process    ████████████████████░░░░░░░░░░░░  27%  (strong)                │
│  Strategy   ████████████░░░░░░░░░░░░░░░░░░░░  17%  (excellent)             │
│  Conflict   ████████░░░░░░░░░░░░░░░░░░░░░░░░  11%  (growing)               │
│  Other      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░   7%                          │
│                                                                             │
│  Confidence calibration: Well-calibrated (gap: 0.4)                        │
│  Decision quality trend: Improving                                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  EMOTIONAL SIGNATURE                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  Primary emotions logged:                                                   │
│  Frustrated (32%) │ Anxious (24%) │ Proud (18%) │ Overwhelmed (14%)        │
│                                                                             │
│  Intensity trend: Decreasing (avg 3.4 → 2.8 over 6 weeks)                  │
│  Recovery trend: Faster (avg 4.2 hours → 2.1 hours)                        │
│                                                                             │
│  Trigger patterns:                                                          │
│  • Meetings with unclear agendas → Frustrated                              │
│  • High-visibility moments → Anxious                                       │
│  • Team wins → Proud                                                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  THE ARC                                                                    │
│                                                                             │
│  "Three months ago, you described yourself as someone who 'struggles       │
│   to let go.' You avoided delegation. You avoided hard conversations.      │
│   You absorbed stress rather than addressing its sources.                   │
│                                                                             │
│   Today, Sarah leads client calls. You've improved your feedback ratio     │
│   with Marcus from 1:1 to 4:1. Your emotional intensity is down 20%.       │
│   You're not yet having every hard conversation—but you're having more     │
│   of them, and recovering faster when they don't go perfectly.             │
│                                                                             │
│   This is what growth looks like. Not perfection. Progress."               │
│                                                                             │
│                                                                             │
│  [Download Full Report]  [Share with Coach]  [Add to Performance Review]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Weekly Digest

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  📊 YOUR WEEK                                                               │
│  January 20-26, 2026                                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  "You're proving that delegation isn't about giving up control—            │
│   it's about growing others. Sarah's win this week is your win too."       │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎯 DECISIONS (4)                                                           │
│  ─────────────────                                                          │
│                                                                             │
│  • Promoted Sarah to team lead — High stakes, Confident ✓                  │
│  • Delayed product launch — High stakes, Confident                         │
│  • Changed sprint process — Medium stakes                                   │
│  • Declined vendor meeting — Low stakes                                     │
│                                                                             │
│  Average confidence: 3.8/5                                                  │
│  AI assessment: Aligned with self-report ✓                                 │
│                                                                             │
│  📈 DECISION TREND: You're making more high-stakes people decisions        │
│     than last month. This is growth from earlier delegation avoidance.     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  💬 FEEDBACK (9)                                                            │
│  ─────────────────                                                          │
│                                                                             │
│  Positive: 7  •  Constructive: 2  •  Ratio: 3.5:1                          │
│                                                                             │
│  By person:                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ Sarah      ████████████████░░░░ 3:1  (strong)               │           │
│  │ Marcus     ████████████████████ 4:1  (▲ improved from 2:1)  │           │
│  │ Team       ██████░░░░░░░░░░░░░░ 1:1  (opportunity)          │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Specificity score: 72/100 (▲ from 65 last week)                           │
│                                                                             │
│  🏆 FEEDBACK WIN: Your ratio with Marcus improved significantly.           │
│     You're investing positively while still working up to the harder       │
│     conversation.                                                           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔥 FRICTION (2)                                                            │
│  ─────────────────                                                          │
│                                                                             │
│  • Delegation tension (Tuesday) — Intensity: 3/5                           │
│    Resolved: Partially                                                      │
│                                                                             │
│  • Difficult conversation avoided (Thursday) — Intensity: 4/5              │
│    Resolved: No ← This is the pattern                                       │
│                                                                             │
│  ⚠️ PATTERN: 3 of your last 4 friction moments involve avoiding a          │
│     conversation with Marcus about his meeting behavior.                    │
│                                                                             │
│  💡 REFRAME: "The cost of avoidance is compounding. Each week this         │
│      doesn't get addressed, the conversation gets harder and the           │
│      friction grows. What would happen if you just... did it?"             │
│                                                                             │
│                                               [Prepare for this →]         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ⭐ WINS (3)                                                                │
│  ─────────────────                                                          │
│                                                                             │
│  🏆 Sarah's first solo client call (You: enabled)                          │
│     └─ 🔗 GROWTH CONNECTION: This links directly to the delegation         │
│        friction you logged on Jan 10. You let go, she grew.               │
│                                                                             │
│  • Team shipped early (You: enabled)                                        │
│  • Board prep completed ahead (You: led)                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎯 SKILL DEVELOPMENT (Ryan's Tracking)                                     │
│  ─────────────────────────────────────                                      │
│                                                                             │
│  ACTIVE FOCUS: Difficult Conversations                                      │
│                                                                             │
│  Current Stage: Conscious Competence (62/100)                              │
│  This Week: +2 points                                                       │
│  Practice Logged: 1 (conversation with Alex)                               │
│                                                                             │
│  📊 TRAJECTORY:                                                             │
│  Week 1: 48 ───► Week 4: 58 ───► Week 6: 62                                │
│                                                                             │
│  "You're making real progress. The next level of growth will come          │
│   from having the Marcus conversation. That's your current edge."          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👥 1:1s (2)                                                                │
│  ─────────────────                                                          │
│                                                                             │
│  Sarah (Tuesday): 4/5 — Intention met, feedback given ✓                    │
│  Marcus (Thursday): 3/5 — Intention partially met                          │
│                      └─ Note: You intended to address meeting behavior     │
│                         but "ran out of time." Pattern?                    │
│                                                                             │
│  Prep rate: 100% 🎯                                                         │
│  Feedback inclusion: 50%                                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📅 LOOKING AHEAD                                                           │
│  ─────────────────                                                          │
│                                                                             │
│  🗓 Tuesday: 1:1 with Marcus                                                │
│     └─ This could be the moment. I've prepared some talking points        │
│        based on your friction patterns. [View prep →]                      │
│                                                                             │
│  🗓 Thursday: Board presentation                                            │
│     └─ You flagged this as a stressor. Remember: your strategy             │
│        decisions have an 85% positive outcome rate. You've got this.       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  💭 ONE QUESTION                                                            │
│  ─────────────────                                                          │
│                                                                             │
│  "If the version of you from 3 months ago could see you now—               │
│   watching Sarah lead that client call—what would she think?"              │
│                                                                             │
│                                               [Reflect →]                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Compound Effect Visualization

Show leaders how small improvements compound into transformation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    THE COMPOUND EFFECT                                      │
│                    Your Leadership Growth Over Time                         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  "Small improvements, consistently applied, create exponential growth."    │
│                                                                             │
│                                                                             │
│  DELEGATION SKILL                                                           │
│  ─────────────────                                                          │
│                                                                             │
│  100 ┤                                                    ●                │
│   90 ┤                                               ●                     │
│   80 ┤                                          ●                          │
│   70 ┤                                    ●                      ← YOU     │
│   60 ┤                              ●                                      │
│   50 ┤                        ●                                            │
│   40 ┤                  ●                                                  │
│   30 ┤           ●                                                         │
│   20 ┤     ●                                                               │
│   10 ┤●                                                                    │
│      └──────────────────────────────────────────────────────────────────   │
│        Oct    Nov    Dec    Jan    Feb    Mar    Apr    May    Jun         │
│                                                                             │
│  Key moments:                                                               │
│  • Oct: "I can't trust anyone to do this right" (friction)                 │
│  • Dec: First successful delegation to Sarah (win)                         │
│  • Jan: Sarah leads client call independently (breakthrough)               │
│                                                                             │
│  Improvement rate: 3.2% per week → 71% over 6 months                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WHAT 3.2% PER WEEK MEANS:                                                  │
│                                                                             │
│  After 6 months:   71% better                                              │
│  After 1 year:    192% better                                              │
│  After 2 years:   468% better                                              │
│                                                                             │
│  "This is why consistent small improvements beat sporadic big efforts.     │
│   You're not just getting better. You're getting better at getting better."│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Reflect Mode

**Purpose:** On-demand coaching when you have something to process.  
**Trigger:** After capture, from digest, or self-initiated.  
**Philosophy:** Socratic. Questions, not answers. The leader discovers their own insight.

### Coaching Conversation Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  💭 Reflect                                                     [Close X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CONTEXT: You logged friction about avoiding a conversation with Marcus.   │
│  This is the 3rd time in 4 weeks.                                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  I've noticed this pattern too, and I'm curious about it.           │   │
│  │                                                                      │   │
│  │  You've improved your feedback ratio with Marcus significantly—     │   │
│  │  from 2:1 to 4:1. You're clearly investing in the relationship.     │   │
│  │                                                                      │   │
│  │  But there's this specific conversation about his meeting behavior  │   │
│  │  that keeps not happening. What is it about THIS conversation       │   │
│  │  that makes it different from the other feedback you've given him?  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  I think it's because the other feedback was about his work,        │   │
│  │  which is actually excellent. This one is about how he shows up—    │   │
│  │  his behavior in meetings. It feels more personal.                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  That distinction makes sense. Work feedback vs. behavior feedback. │   │
│  │                                                                      │   │
│  │  Here's what I'm wondering: what story are you telling yourself     │   │
│  │  about what will happen if you have this conversation?              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Honestly? I worry he'll get defensive. Or feel attacked. He's      │   │
│  │  really valuable and I don't want to damage the relationship or     │   │
│  │  make him feel like I don't appreciate him.                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  So the story is: "If I have this conversation, I'll damage the     │   │
│  │  relationship."                                                      │   │
│  │                                                                      │   │
│  │  But here's something interesting from your data: you've logged     │   │
│  │  friction about Marcus's meeting behavior 3 times. Each time, the   │   │
│  │  intensity was higher than the last (3, then 3.5, then 4).          │   │
│  │                                                                      │   │
│  │  The relationship you're trying to protect—is it actually           │   │
│  │  protected by the avoidance? Or is the avoidance slowly eroding     │   │
│  │  something?                                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ...That's a really good point. I think I'm starting to resent      │   │
│  │  him a little. Which is exactly what I don't want.                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  So the avoidance that's meant to protect the relationship might    │   │
│  │  actually be the thing threatening it.                               │   │
│  │                                                                      │   │
│  │  I'm not going to tell you to have the conversation. But I'll       │   │
│  │  ask you this: What would it look like to have the conversation     │   │
│  │  in a way that actually strengthens the relationship instead of     │   │
│  │  damaging it?                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Type your response...                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│           [End & Save Insights]                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key AI Coaching Principles

1. **Questions, not answers.** The leader must discover their own insight.
2. **Reflect back what they said.** "So the story is..."
3. **Use their data.** Connect to patterns, not generic advice.
4. **Name the dynamic.** "The avoidance meant to protect might be the threat."
5. **End with agency.** "What would it look like to..." not "You should..."

---

## The Support Systems

### Coach Dashboard

Human coaches see:
- Pattern summaries (not raw data)
- Skill trajectories (Ryan's model with stage progression)
- Relationship health indicators
- The leader's own language from reflections
- Suggested focus areas based on pattern analysis
- Skill development velocity for each tracked skill

### Community Intelligence

Anonymous aggregate patterns:
- "43% of leaders in your cohort are working through delegation"
- "The most common friction this month: difficult conversations"
- "Leaders who log 5+ moments/week show 2.3x faster skill progression"
- This informs community calls and content

### Content Surfacing

Content is never pushed. It's surfaced when relevant:
- After detecting a pattern → "This article addresses exactly this"
- During 1:1 prep → "Relevant concept for your conversation with Marcus"
- After a reflection → "You might find this useful"
- When skill practice is detected → "Framework for this skill"

---

## What Makes This World-Class

### The Five Breakthroughs

**1. Rigorous Skill Measurement (Ryan's Model)**

Most apps track activity. We track capability development through:
- Four-stage competence model (unconscious/conscious incompetence → competence)
- Multiple measurement dimensions (frequency, quality, comfort, outcomes, transfer, recovery)
- Evidence-based stage transitions, not arbitrary thresholds
- Longitudinal skill trajectory visualization
- Contextual competence awareness (skill varies by situation)

**2. Pattern Intelligence That Actually Works**

Not generic AI chatbot responses, but pattern detection that:
- Connects moments across time automatically
- Identifies emotional escalation trends
- Spots avoidance behaviors before the leader does
- Tracks relationship health through interaction patterns
- Predicts friction before it happens

**3. The Three-Layer Validation Model**

Every measurement is validated three ways:
- **Self-report:** What the leader says they feel
- **AI inference:** What their language reveals
- **Behavioral evidence:** What actually happens over time

This solves the core problem of self-reporting bias.

**4. Growth Connections**

The system automatically connects:
- Wins → Previous friction (showing growth)
- Friction → Skill gaps (showing opportunity)
- 1:1 effectiveness → Relationship health (showing patterns)
- Decisions → Outcomes → Learning (showing calibration)

No other system does this automatically.

**5. The Compound Effect Visualization**

Showing not just "you're improving" but exactly how small improvements compound over time—making visible what was previously invisible.

### Why Competitors Can't Copy This

| Barrier | Description |
|---------|-------------|
| **Data Density** | Requires months of moments to detect patterns |
| **Model Complexity** | Ryan's skill model + three-layer validation is hard to implement well |
| **Coach Integration** | Requires buy-in from human coaches to be multiplicative |
| **Longitudinal Design** | Built for years, not sessions |
| **Philosophical Coherence** | Every feature serves capability, not engagement |

---

## The Build Phases

### Phase 1: Capture + Weekly Digest (6 weeks)
**Goal:** Validate that leaders will capture moments

- All 6 moment types (including Skill Practice)
- Basic AI classification
- Weekly digest generation
- Friday notification

**Validation:**
- 5+ moments/week per active user
- 70% digest open rate
- 4+ satisfaction rating
- "Yes, this feels valuable" in user interviews

### Phase 2: Pattern Intelligence + Skill Tracking (6 weeks)
**Goal:** Validate that patterns and skill trajectories feel accurate

- Pattern detection engine (5 intelligence systems)
- Ryan's skill trajectory tracking
- Relationship health dashboard
- Pattern display in digest
- Skill stage visualization

**Validation:**
- 80% "yes, that pattern is accurate"
- 70% "skill stage feels right"
- Leaders report "seeing things they couldn't see"
- Skill progression visible over 6+ weeks

### Phase 3: Reflect + Growth Evidence (6 weeks)
**Goal:** Validate that on-demand coaching and growth evidence add value

- Reflect mode (Socratic coaching)
- Insight surfacing
- Leadership Fingerprint
- Growth evidence connections (friction → win)
- Compound effect visualization

**Validation:**
- 1+ reflect sessions/week
- Leaders report actionable insights
- "The Arc" resonates in user interviews
- Coach feedback positive

### Phase 4: Evolution + Integration (6 weeks)
**Goal:** Make it a complete system

- Monthly/quarterly summaries
- Coach dashboard with skill trajectories
- Community patterns
- Content surfacing
- Calendar integration for 1:1 prep
- Performance review export

**Validation:**
- 6-month retention 60%+
- NPS 50+
- Coaches report 2x efficiency
- Leaders can articulate their growth

---

## Success Metrics

### For Leaders

| Metric | Target | How Measured |
|--------|--------|--------------|
| Weekly moments logged | 5+ | System count |
| Skill stage progression | Advancement in 6 weeks | Ryan's model |
| Friction resolution rate | 60%+ | Status tracking |
| Confidence calibration | Gap < 0.5 | Three-layer model |
| Self-reported capability | +20% over 6 months | Quarterly survey |

### For Product

| Metric | Target | How Measured |
|--------|--------|--------------|
| Weekly active users | 80% of enrolled | Login tracking |
| Digest open rate | 70%+ | Email analytics |
| Time to first reflect | < 2 weeks | System tracking |
| Feature depth | 60% use 4+ moment types | Usage analytics |
| 6-month retention | 60%+ | Cohort analysis |

### For Business

| Metric | Target | How Measured |
|--------|--------|--------------|
| NPS | 50+ | Quarterly survey |
| Referral rate | 30%+ recommend | Survey |
| Coach efficiency | 2x improvement | Coach feedback |
| Enterprise interest | 3+ pilots | Outreach |
| Expansion revenue | 40% upsell | Sales data |

---

## The One-Liner

> **"The system that makes leadership development actually work."**

Not engagement theater. Not content consumption. Not gamification.

A leadership operating system that captures your moments, sees your patterns, tracks your skill development, and shows you who you're becoming.

This is what world-class looks like.

---

*Design Document v3.0 FINAL*  
*January 27, 2026*  
*Contributors: Rob (Vision), Cristina (Philosophy), Jeff (Utility), Ryan (Skill Measurement)*  
*Built to survive the zombie apocalypse*
