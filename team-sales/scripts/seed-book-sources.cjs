#!/usr/bin/env node
/**
 * Seed Book Sources
 * Populates Firestore with all source materials from the codebase
 * 
 * Usage: node scripts/seed-book-sources.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with Team Sales project (same as main app)
const serviceAccountPath = path.join(__dirname, '../../leaderreps-pd-platform-firebase-adminsdk.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-pd-platform',
});

const db = admin.firestore();
const SOURCES_COLLECTION = 'book_sources';

// All source materials organized by type
const SOURCES = [
  // ==================== METHODOLOGY & PHILOSOPHY ====================
  {
    title: 'LeaderReps Platform Blueprint',
    type: 'field_guide',
    tags: ['methodology', 'phases', 'foundation', 'ascent', 'prep'],
    notes: 'Core methodology document defining Prep → Foundation → Ascent phases',
    content: `# LeaderReps Platform Blueprint
## A Ground-Up Rebuild for Leadership Development

## Executive Summary

This document outlines a complete rebuild of the LeaderReps platform, architected around three distinct phases of leader development: **Prep**, **Foundation**, and **Ascent**.

**The Core Distinction:**
- **Foundation** = The Fort (structured, time-bound, high-touch training)
- **Ascent** = The Wilderness (open-ended, self-directed, lifelong growth)

## Part 1: Phase Definitions

### 1.1 PREP Phase
**Duration:** 2 weeks before Foundation begins
**Purpose:** Ensure leaders arrive ready for Day 1

Key Activities:
- Leadership assessments (PDQ, etc.)
- Leadership Identity profile
- Watch intro videos
- Access workbook for Session 1
- Complete pre-work exercises

### 1.2 FOUNDATION Phase
**Duration:** Target 4-6 weeks (reduced from 8 weeks for scalability)
**Purpose:** Build baseline competence and habit formation

> "This person can now function as a capable manager"

The Three Pillars of Foundation:
1. **Synchronous Training Sessions** - Live, instructor-led (Ryan/Christina)
2. **Conditioning Layer** - Deliberate practice between sessions
3. **Coach-in-the-Moment** - Prep assistance before real conversations

Foundation Content Modules:
1. Clear Feedback Framework - Core skill, practiced extensively
2. 1:1 Structure and Execution - Regular touchpoint discipline
3. Tension/Conflict Navigation - Difficult conversation handling
4. Leadership Identity - Self-awareness foundation
5. Accountability Conversations - Commitment and follow-through

### The Conditioning Layer - Detailed Specification

**Core Rule:**
Each leader completes ≥ 1 real leadership rep per week.

**Rep Definition Requirements:**
- Person (who)
- Rep type (feedback / 1:1 / tension / other)
- Deadline (defaults to end of week)

**Missed Rep Logic:**
If rep not completed by deadline:
→ Status = "Missed"
→ Rep rolls forward to next week
→ Leader must recommit or cancel with reason`
  },
  {
    title: 'README - Executive Summary',
    type: 'field_guide',
    tags: ['overview', 'problem', 'solution', 'three-pillars'],
    notes: 'Master documentation with problem statement and solution overview',
    content: `# LeaderReps PD Platform: Master Documentation

## The Problem
**70% of leadership training fails to create lasting behavior change.**

Traditional workshops create a "knowledge bump" that fades within weeks. Leaders return to old habits, organizations see no ROI, and the cycle repeats. **Your managers need daily practice, not occasional events.**

## The Solution: LeaderReps
A **complete leadership development ecosystem** combining:

| Pillar | What It Is | Why It Works |
|--------|-----------|--------------|
| **Community** | Cohort of 12 leaders growing together | Peer accountability + shared learning |
| **Content** | 95+ curated videos, tools & templates | Right content, right time, right format |
| **Coaching** | Expert trainers + personalized 1:1s | Guidance tailored to each leader |

## The Program Phases

**1. Prep Phase**
Onboarding, baseline assessments, and setting the stage for the program.

**2. Foundation (8 Weeks)** — Intensive skill-building
- 4 live cohort sessions with expert trainers
- CLEAR Feedback Framework mastery
- Leadership Identity development
- Daily practice in "The Arena"

**3. Ascent (Ongoing)** — The Leadership Operating System
- **My Leadership Plan:** Personalized, self-directed quarterly development plans.
- **Real Rep Practice:** AI-recommended practice aligned to specific focus areas.
- **Observer Feedback:** Monthly micro-pulses from peers for external validation.

## Daily Practice: The Arena & Workflow
The platform is built around a structured, time-based daily workflow:
- **AM Session:** Morning check-in, daily plan review, grounding rep.
- **Daily Practice:** Content consumption, skill practice, applied leadership.
- **PM Session:** Reflection, win logging, conditioning check.`
  },

  // ==================== USER GUIDES ====================
  {
    title: 'User Guide - Complete Platform Walkthrough',
    type: 'session_guide',
    tags: ['user-experience', 'conditioning-reps', 'streaks', 'LIS'],
    notes: 'Complete user journey documentation',
    content: `# LeaderReps PD Platform - User Guide

## Your Conditioning Reps

### The Power of Reps
Leadership is like fitness - it requires consistent practice. We call these small daily actions **"Reps"**. Each rep builds your leadership muscle over time. Each leader must complete ≥1 real rep per week.

### Grounding Rep
Start your day with intention:
1. Catch Up Alert (If Applicable) - If you have missed weeks, a prominent alert encourages catching up
2. Leadership Identity Statement - Read your LIS, reflect on who you want to be, confirm your grounding

### Daily Reps
1. Review Assigned Habits - Commit to practicing leadership habits today
2. Evening Reflection - Three questions:
   - What went well? - Celebrate successes
   - What could be better? - Learn from challenges
   - What will you focus on? - Set tomorrow's intention

### Understanding Your Streak 🔥
| What You Did | Streak Result |
|--------------|---------------|
| Completed grounding rep | +1 day |
| Weekend with no activity | Maintained (grace period) |
| Weekday with no activity | Reset to 0 |

### Leadership Identity Statement (LIS) Maker
Craft your personal Leadership Identity Statement:
1. Follow the prompt: "I am a [Core Value] leader who [Action] to create [Impact]."
2. Use the text area to draft and refine your statement.
3. Your statement will be saved and used in your daily grounding rep.

## Development Plan - Your 8-Week Journey
- **8 weeks** of focused development
- **New content unlocks** each week
- **Daily reps** specific to each week's theme
- **Community activities** to connect with peers

Each week includes:
- 📺 Videos - Leadership training videos
- 📖 Read & Reps - Articles with practice exercises
- 🏋️ Workouts - Interactive skill-building activities
- 🛠️ Tools - Templates and frameworks
- 👥 Community - Discussion topics and activities
- 🎯 Coaching - Live sessions and office hours`
  },
  {
    title: 'Admin Guide - Vault & Key Architecture',
    type: 'field_guide',
    tags: ['architecture', 'vault-key', 'conditioning', 'rep-flow'],
    notes: 'Technical architecture and admin operations',
    content: `# LeaderReps PD Platform - Administrator Guide

## The "Vault & Key" Architecture

This is the **most important concept** to understand:

THE VAULT (All content resources stored in Firestore collections)
- content_readings, content_videos, content_community
- content_coaching, content_tools, content_programs
- content_workouts, content_events, content_announcements

THE KEY (Development Plan weeks control what users can access)
- development_plan_v1/week-01 → Unlocks specific resources
- development_plan_v1/week-02 → Unlocks more resources

USER ACCESS
- Content only visible when unlocked by their current week
- User in Week 3 sees: Week 1 + Week 2 + Week 3 content
- Content is HIDDEN by default until unlocked

## Daily Conditioning Reps Flow

1. **Commit** to a rep - Choose rep type, person, risk level
2. **Prepare** for the rep (optional)
3. **Schedule** the rep (set deadline)
4. **Execute** the rep (take action)
5. **Debrief** the rep (reflect on results)

## Streak Logic
| Scenario | Streak Result |
|----------|---------------|
| Did activity (grounding, win, or rep) | +1 (increment) |
| Weekend, no activity | Maintained (grace) |
| Weekday, no activity | Reset to 0 |`
  },

  // ==================== FRAMEWORKS ====================
  {
    title: 'CLEAR Feedback Framework',
    type: 'field_guide',
    tags: ['framework', 'feedback', 'CLEAR', 'communication'],
    notes: 'Core feedback methodology used throughout Foundation',
    content: `# The CLEAR Feedback Framework

A structured approach to delivering effective feedback that creates real behavior change.

## The Framework

**C - Context**
Set the scene. When and where did this happen?
"In yesterday's team meeting when we were discussing the project timeline..."

**L - Locate**
Identify the specific behavior you observed.
"I noticed you interrupted Sarah three times while she was presenting..."

**E - Effect**
Describe the impact of the behavior.
"This made it difficult for the team to follow her points, and I saw her lose her train of thought..."

**A - Ask**
Invite their perspective with curiosity.
"What was going on for you in that moment?"

**R - Request**
Make a clear, specific request for the future.
"Going forward, I'd like you to wait until someone finishes their point before jumping in. Can you commit to that?"

## Why CLEAR Works

1. **Removes judgment** - Focus on observable behavior, not character
2. **Creates safety** - The 'Ask' step shows you're curious, not attacking
3. **Drives action** - Ends with a clear, actionable commitment
4. **Builds trust** - Transparency about impact without blame

## Common Mistakes

- Skipping Context (sounds like an ambush)
- Being vague in Locate ("you always...")
- Piling on in Effect (stick to one impact)
- Asking rhetorical questions ("Don't you think...")
- Making vague requests ("do better")`
  },
  {
    title: 'Trust Equation Framework',
    type: 'field_guide',
    tags: ['framework', 'trust', 'relationships', 'credibility'],
    notes: 'Mathematical model for understanding and building trust',
    content: `# The Trust Equation

Trust isn't magical—it's mathematical.

## The Formula

**Trust = (Credibility + Reliability + Intimacy) / Self-Orientation**

## The Components

**Credibility** - Can they believe what you say?
- Expertise and track record
- Knowledge and competence
- Honesty about what you don't know

**Reliability** - Can they count on you?
- Consistency over time
- Follow-through on commitments
- Predictable behavior

**Intimacy** - Do they feel safe with you?
- Confidentiality
- Empathy and understanding
- Willingness to be vulnerable

**Self-Orientation** (The Divisor) - Are you focused on them or yourself?
- This is the trust-killer
- High self-orientation tanks everything
- Even high credibility/reliability/intimacy can't overcome it

## Key Insight

Most trust issues aren't about competence. They're about self-orientation. 

Ask yourself: "Am I truly focused on them, or am I focused on how I'm being perceived?"

## Application

When trust is low, diagnose which component is failing:
- Credibility gap? Demonstrate expertise, admit gaps honestly
- Reliability gap? Make smaller promises and keep them consistently
- Intimacy gap? Share more, listen more, create psychological safety
- Self-Orientation? Shift focus from "how do I look?" to "how can I help?"`
  },
  {
    title: 'Leadership Identity Statement Formula',
    type: 'field_guide',
    tags: ['framework', 'identity', 'LIS', 'self-awareness'],
    notes: 'Framework for crafting personal leadership identity',
    content: `# The Leadership Identity Statement (LIS)

Every great leader knows who they are and what they stand for.

## The Formula

Your Leadership Identity Statement answers: "What kind of leader do I want to be?"

**I am a leader who...** (core trait)
**I believe...** (guiding principle)
**I create...** (impact on others)

## Example

"I am a leader who leads with calm confidence. I believe every person has untapped potential. I create environments where people feel safe to grow."

## Key Insight

Your LIS isn't aspirational—it's declarative. Speak it as truth.

## How to Craft Your LIS

1. **Identify your core trait** - What word captures how you naturally lead? (curious, calm, direct, inclusive, bold)

2. **Articulate your belief** - What do you believe about people, teams, or leadership that guides your decisions?

3. **Define your impact** - What do you create or enable for the people you lead?

## Using Your LIS

- Read it every morning during your Grounding Rep
- Use it as a compass when facing difficult decisions
- Revisit and refine it as you grow
- Share it with your team (vulnerability builds trust)

## Evolution

Your LIS will evolve. But starting with clarity beats starting with confusion. Write a first draft, live with it, refine it as you learn more about yourself as a leader.`
  },
  {
    title: 'Radical Candor 2x2',
    type: 'field_guide',
    tags: ['framework', 'feedback', 'radical-candor', 'care'],
    notes: 'Kim Scott model for effective feedback relationships',
    content: `# The Radical Candor Framework

From Kim Scott's "Radical Candor" - a model for feedback relationships.

## The 2x2 Matrix

Two dimensions:
- **Care Personally** (vertical axis) - Do you genuinely care about this person as a human?
- **Challenge Directly** (horizontal axis) - Are you willing to tell them hard truths?

## The Four Quadrants

**Radical Candor** (High Care + High Challenge)
"I care about you AND I'm going to tell you the truth"
- This is the goal
- Build relationships first, then challenge
- Kim Scott: "It's not mean; it's clear"

**Ruinous Empathy** (High Care + Low Challenge)
"I care about you so I won't say anything that might hurt"
- The most common mistake
- Feels kind, but prevents growth
- Actually more damaging than Obnoxious Aggression

**Obnoxious Aggression** (Low Care + High Challenge)
"I don't care about your feelings, here's the truth"
- At least they know where they stand
- Can be corrected by building relationships
- Often comes from stress or poor self-awareness

**Manipulative Insincerity** (Low Care + Low Challenge)
"I don't care and I won't say anything real"
- Backstabbing, passive-aggressive, political
- The worst quadrant
- Destroys trust and culture

## Key Insight

Ruinous Empathy is the most dangerous because it feels like the right thing to do. We tell ourselves we're being kind, but we're actually withholding information people need to grow.

## The Fix

Start with Radical Candor. If it's not landing, you probably haven't built enough "Care Personally" first. Don't reduce the challenge—increase the care.`
  },

  // ==================== LEADERSHIP QUOTES ====================
  {
    title: 'Leadership Quotes Collection',
    type: 'notes',
    tags: ['quotes', 'inspiration', 'wisdom', 'leaders'],
    notes: '28+ curated leadership quotes for book chapters',
    content: `# Leadership Quotes Collection

## On Vision & Clarity
"The very essence of leadership is that you have to have a vision. You can't blow an uncertain trumpet." 
— Theodore Hesburgh, Former president of Notre Dame University

"Leadership is the capacity to translate vision into reality."
— Warren Bennis, Pioneer of leadership studies

## On Service & Care
"Leadership is not about being in charge. It's about taking care of those in your charge."
— Simon Sinek, Author of 'Leaders Eat Last'

"The first responsibility of a leader is to define reality. The last is to say thank you. In between, the leader is a servant."
— Max De Pree, Former CEO of Herman Miller

"It is better to lead from behind and to put others in front, especially when you celebrate victory. You take the front line when there is danger."
— Nelson Mandela

## On Developing Others
"Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others."
— Jack Welch, Former CEO of General Electric

"The task of leadership is not to put greatness into people, but to elicit it, for the greatness is there already."
— John Buchan

"The growth and development of people is the highest calling of leadership."
— Harvey Firestone

## On Influence
"A leader is one who knows the way, goes the way, and shows the way."
— John C. Maxwell

"People buy into the leader before they buy into the vision."
— John C. Maxwell, From '21 Irrefutable Laws of Leadership'

"The key to successful leadership is influence, not authority."
— Kenneth Blanchard

## On Character
"Nearly all men can stand adversity, but if you want to test a man's character, give him power."
— Abraham Lincoln

"The price of greatness is responsibility."
— Winston Churchill

"Earn your leadership every day."
— Michael Jordan

## On Vulnerability & Courage
"Vulnerability is the birthplace of innovation, creativity, and change."
— Brené Brown

"Courage is not the absence of fear. It is acting in spite of it."
— Mark Twain

## On Balance
"The challenge of leadership is to be strong, but not rude; be kind, but not weak; be bold, but not bully; be thoughtful, but not lazy; be humble, but not timid; be proud, but not arrogant."
— Jim Rohn

## On Decision Making
"Management is doing things right; leadership is doing the right things."
— Peter Drucker

"The art of leadership is saying no, not yes. It is very easy to say yes."
— Tony Blair

## On Empathy
"To handle yourself, use your head; to handle others, use your heart."
— Eleanor Roosevelt`
  },

  // ==================== BOOK SUMMARIES ====================
  {
    title: 'Leadership Book Summaries',
    type: 'research',
    tags: ['books', 'summaries', 'atomic-habits', 'radical-candor', 'leadership'],
    notes: '12 leadership book synopses with key insights',
    content: `# Leadership Book Summaries

## 1. Atomic Habits - James Clear (2018)
**Synopsis:** The quality of your life depends on the quality of your habits. Tiny changes compound into remarkable results.

**Key Insight:** "You do not rise to the level of your goals. You fall to the level of your systems."

**Leadership Connection:** Great leaders build systems that make good leadership automatic. They don't rely on motivation—they design environments for success.

**Actionable Advice:** Focus on becoming 1% better each day. Make desired behaviors obvious, attractive, easy, and satisfying.

---

## 2. Radical Candor - Kim Scott (2017)
**Synopsis:** The best managers care personally while challenging directly. Missing either creates dysfunction.

**Key Insight:** Ruinous Empathy—caring but not challenging—is actually more dangerous than Obnoxious Aggression.

**Leadership Connection:** Your job as a leader is to be clear, not nice. Kindness isn't avoiding hard truths—it's delivering them in a way that helps people grow.

**Quote:** "It's not mean; it's clear. Unclear is unkind."

---

## 3. Leaders Eat Last - Simon Sinek (2014)
**Synopsis:** Great leaders create a Circle of Safety where teams feel protected and can focus on external challenges instead of internal threats.

**Key Insight:** When leaders prioritize their own comfort and status over the wellbeing of their people, trust erodes and performance suffers.

**Leadership Connection:** Leadership is not about being in charge. It's about taking care of those in your charge.

---

## 4. The Five Dysfunctions of a Team - Patrick Lencioni (2002)
**Synopsis:** Teams fail because of five connected dysfunctions: absence of trust, fear of conflict, lack of commitment, avoidance of accountability, and inattention to results.

**Key Insight:** Everything starts with trust. Without it, people won't be vulnerable, won't engage in productive conflict, and won't commit fully.

**Leadership Connection:** Your job is to go first in vulnerability. When leaders admit mistakes and ask for help, it gives others permission to do the same.

---

## 5. Good to Great - Jim Collins (2001)
**Synopsis:** Companies that went from good to great shared key characteristics: Level 5 leadership, getting the right people, confronting brutal facts, and disciplined focus.

**Key Insight:** Level 5 leaders combine personal humility with fierce resolve. They're ambitious for the company, not themselves.

**Quote:** "Good is the enemy of great."

---

## 6. Dare to Lead - Brené Brown (2018)
**Synopsis:** Brave leadership requires vulnerability. You can't get to courage without walking through uncertainty, risk, and emotional exposure.

**Key Insight:** Armored leadership—hiding behind certainty, perfection, and emotional distance—actually makes leaders less effective, not more.

**Quote:** "Vulnerability is not winning or losing; it's having the courage to show up and be seen when we have no control over the outcome."

---

## 7. The Coaching Habit - Michael Bungay Stanier (2016)
**Synopsis:** Great leaders coach more and manage less. Seven essential questions can transform your conversations from advice-giving to growth-enabling.

**Key Insight:** When you jump in with advice, you miss the real issue 80% of the time.

**Actionable:** Master three questions: 'What's on your mind?' (kickstart), 'And what else?' (find the real issue), 'What's the real challenge here for you?' (focus).

---

## 8. Extreme Ownership - Jocko Willink & Leif Babin (2015)
**Synopsis:** Navy SEAL leadership principles: Leaders must own everything in their world. There are no bad teams, only bad leaders.

**Key Insight:** When things go wrong, the leader's first instinct should be to look in the mirror, not point fingers.

**Quote:** "The leader is truly and ultimately responsible for everything. That's Extreme Ownership."

---

## 9. Drive - Daniel Pink (2009)
**Synopsis:** True motivation comes from autonomy, mastery, and purpose—not carrots and sticks.

**Leadership Connection:** Stop trying to motivate people with rewards and punishments. Instead, create conditions for intrinsic motivation.

---

## 10. Turn the Ship Around! - L. David Marquet (2013)
**Synopsis:** A submarine captain transformed the worst-performing sub into the best by giving control instead of taking it. Leader-leader, not leader-follower.

**Key Insight:** Instead of giving orders, ask 'What do you intend to do?' This forces people to think like leaders.

**Quote:** "Don't move information to authority, move authority to information."

---

## 11. Multipliers - Liz Wiseman (2010)
**Synopsis:** Some leaders (Multipliers) amplify the intelligence and capability of their teams. Others (Diminishers) drain it.

**Key Insight:** Multipliers get 2x more out of people than Diminishers. Most Diminishers think they're Multipliers—the behaviors are often well-intentioned.

---

## 12. Emotional Intelligence - Daniel Goleman (1995)
**Synopsis:** Emotional intelligence—self-awareness, self-regulation, motivation, empathy, and social skills—separates great leaders from merely good ones.

**Key Insight:** Up to 70% of how employees perceive workplace climate is attributable to the emotional intelligence of the leader.`
  },

  // ==================== SALES & MARKETING ====================
  {
    title: 'Video Scripts - The Problem',
    type: 'website',
    tags: ['sales', 'marketing', 'problem', 'messaging'],
    notes: 'Sales video scripts with problem framing and value proposition',
    content: `# LeaderReps Video Scripts - Core Messaging

## The Hook (30 seconds)
"Your company spent $10,000 on leadership training last year.

Want to know what you got for it?

A binder. Some Post-it notes. And managers who went right back to their old habits.

[70% of training fails]

Here's the secret no one tells you:

Leadership isn't taught in workshops.
It's built in daily reps.

[Daily reps > Annual events]"

---

## The Problem (45 seconds)
"I spent 15 years training leaders.

And I'll be honest — most of what we did didn't work.

We'd run a great two-day workshop. Leaders would leave inspired.

Then they'd go back to 47 emails, three fires to put out, and a team waiting for answers.

Within two weeks, everything we taught was gone.

The problem wasn't the content. It was the format.

Leadership development can't be an event. It has to be a practice.

Daily. Consistent. Supported."

---

## Two-Minute Explainer - The Solution
"LeaderReps changes that.

We combine an 8-week Foundation program with daily practice in The Arena.

Four live sessions with expert trainers — where leaders learn frameworks like CLEAR Feedback and build their Leadership Identity.

Plus 10 minutes a day in the app — morning intention, evening reflection — building habits that stick.

And a cohort of 12 leaders growing together. Because leadership isn't a solo journey."

---

## The Proof
"The results?

78% completion rate — versus the industry average of 20%.
Leaders averaging 16-day streaks.
3x increase in feedback given to their teams.

Real behavior change. Not just knowledge."

---

## The Differentiator
"Three pillars make it work:

Community — a cohort that holds you accountable.
Content — 95 videos, tools, and templates at your fingertips.
Coaching — expert trainers who know your specific challenges.

It's not another app. It's not another workshop.
It's a complete ecosystem for leadership growth."

---

## The CTA
"Ready to develop leaders who actually change?

Visit leaderreps.com or reach out to schedule a demo.

LeaderReps. Leadership development that happens every single day."`
  },

  // ==================== CURRICULUM CONTENT ====================
  {
    title: 'Focus 1: Leadership Identity Sessions',
    type: 'session_guide',
    tags: ['curriculum', 'identity', 'self-awareness', 'plato'],
    notes: 'Complete 6-session focus on leadership identity',
    content: `# Focus 1: Leadership Identity - "Know Who You Are"

Discover your authentic leadership voice and build unshakeable self-awareness.

## Session 1: The Mirror of Leadership (Quote)
**Theme:** Self-awareness

"The first and greatest victory is to conquer yourself."
— Plato

Reflection: Leadership begins with self-mastery. Before you can guide others, you must understand your own values, fears, and motivations.

---

## Session 2: The Leadership Identity Statement (Lesson)
**Theme:** Identity

Every great leader knows who they are and what they stand for.

Your Leadership Identity Statement (LIS) is a compass that guides decisions when the path isn't clear. It answers: 'What kind of leader do I want to be?' Not what you do, but who you ARE as a leader.

**The LIS Formula:**
- I am a leader who... (core trait)
- I believe... (guiding principle)
- I create... (impact on others)

**Example:** "I am a leader who leads with calm confidence. I believe every person has untapped potential. I create environments where people feel safe to grow."

Your LIS isn't aspirational—it's declarative. Speak it as truth.

---

## Session 3: Defining Your Core Values (Reflection)
**Theme:** Values

Your values are the non-negotiables that define your leadership.

**Prompt:** Think about a time when you felt deeply proud of a decision you made as a leader. What value were you honoring in that moment?

**Deeper Prompt:** Now think about a time you felt conflicted or compromised. What value was being challenged?

**Insight:** The gap between these two moments reveals where your growth edge lies.

---

## Session 4: Simon Sinek - Start with Why (Video)
**Theme:** Purpose

Description: One of the most-watched TED talks ever. Sinek explains why some leaders inspire action while others struggle—and it all starts with WHY.

**Watch For:** The Golden Circle framework: Why → How → What. Notice how Apple and Martin Luther King Jr. both 'start with why.'

**Discussion:** What's YOUR why as a leader? Not what you do—why do you do it?

---

## Session 5: Start with Why - Book Bite
**Theme:** Purpose

Synopsis: Sinek's Golden Circle framework reveals why some leaders inspire action while others struggle. It starts with WHY—your purpose, cause, or belief—not WHAT you do or HOW you do it.

**Key Insight:** People don't buy what you do; they buy why you do it. The same applies to leading people.

**Leadership Connection:** When your team knows your WHY, they don't follow you for a paycheck—they follow you for a purpose.

---

## Session 6: Crafting Your Leadership Identity (Integration)
**Theme:** Identity

You've explored self-awareness, values, and purpose. Now let's bring it together.

**Challenge:** Write your Leadership Identity Statement. Use what you've learned this week.

**Prompts:**
- What kind of leader do you want to be?
- What do you believe about people and leadership?
- What do you want to create for your team?

**Closing:** This statement will evolve. But starting with clarity beats starting with confusion.`
  },
  {
    title: 'Focus 2: Building Trust Sessions',
    type: 'session_guide',
    tags: ['curriculum', 'trust', 'vulnerability', 'covey'],
    notes: 'Complete 6-session focus on building trust',
    content: `# Focus 2: Building Trust - "The Foundation of Influence"

Master the mechanics of trust—how to build it rapidly and repair it when broken.

## Session 1: The Speed of Trust (Quote)
**Theme:** Trust

"Trust is the one thing that changes everything."
— Stephen M.R. Covey

Reflection: When trust is high, everything moves faster. When it's low, everything becomes expensive—in time, energy, and relationships.

---

## Session 2: The Trust Equation (Lesson)
**Theme:** Trust

Trust isn't magical—it's mathematical.

**The Trust Equation:**
Trust = (Credibility + Reliability + Intimacy) / Self-Orientation

**Components:**
- **Credibility:** Can they believe what you say? (Expertise, track record)
- **Reliability:** Can they count on you? (Consistency, follow-through)
- **Intimacy:** Do they feel safe with you? (Confidentiality, empathy)
- **Self-Orientation:** Are you focused on them or yourself? (This is the divisor—it tanks trust)

**Insight:** Most trust issues aren't about competence. They're about self-orientation. Are you truly focused on them?

---

## Session 3: The Broken Promise (Scenario)
**Theme:** Trust Repair

**Setup:** You promised your team you'd advocate for their project in the leadership meeting. But when pushback came from the CEO, you didn't push back. Now your team knows. They're not saying anything, but the energy has shifted.

**Question:** What do you do?

**Options:**
1. **Address it head-on with the team** - Vulnerable but powerful. Acknowledging the gap shows integrity.
2. **Wait and demonstrate trustworthiness over time** - Actions speak, but silence signals avoidance.
3. **Go back to leadership and advocate harder** - Good follow-through, but team may never know.

**Principle:** The fastest way to repair trust is to name the break. Avoiding it extends the damage.

---

## Session 4: Vulnerability-Based Trust (Lesson)
**Theme:** Vulnerability

Patrick Lencioni's model suggests trust requires something uncomfortable: vulnerability.

Vulnerability-based trust means being willing to say 'I don't know,' 'I was wrong,' or 'I need help.' It's the opposite of projecting invincibility.

**Signals of Vulnerability-Based Trust:**
- Admitting weaknesses and mistakes
- Asking for help
- Accepting questions and input
- Giving others the benefit of the doubt
- Taking risks in offering feedback

**Key Insight:** The leader must go first. When you model vulnerability, you give others permission.

---

## Session 5: The Five Dysfunctions of a Team - Book Bite
**Theme:** Teams & Trust

Synopsis: Teams fail because of five connected dysfunctions. Everything starts with trust.

**Key Insight:** Without trust, people won't be vulnerable, won't engage in productive conflict, and won't commit fully.

**Leadership Connection:** Your job is to go first in vulnerability. When leaders admit mistakes and ask for help, it gives others permission to do the same.

---

## Session 6: Building Your Trust Foundation (Integration)
**Theme:** Trust Application

**Reflection Prompts:**
- Think of someone at work you fully trust. What behaviors create that trust?
- Think of someone you struggle to trust. Which component of the Trust Equation is weakest?
- What's one thing you could do this week to increase trust on your team?

**Challenge:** Have a conversation where you "go first" in vulnerability this week.`
  },
  {
    title: 'Focus 3: Giving Effective Feedback Sessions',
    type: 'session_guide',
    tags: ['curriculum', 'feedback', 'CLEAR', 'radical-candor'],
    notes: 'Complete focus on feedback with CLEAR Framework',
    content: `# Focus 3: Giving Effective Feedback

Transform feedback from dreaded obligation to powerful development tool.

## Session 1: The Feedback Paradox (Quote)
"It's not mean; it's clear. Unclear is unkind."
— Kim Scott, Radical Candor

Reflection: Most people avoid feedback because they think it's mean to point out problems. But withholding information someone needs to grow is the unkind act.

---

## Session 2: The CLEAR Framework (Lesson)
**Theme:** Feedback Delivery

**The Framework:**
- **C - Context:** Set the scene. When and where?
- **L - Locate:** Identify the specific behavior
- **E - Effect:** Describe the impact
- **A - Ask:** Invite their perspective
- **R - Request:** Make a clear ask for the future

**Example:**
"In yesterday's meeting [Context], I noticed you interrupted Sarah three times [Locate]. This made it hard for the team to follow her points [Effect]. What was going on for you? [Ask] Going forward, I'd like you to wait until someone finishes before jumping in [Request]."

---

## Session 3: Reinforcing vs. Redirecting (Lesson)
**Theme:** Feedback Types

**Reinforcing Feedback (DRF):**
Catch people doing things right. Be specific about WHAT they did and WHY it mattered.
"I noticed you followed up with the client within an hour. That responsiveness is exactly what builds trust—keep doing that."

**Redirecting Feedback (DRE):**
Address behaviors that need to change. Focus on behavior and impact, not character.
"I noticed you sent that email without copying the team. This created confusion about next steps. Can you commit to including the team going forward?"

**Key Insight:** Most leaders under-deliver reinforcing feedback. The ratio should be at least 3:1 positive to redirecting.

---

## Session 4: The Radical Candor Matrix (Lesson)
**Theme:** Feedback Relationships

**The 2x2:**
- Care Personally × Challenge Directly

**Quadrants:**
- **Radical Candor:** High Care + High Challenge = The goal
- **Ruinous Empathy:** High Care + Low Challenge = Most common mistake
- **Obnoxious Aggression:** Low Care + High Challenge = Harsh but fixable
- **Manipulative Insincerity:** Low Care + Low Challenge = Toxic

**Fix:** If feedback isn't landing, don't reduce challenge—increase care.

---

## Session 5: Roleplay - The Difficult Feedback
**Theme:** Practice

**Scenario:** One of your team members, Jordan, has been consistently late to stand-ups. It's affecting team morale. Others have started arriving late too.

**Your task:** Practice delivering feedback using the CLEAR framework.

**Coaching:** 
- Did you set clear context?
- Was the behavior specific and observable?
- Did you ask for their perspective before making your request?

---

## Session 6: Your Feedback Commitment (Integration)
**Theme:** Application

**Reflection:**
- Who on your team needs reinforcing feedback this week?
- Who needs redirecting feedback you've been avoiding?
- What's your fear about delivering that feedback?

**Challenge:** Deliver one CLEAR feedback conversation this week. Report back on how it went.`
  },

  // ==================== ASSESSMENT DIMENSIONS ====================
  {
    title: 'Leadership Assessment Dimensions',
    type: 'research',
    tags: ['assessment', 'dimensions', 'competencies', 'DNA'],
    notes: '6 core leadership dimensions with descriptions',
    content: `# Leadership Assessment Dimensions

## The 6 Core Leadership Dimensions

### 1. Vision & Strategy
**Description:** The ability to see the big picture, develop strategic direction, and inspire others with a compelling future state. Visionary leaders connect daily work to long-term purpose.

**Strengths:**
- Creates compelling vision
- Thinks strategically
- Connects work to purpose
- Anticipates future challenges

**Growth Areas:**
- May overlook tactical details
- Can struggle with execution focus
- May move too fast for others

---

### 2. People & Empathy
**Description:** The capacity to understand and connect with others on a human level, building relationships based on genuine care and mutual respect.

**Strengths:**
- Builds deep relationships
- Shows genuine care
- Creates psychological safety
- Develops others

**Growth Areas:**
- May avoid necessary conflict
- Can be seen as too soft
- May struggle with tough decisions about people

---

### 3. Execution & Drive
**Description:** The discipline to turn ideas into action, maintain momentum, and deliver results consistently. Execution-focused leaders make things happen.

**Strengths:**
- Gets results
- Maintains high standards
- Creates accountability
- Follows through consistently

**Growth Areas:**
- May burn out self or team
- Can overlook relationship building
- May sacrifice long-term for short-term

---

### 4. Communication
**Description:** The ability to convey ideas clearly, listen actively, and adapt communication style to different audiences and situations.

**Strengths:**
- Articulates clearly
- Listens actively
- Adapts to audience
- Gives effective feedback

**Growth Areas:**
- May over-communicate
- Can struggle in 1:1 vs. group settings
- May assume understanding

---

### 5. Adaptability
**Description:** The flexibility to navigate change, adjust approaches when needed, and maintain effectiveness in uncertain or ambiguous situations.

**Strengths:**
- Embraces change
- Stays calm under pressure
- Adjusts quickly
- Sees opportunity in chaos

**Growth Areas:**
- May lack consistency
- Can frustrate those needing stability
- May change too quickly

---

### 6. Innovation & Growth
**Description:** The drive to improve, experiment, and push beyond the status quo, creating an environment where new ideas flourish.

**Strengths:**
- Challenges status quo
- Encourages experimentation
- Creates learning culture
- Embraces failure as learning

**Growth Areas:**
- May neglect proven approaches
- Can create instability
- May undervalue operational excellence`
  },

  // ==================== ROI & METRICS ====================
  {
    title: 'ROI Data & Industry Benchmarks',
    type: 'research',
    tags: ['ROI', 'metrics', 'benchmarks', 'data', 'business-case'],
    notes: 'Research-backed statistics for leadership development ROI',
    content: `# Leadership Development ROI Data

## The Problem: Industry Statistics

**Training Failure Rate:**
- 70% of leadership training fails to create lasting behavior change (source: McKinsey)
- Average completion rate for corporate training: 20%
- Knowledge retention after 2 weeks: 10% without reinforcement

**Cost of Poor Leadership:**
- 50% of employees leave because of their manager (Gallup)
- Disengaged employees cost $450-550B annually in lost productivity (Gallup)
- Cost to replace an employee: 50-200% of annual salary

---

## The Solution: LeaderReps Results

**Engagement Metrics:**
- 78% completion rate (vs. 20% industry average)
- Average streak length: 16 days
- Daily active usage: 85% of enrolled leaders

**Behavior Change Metrics:**
- 3x increase in feedback delivered to direct reports
- 92% report using CLEAR Framework in real conversations
- 87% report improved 1:1 meeting effectiveness

---

## Business Impact Projections

**Turnover Reduction:**
- Industry benchmark: 10-20% turnover improvement from leadership development
- Projected savings per 100 managers: $500K-$2M annually

**Productivity Gains:**
- Engaged teams are 21% more productive (Gallup)
- Leaders with strong feedback skills see 14.9% higher retention

**Leadership Pipeline:**
- Internal promotion rate increases 25% with structured development
- Time-to-productivity for new managers decreases 30%

---

## ROI Calculator Assumptions

**Conservative Model:**
- Average salary of manager: $80,000
- Cost of turnover: 100% of salary ($80,000)
- Turnover reduction: 10%
- Productivity improvement: 5%

**For 50 managers:**
- Turnover savings: $400,000 (5 fewer departures)
- Productivity gains: $200,000 (5% × 50 × $80K)
- Total annual impact: $600,000
- Program cost: ~$100,000
- ROI: 500%

---

## Research Sources

- Gallup State of the American Manager Report
- McKinsey: Why Leadership Development Programs Fail
- Harvard Business Review: The Business Case for Curiosity
- Bersin by Deloitte: High-Impact Leadership Development
- CEB/Gartner: Leadership Development ROI Studies`
  }
];

async function seedSources() {
  console.log('🌱 Starting Book Sources seed...\n');
  
  // First, check existing sources
  const existingSnapshot = await db.collection(SOURCES_COLLECTION).get();
  const existingTitles = new Set(existingSnapshot.docs.map(doc => doc.data().title));
  
  console.log(`📚 Found ${existingSnapshot.size} existing sources\n`);
  
  let added = 0;
  let skipped = 0;
  
  for (const source of SOURCES) {
    if (existingTitles.has(source.title)) {
      console.log(`⏭️  Skipped (exists): ${source.title}`);
      skipped++;
      continue;
    }
    
    try {
      await db.collection(SOURCES_COLLECTION).add({
        ...source,
        uploadedBy: 'system-seed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added: ${source.title}`);
      added++;
    } catch (err) {
      console.error(`❌ Failed to add "${source.title}":`, err.message);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total in collection: ${existingSnapshot.size + added}`);
  console.log('\n✨ Seed complete!');
  
  process.exit(0);
}

// Run the seeder
seedSources().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
