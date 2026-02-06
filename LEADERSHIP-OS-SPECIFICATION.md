# Leadership Operating System - Detailed Specification

> **Version:** 1.0 Draft  
> **Date:** January 27, 2026  
> **Purpose:** Technical specification with measurement models for evaluating leadership growth

---

## Table of Contents

1. [Measurement Philosophy](#measurement-philosophy)
2. [Moment Types & Data Models](#moment-types--data-models)
3. [Measurement Scales](#measurement-scales)
4. [Pattern Detection Logic](#pattern-detection-logic)
5. [Growth Indicators](#growth-indicators)
6. [Weekly Digest Specification](#weekly-digest-specification)
7. [AI Prompts & Classification](#ai-prompts--classification)
8. [UI/UX Flows](#uiux-flows)
9. [Database Schema](#database-schema)
10. [Build Phases](#build-phases)

---

## Measurement Philosophy

### The Core Challenge

Leadership is qualitative. How do we make it quantifiable without making it reductive?

**Our approach:** Combine **self-assessment** with **AI inference** and **behavioral evidence**.

| Data Type | Self-Reported | AI-Inferred | Behavioral Evidence |
|-----------|---------------|-------------|---------------------|
| Decision Confidence | ✅ At capture | ✅ From language | ✅ Outcome tracking |
| Feedback Quality | ✅ Classification | ✅ From description | ✅ Frequency patterns |
| Emotional State | ✅ At capture | ✅ From language | ✅ Context patterns |
| Growth | ❌ | ✅ Pattern comparison | ✅ Before/after behavior |

### The Three Validation Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: SELF-REPORT                                                       │
│  "How confident were you in this decision?" (1-5)                           │
│  Quick, subjective, captures in-the-moment feeling                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2: AI INFERENCE                                                      │
│  Analyzes language for hedging, certainty markers, emotional tone           │
│  "Your description suggests lower confidence than you rated"                │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3: BEHAVIORAL EVIDENCE                                               │
│  Tracks outcomes, patterns over time, before/after comparisons              │
│  "3 months ago, you avoided this type of decision. Now you initiate them."  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Moment Types & Data Models

### 1. DECISION Moment

**When captured:** After making a significant decision

```typescript
interface DecisionMoment {
  id: string;
  timestamp: Date;
  userId: string;
  type: 'decision';
  
  // Core data (user enters)
  description: string;           // "Decided to delay the product launch"
  context?: string;              // Optional: why, what led to it
  
  // Self-assessment (user selects)
  confidence: 1 | 2 | 3 | 4 | 5; // How confident are you in this decision?
  stakes: 'low' | 'medium' | 'high'; // What's at stake?
  
  // AI-inferred (computed)
  aiConfidenceScore: number;     // 0-100, from language analysis
  decisionType: DecisionType;    // Classified by AI
  emotionalTone: EmotionalTone;  // From language
  certaintyMarkers: string[];    // Words indicating certainty/uncertainty
  
  // Outcome tracking (added later)
  outcome?: {
    status: 'pending' | 'positive' | 'negative' | 'mixed';
    reflection?: string;
    recordedAt: Date;
  };
}

enum DecisionType {
  PEOPLE = 'people',           // Hiring, firing, promotions, assignments
  PROCESS = 'process',         // How work gets done
  STRATEGY = 'strategy',       // Direction, priorities
  RESOURCE = 'resource',       // Budget, time, allocation
  CONFLICT = 'conflict',       // Interpersonal tensions
  DELEGATION = 'delegation',   // What to hand off
  BOUNDARY = 'boundary',       // Saying no, protecting time
  COMMUNICATION = 'communication' // What/how to share
}

enum EmotionalTone {
  CONFIDENT = 'confident',
  ANXIOUS = 'anxious',
  CONFLICTED = 'conflicted',
  RELIEVED = 'relieved',
  UNCERTAIN = 'uncertain',
  NEUTRAL = 'neutral'
}
```

**Confidence Measurement:**

| Score | Label | Description | Example Language |
|-------|-------|-------------|------------------|
| 1 | Very Uncertain | Second-guessing, high anxiety | "I don't know if...", "Maybe I should have..." |
| 2 | Somewhat Uncertain | Doubts present, but proceeded | "I think this is right...", "Hopefully..." |
| 3 | Neutral | Neither confident nor doubtful | "We decided to...", factual tone |
| 4 | Fairly Confident | Clear reasoning, minor doubts | "I'm pretty sure...", "The data supports..." |
| 5 | Very Confident | Strong conviction, clear rationale | "This is definitely...", "I know this is right..." |

**AI Confidence Inference:**

The AI analyzes the description for:
- **Certainty markers:** "definitely", "clearly", "obviously" → Higher confidence
- **Hedging language:** "maybe", "I think", "not sure" → Lower confidence
- **Justification depth:** More reasoning → Often higher confidence
- **Emotional words:** "worried", "anxious" → Lower confidence

```
AI Confidence Score = weighted_sum(
  certainty_markers * 0.3,
  hedging_penalty * -0.3,
  justification_depth * 0.2,
  emotional_tone * 0.2
)
```

**Discrepancy Alert:**
If `|self_confidence - ai_confidence| > 1.5`, flag for reflection:
> "You rated this decision as very confident, but your description suggests some uncertainty. Want to explore that?"

---

### 2. FEEDBACK Moment

**When captured:** After giving feedback to someone

```typescript
interface FeedbackMoment {
  id: string;
  timestamp: Date;
  userId: string;
  type: 'feedback';
  
  // Core data (user enters)
  recipient: string;             // "Sarah", "Marcus", "Team" (can be anonymized)
  description: string;           // What feedback was given
  context?: string;              // The situation
  
  // Self-assessment (user selects)
  feedbackType: 'positive' | 'constructive' | 'mixed';
  deliveryConfidence: 1 | 2 | 3 | 4 | 5;  // How well did you deliver it?
  
  // AI-inferred (computed)
  feedbackCategory: FeedbackCategory;
  specificityScore: number;      // 0-100, how specific vs. vague
  actionabilityScore: number;    // 0-100, how actionable
  balanceIndicator: string;      // "praise-heavy", "critique-heavy", "balanced"
  
  // Outcome tracking (optional, added later)
  perceivedReception?: 'positive' | 'neutral' | 'negative' | 'unknown';
}

enum FeedbackCategory {
  RECOGNITION = 'recognition',       // Praising good work
  PERFORMANCE = 'performance',       // About work quality
  BEHAVIOR = 'behavior',             // About how they show up
  GROWTH = 'growth',                 // Developmental feedback
  CORRECTION = 'correction',         // Addressing a mistake
  EXPECTATION = 'expectation'        // Clarifying standards
}
```

**Feedback Quality Scoring:**

| Dimension | How Measured | Score Range |
|-----------|--------------|-------------|
| **Specificity** | AI analyzes for concrete examples vs. vague statements | 0-100 |
| **Actionability** | Does it include what to do differently? | 0-100 |
| **Timeliness** | Days since the event being discussed (if mentioned) | Bonus/penalty |
| **Balance** | Ratio of positive to constructive language | Indicator |

**Specificity Examples:**

| Low Specificity (Score: 20-40) | High Specificity (Score: 70-100) |
|-------------------------------|----------------------------------|
| "Great job on the project" | "Your client presentation was compelling—the ROI slide especially landed well" |
| "You need to communicate better" | "In yesterday's meeting, you interrupted Sarah twice. Try waiting 3 seconds before responding." |

**Feedback Ratio Tracking:**

```typescript
interface FeedbackRatio {
  userId: string;
  recipientId: string;  // Can be "team" for group feedback
  period: 'week' | 'month' | 'quarter';
  
  positiveCount: number;
  constructiveCount: number;
  ratio: number;         // positive / constructive
  
  benchmark: 5.0;        // Target ratio (5:1)
  gap: number;           // How far from benchmark
}
```

**Growth Indicator:**
- Track ratio per person over time
- Track average specificity score over time
- Track delivery confidence trend

---

### 3. FRICTION Moment

**When captured:** After experiencing leadership friction/difficulty

```typescript
interface FrictionMoment {
  id: string;
  timestamp: Date;
  userId: string;
  type: 'friction';
  
  // Core data (user enters)
  description: string;           // What happened
  trigger?: string;              // What triggered the friction
  
  // Self-assessment (user selects)
  emotionalIntensity: 1 | 2 | 3 | 4 | 5;  // How strongly did you feel it?
  primaryEmotion: PrimaryEmotion;
  
  // AI-inferred (computed)
  frictionCategory: FrictionCategory;
  stressIndicators: string[];
  relatedPatterns: string[];     // Links to similar past friction
  
  // Resolution tracking (optional)
  resolution?: {
    status: 'unresolved' | 'partially_resolved' | 'resolved';
    whatHelped?: string;
    recordedAt: Date;
  };
}

enum PrimaryEmotion {
  FRUSTRATED = 'frustrated',
  ANXIOUS = 'anxious',
  DISAPPOINTED = 'disappointed',
  OVERWHELMED = 'overwhelmed',
  ANGRY = 'angry',
  CONFUSED = 'confused',
  HURT = 'hurt',
  DEFEATED = 'defeated'
}

enum FrictionCategory {
  DELEGATION = 'delegation',         // Struggles with letting go
  CONFLICT_AVOIDANCE = 'conflict_avoidance',
  DIFFICULT_CONVERSATION = 'difficult_conversation',
  OVERCOMMITMENT = 'overcommitment',
  BOUNDARY_VIOLATION = 'boundary_violation',
  TEAM_DYNAMICS = 'team_dynamics',
  UPWARD_MANAGEMENT = 'upward_management',
  IMPOSTER_SYNDROME = 'imposter_syndrome',
  PERFECTIONISM = 'perfectionism',
  CONTROL = 'control'
}
```

**Emotional Intensity Scale:**

| Score | Label | Physical/Mental Indicators |
|-------|-------|---------------------------|
| 1 | Mild | Brief annoyance, quickly passed |
| 2 | Noticeable | Lingered for a bit, but manageable |
| 3 | Moderate | Affected your focus, needed processing |
| 4 | Strong | Disrupted your day, hard to shake |
| 5 | Intense | Overwhelmed, needed significant recovery |

**Pattern Detection:**

The AI looks for:
- **Recurrence:** Same friction category appearing 3+ times in 6 weeks
- **Trigger patterns:** Same person, meeting type, or situation
- **Emotional escalation:** Intensity increasing over similar situations
- **Time patterns:** Friction clustering on certain days/times

---

### 4. WIN Moment

**When captured:** After a leadership success

```typescript
interface WinMoment {
  id: string;
  timestamp: Date;
  userId: string;
  type: 'win';
  
  // Core data (user enters)
  description: string;           // What happened
  whoContributed?: string[];     // Team members involved
  
  // Self-assessment (user selects)
  significance: 'small' | 'medium' | 'big';
  yourRole: 'led' | 'contributed' | 'enabled' | 'observed';
  
  // AI-inferred (computed)
  winCategory: WinCategory;
  leadershipBehaviors: string[];  // What leadership behaviors made this happen
  
  // Connection to growth
  relatedGrowthArea?: string;     // Links to previous friction/development area
}

enum WinCategory {
  TEAM_ACHIEVEMENT = 'team_achievement',
  INDIVIDUAL_GROWTH = 'individual_growth',
  PROCESS_IMPROVEMENT = 'process_improvement',
  RELATIONSHIP_BREAKTHROUGH = 'relationship_breakthrough',
  DIFFICULT_CONVERSATION_SUCCESS = 'difficult_conversation_success',
  DELEGATION_SUCCESS = 'delegation_success',
  STRATEGIC_WIN = 'strategic_win'
}
```

**Growth Connection:**

The AI looks for wins that connect to previous friction:
> "You logged delegation friction with Marcus on Jan 10. This win—Marcus leading the client presentation successfully—shows growth in that area."

---

### 5. ONE_ON_ONE Moment

**When captured:** Before and after 1:1 meetings

```typescript
interface OneOnOneMoment {
  id: string;
  timestamp: Date;
  userId: string;
  type: 'one_on_one';
  
  // Core data
  withPerson: string;
  phase: 'prep' | 'complete';
  
  // Pre-meeting (prep phase)
  prep?: {
    intention: string;           // "I want to address the deadline concern"
    questionsToAsk?: string[];
    feedbackToGive?: string;
    aiSuggestedTopics?: string[]; // Based on history
  };
  
  // Post-meeting (complete phase)
  complete?: {
    howItWent: 1 | 2 | 3 | 4 | 5;
    keyTakeaways?: string;
    followUps?: string[];
    feedbackGiven?: boolean;
    difficultTopicAddressed?: boolean;
  };
  
  // AI analysis
  aiAnalysis?: {
    intentionMet: boolean;       // Did they do what they intended?
    consistencyWithHistory: string;
    suggestedFollowUp: string;
  };
}
```

**1:1 Effectiveness Tracking:**

| Metric | How Measured | Target |
|--------|--------------|--------|
| Prep consistency | % of 1:1s with prep logged | >70% |
| Intention follow-through | % where intention was addressed | >80% |
| Feedback inclusion | % of 1:1s where feedback was given | >60% |
| Self-rated effectiveness | Average "how it went" score | >3.5 |

---

## Measurement Scales

### Universal Confidence Scale (Used Across Moments)

```
1 ──────── 2 ──────── 3 ──────── 4 ──────── 5
│          │          │          │          │
Very       Somewhat   Neutral    Fairly     Very
Uncertain  Uncertain             Confident  Confident
```

**Behavioral Anchors:**

| Score | Decision Context | Feedback Context | 1:1 Context |
|-------|-----------------|------------------|-------------|
| 1 | "I have no idea if this is right" | "I don't know how to say this" | "I dreaded this meeting" |
| 2 | "I have doubts but decided anyway" | "I stumbled through it" | "It was awkward" |
| 3 | "It felt like the reasonable choice" | "It went okay" | "Fine, nothing special" |
| 4 | "I feel good about this" | "I delivered it well" | "It was productive" |
| 5 | "I'm certain this is right" | "I nailed it" | "One of our best" |

### Stakes/Significance Scale

```
Low ──────────── Medium ──────────── High
│                  │                   │
Minor impact      Moderate impact     Major impact
Easily reversed   Some cost to change Significant consequences
Few people        Some people         Many people/org-wide
```

### Emotional Intensity Scale

```
1 ──────── 2 ──────── 3 ──────── 4 ──────── 5
│          │          │          │          │
Mild       Noticeable Moderate   Strong     Intense
(minutes)  (hour)     (hours)    (day)      (days)
```

---

## Pattern Detection Logic

### How Patterns Are Identified

```typescript
interface Pattern {
  id: string;
  userId: string;
  patternType: PatternType;
  
  // Detection
  detectedAt: Date;
  confidence: number;          // 0-100, how confident is the AI
  evidenceCount: number;       // Number of moments supporting this
  evidenceMoments: string[];   // IDs of supporting moments
  
  // Description
  title: string;               // "Delegation Friction Pattern"
  description: string;         // Human-readable explanation
  
  // Tracking
  status: 'emerging' | 'established' | 'resolving' | 'resolved';
  firstSeen: Date;
  lastSeen: Date;
  
  // Growth connection
  suggestedContent?: string[]; // Read & Reps, videos to surface
  coachingPrompt?: string;     // For reflect mode or coach
}

enum PatternType {
  FRICTION_RECURRING = 'friction_recurring',
  DECISION_AVOIDANCE = 'decision_avoidance',
  FEEDBACK_IMBALANCE = 'feedback_imbalance',
  CONFIDENCE_GAP = 'confidence_gap',        // Self vs AI confidence mismatch
  PERSON_TENSION = 'person_tension',        // Friction clustering around one person
  TIME_PATTERN = 'time_pattern',            // Issues at certain times
  GROWTH_EVIDENCE = 'growth_evidence',      // Positive change detected
  IDENTITY_SHIFT = 'identity_shift'         // Behavioral change in key area
}
```

### Pattern Detection Rules

**Rule 1: Recurring Friction**
```
IF friction_category appears 3+ times in 6 weeks
AND emotional_intensity averages > 2.5
THEN create pattern: FRICTION_RECURRING
```

**Rule 2: Feedback Imbalance**
```
IF feedback_ratio for any person < 3:1 over 4 weeks
AND feedback_count > 5
THEN create pattern: FEEDBACK_IMBALANCE
```

**Rule 3: Decision Avoidance**
```
IF friction mentions "putting off" OR "avoiding" OR "delaying"
AND category = CONFLICT or DIFFICULT_CONVERSATION
AND count >= 2 in 4 weeks
THEN create pattern: DECISION_AVOIDANCE
```

**Rule 4: Confidence Gap**
```
IF average(|self_confidence - ai_confidence|) > 1.5
AND sample_size >= 5 decisions
THEN create pattern: CONFIDENCE_GAP
```

**Rule 5: Growth Evidence**
```
IF friction_category X appeared 3+ times in weeks 1-6
AND friction_category X appeared 0-1 times in weeks 7-12
AND/OR win related to category X appeared
THEN create pattern: GROWTH_EVIDENCE
```

---

## Growth Indicators

### How We Know Someone Is Growing

| Indicator | Measurement | Timeframe | What It Means |
|-----------|-------------|-----------|---------------|
| **Friction Reduction** | Same category friction decreases | 8-12 weeks | They're learning to handle it |
| **Confidence Calibration** | Self vs AI confidence gap shrinks | 6-10 weeks | More self-aware |
| **Feedback Ratio Improvement** | Ratio moves toward 5:1 | 4-8 weeks | Better balance |
| **Feedback Quality** | Specificity score increases | 4-8 weeks | More effective feedback |
| **1:1 Effectiveness** | "How it went" scores increase | 4-6 weeks | Better conversations |
| **Decision Initiation** | More decisions logged (especially hard ones) | 4-8 weeks | Not avoiding |
| **Resolution Rate** | Friction marked "resolved" increases | 6-12 weeks | Taking action |
| **Win-Friction Connection** | Wins link to previous friction areas | 8-16 weeks | Real behavioral change |

### Growth Score Model (Experimental)

```typescript
interface GrowthScore {
  userId: string;
  period: 'month' | 'quarter';
  
  dimensions: {
    selfAwareness: number;      // 0-100: Confidence calibration
    feedbackEffectiveness: number; // 0-100: Ratio + quality
    decisionCourage: number;    // 0-100: Hard decisions not avoided
    emotionalRegulation: number; // 0-100: Friction intensity management
    intentionality: number;     // 0-100: Prep rate, intention follow-through
  };
  
  overall: number;              // Weighted composite
  trend: 'improving' | 'stable' | 'declining';
  
  // Evidence
  keyWins: string[];
  areasOfGrowth: string[];
  areasToWatch: string[];
}
```

**Note:** Growth scores are shown as trends and evidence, NOT as absolute numbers to avoid gamification.

---

## Weekly Digest Specification

### Data Aggregation

```typescript
interface WeeklyDigest {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  generatedAt: Date;
  
  // Moment summaries
  decisions: {
    count: number;
    byType: Record<DecisionType, number>;
    avgConfidence: number;
    highStakesCount: number;
    highlights: DecisionMoment[];  // Top 2-3
  };
  
  feedback: {
    count: number;
    positiveCount: number;
    constructiveCount: number;
    ratio: number;
    byRecipient: Record<string, { positive: number; constructive: number }>;
    avgSpecificity: number;
    highlights: FeedbackMoment[];
  };
  
  friction: {
    count: number;
    byCategory: Record<FrictionCategory, number>;
    avgIntensity: number;
    unresolvedCount: number;
    highlights: FrictionMoment[];
  };
  
  wins: {
    count: number;
    byCategory: Record<WinCategory, number>;
    highlights: WinMoment[];
  };
  
  oneOnOnes: {
    count: number;
    prepRate: number;           // % with prep
    avgEffectiveness: number;
    feedbackInclusionRate: number;
  };
  
  // AI insights
  patterns: {
    emerging: Pattern[];        // New patterns detected this week
    continuing: Pattern[];      // Existing patterns with new evidence
    resolving: Pattern[];       // Patterns showing improvement
  };
  
  insights: {
    headline: string;           // "Your feedback ratio improved to 4:1"
    observations: string[];     // 2-3 specific observations
    suggestion: string;         // One thing to consider next week
  };
  
  // Looking ahead
  upcoming: {
    scheduledOneOnOnes: OneOnOneMoment[];
    flaggedStressors: FrictionMoment[];
  };
}
```

### Digest Display (UI Wireframe)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 YOUR WEEK: January 20-26, 2026                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ━━━ HEADLINE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  "Your feedback ratio with Marcus improved from 2:1 to 3.5:1 this week."   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  🎯 DECISIONS                          💬 FEEDBACK                          │
│  ─────────────                         ─────────────                        │
│  4 total                               9 total                              │
│  • 2 People                            • 7 Positive                         │
│  • 1 Strategy                          • 2 Constructive                     │
│  • 1 Delegation                        Ratio: 3.5:1 (↑ from 2.8:1)         │
│                                                                             │
│  Avg Confidence: 3.8/5                 Avg Specificity: 72/100              │
│  High Stakes: 1                        Top recipient: Sarah (3)             │
│                                                                             │
│  ► "Promoted Sarah to lead" [expand]   ► "Praised Marcus on client call"   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  🔥 FRICTION                           ⭐ WINS                              │
│  ─────────────                         ─────────────                        │
│  2 moments                             3 moments                            │
│  • Delegation (1)                                                           │
│  • Difficult conversation (1)          • Team shipped early                 │
│                                        • Sarah's first client call          │
│  Avg Intensity: 3.2/5                  • Board prep done early              │
│  Unresolved: 1                                                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  🔮 PATTERNS & INSIGHTS                                                     │
│  ─────────────────────────                                                  │
│                                                                             │
│  📈 GROWTH EVIDENCE                                                         │
│  "Your feedback with Marcus has shifted. 3 weeks ago, ratio was 1:1.       │
│   This week: 3:1. That's meaningful progress."                             │
│                                                                             │
│  ⚠️ EMERGING PATTERN                                                        │
│  "Delegation friction appeared twice this month. Both involved             │
│   Marcus taking on new responsibilities. Worth exploring?"                  │
│                                        [Reflect on this →]                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  📅 LOOKING AHEAD                                                           │
│  ─────────────────────                                                      │
│  • 1:1 with Sarah (Tuesday) — Last time you discussed career growth        │
│  • Board presentation (Thursday) — You flagged this as a stressor          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## AI Prompts & Classification

### Moment Classification Prompt

```
SYSTEM:
You are analyzing a leadership moment to extract structured data.
Given the user's description, classify and score the following:

For DECISIONS:
1. Decision Type: [people|process|strategy|resource|conflict|delegation|boundary|communication]
2. Emotional Tone: [confident|anxious|conflicted|relieved|uncertain|neutral]
3. AI Confidence Score: 0-100 based on language certainty
4. Certainty markers found: list specific words/phrases

For FEEDBACK:
1. Feedback Category: [recognition|performance|behavior|growth|correction|expectation]
2. Specificity Score: 0-100 (concrete examples = high, vague = low)
3. Actionability Score: 0-100 (clear next steps = high)
4. Balance Indicator: [praise-heavy|critique-heavy|balanced]

For FRICTION:
1. Friction Category: [delegation|conflict_avoidance|difficult_conversation|overcommitment|boundary_violation|team_dynamics|upward_management|imposter_syndrome|perfectionism|control]
2. Stress indicators: list specific words/phrases
3. Related past patterns: if any match previous friction descriptions

Respond in JSON format only.
```

### Insight Generation Prompt

```
SYSTEM:
You are generating weekly leadership insights for a leader.
Your tone is: warm but direct, like a trusted coach.
Avoid: generic advice, cheerleading, corporate speak.
Focus on: specific observations from THEIR data, genuine curiosity, meaningful patterns.

Given this week's data:
- [Decisions, Feedback, Friction, Wins data]
- [Historical patterns]
- [Previous week's data for comparison]

Generate:
1. HEADLINE: One sentence capturing the most meaningful observation
2. OBSERVATIONS: 2-3 specific, data-backed observations
3. SUGGESTION: One thing to consider (question form, not directive)

Rules:
- Reference specific moments when possible
- Note changes from previous weeks
- Highlight growth evidence when genuine
- Be honest about concerning patterns
- Keep total length under 200 words
```

### Reflect Mode Coaching Prompt

```
SYSTEM:
You are a leadership coach helping a leader process a moment they captured.
Your approach is Socratic—ask questions, don't give answers.
Your tone is warm, curious, and direct.

Context:
- User's profile: [name, role, goals]
- The moment they want to discuss: [moment data]
- Relevant patterns: [if any]
- Previous similar moments: [if any]

Rules:
- Ask ONE question at a time
- Listen for emotions beneath the facts
- Connect to patterns if relevant
- Help them discover their own insights
- Don't offer solutions unless explicitly asked
- Keep responses under 100 words

Goal: Help them gain clarity, not feel coached.
```

---

## UI/UX Flows

### Capture Flow (Mobile-First)

```
┌─────────────────────────┐
│  + Capture Moment       │
├─────────────────────────┤
│                         │
│  What happened?         │
│                         │
│  [  Decision  ]         │
│  [  Feedback  ]         │
│  [  Friction  ]         │
│  [    Win     ]         │
│  [    1:1     ]         │
│                         │
└─────────────────────────┘
         │
         ▼ (User taps "Decision")
┌─────────────────────────┐
│  Log a Decision         │
├─────────────────────────┤
│                         │
│  What did you decide?   │
│  ┌───────────────────┐  │
│  │                   │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  How confident?         │
│  ○ ○ ○ ○ ○              │
│  1   2   3   4   5      │
│                         │
│  Stakes?                │
│  [Low] [Med] [High]     │
│                         │
│  [Save →]               │
│                         │
└─────────────────────────┘
         │
         ▼ (Saved)
┌─────────────────────────┐
│  ✓ Captured             │
├─────────────────────────┤
│                         │
│  Decision logged.       │
│                         │
│  [Reflect on this]      │
│  [Done]                 │
│                         │
└─────────────────────────┘
```

### Time to Capture: < 30 seconds

---

## Database Schema

### Firestore Collections

```
users/{userId}
├── profile/
│   ├── name: string
│   ├── role: string
│   ├── startDate: timestamp
│   ├── goals: string[]
│   └── settings: {...}
│
├── moments/
│   ├── {momentId}/
│   │   ├── type: 'decision' | 'feedback' | 'friction' | 'win' | 'one_on_one'
│   │   ├── timestamp: timestamp
│   │   ├── data: {...}  // Type-specific data
│   │   ├── aiAnalysis: {...}
│   │   └── outcome: {...}  // Optional, added later
│   └── ...
│
├── patterns/
│   ├── {patternId}/
│   │   ├── type: PatternType
│   │   ├── status: 'emerging' | 'established' | 'resolving' | 'resolved'
│   │   ├── evidence: string[]  // Moment IDs
│   │   ├── detectedAt: timestamp
│   │   └── description: string
│   └── ...
│
├── digests/
│   ├── {weekId}/  // Format: "2026-W04"
│   │   ├── generatedAt: timestamp
│   │   ├── data: {...}  // Full digest data
│   │   └── seen: boolean
│   └── ...
│
├── conversations/
│   ├── {conversationId}/
│   │   ├── momentId: string  // What sparked the reflection
│   │   ├── messages: Message[]
│   │   ├── startedAt: timestamp
│   │   └── insights: string[]  // Key takeaways
│   └── ...
│
└── metrics/
    ├── weekly/
    │   └── {weekId}/
    │       ├── decisionCount: number
    │       ├── feedbackRatio: number
    │       ├── avgConfidence: number
    │       └── ...
    └── monthly/
        └── {monthId}/
            └── ...
```

---

## Build Phases

### Phase 1: Capture + Digest Foundation (6 weeks)

**Goal:** Validate that leaders will capture moments without prompts

**Build:**
- [ ] Moment capture UI (all 5 types)
- [ ] Basic AI classification (decision type, feedback type, friction category)
- [ ] Weekly digest generation
- [ ] Digest display UI
- [ ] Basic notification: Friday digest ready

**Measure:**
- Moments captured per user per week (target: 5+)
- Digest open rate (target: 70%)
- Retention at week 4 (target: 60%)

**Skip for now:**
- Pattern detection
- Reflect mode
- 1:1 prep features
- Coach dashboard

---

### Phase 2: Reflect + Patterns (6 weeks)

**Goal:** Validate that on-demand coaching feels valuable

**Build:**
- [ ] Reflect mode (post-capture conversation option)
- [ ] Pattern detection (basic rules)
- [ ] Pattern display in digest
- [ ] Insight surfacing ("I noticed something...")

**Measure:**
- Reflect sessions initiated per user per week (target: 1+)
- Session completion rate (target: 80%)
- Pattern acknowledgment rate (do users find them accurate?)

---

### Phase 3: Prep + Outcomes (4 weeks)

**Goal:** Add forward-looking utility

**Build:**
- [ ] 1:1 prep suggestions (based on history)
- [ ] Decision outcome tracking (follow-up prompts)
- [ ] Friction resolution tracking
- [ ] "Looking ahead" section in digest

**Measure:**
- 1:1 prep usage rate
- Outcome logging rate
- Resolution rate for friction

---

### Phase 4: Growth + Coach (4 weeks)

**Goal:** Make growth visible, integrate coaching

**Build:**
- [ ] Growth indicators (trends, not scores)
- [ ] Monthly growth summary
- [ ] Coach dashboard (pattern summaries)
- [ ] Shareable progress reports

**Measure:**
- Leader satisfaction with growth visibility
- Coach feedback on dashboard utility
- Quarterly retention

---

## Success Criteria

### For the Product

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Weekly active capture | 70% of users | By month 3 |
| Moments per active user | 5+ per week | By month 2 |
| Digest engagement | 70% open rate | Ongoing |
| Reflect usage | 1+ per week | By month 4 |
| 6-month retention | 60% | By month 6 |

### For Leaders

| Outcome | How We'll Know |
|---------|---------------|
| Better self-awareness | Confidence gap shrinks over time |
| More effective feedback | Ratio improves, specificity increases |
| Growth evidence | Friction categories reduce, wins connect to friction |
| Value without guilt | Engagement without streaks or daily prompts |

---

## Open Questions

1. **Calibration:** How do we train the AI confidence scoring? Need labeled data.
2. **Privacy:** How much do we store vs. summarize? Moment details vs. just patterns?
3. **Coach access:** What exactly can coaches see? Raw moments or only summaries?
4. **Benchmarking:** Should we show how user compares to cohort? (Risky gamification)
5. **Offline:** Do we need offline capture? (Mobile reality)

---

*Specification v1.0 - January 27, 2026*
*For team review and refinement*
