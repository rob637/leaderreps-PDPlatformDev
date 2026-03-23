md
# Application Architecture & File Map

This document provides a comprehensive map of the LeaderReps application codebase, detailing the purpose and location of key files and directories. It is designed to help developers and the Kaizen AI understand the system structure.

**Last Updated: March 23, 2026**

## 1. Core Application Entry Points

| File | Location | Purpose |
|------|----------|---------|
| `main.jsx` | `src/main.jsx` | The application entry point. Mounts the React app, initializes providers (Auth, Router, Feature), and handles global error boundaries. Registers the PWA and handles web vitals. |
| `App.jsx` | `src/App.jsx` | The root component. Sets up the main routing structure, layout wrappers, and global context providers. Manages authentication state, initializes Firebase, and sets up the provider tree. |
| `index.html` | `/index.html` | The main HTML template. Contains the root div for React and global meta tags. |
| `vite.config.mjs` | `/vite.config.mjs` | Configuration for the Vite build tool, including plugins, aliases, and build settings. Includes `VISUALIZE` and `DEBUG` options for build analysis. |

## 2. Configuration & Environment

| File | Location | Purpose |
|------|----------|---------|
| `firebaseConfig.js` | `src/config/firebaseConfig.js` | Initializes the Firebase app and exports auth, firestore, storage, and functions instances. Handles environment-specific config (Dev vs Test vs Prod) using `VITE_` environment variables. |
| `widgetTemplates.js` | `src/config/widgetTemplates.js` | Defines the templates for the dynamic widget system. Contains the code strings for widgets, with logic for dynamic content and user interaction. It utilizes Lucide React icons for visual elements within the widgets. Includes templates for roadmap widgets, and content display. |
| `zoneConfig.js` | `src/config/zoneConfig.js` | Defines the layout zones (e.g., Dashboard, Locker, Community) and which widgets are allowed in each. |
| `breadcrumbConfig.js` | `src/config/breadcrumbConfig.js` | Defines the navigation breadcrumbs for the application. |
| `tailwind.config.cjs` | `/tailwind.config.cjs` | Configuration for Tailwind CSS, including custom colors (corporate-navy, corporate-teal, corporate-orange), fonts (Nunito Sans), theme extensions, and shadow utilities (shadow-card, shadow-card-hover, shadow-elevated, shadow-pop). |

## 3. State Management & Services

The application uses a Service-Oriented Architecture (SOA) pattern injected via React Context.

| File | Location | Purpose |
|------|----------|---------|
| `AppServiceContext.js` | `src/services/AppServiceContext.js` | React context for accessing application services. |
| `createAppServices.js` | `src/services/createAppServices.js` | Factory function that instantiates all service objects (contentService, coachingService, conditioningService, etc.) and binds them to the Firebase instance. Manages data subscriptions and local state.  It also includes logic to convert JavaScript Dates to Firebase Timestamps, respecting Firebase field value sentinels. It also manages the midnight timer for daily rollover checks. |
| `contentService.js` | `src/services/contentService.js` | Manages fetching and filtering of content (Readings, Videos, Courses) from Firestore. |
| `coachingService.js` | `src/services/coachingService.js` | Manages coaching sessions. |
| `conditioningService.js` | `src/services/conditioningService.js` | Manages real leadership rep accountability between Foundation sessions. Core rule: Each leader must complete ≥1 real rep per week. |
| `dailyLogService.js` | `src/services/dailyLogService.js` | Handles the logic for daily user logs, including reflections, and habit tracking. |
| `communityService.js` | `src/services/communityService.js` | Manages community events and interactions. |
| `membershipService.js` | `src/services/membershipService.js` | Manages free/premium tiers and membership data. |
| `notificationService.js` | `src/services/notificationService.js` | Manages notification scheduling. |
| `mediaService.js` | `src/services/mediaService.js` | Handles video/media handling. |
| `timeService.js` | `src/services/timeService.js` | Provides time-of-day logic and calculates milliseconds until midnight. |
| `unifiedContentService.js` | `src/services/unifiedContentService.js` | Manages cross-feature content resolution. |
| `dateUtils.js` | `src/services/dateUtils.js` | Provides date helpers. |
| `dataUtils.js` | `src/services/dataUtils.js` | Provides data transformation helpers, including functions to apply patches, sanitize timestamps, and strip sentinels. |
| `firebaseUtils.js` | `src/services/firebaseUtils.js` | Provides Firebase operation helpers. |
| `firestoreUtils.js` | `src/services/firestoreUtils.js` | Provides Firestore query helpers. |
| `DataProvider.jsx` | `src/providers/DataProvider.jsx` | Core data layer. Provides the AppServices via React context, manages Firestore subscriptions, and handles data loading. Provides data for user profile, development plan, daily practice, strategic content, membership, and global metadata. |
| `FeatureProvider.jsx` | `src/providers/FeatureProvider.jsx` | Manages feature flags. |
| `AccessControlProvider.jsx` | `src/providers/AccessControlProvider.jsx` | Manages day-based and role-based access control. |
| `LayoutProvider.jsx` | `src/providers/LayoutProvider.jsx` | Manages layout state (sidebar, mobile nav). |
| `NavigationProvider.jsx` | `src/providers/NavigationProvider.jsx` | Provides screen navigation context. |
| `NotificationProvider.jsx` | `src/providers/NotificationProvider.jsx` | Manages in-app notifications. |
| `ThemeProvider.jsx` | `src/providers/ThemeProvider.jsx` | Manages dark/light theme. |
| `TimeProvider.jsx` | `src/providers/TimeProvider.jsx` | Provides time-of-day context (AM/PM sessions). |

## 4. Component Structure

### 4.1 Admin Portal (`src/components/admin/`)
| File | Purpose |
|------|---------|
| `AdminPortal.jsx` | The main layout and router for the Admin interface. Manages admin authentication, utilizes `useAppServices` and `useNavigation` hooks, and displays different admin sections based on user role. It dynamically renders different sections based on the `activeTab` state, which is synchronized with navigation parameters. |
| `AdminDashboard.jsx` | Displays key metrics and system overview for administrators. |
| `FeatureManager.jsx` | Allows admins to enable/disable widgets, reorder them, and edit their settings/documentation. |
| `DocumentationCenter.jsx` | The hub for viewing and updating system documentation (Admin Guide, User Guide, Architecture). Includes the Kaizen AI updater. |
| `ContentAdminHome.jsx` | Interface for managing the Content Library (uploading videos, creating articles). |
| `MediaLibrary.jsx` | Component for managing media assets (images, videos, etc.) in the application. |
| `UserManagement.jsx` | Interface for viewing and managing user accounts and permissions. |
| `SystemDiagnostics.jsx` | Provides system health and diagnostic information. |
| `SystemWidgets.jsx` | Manages system-wide widgets and settings. |
| `TestCenter.jsx` | Allows administrators to run system tests and monitor results. |
| `CommunityManager.jsx` | Manages community-related features and content. |
| `CoachingManager.jsx` | Manages coaching programs and user assignments. |
| `LOVManager.jsx` | Manages List of Values (LOV) used throughout the application. |
| `DailyRepsLibrary.jsx` | Manages the library of Daily Reps content. |
| `ContentManager.jsx` | Manages the structure and content of Daily Plans. |
| `LevelSignOffQueue.jsx` | Manages the queue for level sign-off requests. |
| `SessionAttendanceQueue.jsx` | Manages the queue for session attendance records. |
| `CoachingCertificationQueue.jsx` | Manages the queue for coaching certification requests. |
| `CohortManager.jsx` | Manages user cohorts and group assignments. |
| `LeaderProfileReports.jsx` | Generates reports on leader profiles and progress. |
| `NotificationManager.jsx` | Manages application notifications and alerts. |
| `CommunicationsManager.jsx` | Manages in-app communications and messaging. |
| `AnnouncementsManager.jsx` | Manages global announcements displayed to users. |
| `ConditioningDashboard.jsx` | Displays the Conditioning Dashboard for admins. |
| `ConditioningConfig.jsx` | Allows configuration of conditioning settings. |
| `UxAuditPanel.jsx` | Panel for conducting UX audits. |
| `VideoSeriesManager.jsx` | Manages video series content and metadata. |

### 4.2 Widgets (`src/components/widgets/`)
Contains the React components for complex widgets. Simple widgets are defined as strings in `widgetTemplates.js`.
| File | Purpose |
|------|---------|
| `WinTheDayWidget.jsx` | The interactive "Win the Day" tracker. |
| `DevelopmentPlanWidget.jsx` | Displays the user's current weekly development plan. |
| `ThisWeeksActionsWidget.jsx` | Shows the checklist of actions for the current week. |

### 4.3 Screens (`src/components/screens/`)
| File | Purpose |
|------|---------|
| `AICoachSelector.jsx` | Screen for selecting an AI coach. |
| `RepCoach.jsx` | Screen for the Rep AI Coach. |
| `RoadmapTracker.jsx` | Screen for tracking progress on the roadmap. |
| `Dashboard.jsx` | The main user dashboard. Renders the widget grid. |
| `Conditioning.jsx` | Screen for managing conditioning reps. |
| `DevelopmentPlan.jsx` | The full Development Plan interface. |
| `CoachingHub.jsx` | Screen for the Coaching Hub. |
| `Locker.jsx` | The user's personal "Locker" (Profile, History, Settings). |
| `DailyPractice.jsx` | Screen for the daily practice. |
| `PlanningHub.jsx` | Screen for the Planning Hub. |
| `BusinessReadings.jsx` | Screen for business readings. |
| `QuickStartAccelerator.jsx` | Screen for the Quick Start Accelerator. |
| `ExecutiveReflection.jsx` | Screen for executive reflection. |
| `CommunityHub.jsx` | Screen for the Community Hub. |
| `CommunityFeed.jsx` | Screen for the Community Feed. |
| `AppliedLeadership.jsx` | Screen for Applied Leadership. |
| `LeadershipVideos.jsx` | Screen for Leadership Videos. |
| `AppSettings.jsx` | Screen for app settings. |
| `PrivacySettings.jsx` | Screen for privacy settings. |
| `AccessibilitySettings.jsx` | Screen for accessibility settings. |
| `LegalNotice.jsx` | Screen for the legal notice. |
| `Support.jsx` | Screen for support. |
| `Terms.jsx` | Screen for the terms of service. |
| `NotFound.jsx` | Screen for handling 404 errors (Not Found). |

## 5. Backend & Cloud Functions

| File | Location | Purpose |
|------|----------|---------|
| `firestore.rules` | `/firestore.rules` | Security rules for the Firestore database. Defines who can read/write to which collections. |
| `storage.rules` | `/storage.rules` | Security rules for Firebase Storage (user uploads, content assets). |
| `functions/index.js` | `functions/index.js` | Firebase Cloud Functions. Handles backend logic like user creation triggers, daily rollovers (via scheduledDailyRollover function), and notifications. Includes proxy functions for accessing AI models like Google Gemini API and Anthropic Claude. |

## 6. Scripts & Automation

| File | Location | Purpose |
|------|----------|---------|
| `deploy.sh` | `/scripts/deploy.sh` | Generic script to build and deploy the application. Accepts environment as an argument (dev, test, prod). Enforces environment separation. |
| `deploy-repup.sh` | `/scripts/deploy-repup.sh` | Script to deploy the RepUp application to specified environments (dev, test). |
| `sync-dev-to-test.sh` | `/scripts/deploy/sync-dev-to-test.sh` | Script to sync data from the development environment to the test environment. |
| `scripts/ui-architecture-check.sh` | `/scripts/ui-architecture-check.sh` | Script to lint and validate the UI architecture. |
| `scripts/migrate-app-data.cjs` | `/scripts/migrate-app-data.cjs` | Node script for exporting and importing app data. |
| `scripts/cleanup-test-users.cjs` | `/scripts/cleanup-test-users.cjs` | Node script for cleaning up test users in development and test environments. |

## 7. Dependencies

The following key dependencies are used in the project:

| Package | Version | Description |
|---|---|---|
| `@google/genai` | `^1.27.0` | Google Generative AI API client. |
| `@monaco-editor/react` | `^4.7.0` | Monaco Editor (code editor) component for React. |
| `clsx` | `^2.1.1` | Utility for constructing `className` strings conditionally. |
| `csv-parse` | `^6.1.0` | CSV parsing library. |
| `dompurify` | `^3.3.0` | DOMPurify is a DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML, MathML and SVG. |
| `dotenv` | `^17.2.3` | Loads environment variables from a .env file. |
| `lucide-react` | *latest* | Provides a library of icons for use in React components, enhancing the UI with scalable vector graphics. |
| `vite-plugin-pwa` | *latest* | Plugin for Vite to generate a Progressive Web App. |
| `framer-motion` | *latest* | Animation library for React. |

## 8. Testing

| Command | Purpose |
|---|---|
| `npm run test` | Runs all tests. |
| `npm run test:run` | Executes the test suite. |
| `npm run test:coverage` | Generates test coverage reports. |
| `npm run e2e` | Runs end-to-end tests using Playwright. |
| `npm run e2e:headed` | Runs end-to-end tests in headed mode (with browser UI). |
| `npm run e2e:ui` | Runs end-to-end tests in UI mode using Playwright. |
| `npm run e2e:smoke` | Runs smoke tests using Playwright, defined in `smoke.spec.js`. |
| `npm run e2e:auth` | Runs authentication-specific tests using Playwright, defined in `auth.spec.js`. |

## 9. Deployment Scripts

| Script | Command | Environment |
|---|---|---|
| `deploy:dev` | `bash ./scripts/deploy.sh dev` | Deploys to the Development environment. |
| `deploy:test` | `bash ./scripts/deploy.sh test` | Deploys to the Test environment. |
| `deploy:prod` | `bash ./scripts/deploy.sh prod` | Deploys to the Production environment. |
| `deploy:repup:dev` | `bash ./scripts/deploy-repup.sh dev` | Deploys the RepUp application to the Development environment. |
| `deploy:repup:test` | `bash ./scripts/deploy-repup.sh test` | Deploys the RepUp application to the Test environment. |

## 10. Program Structure

The LeaderReps platform delivers structured leadership development through **8-week** programs, incorporating daily practices, coaching, community events, and AI coaching.

---
*This document is maintained by the Kaizen AI system. Last updated: March 23, 2026.*
---