# Demo App Requirements & Workplan

## Executive Summary

Create a standalone, choreographed demo experience that showcases the LeaderReps PD Platform without requiring authentication. The demo will walk prospective clients through "a day in the life" of a user, highlighting key features across all phases of the 70-day journey.

---

## 1. Business Objectives

### Primary Goals
- **Sales Enablement**: Provide a polished, repeatable demo for client presentations
- **Marketing**: Showcase the platform's value proposition without friction
- **Client Onboarding**: Preview what users will experience before they commit
- **Investor Presentations**: Demonstrate product capabilities professionally

### Success Metrics
- Demo can be completed in 10-15 minutes (full walkthrough)
- Quick highlight tour in 3-5 minutes
- Zero authentication required
- Works on desktop and mobile
- Self-guided or presenter-led modes

---

## 2. Technical Approach Options

### Option A: Standalone Demo PWA (Recommended)
**Pros:**
- Completely isolated from production data
- Can be heavily customized for demo purposes
- No risk of affecting real users
- Can host at demo.leaderreps.com or similar
- Lightweight, fast loading

**Cons:**
- Separate codebase to maintain (or shared components)
- Need to keep in sync with main app updates

### Option B: Demo Mode in Main App
**Pros:**
- Single codebase
- Always in sync with latest features
- Feature flag controlled

**Cons:**
- Risk of demo data leaking into production
- More complex conditional logic throughout app
- Could accidentally expose to real users

### Option C: Interactive Guided Tour Overlay
**Pros:**
- Uses actual app with tour overlay
- Minimal additional code
- Shows real UI exactly

**Cons:**
- Still needs mock data/user
- Tour libraries can be limiting
- Less control over narrative

### Recommendation: **Option A - Standalone Demo PWA**
- Clean separation of concerns
- Full creative control
- Professional presentation
- Can share components with main app via shared library

---

## 3. Demo User Journey ("A Day in the Life")

### 3.1 Demo Personas

#### Primary Demo User: "Alex Martinez"
- **Role**: Mid-level Manager, 3 years experience
- **Company**: Tech startup, 150 employees
- **Day in Program**: Day 23 (Dev Phase, Week 4)
- **Progress**: 32% complete, consistently engaged
- **Strengths**: Communication, Team Building
- **Growth Areas**: Strategic Thinking, Conflict Resolution

#### Secondary Demo User: "Jordan Chen" (Optional)
- **Role**: Senior Director
- **Day in Program**: Day 58 (Late Dev Phase)
- **Shows**: Advanced progress, near completion

### 3.2 Demo Flow - Full Walkthrough (15 minutes)

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEMO FLOW OVERVIEW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. WELCOME & CONTEXT (1 min)                                  │
│     └─> "Meet Alex, a manager 23 days into the program"        │
│                                                                 │
│  2. MORNING BOOKEND (3 min)                                    │
│     ├─> Daily Practice screen                                   │
│     ├─> Today's focus skill                                     │
│     ├─> Morning intention setting                               │
│     └─> Quick leadership tip                                    │
│                                                                 │
│  3. CONTENT EXPLORATION (4 min)                                │
│     ├─> Content Library overview                                │
│     ├─> Watch a leadership video (30 sec clip)                 │
│     ├─> Browse skills development                               │
│     └─> View a program/course                                   │
│                                                                 │
│  4. PROGRESS & PLANNING (3 min)                                │
│     ├─> Roadmap Tracker (visual journey)                       │
│     ├─> Week overview                                           │
│     ├─> Achievements earned                                     │
│     └─> Planning Hub                                            │
│                                                                 │
│  5. EVENING BOOKEND (2 min)                                    │
│     ├─> Executive Reflection                                    │
│     ├─> Daily journal entry                                     │
│     └─> Tomorrow's preview                                      │
│                                                                 │
│  6. COMMUNITY & COACHING (2 min)                               │
│     ├─> Community features                                      │
│     ├─> Coaching options                                        │
│     └─> Support resources                                       │
│                                                                 │
│  7. WRAP-UP & CTA                                              │
│     └─> "Ready to start your journey?"                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Demo Flow - Quick Highlights (5 minutes)

1. **Dashboard Overview** (1 min) - Show the at-a-glance experience
2. **Daily Practice** (1 min) - Core daily engagement
3. **Content Library** (1 min) - Depth of resources
4. **Progress Tracking** (1 min) - Visual journey & achievements
5. **Call to Action** (1 min) - "Start your journey"

---

## 4. Feature Requirements

### 4.1 Demo Shell & Navigation

| Feature | Description | Priority |
|---------|-------------|----------|
| Demo Landing Page | Welcome screen with persona intro, "Start Demo" button | P0 |
| Guided Mode | Step-by-step narrated walkthrough with Next/Back | P0 |
| Free Explore Mode | Let users click around freely | P1 |
| Progress Indicator | Shows where you are in the demo flow | P0 |
| Skip to Section | Jump to specific demo sections | P1 |
| Reset Demo | Return to beginning | P0 |
| Mobile Responsive | Full demo works on phone/tablet | P0 |

### 4.2 Demo Data Requirements

| Data Type | Content Needed | Notes |
|-----------|---------------|-------|
| User Profile | Alex Martinez with photo, stats | Realistic looking |
| Day Progress | Day 23 of 70 | Shows mid-journey |
| Completed Items | ~20 activities marked done | Shows engagement |
| Journal Entries | 3-5 sample entries | Thoughtful content |
| Skills Progress | 4-5 skills with varying % | Shows development |
| Achievements | 5-8 badges earned | Motivating |
| Notifications | 2-3 recent notifications | Shows activity |
| Content Library | Subset of real content | 5-10 items per type |

### 4.3 Interactive Elements

| Element | Behavior | Notes |
|---------|----------|-------|
| Video Player | Play short clips (30-60 sec) | Actual content or placeholder |
| Checkboxes | Click to complete (animated) | Satisfying feedback |
| Journal Entry | Pre-filled but editable | Shows interaction |
| Navigation | Full nav works | Constrained to demo content |
| Tooltips | Explanatory popups on features | Guide users |
| Highlights | Pulse/glow on key features | Draw attention |

### 4.4 Demo Narration/Text

Each screen should have:
- **Headline**: What this screen does
- **Context**: Why it matters for leadership development
- **Highlight**: Key feature callout
- **Transition**: Leads to next screen

Example for Daily Practice:
```
Headline: "Start Each Day with Purpose"
Context: "Alex begins every morning with a 5-minute leadership ritual 
         that sets the tone for intentional growth."
Highlight: "Today's focus: Strategic Communication - a skill Alex 
          identified as a growth area."
Transition: "After completing the morning practice, Alex has quick 
           access to deeper content..."
```

---

## 5. UI/UX Specifications

### 5.1 Demo Chrome (Overlay Elements)

```
┌────────────────────────────────────────────────────────────────┐
│ [LeaderReps DEMO]                    [Free Explore] [Restart]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    ┌──────────────────────┐                    │
│                    │                      │                    │
│                    │    ACTUAL APP UI     │                    │
│                    │    (Demo Content)    │                    │
│                    │                      │                    │
│                    └──────────────────────┘                    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 💡 "This is the Daily Practice screen where users..."     │ │
│ │                                                            │ │
│ │ ●───────●───────●───────○───────○───────○                 │ │
│ │ [◀ Back]                              [Next ▶]            │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Visual Treatment

- **Demo Badge**: Subtle "DEMO" indicator so it's clear this isn't live
- **Spotlight Effect**: Dims background, highlights current feature
- **Animated Transitions**: Smooth flow between demo steps
- **Confetti/Celebration**: When showing achievements
- **Persona Avatar**: Alex's photo visible throughout
- **Progress Bar**: Visual indicator of demo completion

### 5.3 Color Theme

Use existing app theme with subtle demo accents:
- Demo controls: Slightly different shade to distinguish
- Spotlight: Semi-transparent overlay
- Call-to-action: Prominent "Start Your Journey" button

---

## 6. Technical Architecture

### 6.1 Recommended Stack

**IMPORTANT: Completely Separate Codebase**

The demo app will be a standalone project, NOT part of the main leaderreps-PDPlatformDev repo. This ensures:
- Clean separation - demo can evolve independently
- No risk of demo code affecting production
- Can be handed off or hosted separately
- Easy to archive or deprecate if direction changes

**Repository**: `leaderreps-demo` (new repo) or `/demo-app` folder outside main project

```
/leaderreps-demo              # SEPARATE REPO/PROJECT
├── /public
│   ├── /demo-assets/         # Demo-specific images, videos
│   └── index.html
├── /src
│   ├── /components
│   │   ├── /demo             # Demo-specific components
│   │   │   ├── DemoShell.jsx
│   │   │   ├── DemoNarration.jsx
│   │   │   ├── DemoProgress.jsx
│   │   │   ├── DemoSpotlight.jsx
│   │   │   ├── DemoControls.jsx
│   │   │   ├── AccessCodeScreen.jsx
│   │   │   └── PresenterNotes.jsx
│   │   └── /ui               # Copied/simplified UI components
│   ├── /data
│   │   ├── demoData.js       # All mock data for demo
│   │   ├── demoSteps.js      # Demo flow configuration
│   │   └── presenterNotes.js # Hidden presenter guidance
│   ├── /screens
│   │   ├── DemoWelcome.jsx
│   │   ├── DemoDashboard.jsx
│   │   ├── DemoDailyPractice.jsx
│   │   ├── DemoContentLibrary.jsx
│   │   ├── DemoRoadmap.jsx
│   │   ├── DemoReflection.jsx
│   │   ├── DemoCommunity.jsx
│   │   └── DemoConclusion.jsx
│   ├── /hooks
│   │   ├── useDemoFlow.js    # Demo navigation state
│   │   └── usePresenterMode.js
│   ├── /config
│   │   └── accessCode.js     # Simple code config
│   └── App.jsx
├── package.json
├── vite.config.js
├── firebase.json             # Separate hosting config
└── README.md                 # Demo-specific documentation
```

### 6.2 Demo Data Structure

```javascript
// demoData.js
export const demoUser = {
  id: 'demo-user-alex',
  name: 'Alex Martinez',
  email: 'alex.martinez@demo.com',
  avatar: '/demo-assets/alex-avatar.jpg',
  role: 'Engineering Manager',
  company: 'TechStart Inc.',
  startDate: '2025-12-17', // Makes today Day 23
  currentDay: 23,
  phase: 'dev',
  tier: 'premium',
  stats: {
    streakDays: 18,
    totalMinutes: 420,
    completedActivities: 67,
    journalEntries: 15,
    videosWatched: 12
  }
};

export const demoProgress = {
  week: 4,
  day: 2, // Tuesday of week 4
  completedToday: ['morning-intention', 'daily-tip'],
  pendingToday: ['evening-reflection', 'journal-entry'],
  weeklyGoals: [
    { id: 1, text: 'Complete strategic thinking module', done: true },
    { id: 2, text: 'Practice difficult conversation framework', done: false },
    { id: 3, text: 'Journal about team dynamics', done: true }
  ]
};

export const demoSkills = [
  { id: 'communication', name: 'Strategic Communication', progress: 72, level: 3 },
  { id: 'team-building', name: 'Team Building', progress: 85, level: 4 },
  { id: 'conflict', name: 'Conflict Resolution', progress: 45, level: 2 },
  { id: 'strategic', name: 'Strategic Thinking', progress: 38, level: 2 },
  { id: 'coaching', name: 'Coaching Others', progress: 60, level: 3 }
];

export const demoAchievements = [
  { id: 'first-week', name: 'First Week Champion', icon: '🏆', earnedDate: '2025-12-24' },
  { id: 'journal-streak', name: '10-Day Journal Streak', icon: '📝', earnedDate: '2025-12-27' },
  { id: 'video-master', name: 'Video Voyager', icon: '🎬', earnedDate: '2025-12-30' },
  // ... more
];

export const demoJournalEntries = [
  {
    date: '2026-01-08',
    prompt: 'What leadership moment are you most proud of this week?',
    entry: 'Today I facilitated a difficult team discussion about project priorities...'
  },
  // ... more
];

export const demoSteps = [
  { id: 'welcome', screen: 'DemoWelcome', title: 'Welcome' },
  { id: 'dashboard', screen: 'DemoDashboard', title: 'Your Dashboard' },
  { id: 'morning', screen: 'DemoDailyPractice', title: 'Morning Practice' },
  { id: 'content', screen: 'DemoContentLibrary', title: 'Content Library' },
  { id: 'roadmap', screen: 'DemoRoadmap', title: 'Your Journey' },
  { id: 'evening', screen: 'DemoReflection', title: 'Evening Reflection' },
  { id: 'community', screen: 'DemoCommunity', title: 'Community' },
  { id: 'conclusion', screen: 'DemoConclusion', title: 'Start Your Journey' }
];
```

### 6.3 Presenter Mode

Hidden presenter features activated by keyboard shortcut (e.g., `Ctrl+Shift+P`):

```javascript
// presenterNotes.js
export const presenterNotes = {
  welcome: {
    talkingPoints: [
      "Alex represents a typical mid-level manager",
      "Day 23 shows meaningful progress, not just starting out",
      "Notice the streak counter - engagement is built into the design"
    ],
    timing: "1-2 minutes",
    transition: "Let's see what Alex's morning routine looks like..."
  },
  dailyPractice: {
    talkingPoints: [
      "This 5-minute morning ritual sets the tone for the day",
      "Content is personalized based on their development goals",
      "The completion checkmarks provide dopamine hits"
    ],
    timing: "2-3 minutes",
    keyFeature: "Point out the skill focus area - Strategic Communication"
  },
  // ... for each screen
};
```

**Presenter Panel Features:**
- Current screen talking points (collapsible sidebar)
- Timing guidance
- Key features to highlight
- Suggested transitions to next screen
- Hidden from regular demo viewers

### 6.4 Access Code Screen

```javascript
// accessCode.js
export const DEMO_ACCESS_CODE = 'LEAD2026';  // Easy to change
export const CODE_EXPIRY_HOURS = 24;          // Re-enter after 24h
```

Simple, clean entry:
```
┌─────────────────────────────────────────┐
│                                         │
│         [LeaderReps Logo]               │
│                                         │
│      Leadership Development Demo        │
│                                         │
│    ┌─────────────────────────────┐      │
│    │  Enter Access Code          │      │
│    └─────────────────────────────┘      │
│                                         │
│          [ Enter Demo ]                 │
│                                         │
│    Need a code? Contact sales@...       │
│                                         │
└─────────────────────────────────────────┘
```

### 6.5 Deployment

- **URL**: `leaderreps-demo.web.app` (separate Firebase project)
- **Hosting**: Firebase Hosting (separate project from main app)
- **Build**: Completely independent build/deploy pipeline
- **Analytics**: Basic Firebase Analytics (optional)
- **Repository**: Separate GitHub repo (`leaderreps-demo`)

---

## 7. Video Content Strategy

### 7.1 Using Actual Platform Content

We'll use real videos from the LeaderReps content library with shortened clips:

| Demo Section | Video Source | Clip Duration | Notes |
|--------------|--------------|---------------|-------|
| Dashboard Preview | Leadership Fundamentals intro | 20 sec | Teaser thumbnail with play |
| Content Library | Communication Skills video | 45 sec | Best 45 seconds |
| Skills Section | Strategic Thinking module | 30 sec | Compelling excerpt |
| Programs | Team Building program intro | 30 sec | Overview clip |

### 7.2 Video Implementation

- **Thumbnail + Play**: Show video thumbnail, click plays short clip
- **Looping Option**: Short clips can loop for presentation
- **Muted by Default**: Presenter controls audio during live demos
- **Fallback**: If video fails, show compelling screenshot

---

## 8. Content Requirements

### 8.1 Demo Video Clips

Need 30-60 second clips from actual content (or placeholder):
1. Leadership fundamentals intro
2. Communication skills snippet
3. Strategic thinking teaser
4. Team building highlight

### 8.2 Demo Narration Copy

Professional copy needed for each demo step:
- Welcoming, aspirational tone
- Focus on user transformation
- Highlight unique value propositions
- Clear calls-to-action

### 8.3 Demo User Avatar

- Professional headshot style
- Diverse representation
- Approachable, relatable
- Can use stock photo with proper licensing

---

## 9. Workplan

### Phase 1: Foundation (3-4 days)
| Task | Description | Estimate |
|------|-------------|----------|
| 1.1 | Set up demo app project structure | 2 hours |
| 1.2 | Create demo data files | 4 hours |
| 1.3 | Build DemoShell component (controls, progress) | 4 hours |
| 1.4 | Implement useDemoFlow hook | 2 hours |
| 1.5 | Create Welcome and Conclusion screens | 3 hours |
| 1.6 | Set up Firebase hosting for demo | 1 hour |

### Phase 2: Core Screens (4-5 days)
| Task | Description | Estimate |
|------|-------------|----------|
| 2.1 | Demo Dashboard (simplified) | 4 hours |
| 2.2 | Demo Daily Practice (AM bookend) | 4 hours |
| 2.3 | Demo Content Library | 4 hours |
| 2.4 | Demo Roadmap Tracker | 4 hours |
| 2.5 | Demo Reflection (PM bookend) | 3 hours |
| 2.6 | Demo Community/Coaching preview | 3 hours |

### Phase 3: Polish & Interaction (2-3 days)
| Task | Description | Estimate |
|------|-------------|----------|
| 3.1 | Spotlight/highlight effects | 3 hours |
| 3.2 | Smooth transitions between steps | 2 hours |
| 3.3 | Interactive elements (checkboxes, etc) | 3 hours |
| 3.4 | Narration copy integration | 2 hours |
| 3.5 | Progress indicators | 2 hours |

### Phase 4: Content & Assets (1-2 days)
| Task | Description | Estimate |
|------|-------------|----------|
| 4.1 | Source/create demo user avatar | 1 hour |
| 4.2 | Prepare video clips | 2 hours |
| 4.3 | Write all narration copy | 3 hours |
| 4.4 | Create demo-specific graphics | 2 hours |

### Phase 5: Testing & Launch (1-2 days)
| Task | Description | Estimate |
|------|-------------|----------|
| 5.1 | Full walkthrough testing | 2 hours |
| 5.2 | Mobile responsiveness testing | 2 hours |
| 5.3 | Performance optimization | 2 hours |
| 5.4 | Deploy to demo URL | 1 hour |
| 5.5 | Create presenter guide | 2 hours |

### Timeline Summary

```
Week 1: Foundation + Core Screens Start
├── Days 1-2: Project setup, demo data, shell components
├── Days 3-4: Dashboard, Daily Practice screens
└── Day 5: Content Library screen

Week 2: Core Screens + Polish
├── Days 1-2: Roadmap, Reflection, Community screens
├── Days 3-4: Spotlight effects, transitions, interactions
└── Day 5: Content integration, copy

Week 3: Final Polish + Launch
├── Days 1-2: Testing, bug fixes
├── Day 3: Performance, final touches
└── Day 4-5: Deploy, documentation
```

**Total Estimated Effort**: 55-65 hours over 2-3 weeks

---

## 9. Future Enhancements

### V1.1 Additions
- [ ] Multiple persona options (different roles/industries)
- [ ] Presenter mode with speaker notes
- [ ] Customizable demo flow (pick sections)
- [ ] Analytics dashboard (demo engagement)

### V2.0 Possibilities
- [ ] Interactive sandbox (create own user)
- [ ] A/B test different demo flows
- [ ] Embedded demo widget for website
- [ ] Personalized demo based on viewer's role

---

## 10. Decisions Made

| Question | Decision | Notes |
|----------|----------|-------|
| Video Content | **Use actual platform content** | 30-60 sec clips from real videos - authentic, no extra production |
| Access Control | **Simple access code** | Prevents random access, allows controlled sharing |
| Presenter Notes | **Yes, include** | Hidden presenter guidance for sales calls |
| Branding | Standard LeaderReps branding | With "DEMO" badge |
| Languages | English only (V1) | Can expand later |
| Analytics | Basic tracking | Demo starts, completions, drop-off points |

### Access Code Implementation
- Simple 4-6 character code (e.g., "LEAD2026" or "DEMO01")
- Stored in localStorage after entry (persists for session)
- No backend required - code hardcoded (can update with deploy)
- Clean entry screen: Logo + code input + "Enter Demo"

---

## 11. Approval & Sign-off

| Role | Name | Date | Approval |
|------|------|------|----------|
| Product Owner | | | ☐ |
| Technical Lead | | | ☐ |
| Design | | | ☐ |
| Content | | | ☐ |

---

## Appendix A: Demo Script (Presenter Guide)

*To be developed after requirements approval*

## Appendix B: Wireframes

*To be developed after requirements approval*

---

*Document Version: 1.0*
*Created: January 9, 2026*
*Last Updated: January 9, 2026*
