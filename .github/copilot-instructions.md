# Copilot Instructions — LeaderReps PD Platform

## Project Overview

LeaderReps is a **leadership professional development (PD) platform** — a PWA built for cohort-based leadership programs. Leaders go through structured 8-week development programs with daily practices, coaching sessions, community events, assessments, and AI coaching. The platform supports multiple deployment targets (dev, test, prod) and has strict environment separation to prevent accidental cross-environment operations.

**Product context:** This is NOT a generic SaaS app. It's a structured leadership development experience with phases (Prep → Active Program → Post-Program), daily time-based workflows (AM check-in → daily practice → PM reflection), and cohort-based access control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (JSX, no TypeScript) |
| **Build** | Vite 5 (`vite.config.mjs`) |
| **Styling** | Tailwind CSS 3 + custom brand colors |
| **Icons** | Lucide React |
| **Animation** | Framer Motion |
| **Backend** | Firebase (Firestore, Auth, Storage, Functions, Hosting) |
| **Cloud Functions** | Firebase Functions (mix of Gen 1 and Gen 2), Node.js |
| **AI** | Google Gemini API + Anthropic Claude (via Cloud Functions proxy) |
| **Testing** | Vitest (unit), Playwright (e2e) |
| **Linting** | ESLint + Prettier |
| **PWA** | vite-plugin-pwa with Workbox |
| **Package Manager** | npm |
| **Node** | >=20.x |
| **Module System** | ESM (`"type": "module"` in package.json) |

---

## Project Structure

```
src/
├── App.jsx              # Root component — auth state, Firebase init, provider tree
├── main.jsx             # Entry point — PWA registration, web vitals, React root
├── components/
│   ├── screens/         # Top-level route screens (lazy loaded via ScreenRouter)
│   ├── widgets/         # Dashboard widgets (self-contained feature cards)
│   ├── layout/          # AppContent, MobileBottomNav, ArenaSidebar
│   ├── admin/           # Admin-only components
│   ├── auth/            # AuthPanel, login/signup flows
│   ├── coaching/        # Coaching session components
│   ├── conditioning/    # Conditioning/habit tracking components
│   ├── rep/             # Rep AI Coach components
│   ├── arena/           # Arena (gamification) components
│   ├── common/          # Shared reusable components
│   ├── shared/          # Cross-feature shared components
│   ├── ui/              # Presentational UI components
│   ├── icons/           # Custom icon components
│   ├── modals/          # Modal dialogs
│   ├── system/          # ErrorBoundary, ConfigError, ConfigGate
│   ├── offline/         # Offline detection and caching
│   ├── accessibility/   # LiveRegion, SkipLinks
│   ├── motion/          # Animation wrappers
│   ├── gestures/        # Touch/gesture handlers
│   └── haptics/         # Haptic feedback
├── config/
│   ├── firebaseConfig.js   # Firebase config from VITE_ env vars
│   ├── zoneConfig.js       # Widget zone definitions
│   ├── breadcrumbConfig.js # Navigation breadcrumbs
│   └── widgetTemplates.js  # Widget template definitions
├── hooks/               # Custom React hooks (useAuth, useDailyPlan, useDevPlan, etc.)
├── providers/           # React Context providers
│   ├── DataProvider.jsx          # Core data layer — AppServices, Firestore subscriptions
│   ├── FeatureProvider.jsx       # Feature flags
│   ├── AccessControlProvider.jsx # Day-based and role-based access control
│   ├── LayoutProvider.jsx        # Layout state (sidebar, mobile nav)
│   ├── NavigationProvider.jsx    # Screen navigation
│   ├── NotificationProvider.jsx  # In-app notifications
│   ├── ThemeProvider.jsx         # Dark/light theme
│   └── TimeProvider.jsx          # Time-of-day context (AM/PM sessions)
├── services/            # Business logic and Firestore interaction layer
│   ├── createAppServices.js      # Factory for all service instances
│   ├── AppServiceContext.js      # React context for services
│   ├── contentService.js         # Content management
│   ├── coachingService.js        # Coaching sessions
│   ├── conditioningService.js    # Conditioning/habits
│   ├── dailyLogService.js        # Daily practice logging
│   ├── communityService.js       # Community events
│   ├── membershipService.js      # Free/premium tiers
│   ├── notificationService.js    # Notification scheduling
│   ├── mediaService.js           # Video/media handling
│   ├── timeService.js            # Time-of-day logic
│   ├── unifiedContentService.js  # Cross-feature content resolution
│   ├── dateUtils.js              # Date helpers
│   ├── dataUtils.js              # Data transformation helpers
│   ├── firebaseUtils.js          # Firebase operation helpers
│   └── firestoreUtils.js         # Firestore query helpers
├── routing/
│   └── ScreenRouter.jsx  # Lazy-loaded screen mapping (string keys → components)
├── ui/
│   └── uiKit.jsx         # Shared UI primitives (Button, Card, Section)
├── lib/                  # Low-level utilities
├── styles/               # Global CSS
├── globals/              # Global constants
├── data/                 # Static data files
└── test/                 # Test utilities and setup

functions/                # Firebase Cloud Functions (CommonJS)
├── index.js              # All cloud functions (scheduledDailyRollover, geminiProxy, etc.)
├── package.json          # Separate dependencies (firebase-admin, etc.)

scripts/                  # Deployment and utility scripts
├── deploy.sh             # Main deploy script (enforces env separation)
├── deploy-repup.sh       # RepUp sub-app deploy
├── migrate-app-data.cjs  # Data export/import between environments
├── cleanup-test-users.cjs
├── ui-architecture-check.sh
├── data/                 # Seed, import, upload, and catalog data scripts
├── debug/                # Diagnostic check-* and debug-* scripts (~90 files)
├── deploy/               # Shell deploy scripts (deploy-dev, sync-dev-to-test, etc.)
├── fixes/                # One-time fix-* scripts
├── migrations/           # Data migration scripts (migrate-*, migration-*)
└── utils/                # Python scrapers, misc utility scripts

docs/                     # Architecture docs, guides, plans, specifications

e2e-tests/                # Playwright end-to-end tests
├── suites/               # Test suites organized by feature

corporate/                # Corporate website (separate Vite app)
reppy/                    # Reppy AI Coach (separate PWA)
passcpa/                  # PassCPA app (separate Vite app)
```

---

## Critical Conventions

### JavaScript — No TypeScript
- This project uses **plain JavaScript (.js/.jsx)** throughout. Do NOT suggest or generate TypeScript.
- Use JSDoc comments for complex function signatures when helpful.

### File Extensions
- React components: `.jsx`
- Services, hooks, config, utilities: `.js`
- Node.js scripts (CommonJS): `.cjs`
- Node.js scripts (ESM): `.mjs`
- Cloud Functions: `.js` (CommonJS — `functions/` has its own package.json)

### Imports
- Use **named imports** from services and hooks.
- Use **relative paths** — no path aliases configured.
- Screens are **lazy loaded** via `ScreenRouter.jsx` — add new screens there.

### Component Patterns
- **Functional components only** — no class components.
- **Hooks** for state and effects — no HOCs.
- Components receive Firebase services via `AppServiceContext` (from DataProvider).
- Access control uses `useAccessControl` and `useDayBasedAccessControl` hooks.
- Navigation is string-based via `navigate('screen-key')`, NOT react-router.

### Styling
- **Tailwind CSS utility classes** — avoid inline styles except for brand color overrides.
- Brand colors are defined in `tailwind.config.cjs`:
  - Navy: `#002E47` → `corporate-navy`
  - Teal: `#47A88D` → `corporate-teal`
  - Orange: `#E04E1B` → `corporate-orange`
- Use the `shadow-card`, `shadow-card-hover`, `shadow-elevated`, `shadow-pop` utilities.
- Font: Nunito Sans (loaded via index.html).
- Dark mode supported via `darkMode: 'class'`.

### UI Kit
- Use components from `src/ui/uiKit.jsx` (`Button`, `Card`, `Section`) for consistency.
- Icons: Use `lucide-react` — import specific icons by name.

---

## Firebase & Firestore

### Environment Separation (CRITICAL)
- **Dev:** `leaderreps-pd-platform` (default)
- **Test:** `leaderreps-test`
- **Prod:** `leaderreps-prod`
- **NEVER** run `npm run build` or `npm run deploy` directly — use `npm run deploy:dev` or `npm run deploy:test` which go through `scripts/deploy.sh` with env validation.
- Environment is controlled by `.env.local` (VITE_FIREBASE_* variables).
- The plain `build` and `deploy` scripts are **intentionally blocked** to prevent env mixups.

### Firestore Data Model
- User data: `users/{userId}/...` (profile, progress, logs, daily plans)
- Content: `metadata/...` catalogs, `content-groups/`, `unified-content/`
- Cohorts: `cohorts/{cohortId}` — users belong to cohorts with start/end dates
- Config: `config/` collection (feature flags), `metadata/config` (admin emails)
- Global: `global/metadata` — app-wide settings

### Firestore Rules
- Defined in `firestore.rules` — hardened security model.
- Admin check: hardcoded list + dynamic `metadata/config` adminemails array.
- Users can only read/write their own data.
- All email comparisons are case-insensitive (`.lower()`).

### Cloud Functions (`functions/index.js`)
- Written in **CommonJS** (`require()`), NOT ESM.
- Mix of Gen 1 (`firebase-functions/v1`) and Gen 2 (`firebase-functions/v2`).
- Key functions: `scheduledDailyRollover`, `manualRollover`, `geminiProxy`, `scheduledNotificationCheck`, `validateInvitation`.
- Functions have their own `package.json` in `functions/` — separate `npm install`.

---

## Provider Architecture

The app wraps content in a specific provider order (defined in `App.jsx`):

```
ThemeProvider
  └─ OfflineProvider
       └─ TimeProvider
            └─ DataProvider (core data subscriptions)
                 └─ FeatureProvider (feature flags)
                      └─ AccessControlProvider
                           └─ NotificationProvider
                                └─ LayoutProvider
                                     └─ NavigationProvider
                                          └─ AppContent
```

- **DataProvider** is the most important — it creates `AppServices`, subscribes to Firestore, and provides all data downstream.
- Access `services` and `serviceData` via the `useAppServices()` hook.
- **Never** create raw Firestore subscriptions in components — use services.

---

## Navigation

- **No react-router.** Navigation is state-based via `navigate('screen-key')`.
- Screen keys are defined in `src/routing/ScreenRouter.jsx`.
- To add a new screen: add a lazy import entry to `ScreenRouter.jsx` and create the component in `src/components/screens/`.
- Breadcrumbs are configured in `src/config/breadcrumbConfig.js`.

---

## Daily Plan & Time-Based Workflow

The app has a structured daily flow:
1. **Prep Phase** — Before the program starts (onboarding, assessments)
2. **AM Session** — Morning check-in, daily plan, grounding rep
3. **Daily Practice** — Content consumption, skill practice, applied leadership
4. **PM Session** — Reflection, win logging, conditioning check
5. **Post-Program** — After 8-week program ends

Time-of-day logic is in `src/services/timeService.js` and `TimeProvider`.

---

## Widget System

Dashboard uses a **widget-based architecture**:
- Widgets are in `src/components/widgets/`
- Each widget is self-contained with its own data fetching via services.
- Widget zones are configured in `src/config/zoneConfig.js`.
- Widget templates in `src/config/widgetTemplates.js`.

---

## Testing

### Unit Tests (Vitest)
- Run: `npm test` or `npm run test:run`
- Config: Vitest is configured in `vite.config.mjs`
- Test files: `src/test/` and co-located `*.test.js` files
- Use `@testing-library/react` for component tests

### E2E Tests (Playwright)
- Run: `npm run e2e` or specific suites like `npm run e2e:suite:auth`
- Config: `playwright.config.js`
- Tests: `e2e-tests/` directory
- Suite structure: `e2e-tests/suites/` organized by feature
- Can target environments: `npm run e2e:test`, `npm run e2e:prod`

---

## Code Style

### Formatting (Prettier)
- Single quotes
- Semicolons
- Trailing commas (all)
- 2-space indentation
- 80 char print width

### ESLint
- React hooks rules enabled
- React refresh plugin for HMR
- Ignored: `dist/`, `build/`, `corporate/`, `reppy/`, `passcpa/`, `e2e-tests/`, `functions/`

### Naming Conventions
- Components: PascalCase (`DailyPlanWidget.jsx`)
- Hooks: camelCase with `use` prefix (`useDailyPlan.js`)
- Services: camelCase with `Service` suffix (`coachingService.js`)
- Config files: camelCase (`firebaseConfig.js`)
- Scripts: kebab-case (`cleanup-test-users.cjs`)
- CSS classes: Tailwind utilities, brand colors use kebab-case (`corporate-teal`)

---

## Sub-Applications

The workspace contains several related but independent apps:
- **`corporate/`** — Corporate website (separate Vite + React app)
- **`reppy/`** — Reppy AI Coach (separate PWA with its own Firebase config)
- **`passcpa/`** — PassCPA study app (separate Vite app)

These have their own `package.json` and `vite.config.js`. They are **not** part of the main build.

---

## Environment Variables

All frontend env vars use the `VITE_` prefix (required by Vite):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.
- `VITE_ADMIN_EMAILS` — comma-separated admin email list
- `VITE_GEMINI_API_KEY` — AI API key
- `VITE_ENABLE_DEBUG_MODE` — debug features toggle

Env files: `.env.local` (secrets, gitignored), `.env.dev`, `.env.test`, `.env.prod`

---

## Common Tasks — How To

### Add a new screen
1. Create component in `src/components/screens/NewScreen.jsx`
2. Add lazy import in `src/routing/ScreenRouter.jsx`
3. Add breadcrumb in `src/config/breadcrumbConfig.js` if needed

### Add a new widget
1. Create in `src/components/widgets/NewWidget.jsx`
2. Access data via `useAppServices()` hook
3. Register in zone config if dashboard placement needed

### Add a new service
1. Create in `src/services/newService.js`
2. Instantiate in `src/services/createAppServices.js`
3. Expose via `AppServiceContext`

### Add a Cloud Function
1. Edit `functions/index.js` (CommonJS)
2. Use Gen 2 syntax unless there's a specific reason for Gen 1
3. Deploy with `firebase deploy --only functions` (from correct project)

### Deploy
- Dev: `npm run deploy:dev`
- Test: `npm run deploy:test`
- **Never** use raw `firebase deploy` — always use the scripts

---

## Things to Avoid

- **Do NOT** use TypeScript — this is a JS project
- **Do NOT** use react-router — navigation is state-based
- **Do NOT** create raw Firestore listeners in components — use services
- **Do NOT** use `npm run build` directly — use deploy scripts
- **Do NOT** hardcode Firebase config — use env vars
- **Do NOT** put secrets in `.env` files that get committed
- **Do NOT** mix ESM/CommonJS in the same context (frontend = ESM, functions = CJS)
- **Do NOT** install packages in root for Cloud Functions — use `functions/package.json`
