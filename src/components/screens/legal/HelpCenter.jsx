import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  HelpCircle, Search, BookOpen, Users, Settings, Zap, Target, 
  ChevronRight, ArrowLeft, Mail, MessageCircle, Clock, 
  ThumbsUp, ThumbsDown, ExternalLink, Sparkles, Compass,
  Play, FileText, Shield, CreditCard, Bell, Smartphone,
  TrendingUp, Award, BarChart3, Calendar, CheckCircle2,
  Lightbulb, Heart, RefreshCw, ArrowRight, Star, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../../../providers/NavigationProvider.jsx';
import { BreadcrumbNav } from '../../ui/BreadcrumbNav.jsx';

// ============================================================================
// HELP CENTER DATA - Comprehensive knowledge base
// ============================================================================

const HELP_ARTICLES = {
  // Getting Started Category
  'getting-started': {
    id: 'getting-started',
    category: 'Getting Started',
    categoryId: 'getting-started',
    icon: Zap,
    color: 'emerald',
    description: 'New to the Arena? Start here.',
    articles: [
      {
        id: 'what-is-leaderreps',
        title: 'What is the Arena?',
        summary: 'An overview of the platform and what you can accomplish.',
        readTime: 3,
        featured: true,
        content: `
## Welcome to the Arena

The Arena is a comprehensive leadership development platform designed to transform how you grow as a leader through daily conditioning and practice.

### What Makes the Arena Different

Unlike traditional training programs that deliver information in a one-time event, the Arena is built on the principle that **leadership is a practice**—something you develop through daily action, not just knowledge acquisition.

### Key Features

- **Conditioning System**: Build leadership habits through Real Reps in your actual work
- **5-Milestone Foundation**: Progress through 5 milestones that unlock new rep types
- **AI Coaching**: 24/7 access to RepUp, your AI leadership coach
- **Live Sessions**: Real-time coaching with expert trainers
- **Progress Tracking**: Visualize your growth in the Arena

### The Arena Method

1. **Learn** — Absorb leadership concepts through curated content
2. **Practice** — Apply what you learn through daily conditioning reps
3. **Track** — Build self-awareness through consistent progress monitoring
4. **Connect** — Grow alongside your cohort community

### Getting Started

Your journey begins with the **Prep Phase**, where you'll complete your Leader Profile and Baseline Assessment. This helps us personalize your experience and track your growth.
        `,
        relatedArticles: ['prep-phase', 'conditioning-overview', 'what-is-cohort']
      },
      {
        id: 'prep-phase',
        title: 'How do I complete the Prep Phase?',
        summary: 'Everything you need to do before your cohort begins.',
        readTime: 4,
        featured: true,
        content: `
## Completing the Prep Phase

The Prep Phase prepares you for success in your leadership development journey. Here's exactly what you need to do.

### Required Items

#### 1. Leader Profile
Your Leader Profile captures essential information about you as a leader:
- Your leadership role and context
- Your development goals
- Your preferred communication style
- Your timezone for scheduling

**Tip**: Take your time here. The more thoughtful your responses, the better we can personalize your experience.

#### 2. Baseline Assessment
The assessment measures your current leadership capabilities across key dimensions:
- Self-awareness
- Team leadership
- Strategic thinking
- Communication effectiveness
- Emotional intelligence

**Time needed**: Approximately 15-20 minutes

### What Happens After

Once you complete both required items:
- ✅ You'll unlock the Conditioning system for Real Reps
- ✅ You can begin practicing leadership before your cohort starts
- ✅ You'll see your personalized Daily Plan

### Pro Tips

- Complete the prep phase at least 3 days before your cohort starts
- Explore the Conditioning feature to understand how Real Reps work
- Review the onboarding content in your Daily Plan
        `,
        relatedArticles: ['what-is-leaderreps', 'conditioning-overview', 'baseline-assessment']
      },
      {
        id: 'foundation-prep',
        title: 'What is the Preparation Phase?',
        summary: 'Understanding the onboarding period before your cohort starts.',
        readTime: 2,
        content: `
## Preparation Phase Explained

The Preparation Phase is the onboarding window between when you get access to the platform and when your cohort officially begins.

### Purpose

This time is designed to help you:
- Get comfortable with the platform interface
- Complete required setup tasks
- Begin building the daily conditioning habit
- Mentally prepare for your leadership journey

### What to Focus On

1. **Complete your Leader Profile** — First priority
2. **Take the Baseline Assessment** — Required for cohort participation
3. **Explore the interface** — Familiarize yourself with navigation
4. **Try the Conditioning system** — Practice makes perfect

### Timeline

The Preparation Phase typically lasts 1-2 weeks, depending on when you were enrolled. Use this time wisely—leaders who engage during prep phase see better outcomes.
        `,
        relatedArticles: ['prep-phase', 'what-is-leaderreps']
      },
      {
        id: 'baseline-assessment',
        title: 'Understanding the Baseline Assessment',
        summary: 'What the assessment measures and how to approach it.',
        readTime: 3,
        content: `
## The Baseline Assessment

The Baseline Assessment establishes your starting point for measurable leadership growth.

### What It Measures

- **Self-Awareness**: How well you understand your strengths, weaknesses, and impact
- **Team Development**: Your ability to build and elevate others
- **Strategic Thinking**: How you approach complex problems and planning
- **Communication**: Your effectiveness in connecting and influencing
- **Emotional Intelligence**: Your ability to manage emotions and relationships

### How to Approach It

- **Be honest**: This isn't a test with right answers—it's a mirror
- **Think about recent behavior**: Base answers on actual experiences
- **Don't overthink**: Your first instinct is usually most accurate
- **Allow 15-20 minutes**: Don't rush through

### After the Assessment

Your results are used to:
- Personalize your content recommendations
- Track your growth over the program
- Inform your coaching conversations
- Prepare your end-of-program comparison report
        `,
        relatedArticles: ['prep-phase', 'progress-tracking']
      }
    ]
  },

  // Conditioning Category
  'conditioning': {
    id: 'conditioning',
    category: 'Conditioning',
    categoryId: 'conditioning',
    icon: Target,
    color: 'blue',
    description: 'Master your leadership through Real Reps.',
    articles: [
      {
        id: 'conditioning-overview',
        title: 'The Conditioning System',
        summary: 'How Real Reps build leadership habits in your actual work.',
        readTime: 4,
        featured: true,
        content: `
## Your Leadership Conditioning

The heart of the Arena is the Conditioning system—where you practice leadership in **real situations**, not hypotheticals. We call these "Real Reps."

### What Makes Real Reps Different

Unlike traditional training that uses case studies or role plays, Real Reps are leadership behaviors you commit to and execute in your actual work:

- Setting clear expectations with your team
- Delivering reinforcing feedback when someone does great work
- Having a redirect conversation to address an issue
- Following up to close the loop on previous conversations

### The Rep Lifecycle

Each Real Rep moves through stages:

1. **COMMIT** — Choose a rep type and specify the situation
2. **DO REP** — Execute the conversation/behavior in real life
3. **CAPTURE EVIDENCE** — Record what you actually said and what happened
4. **REVIEW ASSESSMENT** — Get AI feedback on your approach
5. **CLOSE LOOP** — *(For feedback reps)* Follow up to verify the impact
6. **COMPLETE REP** — Finish and reflect on what you learned

### The Five Milestones

Your conditioning journey progresses through 5 milestones that unlock new rep types:

| Milestone | Rep Types Unlocked |
|-----------|-------------------|
| **Milestone 1** | Set Clear Expectations, Deliver Reinforcing Feedback |
| **Milestone 2** | Follow-up on the Work, Lead with Vulnerability |
| **Milestone 3** | Deliver Redirecting Feedback, Close the Loop |
| **Milestone 4** | Handle Pushback, Hold the Line |
| **Milestone 5** | Be Curious |

### Why Real Reps Work

Research shows leadership development sticks when it's:
- **Real**: Practice in actual situations, not simulations
- **Specific**: Clear behaviors, not vague intentions
- **Tracked**: See your consistency and patterns
- **Coached**: Get AI support before and after
        `,
        relatedArticles: ['rep-types', 'real-reps-flow', 'high-risk-reps']
      },
      {
        id: 'rep-types',
        title: 'Real Rep Types',
        summary: 'Understanding the different types of leadership reps.',
        readTime: 5,
        featured: true,
        content: `
## Real Rep Types

Real Reps are organized into 9 specific types across 3 categories. Each type targets a different leadership capability.

### Lead the Work

These reps focus on directing and managing work effectively:

**Set Clear Expectations (SCE)** — Define what success looks like before work begins. Clarify who does what, by when, and to what standard.

**Follow-up on the Work** — Check progress on delegated tasks. Ensure accountability without micromanaging.

**Hold the Line** — Maintain a standard or boundary under pressure. Stand firm on what matters.

### Lead the Team

These reps build and develop your people:

**Deliver Reinforcing Feedback (DRF)** — Give specific, timely recognition when someone does something well. What gets recognized gets repeated.

**Deliver Redirecting Feedback** — Address behavior that needs to change. Give constructive feedback with care and clarity.

**Close the Loop** — Follow up on previous feedback conversations. Verify whether the change happened and reinforce accountability.

**Handle Pushback** — Navigate defensiveness or resistance during difficult conversations. Stay centered and keep the dialogue productive.

### Lead Yourself

These reps develop your own leadership presence:

**Lead with Vulnerability** — Share authentically about challenges, mistakes, or uncertainties. Build trust through openness.

**Be Curious** — Ask questions to understand rather than to confirm. Approach situations with genuine inquiry.

### Milestone Unlocking

Rep types unlock progressively as you complete milestones:
- **Milestone 1**: SCE and DRF (your foundation reps)
- **Milestone 2**: Follow-up on the Work, Lead with Vulnerability
- **Milestone 3**: Deliver Redirecting Feedback, Close the Loop
- **Milestone 4**: Handle Pushback, Hold the Line
- **Milestone 5**: Be Curious
        `,
        relatedArticles: ['conditioning-overview', 'real-reps-flow', 'high-risk-reps']
      },
      {
        id: 'real-reps-flow',
        title: 'How do Real Reps work?',
        summary: 'The Real Rep lifecycle from commit to complete.',
        readTime: 3,
        featured: true,
        content: `
## Real Reps: Your Leadership Practice

Real Reps are leadership behaviors you commit to, execute, and reflect on—in your actual work, not role plays.

### Committing to a Rep

Click **"+ Commit to a Rep"** to start. You'll:

1. **Select a Rep Type** — Choose from your unlocked rep types
2. **Specify the Situation** — Define who it's with and what you'll do
3. **Plan Your Approach** — Think through what you'll say

### The Rep Flow

After committing, follow the stages shown on your rep card:

| Stage | Action |
|-------|--------|
| **Commit** | Plan your rep and specify the situation |
| **Do Rep** | Execute the conversation in real life |
| **Capture Evidence** | Record what you actually said and what happened |
| **Review Assessment** | Get AI feedback on your approach |
| **Close Loop** | *(Feedback reps)* Follow up to verify impact |
| **Complete Rep** | Finish and reflect |

### Tracking Your Progress

The Conditioning screen shows:
- **Current Reps** — Reps you're working on
- **Completed Reps** — Your rep history in the Locker
- **Milestone Progress** — Which rep types you've unlocked

### Tips for Success

- **Start with SCE and DRF** — These foundation reps build your core skills
- **Capture evidence right after** — Details are freshest immediately after the conversation
- **Be honest in reflections** — Growth comes from honest self-assessment
- **Don't skip Close Loop** — Following up is what makes feedback stick
- **Review AI assessments** — Learn from the scoring to improve next time
        `,
        relatedArticles: ['conditioning-overview', 'rep-types', 'high-risk-reps']
      },
      {
        id: 'high-risk-reps',
        title: 'Preparing for High-Risk Reps',
        summary: 'How to prepare before difficult conversations.',
        readTime: 3,
        content: `
## Preparing for Difficult Reps

Some leadership moments carry more weight—a tough feedback conversation, a boundary with a stakeholder, or delivering difficult news. The Planning Wizard helps you prepare.

### The Planning Wizard

When you commit to a rep, the planning wizard guides you through:

1. **Context & Recipient** — Who will you talk to?
2. **What You'll Say** — Plan your key points
3. **Anticipated Response** — How might they react?
4. **Your Opening Line** — Practice how you'll start
5. **Desired Outcome** — What does success look like?

### Using RepUp for Prep

After planning, you can chat with RepUp to:
- Role-play the conversation
- Get feedback on your approach
- Anticipate objections
- Refine your messaging

### Why Planning Matters

Difficult conversations fail when we:
- Wing it without thinking it through
- Get hijacked by emotion
- Focus on being right instead of being effective

Planning helps you:
- Clarify your actual goal
- Anticipate reactions
- Practice key phrases
- Build confidence

### After the Rep

After executing, capture evidence of what happened:
- What did you actually say?
- How did they respond?
- What went well? What would you change?

The AI assessment compares your plan vs. execution for insights.
        `,
        relatedArticles: ['conditioning-overview', 'rep-types', 'real-reps-flow']
      },
      {
        id: 'tracking-reps',
        title: 'Tracking Your Conditioning Progress',
        summary: 'Understanding your conditioning metrics and streaks.',
        readTime: 2,
        content: `
## Tracking Your Progress

The Conditioning system provides visual feedback on your leadership development journey.

### What's Tracked

**Current Reps**
- Reps you've committed to
- Current stage for each rep
- Any overdue reps

**Rep History**
- Every rep you've completed
- Evidence and reflections captured
- AI assessment scores

**Patterns**
- Which rep types do you practice most?
- Where are you avoiding?
- How are your assessment scores trending?

### Viewing Your Progress

- **Conditioning Card**: Quick dashboard widget
- **Conditioning Screen**: Full rep management
- **Locker**: View completed rep history
- **Arena**: Overall progress visualization
- **My Journey**: Milestone completion

### Milestone Progress

Track your progress through the 5 milestones and see which rep types you've unlocked.
        `,
        relatedArticles: ['conditioning-overview', 'real-reps-flow']
      }
    ]
  },

  // Program & Cohorts Category
  'program-cohorts': {
    id: 'program-cohorts',
    category: 'Program & Cohorts',
    categoryId: 'program-cohorts',
    icon: Users,
    color: 'purple',
    description: 'Learn about the structured program experience.',
    articles: [
      {
        id: 'what-is-cohort',
        title: 'What is a cohort?',
        summary: 'Understand the power of learning together.',
        readTime: 3,
        featured: true,
        content: `
## Cohort-Based Learning

A cohort is a group of leaders who journey through the 5 Foundation milestones together. This shared experience is one of the most powerful elements of the Arena.

### Why Cohorts Work

**Accountability**: You show up differently when others are counting on you
**Diverse Perspectives**: Learn from leaders in different contexts
**Psychological Safety**: Practice and fail safely with supportive peers
**Network Building**: Develop relationships that last beyond the program

### Your Cohort Experience

- **Live Sessions**: Regular meetings with your trainer
- **Discussion Threads**: Ongoing conversation in the app
- **Peer Coaching**: Partner exercises and feedback exchanges
- **Celebration**: Shared milestones and wins

### Cohort Norms

Each cohort establishes shared agreements:
- Confidentiality (what's shared stays in the cohort)
- Presence (cameras on, phones away)
- Participation (everyone contributes)
- Support (we help each other grow)
        `,
        relatedArticles: ['session-one', 'program-length', 'community-events']
      },
      {
        id: 'program-length',
        title: 'How long is the program?',
        summary: 'Program structure, milestones, and what to expect.',
        readTime: 4,
        content: `
## Program Structure

The Arena program uses a **5-Milestone Foundation phase**, followed by ongoing practice in the Ascent phase. This is milestone-gated—you progress by completing milestones, not by time.

### The Three Phases

**Prep Phase** (Before cohort starts)
- Complete your Leader Profile
- Take your Baseline Assessment
- Explore the platform and Conditioning system

**Foundation Phase** (5 Milestones)
- **Milestone 1**: Set Clear Expectations + Deliver Reinforcing Feedback
- **Milestone 2**: Follow-up on the Work + Lead with Vulnerability
- **Milestone 3**: Deliver Redirecting Feedback + Close the Loop
- **Milestone 4**: Handle Pushback + Hold the Line
- **Milestone 5**: Be Curious + Integration

**Ascent Phase** (After graduation)
- Continue daily conditioning
- Access content library
- Connect with alumni community
- Advanced development opportunities

### How Milestones Work

Each milestone:
- Contains specific rep types to practice and master
- Requires completion of reps before trainer sign-off
- Gets reviewed and signed off by your trainer
- Unlocks new rep types upon completion

### After Foundation

When you complete all 5 milestones, you graduate to Ascent:
- Ongoing conditioning access
- Full content library
- Community events
- Leadership certification
        `,
        relatedArticles: ['what-is-cohort', 'session-one']
      },
      {
        id: 'session-one',
        title: 'What happens in Session One?',
        summary: 'Your first live meeting with your cohort.',
        readTime: 3,
        content: `
## Session One: Your Launch Point

Session One is your cohort's first live meeting—an energizing kickoff to your leadership journey.

### What to Expect

**Duration**: Typically 60-90 minutes

**Agenda**:
- Welcome and introductions
- Trainer overview
- Program walkthrough
- Cohort norm setting
- Q&A

### How to Prepare

✅ Complete your prep phase items
✅ Test your video/audio setup
✅ Find a quiet, private space
✅ Have water and something to write with
✅ Come with one question about the program

### Your Trainer

Your trainer is an experienced leadership coach who will:
- Guide your live sessions
- Provide personalized feedback
- Create a safe learning environment
- Connect concepts to your reality

### Making the Most of It

- Introduce yourself briefly but authentically
- Listen actively to others' introductions
- Participate in establishing norms
- Ask questions when you have them
- Note what resonates with you
        `,
        relatedArticles: ['what-is-cohort', 'program-length']
      },
      {
        id: 'community-events',
        title: 'Community Events & Sessions',
        summary: 'Live events and sessions available to you.',
        readTime: 2,
        content: `
## Community Events

Beyond your cohort sessions, you have access to a variety of community events.

### Event Types

**Masterclasses**
Deep dives into specific leadership topics with expert trainers.

**Office Hours**
Drop-in sessions for questions and coaching on current challenges.

**Alumni Sessions**
Connect with leaders who've completed the program.

**Guest Speakers**
Learn from leaders across industries and contexts.

### Finding Events

- Check the Community section of the app
- Events appear in your Daily Plan when relevant
- Enable notifications for event reminders

### Attending Live

- All events are virtual (Zoom)
- Most are recorded for later viewing
- Interactive participation encouraged
- Cameras on when possible
        `,
        relatedArticles: ['what-is-cohort', 'session-one']
      }
    ]
  },

  // Content & Resources Category
  'content-resources': {
    id: 'content-resources',
    category: 'Content & Resources',
    categoryId: 'content-resources',
    icon: BookOpen,
    color: 'amber',
    description: 'Access and navigate learning materials.',
    articles: [
      {
        id: 'content-library',
        title: 'What is the Content Library?',
        summary: 'Your collection of leadership learning resources.',
        readTime: 3,
        content: `
## The Content Library

The Content Library is your personal leadership resource center—a curated collection of videos, articles, tools, and exercises.

### What's Included

**Videos**: Short, focused leadership lessons (3-10 minutes)
**Readings**: Articles and excerpts from leadership thinkers
**Tools**: Frameworks and templates you can apply immediately
**Exercises**: Guided practices for skill development

### How Content is Organized

- **By Topic**: Communication, Strategy, Team Development, etc.
- **By Week**: Aligned to your program progression
- **By Type**: Filter by videos, readings, tools
- **By Skill Level**: Foundation → Advanced

### Progressive Release

Content unlocks as you progress through the program. This prevents overwhelm and ensures you're ready for each concept.

### Your Daily Plan

Each day's learning content appears in your Daily Plan—no need to search the library unless you want to explore ahead or revisit past material.
        `,
        relatedArticles: ['accessing-content', 'conditioning-overview']
      },
      {
        id: 'accessing-content',
        title: 'How do I access videos and readings?',
        summary: 'Finding and consuming learning content.',
        readTime: 2,
        content: `
## Accessing Your Content

There are multiple ways to access learning content in the Arena.

### Via Daily Plan (Recommended)

Your Daily Plan surfaces the right content at the right time:
- Today's assigned videos and readings
- Content relevant to your current week
- Catch-up items if you've missed any

### Via Content Library

Browse the full library for:
- Exploring topics of interest
- Reviewing past content
- Preparing for upcoming sessions

### Content Types

📹 **Videos**: Stream directly in the app
📄 **Readings**: View in-app or download
🛠️ **Tools**: Interactive or downloadable templates
🎯 **Exercises**: Guided in-app activities

### Offline Access

Premium members can download content for offline viewing—useful for travel or spotty internet.

### Progress Tracking

Your completion is automatically tracked:
- ✅ Green check = Completed
- 🔵 Blue dot = In Progress
- ⚪ Empty = Not Started
        `,
        relatedArticles: ['content-library', 'conditioning-overview']
      }
    ]
  },

  // Arena & Gamification Category
  'arena-progress': {
    id: 'arena-progress',
    category: 'Arena & Progress',
    categoryId: 'arena-progress',
    icon: TrendingUp,
    color: 'orange',
    description: 'Track your growth and achievements.',
    articles: [
      {
        id: 'arena-overview',
        title: 'Understanding the Arena',
        summary: 'Visualize your leadership growth journey.',
        readTime: 3,
        content: `
## The Arena: Your Growth Dashboard

The Arena is your visual representation of leadership growth—a gamified view of your progress and achievements.

### Key Elements

**Milestone Progress**
Track your progress through the 5 Foundation milestones toward graduation.

**XP (Experience Points)**
Earned through daily conditioning, content completion, and engagement.

**Achievements**
Badges recognizing specific accomplishments and milestones.

**Streaks**
Tracking consistency in your daily conditioning.

### How to Earn XP

- Complete Real Reps (+10-20 XP)
- Finish content items (+15-25 XP)
- Progress through rep stages (+5-10 XP per stage)
- Complete milestones (+100 XP)
- Graduate from Foundation (+500 XP)

### Why Gamification?

The Arena isn't about competition—it's about:
- Making progress visible
- Celebrating consistency
- Creating positive feedback loops
- Making growth feel tangible
        `,
        relatedArticles: ['progress-tracking', 'achievements']
      },
      {
        id: 'progress-tracking',
        title: 'How progress tracking works',
        summary: 'Understanding your metrics and growth data.',
        readTime: 3,
        content: `
## Progress Tracking

The Arena tracks multiple dimensions of your growth to give you a complete picture of your development.

### What's Tracked

**Conditioning Consistency**
- Real Rep completion patterns
- Assessment score trends
- Stage progression patterns

**Content Progress**
- Videos watched
- Readings completed
- Exercises finished

**Assessment Data**
- Baseline scores
- Mid-point check
- Final assessment
- Growth metrics

**Engagement Quality**
- Rep debrief depth
- Session participation
- Coaching conversations

### Viewing Your Progress

- **Dashboard**: Quick overview widgets
- **Arena**: Gamified progress view
- **Conditioning**: Detailed rep breakdown
- **Reports**: Comprehensive analytics (post-program)

### Privacy Note

Your detailed progress is visible only to you and your trainer. Cohort members see only what you choose to share.
        `,
        relatedArticles: ['arena-overview', 'baseline-assessment']
      },
      {
        id: 'achievements',
        title: 'Achievements and Badges',
        summary: 'How to earn recognition for your growth.',
        readTime: 2,
        content: `
## Achievements & Badges

Achievements celebrate your milestones and consistent effort throughout the program.

### Achievement Categories

**Foundation Achievements**
- Profile Complete
- Assessment Complete
- First Check-in

**Consistency Achievements**
- 7-Day Streak
- 30-Day Streak
- Perfect Week

**Content Achievements**
- First Video
- Content Explorer
- Library Master

**Community Achievements**
- First Comment
- Peer Supporter
- Session Attendee

### How Badges Work

Badges appear on your profile and in the Arena. Some badges have levels (Bronze → Silver → Gold) based on continued achievement.

### Sharing Achievements

You can share achievements with your cohort to celebrate milestones and inspire others.
        `,
        relatedArticles: ['arena-overview', 'progress-tracking']
      }
    ]
  },

  // Account & Settings Category
  'account-settings': {
    id: 'account-settings',
    category: 'Account & Settings',
    categoryId: 'account-settings',
    icon: Settings,
    color: 'slate',
    description: 'Manage your account and preferences.',
    articles: [
      {
        id: 'update-profile',
        title: 'How do I update my profile?',
        summary: 'Keep your profile current and accurate.',
        readTime: 2,
        content: `
## Updating Your Profile

Your Leader Profile contains key information that shapes your experience.

### How to Update

1. Navigate to **Settings** (gear icon)
2. Select **Leader Profile**
3. Edit any field
4. Save changes

### What You Can Update

- Display name
- Profile photo
- Leadership role/title
- Company/organization
- Timezone
- Development goals
- Leadership Identity Statement

### What You Can't Change

- Email address (contact support to change)
- Cohort assignment
- Program start date

### When to Update

Review your profile when:
- Your role changes
- Your development goals evolve
- You want to refine your LIS
- You change timezones
        `,
        relatedArticles: ['notification-preferences', 'forgot-password']
      },
      {
        id: 'notification-preferences',
        title: 'How do I change notification preferences?',
        summary: 'Control how and when the platform contacts you.',
        readTime: 2,
        content: `
## Notification Preferences

Manage notifications to get the right information at the right time.

### Types of Notifications

**In-App Notifications**
- Daily reminders
- New content alerts
- Cohort activity
- Achievement unlocks

**Email Notifications**
- Weekly summaries
- Session reminders
- Important announcements

**Push Notifications** (Mobile)
- Daily check-in reminders
- Session starting soon
- New messages

### How to Change

1. Go to **Settings**
2. Select **Notifications**
3. Toggle each notification type
4. Set quiet hours if desired

### Recommended Settings

For best results, we recommend keeping:
- ✅ Session reminders ON
- ✅ Daily practice reminders ON
- ⚙️ Everything else per your preference
        `,
        relatedArticles: ['update-profile', 'mobile-app']
      },
      {
        id: 'forgot-password',
        title: 'What if I forget my password?',
        summary: 'Reset your password quickly and securely.',
        readTime: 1,
        content: `
## Password Reset

Forgot your password? Here's how to get back in.

### Reset Steps

1. Go to the login page
2. Click **"Forgot Password"**
3. Enter your email address
4. Check your inbox (and spam folder)
5. Click the reset link
6. Create a new password

### Password Requirements

- At least 8 characters
- Mix of letters and numbers recommended
- Avoid common passwords

### Still Having Trouble?

If you don't receive the reset email:
- Check your spam/junk folder
- Wait a few minutes and try again
- Contact support if issues persist

### Security Tips

- Use a unique password for the Arena
- Consider using a password manager
- Never share your password
        `,
        relatedArticles: ['update-profile', 'contact-support']
      },
      {
        id: 'mobile-app',
        title: 'Using the Mobile App',
        summary: 'Access the Arena on your phone or tablet.',
        readTime: 2,
        content: `
## Mobile Access

The Arena is a Progressive Web App (PWA) that works beautifully on mobile devices.

### Adding to Home Screen

**iPhone/iPad:**
1. Open Safari and go to the Arena app URL
2. Tap the Share button
3. Select "Add to Home Screen"
4. Name it and tap Add

**Android:**
1. Open Chrome and go to the Arena app URL
2. Tap the menu (three dots)
3. Select "Add to Home Screen"
4. Confirm

### Mobile Features

All features work on mobile:
- Real Reps (commit, capture, complete)
- Content viewing
- Chat with RepUp
- Live session joining
- Progress tracking

### Mobile Tips

- Enable notifications for reminders
- Use landscape for videos
- Add to home screen for app-like experience
- Good internet recommended for live sessions
        `,
        relatedArticles: ['notification-preferences', 'update-profile']
      }
    ]
  },

  // Troubleshooting Category
  'troubleshooting': {
    id: 'troubleshooting',
    category: 'Troubleshooting',
    categoryId: 'troubleshooting',
    icon: RefreshCw,
    color: 'red',
    description: 'Solutions to common issues.',
    articles: [
      {
        id: 'video-issues',
        title: 'Videos not playing?',
        summary: 'Troubleshoot video playback problems.',
        readTime: 2,
        content: `
## Video Troubleshooting

If videos aren't playing properly, try these solutions.

### Quick Fixes

1. **Refresh the page** — Often solves temporary glitches
2. **Check your internet** — Videos need stable connection
3. **Try a different browser** — Chrome works best
4. **Clear browser cache** — Stale data can cause issues

### Browser Requirements

- Chrome 80+ (recommended)
- Safari 13+
- Firefox 75+
- Edge 80+

### Mobile Issues

- Ensure you're not in Low Power Mode
- Check that auto-play isn't blocked
- Try connecting to WiFi instead of cellular

### Still Not Working?

1. Note which video is affected
2. Try on a different device
3. Contact support with details
        `,
        relatedArticles: ['slow-loading', 'contact-support']
      },
      {
        id: 'slow-loading',
        title: 'App loading slowly?',
        summary: 'Improve your app performance.',
        readTime: 2,
        content: `
## Performance Troubleshooting

If the app feels slow, try these steps.

### Quick Fixes

1. **Refresh the page** — Clears temporary issues
2. **Close other tabs** — Free up browser memory
3. **Check your internet speed** — Run a speed test
4. **Clear browser cache** — Fresh start

### Ideal Conditions

- 10+ Mbps download speed
- Modern browser (updated)
- Stable connection (wired better than WiFi)

### Device Optimization

- Close unused applications
- Restart your device if it's been running long
- Ensure adequate storage space (>500MB free)

### If Problems Persist

The issue may be temporary server load. Wait 10-15 minutes and try again. Contact support if issues continue beyond an hour.
        `,
        relatedArticles: ['video-issues', 'contact-support']
      },
      {
        id: 'contact-support',
        title: 'How do I contact support?',
        summary: 'Get help from the Arena team.',
        readTime: 1,
        content: `
## Getting Support

We're here to help. Here's how to reach us.

### Email Support

📧 **team@leaderreps.com**

Best for:
- Technical issues
- Account questions
- Billing inquiries
- General feedback

**Response time**: Within 24-48 hours

### What to Include

To help us help you faster, include:
- Your account email
- Description of the issue
- Steps to reproduce (if applicable)
- Screenshots (if helpful)
- Device/browser information

### Other Resources

- This Help Center (you're here!)
- Ask RepUp (for coaching questions)
- Your trainer (for program questions)
- Cohort discussion (for peer support)
        `,
        relatedArticles: ['video-issues', 'slow-loading']
      }
    ]
  }
};

// Flatten articles for search
const ALL_ARTICLES = Object.values(HELP_ARTICLES).flatMap(category => 
  category.articles.map(article => ({
    ...article,
    category: category.category,
    categoryId: category.categoryId,
    categoryIcon: category.icon,
    categoryColor: category.color
  }))
);

// Featured articles for homepage
const FEATURED_ARTICLES = ALL_ARTICLES.filter(a => a.featured);

// Popular articles (could be dynamic based on analytics)
const POPULAR_ARTICLE_IDS = ['conditioning-overview', 'rep-types', 'real-reps-flow', 'high-risk-reps', 'what-is-leaderreps'];
const POPULAR_ARTICLES = ALL_ARTICLES.filter(a => POPULAR_ARTICLE_IDS.includes(a.id));

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const colorClasses = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  teal: 'bg-corporate-teal/10 text-corporate-teal'
};

const iconBgClasses = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/50',
  blue: 'bg-blue-100 dark:bg-blue-900/50',
  purple: 'bg-purple-100 dark:bg-purple-900/50',
  amber: 'bg-amber-100 dark:bg-amber-900/50',
  pink: 'bg-pink-100 dark:bg-pink-900/50',
  orange: 'bg-orange-100 dark:bg-orange-900/50',
  slate: 'bg-slate-200 dark:bg-slate-600',
  red: 'bg-red-100 dark:bg-red-900/50',
  teal: 'bg-corporate-teal/20'
};

// Highlight search matches in text
const HighlightText = ({ text, query }) => {
  if (!query || !query.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// Category icon component
const CategoryIcon = ({ icon: Icon, color = 'teal', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  return (
    <div className={`${sizeClasses[size]} ${iconBgClasses[color]} rounded-xl flex items-center justify-center`}>
      <Icon className={`${iconSizes[size]} ${colorClasses[color].split(' ').slice(1).join(' ')}`} />
    </div>
  );
};

// ============================================================================
// SEARCH COMPONENT
// ============================================================================

const SearchBar = ({ value, onChange, onClear, onFocus, onBlur, showResults, placeholder = "Search for help..." }) => {
  const inputRef = useRef(null);
  
  return (
    <div className="relative w-full">
      <div className={`relative flex items-center transition-all duration-200 ${
        showResults 
          ? 'bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl border border-slate-200 dark:border-slate-700 border-b-0' 
          : 'bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl'
      }`}>
        <Search className="absolute left-5 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full py-4 pl-14 pr-12 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 
            focus:outline-none text-lg rounded-2xl"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

// Search Results dropdown
const SearchResults = ({ query, results, onSelect, onClose }) => {
  if (!results.length) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-b-2xl shadow-xl border border-slate-200 dark:border-slate-700 border-t-0 p-6 z-50">
        <div className="text-center py-4">
          <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No results found for "{query}"</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
            Try different keywords or browse categories below
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-b-2xl shadow-xl border border-slate-200 dark:border-slate-700 border-t-0 max-h-96 overflow-y-auto z-50">
      <div className="p-2">
        <div className="text-xs uppercase tracking-wider text-slate-400 px-3 py-2">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </div>
        {results.slice(0, 8).map(article => (
          <button
            key={article.id}
            onClick={() => onSelect(article)}
            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
          >
            <CategoryIcon icon={article.categoryIcon} color={article.categoryColor} size="sm" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 dark:text-white truncate">
                <HighlightText text={article.title} query={query} />
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                <HighlightText text={article.summary} query={query} />
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CATEGORY CARD COMPONENT
// ============================================================================

const CategoryCard = ({ category, onClick }) => {
  const Icon = category.icon;
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-left shadow-sm border border-slate-200 dark:border-slate-700 
        hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all group w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <CategoryIcon icon={Icon} color={category.color} size="lg" />
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 
          group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        {category.category}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        {category.description}
      </p>
      <div className="text-xs text-slate-400 dark:text-slate-500">
        {category.articles.length} article{category.articles.length !== 1 ? 's' : ''}
      </div>
    </motion.button>
  );
};

// ============================================================================
// ARTICLE CARD COMPONENT
// ============================================================================

const ArticleCard = ({ article, onClick, showCategory = false, searchQuery = '' }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 
        transition-colors text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
    >
      <div className="flex-shrink-0 mt-0.5">
        <CategoryIcon icon={article.categoryIcon || BookOpen} color={article.categoryColor || 'teal'} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-corporate-teal transition-colors">
          <HighlightText text={article.title} query={searchQuery} />
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
          <HighlightText text={article.summary} query={searchQuery} />
        </p>
        {showCategory && (
          <span className="inline-block mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            {article.category}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
        <Clock className="w-3.5 h-3.5" />
        {article.readTime} min
      </div>
    </motion.button>
  );
};

// ============================================================================
// ARTICLE VIEW COMPONENT
// ============================================================================

const ArticleView = ({ article, onBack, onArticleSelect }) => {
  const [feedback, setFeedback] = useState(null);
  
  // Get related articles
  const relatedArticles = article.relatedArticles 
    ? ALL_ARTICLES.filter(a => article.relatedArticles.includes(a.id))
    : [];
  
  // Simple markdown-like rendering for content
  const renderContent = (content) => {
    if (!content) return null;
    
    const lines = content.trim().split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-4 space-y-2">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };
    
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // H2 Headers
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={idx} className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
            {trimmed.replace('## ', '')}
          </h2>
        );
        return;
      }
      
      // H3 Headers
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={idx} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }
      
      // H4 Headers
      if (trimmed.startsWith('#### ')) {
        flushList();
        elements.push(
          <h4 key={idx} className="text-base font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-2">
            {trimmed.replace('#### ', '')}
          </h4>
        );
        return;
      }
      
      // List items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        inList = true;
        const text = trimmed.replace(/^[-*] /, '');
        // Handle checkmarks
        if (text.startsWith('✅') || text.startsWith('⚙️') || text.startsWith('❌')) {
          listItems.push(
            <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
              <span className="flex-shrink-0">{text.charAt(0)}</span>
              <span>{renderInlineFormatting(text.slice(2))}</span>
            </li>
          );
        } else {
          listItems.push(
            <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-corporate-teal mt-2 flex-shrink-0" />
              <span>{renderInlineFormatting(text)}</span>
            </li>
          );
        }
        return;
      }
      
      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        inList = true;
        const num = trimmed.match(/^(\d+)\./)[1];
        const text = trimmed.replace(/^\d+\.\s/, '');
        listItems.push(
          <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center 
              text-xs font-medium text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5">
              {num}
            </span>
            <span>{renderInlineFormatting(text)}</span>
          </li>
        );
        return;
      }
      
      // Paragraphs
      if (trimmed.length > 0) {
        flushList();
        elements.push(
          <p key={idx} className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      } else {
        flushList();
      }
    });
    
    flushList();
    return elements;
  };
  
  // Handle inline formatting (bold, emoji indicators)
  const renderInlineFormatting = (text) => {
    // Handle bold text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-slate-900">
      <div className="max-w-3xl mx-auto p-5 sm:p-8">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-corporate-teal 
            transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Help Center</span>
        </button>
        
        {/* Article header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CategoryIcon icon={article.categoryIcon || BookOpen} color={article.categoryColor || 'teal'} />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {article.title}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            {article.summary}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {article.readTime} min read
            </span>
          </div>
        </div>
        
        {/* Article content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          {renderContent(article.content)}
        </article>
        
        {/* Feedback section */}
        <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
            Was this article helpful?
          </h3>
          {feedback === null ? (
            <div className="flex gap-3">
              <button
                onClick={() => setFeedback('yes')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 
                  hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 
                  hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button
                onClick={() => setFeedback('no')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 
                  hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 
                  hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>Thanks for your feedback!</span>
            </div>
          )}
        </div>
        
        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Related Articles
            </h3>
            <div className="space-y-2">
              {relatedArticles.map(related => (
                <ArticleCard
                  key={related.id}
                  article={related}
                  onClick={() => onArticleSelect(related)}
                  showCategory
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Contact support */}
        <div className="mt-8 p-6 bg-gradient-to-br from-corporate-navy to-slate-800 rounded-2xl text-white">
          <h3 className="font-semibold text-lg mb-2">Still need help?</h3>
          <p className="text-slate-300 mb-4">
            Our support team is ready to assist you.
          </p>
          <a
            href="mailto:team@leaderreps.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-corporate-teal rounded-xl font-medium 
              hover:bg-corporate-teal/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CATEGORY VIEW COMPONENT
// ============================================================================

const CategoryView = ({ category, onBack, onArticleSelect }) => {
  const Icon = category.icon;
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-slate-900">
      <div className="max-w-3xl mx-auto p-5 sm:p-8">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-corporate-teal 
            transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Help Center</span>
        </button>
        
        {/* Category header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <CategoryIcon icon={Icon} color={category.color} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {category.category}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {category.description}
              </p>
            </div>
          </div>
        </div>
        
        {/* Articles list */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {category.articles.map(article => (
            <ArticleCard
              key={article.id}
              article={{
                ...article,
                categoryIcon: Icon,
                categoryColor: category.color
              }}
              onClick={() => onArticleSelect(article)}
            />
          ))}
        </div>
        
        {/* Contact support */}
        <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <Lightbulb className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Can't find what you're looking for?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
            Contact our support team for personalized help.
          </p>
          <a
            href="mailto:team@leaderreps.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-corporate-teal text-white rounded-xl font-medium 
              hover:bg-corporate-teal/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HOME VIEW COMPONENT
// ============================================================================

const HomeView = ({ onCategorySelect, onArticleSelect, searchQuery, setSearchQuery, onAskRepUp }) => {
  const { navigate } = useNavigation();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
  
  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = ALL_ARTICLES.filter(article => 
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.content?.toLowerCase().includes(query)
    );
    
    // Sort by relevance (title matches first)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(query);
      const bTitle = b.title.toLowerCase().includes(query);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });
    
    setSearchResults(results);
  }, [searchQuery]);
  
  const showResults = searchFocused && searchQuery.trim().length > 0;
  const categories = Object.values(HELP_ARTICLES);
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-slate-900">
      {/* Breadcrumb Header */}
      <div className="bg-[#FAFBFC] dark:bg-slate-900 px-5 sm:px-8 lg:px-10 pt-5 sm:pt-8 lg:pt-10">
        <div className="max-w-5xl mx-auto">
          <BreadcrumbNav 
            items={[
              { label: 'Dashboard', path: 'dashboard' },
              { label: 'Help Center', path: null }
            ]} 
            navigate={navigate}
          />
        </div>
      </div>
      
      {/* Page Header - consistent with other pages */}
      <div className="px-5 sm:px-8 lg:px-10 pt-6 pb-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center gap-3 justify-center mb-2">
            <HelpCircle className="w-7 h-7 text-corporate-teal" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-corporate-navy dark:text-white tracking-tight">
              Help Center
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-base mb-6">
            Search our knowledge base or browse categories below
          </p>
          
          {/* Search */}
          <div
            ref={searchRef}
            className="relative max-w-2xl mx-auto"
          >
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {}}
              showResults={showResults}
            />
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <SearchResults
                    query={searchQuery}
                    results={searchResults}
                    onSelect={(article) => {
                      onArticleSelect(article);
                      setSearchFocused(false);
                    }}
                    onClose={() => setSearchFocused(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-5 pt-4">
        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Popular Articles</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {POPULAR_ARTICLES.map(article => (
              <button
                key={article.id}
                onClick={() => onArticleSelect(article)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 
                  transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-corporate-teal transition-colors truncate">
                  {article.title}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
        
        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Compass className="w-5 h-5 text-corporate-teal" />
            Browse by Category
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => onCategorySelect(category)}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 
            rounded-2xl p-8 mb-12 border border-slate-200 dark:border-slate-700"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Need more help?
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Our team is available to answer your questions
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <a
              href="mailto:team@leaderreps.com"
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 
                dark:border-slate-700 hover:border-corporate-teal dark:hover:border-corporate-teal 
                transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-corporate-teal/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-corporate-teal" />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white group-hover:text-corporate-teal transition-colors">
                  Email Support
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  team@leaderreps.com
                </div>
              </div>
            </a>
            
            <button
              onClick={onAskRepUp}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 
                dark:border-slate-700 hover:border-corporate-teal dark:hover:border-corporate-teal 
                transition-all group w-full text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white group-hover:text-corporate-teal transition-colors">
                  Ask RepUp
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  AI coaching assistant
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN HELP CENTER COMPONENT
// ============================================================================

const HelpCenter = () => {
  const { navigate } = useNavigation();
  const [view, setView] = useState('home'); // 'home' | 'category' | 'article'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAskRepUp = useCallback(() => {
    navigate('rep-coach', { mode: 'help' });
  }, [navigate]);

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    setView('category');
    window.scrollTo(0, 0);
  }, []);

  const handleArticleSelect = useCallback((article) => {
    // Ensure article has full data
    const fullArticle = ALL_ARTICLES.find(a => a.id === article.id) || article;
    setSelectedArticle(fullArticle);
    setView('article');
    setSearchQuery('');
    window.scrollTo(0, 0);
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'article' && selectedCategory) {
      setView('category');
    } else {
      setView('home');
      setSelectedCategory(null);
      setSelectedArticle(null);
    }
    window.scrollTo(0, 0);
  }, [view, selectedCategory]);

  return (
    <AnimatePresence mode="wait">
      {view === 'home' && (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <HomeView
            onCategorySelect={handleCategorySelect}
            onArticleSelect={handleArticleSelect}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAskRepUp={handleAskRepUp}
          />
        </motion.div>
      )}
      
      {view === 'category' && selectedCategory && (
        <motion.div
          key="category"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CategoryView
            category={selectedCategory}
            onBack={handleBack}
            onArticleSelect={(article) => {
              handleArticleSelect({
                ...article,
                categoryIcon: selectedCategory.icon,
                categoryColor: selectedCategory.color,
                category: selectedCategory.category
              });
            }}
          />
        </motion.div>
      )}
      
      {view === 'article' && selectedArticle && (
        <motion.div
          key="article"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <ArticleView
            article={selectedArticle}
            onBack={handleBack}
            onArticleSelect={handleArticleSelect}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HelpCenter;
