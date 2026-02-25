md
# 📚 LeaderReps PD Platform - Administrator Guide

> **Comprehensive documentation for system administrators**  
> *Last Updated: January 9, 2026*

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Architecture & Key Concepts](#2-architecture--key-concepts)
3. [User Journey & Experience](#3-user-journey--experience)
4. [Admin Portal Guide](#4-admin-portal-guide)
5. [Development Plan Management](#5-development-plan-management)
6. [Content Management (The Vault)](#6-content-management-the-vault)
7. [Widget System](#7-widget-system)
8. [Feature Flags & Configuration](#8-feature-flags--configuration)
9. [User Data & Daily Practice](#9-user-data--daily-practice)
10. [Scheduled Functions & Automation](#10-scheduled-functions--automation)
11. [Deployment & Environments](#11-deployment--environments)
12. [Troubleshooting Guide](#12-troubleshooting-guide)
13. [Technical Reference](#13-technical-reference)
14. [Command Line Scripts](#14-command-line-scripts)

---

## 1. Platform Overview

### What is LeaderReps PD Platform?

LeaderReps PD Platform is a **leadership development application** designed to help users build consistent leadership habits through:

- **Daily Practice Routines** - AM/PM Bookends for planning and reflection
- **Structured Development Plans** - 12-week guided programs
- **Content Library** - Videos, readings, tools, and workouts
- **Progress Tracking** - Streaks, scorecards, and history logs
- **Community Features** - Forums, mastermind groups, live events

### Core Philosophy

The platform is built around the concept of **"Reps"** - small, consistent actions that build leadership muscle over time. Users complete daily reps, track their wins, and reflect on their growth.

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Firebase (Firestore, Auth, Storage, Functions) |
| Hosting | Firebase Hosting |
| PWA | Workbox for offline support |
| AI | Google Gemini via `@google/genai` |

---

## 2. Architecture & Key Concepts

### 2.1 The "Vault & Key" Architecture

This is the **most important concept** to understand:

```
┌─────────────────────────────────────────────────────────────┐
│                      THE VAULT                               │
│  (All content resources stored in Firestore collections)     │
│                                                              │
│  content_readings    content_videos    content_community     │
│  content_coaching    content_tools     content_programs      │
│  content_workouts    content_events      content_announcements│
└─────────────────────────────────────────────────────────────┘
                              │
                              │ resourceId links
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      THE KEY                                 │
│  (Development Plan weeks control what users can access)      │
│                                                              │
│  development_plan_v1/week-01  →  Unlocks specific resources  │
│  development_plan_v1/week-02  →  Unlocks more resources      │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ currentWeek determines access
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      USER ACCESS                             │
│  (Content only visible when unlocked by their current week)  │
│                                                              │
│  User in Week 3 sees: Week 1 + Week 2 + Week 3 content      │
│  Content is HIDDEN by default until unlocked                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Content is stored **once** in the Vault
- Development Plan weeks **link to** (not copy) content
- Users see **cumulative** content (all weeks up to their current week)
- Content marked `isHiddenUntilUnlocked: false` is always visible (public content)

### 2.2 Data Flow Overview

```
User Action → React Component → Service Layer → Firestore
                    ↓
              Widget Template (renders UI)
                    ↓
              Feature Provider (checks if enabled)
                    ↓
              Navigation Provider (handles routing)
```

### 2.3 Key Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users/{uid}` | User profile, membership data |
| `users/{uid}/daily_practice/current` | Today's practice data (wins, reps, reflections) |
| `users/{uid}/daily_logs/{date}` | Archived daily data |
| `users/{uid}/development_plan` | User's plan progress |
| `development_plan_v1/week-XX` | Master plan templates |
| `content_*` | Content vault collections |
| `metadata/config` | Global configuration, including admin email list (`adminemails`) |
| `metadata/featureFlags` | Widget enable/disable states |

---

## 3. User Journey & Experience

### 3.1 Daily Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MORNING (AM Bookend)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Grounding Rep - Review Leadership Identity Statement      │
│ 2. Win the Day - Set 3 high-impact priorities               │
│ 3. Daily Reps - Check off assigned leadership habits         │
│ 4. View Notifications - See unlocked content for the week   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    THROUGHOUT THE DAY                        │
├─────────────────────────────────────────────────────────────┤
│ • Complete content (videos, readings, workouts)              │
│ • Engage with community                                      │
│ • Practice leadership skills                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EVENING (PM Bookend)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Mark wins as complete/incomplete                          │
│ 2. Complete reflection (What went well? What to improve?)    │
│ 3. View daily scorecard                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    11:59 PM (Automatic)                      │
├─────────────────────────────────────────────────────────────┤
│ Cloud Function runs:                                         │
│ • Archives today's data to daily_logs                        │
│ • Carries over incomplete wins                               │
│ • Updates streak (increment/maintain/reset)                  │
│ • Resets scorecard for new day                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Weekly Flow

- **Week Start**: New content unlocks based on Development Plan
- **Throughout Week**: User completes content, community activities, coaching
- **Week End**: Progress tracked, ready for next week's content

### 3.3 Streak Logic

| Scenario | Streak Result |
|----------|---------------|
| Did activity (grounding, win, or rep) | +1 (increment) |
| Weekend, no activity | Maintained (grace) |
| Weekday, no activity | Reset to 0 |

---

## 4. Admin Portal Guide

### 4.1 Accessing the Admin Portal

1. Log in with an admin email (configured in `metadata/config.adminemails`)
2. Navigate to **Admin Command Center** from the sidebar
3. Default admins: `rob@sagecg.com`, `ryan@leaderreps.com`, `admin@leaderreps.com`

### 4.2 Admin Portal Tabs

| Tab | Purpose | Icon |
|-----|---------|-----|
| **Dashboard** | System overview, quick stats | `LayoutDashboard` |
| **User Management** | Manage User Accounts and permissions | `Users` |
| **Dev Plan** | Manage Development Plan weeks | `BookOpen` |
| **Diagnostics** | System health, error logs | `Activity` |
| **Content Mgmt** | Upload/manage content (The Vault) | `FileText` |
| **Media Library** | Manage uploaded images and videos |  |
| **Widget Lab** | Enable/disable/configure widgets | `LayoutDashboard`|
| **System** | System widgets, time traveler | `Settings` |
| **Daily Reps** | Manage list of Daily Reps | `Dumbbell` |
| **LOV Manager** | Manage Lists of Values (LOVs) | `List` |
| **Daily Plan Manager** | Manage and configure the daily plan | `Calendar` |
| **Cohort Manager** | Manage user cohorts | `ArrowLeftRight` |
| **Leader Profile Reports** | Generate and view leader profile reports | `BarChart2` |
| **Notification Manager** | Manage and send notifications to users | `Bell` |
| **Test Center** | Tools for testing features and functionality | `TestTube2` |
| **Community Manager** | Manage community features | `Users` |
| **Coaching Manager** | Manage coaching sessions | `FlaskConical` |
| **Documentation** | Access to this Admin Guide | `FileText` |

### 4.3 Admin Functions (Separate Screen)

Access via sidebar → Admin Functions:

- **Feature Flags**: Enable/disable major features globally
- **Admin Email List**: Manage who has admin access
- **Database Management**: Direct Firestore access

---

## 5. Development Plan Management

### 5.1 Understanding the Plan Structure

Each week document (`development_plan_v1/week-XX`) contains:

```javascript
{
  // Identity
  weekNumber: 3,
  weekId: "week-03",
  title: "Building Feedback Skills",
  subtitle: "Learn to give and receive feedback effectively",
  focusArea: "Feedback",
  isDraft: false,
  
  // Content Items (The Key linking to The Vault)
  content: [
    {
      contentItemId: "abc123",           // Resource ID from Vault
      resourceId: "abc123",              // Same as above
      resourceType: "video",             // video | reading
      contentItemType: "Workout",        // Display category
      contentItemLabel: "Feedback Framework", // Display name
      isRequiredContent: true
    }
  ],
  
  // Community Items
  community: [
    {
      communityItemId: "xyz789",
      communityItemType: "Leader Circle",
      communityItemLabel: "Weekly Discussion",
      recommendedWeekDay: "Thursday"
    }
  ],
  
  // Coaching Items
  coaching: [
    {
      coachingItemId: "def456",
      coachingItemType: "Open Gym",
      coachingItemLabel: "Practice Session",
      isOptional: false
    }
  ],
  
  // Daily Reps
  dailyReps: [
    { repId: "rep-1", repLabel: "Give one piece of feedback" },
    { repId: "rep-2", repLabel: "Ask for feedback from a peer" }
  ]
}
```

### 5.2 Creating/Editing Weeks

1. Go to **Admin Portal → Dev Plan**
2. Click **Edit (pencil icon)** next to a week
3. Use the tabbed editor:
   - **Identity**: Title, focus area, draft status
   - **Resources**: Add content, community, coaching items
   - **Daily Reps**: Define daily habits for the week
4. Click **Save Changes**

### 5.3 Linking Content to Weeks

1. In the Resources tab, click **+ Add Item**
2. Click **Select Resource...** to open the Vault picker
3. Search/filter to find the resource
4. Click to select it
5. Configure:
   - **Type**: Workout, Read & Rep, Video, Tool, etc.
   - **Label**: Display name (auto-fills from resource title)
   - **Required**: Check if mandatory content

### 5.4 Draft Mode

- **Draft Mode ON**: Week is hidden from users, used for testing
- **Draft Mode OFF**: Week is live and users can access content

---

## 6. Content Management (The Vault)

### 6.1 Content Types

| Collection | Description | Supported Formats |
|------------|-------------|-------------------|
| `content_readings` | PDFs, documents, articles | PDF, DOCX, external URLs, TXT, Markdown |
| `content_videos` | Video content | MP4, YouTube, Vimeo, M3U8 |
| `content_programs` | Multi-week programs | Internal structure |
| `content_workouts` | Interactive exercises | Internal structure |
| `content_tools` | Templates, checklists | PDF, DOCX, external URLs |
| `content_community` | Community activities | Internal structure |
| `content_coaching` | Coaching sessions | Internal structure |

### 6.2 Adding Content

1. Go to **Admin Portal → Content Mgmt**
2. Select the content type tab (Videos, Readings, etc.)
3. Click **+ Add New**
4. Fill in:
   - **Title** (required)
   - **Description**
   - **URL** or upload file
   - **Tier**: free | premium
   - **Category**: Organizational tag
   - **Active**: Must be checked to appear in selectors
5. Click **Save**

### 6.3 File Storage

- Files uploaded to Firebase Storage
- Videos: `resources/videos/{timestamp}_{filename}`
- Documents: `resources/documents/{timestamp}_{filename}`
- Metadata stored in the content document

### 6.4 Content Visibility Rules

Content appears to users when **ALL** conditions are met:
1. Resource `isActive: true`
2. Resource ID is in user's `unlockedResourceIds`
3. OR resource has `isHiddenUntilUnlocked: false` (public)

---

## 7. Widget System

### 7.1 What Are Widgets?

Widgets are **dynamic UI components** that can be:
- Enabled/disabled per module
- Reordered within a module
- Updated without code deployment (templates in Firestore)

### 7.2 Widget Categories

| Category | Examples |
|----------|----------|
| Planning | AM Bookend Header, Weekly Focus, Grounding Rep, Win the Day |
| Reflection | PM Bookend Header, Reflection, Daily Quote |
| Tracking | Scorecard, Progress Feedback, Streak Display |
| Development Plan | Leadership Skills Baseline, Plan Tracker, Timeline |
| Locker | Wins History, Reps History, Reflection History |
| Community | Community Feed, My Discussions, Live Events |
| Coaching | Upcoming Sessions, On-Demand, My Sessions |
| System | System Messages, Announcements |

### 7.3 Managing Widgets

1. Go to **Admin Portal → Widget Lab**
2. Find the widget by category or search
3. Toggle **Enable/Disable**
4. Drag to **reorder** within category
5. Click **Save Configuration**

### 7.4 Widget Templates

Widgets are defined in `src/config/widgetTemplates.js`:
- Each widget has a unique ID
- Templates use React-Live or direct JSX for rendering
- Scope variables are passed from parent components

**Example Widget Template (Weekly Focus):**
```javascript
(() => {
  // Get the weekly focus from scope
  const focus = weeklyFocus || "Leadership Identity";
  const weekNum = currentWeekNumber || 1;
  const title = `Week ${weekNum} Focus: ${focus}`;

  return (
    <Card title={title} icon={Target} accent="NAVY">
      {/* Clean, minimal display - just the title */}
    </Card>
  );
})()
```

**Roadmap Widget Template Example**

```javascript
// Helper for Roadmap Widgets
export const createRoadmapWidget = (title, ideas) => `
<div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
    <Lightbulb className="w-5 h-5 text-yellow-500" />
    ${title}
  </h3>
  <div className="space-y-3">
    ${ideas.map(idea => `
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-bold text-slate-800 text-sm">${idea.title}</h4>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">Coming Soon</span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">${idea.desc}</p>
    </div>
    `).join('')}
  </div>
</div>
`;
```

---

## 8. Feature Flags & Configuration

### 8.1 Global Feature Flags

Located in **Admin Functions → Feature Flags**:

| Flag | Controls |
|------|----------|
| `enableLabs` | Labs/experimental features |
| `enableCommunity` | Community module |
| `enablePlanningHub` | Planning Hub access |
| `enableDevPlan` | Development Plan module |
| `enableDailyPractice` | Daily Practice features |
| `enableQuickStart` | Quick Start Accelerator |
| `enableMembershipModule` | Premium membership features |

### 8.2 Widget-Level Flags

Located in **Widget Lab** or `metadata/featureFlags` Firestore document.

### 8.3 Admin Email List

Located in `metadata/config.adminemails`:
- Array of email addresses
- Case-insensitive matching
- Users in this list see Admin menu items

---

## 9. User Data & Daily Practice

### 9.1 Daily Practice Document Structure

`users/{uid}/daily_practice/current`:

```javascript
{
  date: "2025-12-06",                    // Current date (YYYY-MM-DD)
  lastUpdated: "2025-12-06T14:30:00Z",
  
  // Morning Bookend
  morningBookend: {
    wins: [
      { id: "win-1", text: "Complete Q4 review", completed: true },
      { id: "win-2", text: "1:1 with Sarah", completed: false },
      { id: "win-3", text: "", completed: false }
    ],
    winCompleted: true,
    completedAt: "2025-12-06T08:15:00Z"
  },
  
  // Leadership Identity Statement
  identityStatement: "I am a servant leader who empowers others...",
  groundingRepCompleted: true,
  
  // Active Commitments (Daily Reps)
  active_commitments: [
    { id: "rep-1", text: "Give feedback", status: "Committed" },
    { id: "rep-2", text: "Ask for input", status: "Pending" }
  ],
  
  // Evening Bookend
  eveningBookend: {
    good: "Had a productive meeting with the team",
    better: "Could have prepared more for the client call",
    best: "Focus on preparation tomorrow",
    completed: true,
    completedAt: "2025-12-06T18:30:00Z"
  },
  
  // Daily Scorecard
  scorecard: {
    grounding: { done: 1, total: 1, pct: 100 },
    win: { done: 2, total: 3, pct: 67 },
    reps: { done: 1, total: 2, pct: 50 }
  },
  
  // Streak
  streakCount: 7,
  lastStreakDate: "2025-12-05",
  
  // History Arrays (appended nightly)
  winsList: [...],
  repsHistory: [...],
  reflectionHistory: [...],
  scorecardHistory: [...]
}
```

### 9.2 User Development Plan

`users/{uid}/development_plan`:

```javascript
{
  planId: "quick-start-v1",
  currentWeek: 3,
  startDate: "2025-11-18",
  releaseGroup: "alpha",
  masterPlan: { ... },              // Copy of the plan template
  assessmentResults: { ... },       // Leadership Skills Baseline data
  weekProgress: {
    "week-01": { completedAt: "...", ... },
    "week-02": { completedAt: "...", ... }
  }
}
```

### 9.3 Data Archival

At 11:59 PM, current data is copied to:
`users/{uid}/daily_logs/{YYYY-MM-DD}`

This preserves a complete history of each day's activity.

---

## 10. Scheduled Functions & Automation

### 10.1 Daily Rollover Function

**Function**: `scheduledDailyRollover`  
**Schedule**: 11:59 PM Central Time (America/Chicago)  
**Location**: `functions/index.js`

**What it does:**
1. Gets all users with active daily_practice data
2. For each user:
   - Archives current data to `daily_logs/{date}`
   - Carries over incomplete wins
   - Carries over uncommitted reps
   - Calculates and updates streak
   - Resets scorecard, reflection for new day
   - Updates history arrays

### 10.2 Checking Function Status

```bash
# List deployed functions
firebase functions:list --project leaderreps-pd-platform

# View function logs
firebase functions:log --project leaderreps-pd-platform
```

### 10.3 Manual Rollover (Emergency)

If the function fails, you can trigger a manual rollover using the Firebase Console or a script in `scripts/fix-stuck-rollovers.cjs`.

---

## 11. Deployment & Environments

### 11.1 Environments

| Environment | Project ID | URL | Version |
|-------------|-----------|-----|---------|
| DEV | `leaderreps-pd-platform` | https://leaderreps-pd-platform.web.app | Displays in footer |
| TEST | `leaderreps-test` | https://leaderreps-test.web.app | Displays in footer |
| PROD | (future) | (future) | Displays in footer |

### 11.2 Deployment Scripts

```bash
# Deploy to DEV
npm run deploy

# Deploy to TEST (configure firebase use target first)
firebase use test
npm run deploy:quick
```

### 11.3 What Gets Deployed

- **Hosting**: Built React app (`build/` folder)
- **Firestore Rules**: `firestore.rules`
- **Firestore Indexes**: `firestore.indexes.json`
- **Cloud Functions**: `functions/index.js`

### 11.4 Deployment Process

1. Architecture check runs (validates code standards) via `./scripts/ui-architecture-check.sh`
2. ESLint validation runs via `eslint .`
3. Changes committed to git
4. Pushed to GitHub
5. Vite builds the app
6. Firebase deploys hosting + rules + indexes
7. Functions deployed separately (if changed)

---

## 12. Troubleshooting Guide

### 12.1 Content Not Showing for Users

**Check:**
1. Is the resource marked **Active**?
2. Is the week in **Draft Mode**? (should be OFF)
3. Is the resource linked to a week the user has unlocked?
4. Does the resource have the correct **resourceId** in the week?

### 12.2 Widgets Not Appearing

**Check:**
1. Is the widget **enabled** in Widget Lab?
2. Is the parent feature flag enabled?
3. Check browser console for errors
4. Verify the widget template exists in `widgetTemplates.js`

### 12.3 Daily Rollover Not Running

**Check:**
1. Verify function is deployed: `firebase functions:list`
2. Check function logs: `firebase functions:log`
3. Verify timezone is correct (America/Chicago)
4. Check for errors in Cloud Functions console

### 12.4 User Can't Access Admin

**Check:**
1. Is their email in `metadata/config.adminemails`?
2. Email matching is case-insensitive
3. User may need to log out and back in

### 12.5 Build Fails

**Common causes:**
- ESLint errors (check `eslint.config.js`)
- Import errors (check file paths)
- Architecture violations (check terminal output)

**Fix:**
```bash
npm run lint        # Check for errors
npm run build       # Try local build first
```

### 12.6 Time Travel Not Working

**Check:**
1. Is Time Traveler widget enabled?
2. User must be an admin
3. Check `localStorage` for time offset
4. Verify `timeService.js` is imported correctly

### 12.7 Data Migration Issues

**Check:**
1. Verify the `scripts/migrate-app-data.cjs` script is up-to-date.
2. Ensure the correct Firebase project is selected.
3. Check for schema differences between environments.
4. Review the script's output logs for errors.

### 12.8 User Cleanup Issues

**Check:**
1. Verify the `scripts/cleanup-test-users.cjs` script is up-to-date.
2. Ensure the correct Firebase project is selected.
3. Review the script's output logs for errors.
4. Check if the script is running in dry-run mode.

---

## 13. Technical Reference

### 13.1 Key Files & Directories

```
src/
├── components/
│   ├── admin/          # Admin portal components
│   ├── layout/         # App layout, sidebar, navigation
│   ├── screens/        # Main feature screens
│   ├── ui/             # Reusable UI components
│   └── widgets/        # Widget implementations
├── config/
│   ├── widgetTemplates.js   # Widget template definitions
│   ├── breadcrumbConfig.js  # Navigation breadcrumbs
│   └── screenConfig.js      # Screen routing config
├── hooks/
│   ├── useDevPlan.js        # Development plan data
│   └── useDayTransition.js  # Day change detection
├── providers/
│   ├── FeatureProvider.jsx  # Widget feature flags
│   ├── NavigationProvider.jsx # Navigation context
│   └── NotificationProvider.jsx # Browser notifications
├── services/
│   ├── contentService.js    # Content CRUD operations
│   ├── timeService.js       # Time travel support
│   └── useAppServices.jsx   # Central data provider
└── routing/
    └── ScreenRouter.jsx     # Screen routing

functions/
└── index.js                 # Cloud Functions

firebase.json                # Firebase configuration
firestore.rules             # Security rules
firestore.indexes.json      # Database indexes
package.json                # Project dependencies
```

### 13.2 Important Services

| Service | Purpose |
|---------|---------|
| `useAppServices` | Central hook providing all app data |
| `contentService` | CRUD for content collections |
| `timeService` | Time travel/offset functionality |
| `notificationService` | Browser push notifications |
| `membershipService` | Premium membership logic |

### 13.3 Data Update Patterns

**Updating Daily Practice:**
```javascript
const { updateDailyPracticeData } = useAppServices();
await updateDailyPracticeData({ field: value });
```

**Updating Development Plan:**
```javascript
const { updateDevelopmentPlanData } = useAppServices();
await updateDevelopmentPlanData({ field: value });
```

### 13.4 Corporate Colors

| Color | CSS Variable | Hex |
|-------|--------------|-----|
| Navy | `--corporate-navy` | #002E47 |
| Teal | `--corporate-teal` | #00A896 |
| Orange | `--corporate-orange` | #F77F00 |
| Light Gray | `--corporate-light-gray` | #F5F7FA |

### 13.5 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Check code quality
npm run visualize        # Build with bundle analyzer
npm run test             # Run tests
npm run test:coverage    # Run tests with coverage report

# Firebase
firebase use dev         # Switch to DEV project
firebase use test        # Switch to TEST project
npm run deploy           # Deploy all
npm run deploy:quick     # Deploy hosting only

# Git
git status
git add .
git commit -m "message"
git push origin main
```

### 13.6 Data Migration Commands

```bash
npm run data:export   # Export Firestore data to JSON
npm run data:import   # Import Firestore data from JSON
npm run data:list     # List available data exports
```

---

## 14. Command Line Scripts

These scripts are located in the project root directory.

### 14.1 Data Migration Script (`scripts/migrate-app-data.cjs`)

This script is used to export and import Firestore data between environments.

**Commands:**

- `npm run data:export`: Exports Firestore data to a JSON file.
- `npm run data:import`: Imports Firestore data from a JSON file.
- `npm run data:list`: Lists available data exports.

### 14.2 User Cleanup Script (`scripts/cleanup-test-users.cjs`)

This script is used to delete test users from the Firestore database and Firebase Authentication. This is crucial for maintaining data privacy and security, especially in development and testing environments.

**Commands:**

- `npm run cleanup:dev-preview`:  Lists the users that would be deleted from the DEV environment without actually deleting them (dry run).
- `npm run cleanup:dev-execute`:  Deletes test users from the DEV environment.
- `npm run cleanup:test-preview`: Lists the users that would be deleted from the TEST environment without actually deleting them (dry run).
- `npm run cleanup:test-execute`: Deletes test users from the TEST environment.

**Options:**

- `--dry-run`:  Preview the changes without executing them.
- `--execute`:  Execute the deletion of test users.

### 14.3 Sync Dev to Test Script (`sync-dev-to-test.sh`)

This bash script synchronizes data from the development environment to the test environment.  It's a convenience script, check its content for the exact steps.

**Command:**

- `npm run sync:test`

---

## Quick Reference Card

### Daily Admin Tasks
- [ ] Check function logs for overnight rollover
- [ ] Review any user-reported issues
- [ ] Verify content is appearing correctly

### Weekly Admin Tasks
- [ ] Review upcoming week's content
- [ ] Ensure next week's Development Plan is not in draft
- [ ] Check feature flag settings

### Before Major Changes
- [ ] Test in DEV environment first
- [ ] Use Time Traveler to verify time-based features
- [ ] Check architecture compliance
- [ ] Review Firestore rules if data model changes

---

*For additional support, contact the development team or refer to the code repository documentation.*

---