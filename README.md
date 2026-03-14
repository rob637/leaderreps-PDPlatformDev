# LeaderReps PD Platform: Master Documentation

*This single authoritative document combines the Executive Vision, Technical Architecture, and Developer Guidelines. It serves as the daily reference for building the platform.*

---

## 🏗️ PART 1: EXECUTIVE SUMMARY & VISION

### The Problem
**70% of leadership training fails to create lasting behavior change.**
Traditional workshops create a "knowledge bump" that fades within weeks. Leaders return to old habits, organizations see no ROI, and the cycle repeats. **Your managers need daily practice, not occasional events.**

### The Solution: LeaderReps
A **complete leadership development ecosystem** combining:

| Pillar | What It Is | Why It Works |
|--------|-----------|--------------|
| **Community** | Cohort of 12 leaders growing together | Peer accountability + shared learning |
| **Content** | 95+ curated videos, tools & templates | Right content, right time, right format |
| **Coaching** | Expert trainers + personalized 1:1s | Guidance tailored to each leader |

### The Program Phases

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

### Daily Practice: The Arena & Workflow
The platform is built around a structured, time-based daily workflow:
- **AM Session:** Morning check-in, daily plan review, grounding rep.
- **Daily Practice:** Content consumption, skill practice, applied leadership.
- **PM Session:** Reflection, win logging, conditioning check.

---

## 🛠️ PART 2: TECHNICAL ARCHITECTURE

A modern, serverless Professional Development Platform (PWA) built for cohort-based leadership programs.

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (JSX, **no TypeScript**) |
| **Build** | Vite 5 |
| **Styling** | Tailwind CSS 3 + Lucide React + Framer Motion |
| **Backend & Auth** | Firebase (Firestore, Auth, Storage, Hosting) |
| **Cloud Functions** | Firebase Functions (Gen 1 & 2), CommonJS Node.js |
| **AI Integrations** | Google Gemini API + Anthropic Claude (via Cloud proxy) |
| **Testing system** | Vitest (unit) + Playwright (e2e) |
| **Architecture** | Progressive Web App via `vite-plugin-pwa` + Workbox |

### Core Architectural Patterns

#### 1. File Structure
* **`src/components/`**: Divided by domain (e.g., `screens`, `widgets`, `layout`, `conditioning`, `admin`).
* **`src/services/`**: Encapsulates all Firebase interactions and business logic (e.g., `coachingService.js`). Raw Firestore listeners should not be built in components.
* **`src/providers/`**: The app uses a deeply nested React context tree initialized in `App.jsx` (ThemeProvider -> TimeProvider -> DataProvider -> NavigationProvider). DataProvider is the central nervous system.
* **`functions/`**: CommonJS Firebase Cloud functions responsible for strict scoring logic (like AI representation assessments) and server-side scheduling.

#### 2. Navigation & State
* **No `react-router`:** Navigation is purely state-based via `navigate('screen-key')`. All screens are lazy-loaded through `src/routing/ScreenRouter.jsx`.
* **State Management:** Fully relies on grouped React Context providers (`DataProvider`, `AccessControlProvider`, `TimeProvider`) rather than complex global stores like Redux. 

#### 3. Security & Access
* Roles and day-based access overrides are driven by rigid **Firestore rules**.
* Hardened data architecture ensures users can only access their sandbox, while global settings are managed exclusively by administrative roles configured in `.env` variables (`VITE_ADMIN_EMAILS`).

---

## 🚀 PART 3: DEVELOPMENT & OPERATIONS

### Environment Separation (CRITICAL)
We maintain rigorous environment separation to prevent data pollution between environments.

- **Dev:** `leaderreps-pd-platform` (default sandbox)
- **Test:** `leaderreps-test` (QA environment)
- **Prod:** `leaderreps-prod` (Live database)

⚠️ **NEVER run `npm run build` or `npm run deploy` directly!**
Always use the specialized deployment scripts which include strict environment validation.

### Deployment Commands

```bash
# Start local development server
npm run dev

# Deploy to Dev Environment
npm run deploy:dev

# Deploy to Test Environment
npm run deploy:test
```

*(These map to our specialized deployment pipeline via `scripts/deploy.sh`)*

### Sub-Applications
The main repository also hosts three peripheral sub-applications configured with independent build processes:
*   **`corporate/`** — Corporate website (React + Vite).
*   **`reppy/`** — Reppy AI Coach (Standalone PWA).
*   **`passcpa/`** — PassCPA study tool (React + Vite).

### Important Developer Conventions
1. **Plain JavaScript Only:** Do not introduce TypeScript files or types.
2. **Naming Conventions:**
   * Components: PascalCase (`DailyPlanWidget.jsx`)
   * Hooks: camelCase (`useDailyPlan.js`)
   * Scripts: kebab-case (`patch-data.cjs`)
3. **Tailwind Centric:** Keep inline styles to an absolute minimum. Use utility classes and brand extensions (e.g., `corporate-navy`, `shadow-card`).
4. **Widget Paradigm:** Any dashboard components must be integrated via `src/components/widgets/` and structured as independently data-fetching blocks. 

---

### Contact Info
**Ryan Yeoman** | 📞 614-306-2902 | ✉️ ryan@leaderreps.com
**Jeff Pierce** | 📞 202-460-4537 | ✉️ jeff@leaderreps.com
