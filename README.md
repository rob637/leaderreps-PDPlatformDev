# LeaderReps PD Platform: Master Documentation

*This single authoritative document combines the Executive Vision, Technical Architecture, and Priority Roadmap. It serves as the daily reference for building the platform.*

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

### The Program

**Foundation (8 Weeks)** — Intensive skill-building
- 4 live cohort sessions with expert trainers
- CLEAR Feedback Framework mastery
- Leadership Identity development
- Daily practice in "The Arena"

**Ascent (Ongoing)** — Continuous growth
- Unlimited Arena access
- Weekly challenges & fresh content
- Monthly themes & community events

### Daily Practice: The Arena
What makes LeaderReps different:
✅ **10-15 minutes/day** — Fits any schedule
✅ **Daily conditioning** — Builds habits, not just knowledge
✅ **Streak tracking & achievements** — Psychology that drives engagement
✅ **78% completion rate** — vs. industry average of ~20%

### Proven Frameworks
Leaders master:
- **CLEAR Feedback** — Check, Lay out, Explain, Articulate, Request/Reinforce
- **Leadership Identity Statement** — Anchor behavior in who they're becoming
- **Effective 1:1s** — Transform meetings into coaching conversations
- **Vulnerability-Based Trust** — Build psychological safety in teams

### ROI: What You Get
| Metric | Impact |
|--------|--------|
| **Feedback frequency** | 3x increase in constructive feedback given |
| **Team engagement** | Measurable improvement in direct reports |
| **Manager confidence** | 85% report feeling "much more prepared" |
| **Habit formation** | 16-day average streak (vs. 3 days for typical apps) |

### Who It's For
- **Mid-level managers** stepping into leadership
- **High-potential individual contributors** preparing for management
- **Experienced leaders** refreshing their skills
- **Organizations** investing in leadership at scale

### Investment
| Program | What's Included | Duration |
|---------|----------------|----------|
| **Foundation + Ascent** | Full program + ongoing access | 8 weeks + ongoing |
| **Team Cohorts** | Groups of 6-12 from same organization | Custom scheduling |
| **Enterprise** | Custom programs, dedicated trainers | Tailored to needs |

*Contact us for pricing based on your team size and needs.*

### Contact
**Ryan Yeoman** | 📞 614-306-2902 | ✉️ ryan@leaderreps.com
**Jeff Pierce** | 📞 202-460-4537 | ✉️ jeff@leaderreps.com

---

## 🛠️ PART 2: TECHNICAL ARCHITECTURE & GUIDE

A modern, serverless Professional Development Platform built for leadership training.

### Architecture & Tech Stack
The platform is built on a modern, high-performance stack designed for scalability and developer experience:

*   **Frontend Framework**: React 18 with Vite (Fast HMR, optimized builds).
*   **Styling**: Tailwind CSS for utility-first, responsive design.
*   **Backend**: Serverless architecture using Firebase (Auth, Firestore, Hosting).
*   **State Management**: React Context Providers (`DataProvider`, `FeatureProvider`) for clean, global state management without Redux complexity.

### Key Features

#### Dynamic Widget System ("Widget Lab")
A standout feature allowing admins to modify dashboard components at runtime.
*   **FeatureManager**: Controls widget availability and configuration.
*   **WidgetEditor**: Provides a live coding environment where admins can inject logic into a `REAL_SCOPE`, effectively acting as a frontend CMS.

#### Performance
*   **Lazy Loading**: Utilizes `React.lazy` and `Suspense` via `ScreenRouter` to load screens on-demand, keeping the initial bundle size minimal.
*   **Optimized Assets**: Vite-powered build process.

#### Admin Tooling
*   **DevPlanManager**: Comprehensive tool for managing the 26-week development journey.
*   **ContentManager**: Centralized management for readings, videos, and courses.
*   **Sync Capabilities**: Tools to sync local configuration (like LOVs) directly to Firestore.

### Project Structure
The codebase follows a modular, separation-of-concerns pattern:

*   `src/services/`: Encapsulates Firebase logic (e.g., `contentService.js`, `ensureUserDocs.js`), keeping UI components clean.
*   `src/hooks/`: Reusable logic (e.g., `useDevPlan`, `useNavigationHistory`).
*   `src/components/ui/`: Reusable atomic UI components.
*   `src/components/screens/`: Page-level components loaded by the router.
*   `src/components/admin/`: Administrative tools and editors.

### Security
Security is handled via robust **Firestore Rules**:
*   **Role-Based Access**: User data is strictly locked to the owner (`request.auth.uid == userId`).
*   **Admin Privileges**: Controlled via a secure allowlist in `firestore.rules` and database metadata.
*   **Content Protection**: Public content is read-only; user artifacts are private.

### Development Setup

#### Prerequisites
*   Node.js >= 20.x
*   npm

#### Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Deploy to Firebase Hosting
npm run deploy
```

### Recommended Technical Enhancements

#### 🏗️ Architecture & Scalability
1.  **Refactor Widget Configuration (The "God Object" Fix)**
    *   **Recommendation:** Migrating widgets to a subcollection (e.g., `config/features/widgets/{widgetId}`). This allows for infinite scalability and faster initial loads (only load enabled widgets).
2.  **Migrate to TypeScript**
    *   **Benefit:** Given the complex data structures in the **Development Plan** and the **Widget Lab**, TypeScript would prevent entire classes of bugs by enforcing data shapes at compile time.
3.  **Implement Firebase Custom Claims for RBAC**
    *   **Recommendation:** Use Firebase Authentication Custom Claims to tag users as `admin` or `editor`. This removes hardcoded emails from your security rules and is more secure.

#### 🛡️ Reliability & Security
4.  **Production Error Monitoring**: Integrate a tool like **Sentry** or **LogRocket**.
5.  **Widget Versioning & Rollback UI**: Build a "History" tab in the **Widget Editor** to diff and revert changes.

#### ⚡ User Experience & Performance
6.  **Optimistic UI Updates**: Update UI state *immediately* on action, then sync to Firebase.
7.  **Offline-First Support**: Explicitly configure Firestore offline persistence and add "Offline Mode" indicators.

#### 💻 Developer Experience (DevOps)
8.  **CI/CD Pipeline (GitHub Actions)**: Auto-run `npm run lint`, `npm test`, `npm run build` on push.
9.  **Component Documentation (Storybook)**: Document UI components in isolation.
10. **Automated Testing for "Business Logic"**: Expand `vitest` coverage specifically for the `useDevPlan` hook and `DevPlanManager` logic.

---

## 🗺️ PART 3: PRIORITY ROADMAP & TASKS

*Generated: January 20, 2026*

### Mission Alignment
**Goal:** Instill habits that make people exceptional leaders through deliberate practice, accountability, and measurable growth.

### Current Software Stack (Potential Replacements)
| Software | Purpose | Monthly Cost Est. | Replace Priority |
|----------|---------|-------------------|------------------|
| Sales Navigator | Lead prospecting, company research | $100-150/user | Medium |
| LinkedIn Helper | Automated outreach, connection requests | $15-50/user | High (risky tool) |
| Amplify | Content amplification/social sharing | $50-100 | Medium |
| Calendly | Appointment scheduling | $12-20/user | High (easy win) |

### Priority 1: High-Impact, Production-Ready Features
*These directly support the core mission and user retention*

#### 1.1 🎯 SMART/WOOP Goal Setting Module
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** Medium | **Revenue:** Retention driver
A structured goal-setting tool integrated into the development plan.
- [ ] SMART Goal Wizard (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] WOOP Framework (Wish, Outcome, Obstacle, Plan)
- [ ] Goal tracking dashboard with progress visualization
- [ ] Weekly check-ins tied to Daily Plan
- [ ] AI Coach prompts for goal refinement
- [ ] Goal accountability partners (peer matching)
- [ ] Milestone celebrations and notifications
**Integration Points:**
- Links to Leader Profile strengths/weaknesses
- Feeds into weekly reflection (PM Bookend)
- Progress visible to facilitators

#### 1.2 🤖 AI Leadership Coach
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** High | **Revenue:** Premium feature potential
Personalized AI coaching tied to the development plan.
- [ ] Contextual coaching based on current day/week focus
- [ ] Feedback Coach enhancement (already started)
- [ ] Conversation memory across sessions
- [ ] Coaching style selection (supportive, challenging, Socratic)
- [ ] Scenario practice (difficult conversations, feedback delivery)
- [ ] Leadership book synthesis ("What would [author] say?")
- [ ] Progress insights ("You've grown in X area")

#### 1.3 📅 Built-in Scheduling (Calendly Replacement)
**Impact:** ⭐⭐⭐⭐ | **Effort:** Medium | **Revenue:** Cost savings + feature parity
Replace Calendly with native scheduling for coaching sessions, Leader Circles, and Open Gyms.
- [ ] Facilitator availability management
- [ ] Booking pages for coaching sessions
- [ ] Calendar integration (Google, Outlook)
- [ ] Automated reminders (email + SMS)
- [ ] Rescheduling/cancellation flows
- [ ] Group session booking (Leader Circles)
- [ ] Waitlist management
- [ ] Time zone handling (already have user timezones)

#### 1.4 📊 Leader Analytics Dashboard
**Impact:** ⭐⭐⭐⭐ | **Effort:** Medium | **Revenue:** Enterprise selling point
Comprehensive analytics for leaders and their facilitators.
- [ ] Personal growth metrics over time
- [ ] Habit formation tracking (streak analysis)
- [ ] Assessment score progression
- [ ] Engagement heatmaps
- [ ] Peer comparison (anonymized)
- [ ] Predictive insights ("At risk of disengagement")
- [ ] Exportable reports for HR/L&D teams

### Priority 2: Growth & Lead Generation Features
*These help acquire and convert new customers*

#### 2.1 🎯 Prospect Identification System
**Impact:** ⭐⭐⭐⭐ | **Effort:** High | **Revenue:** Direct pipeline builder
- [ ] Company/contact database integration (Apollo, Clearbit API)
- [ ] Ideal Customer Profile (ICP) scoring
- [ ] LinkedIn profile enrichment
- [ ] Company growth signals (hiring, funding, expansion)
- [ ] Decision-maker identification
- [ ] CRM-style pipeline management
- [ ] Lead scoring based on engagement

#### 2.2 📧 Outreach & Nurture System (LinkedIn Helper Replacement)
**Impact:** ⭐⭐⭐⭐ | **Effort:** High | **Revenue:** Replace risky tool + automate sales
- [ ] Email sequence builder
- [ ] Personalization at scale (AI-generated)
- [ ] Multi-channel campaigns (email + LinkedIn DM)
- [ ] Response tracking and alerts
- [ ] A/B testing for messaging
- [ ] CRM integration
- [ ] Compliance-friendly approach

#### 2.3 🌐 Public Demo/Trial Experience
**Impact:** ⭐⭐⭐⭐ | **Effort:** Medium | **Revenue:** Conversion driver
- [ ] Self-service demo environment
- [ ] Interactive product tour
- [ ] Sample daily plan experience (3-day trial)
- [ ] Lead capture with progressive profiling
- [ ] Automated follow-up sequences
- [ ] Demo analytics (what features get attention)

#### 2.4 📢 Content Amplification (Amplify Replacement)
**Impact:** ⭐⭐⭐ | **Effort:** Medium | **Revenue:** Brand awareness
- [ ] Social post scheduler
- [ ] Employee advocacy program
- [ ] Content library for sharing
- [ ] Engagement tracking
- [ ] LinkedIn article publishing
- [ ] Thought leadership calendar

#### 2.5 🛡️ Email Deliverability & Reputation Command Center
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** Medium | **Revenue:** Critical Asset Protection
*Prevent emails from going to spam by monitoring meaningful metrics.*
- [ ] **Google Postmaster Integration**: Track domain reputation and spam rates.
- [ ] **Technical Config Tester**: Validate SPF, DKIM, and DMARC settings anytime.
- [ ] **Inbox Placement Tester**: Send "test" emails to seed accounts to verify inbox/spam folder placement.
- [ ] **Content Spam Scorer**: Analyze email copy for "spammy" words before sending.
- [ ] **Blacklist Monitor**: Alert if domain IPs appear on major blacklists.
- [ ] **Warm-up Helper**: Automated ramping schedules for new sending domains.

### Priority 3: Vendor/Partner Management
*B2B relationship management for enterprise sales*

#### 3.1 🏢 Vendor Control Center
**Impact:** ⭐⭐⭐ | **Effort:** Medium | **Revenue:** Enterprise enablement
- [ ] Vendor/client organization profiles
- [ ] Contact management within organizations
- [ ] Relationship health scoring
- [ ] Activity timeline (meetings, emails, notes)
- [ ] Contract/renewal tracking
- [ ] Custom content delivery per vendor
- [ ] White-label options
- [ ] Usage analytics per organization

#### 3.2 🎥 Demo Management System
**Impact:** ⭐⭐⭐ | **Effort:** Low-Medium | **Revenue:** Sales efficiency
- [ ] Demo request intake form
- [ ] Demo scheduling (ties to Priority 1.3)
- [ ] Demo environment provisioning
- [ ] Follow-up automation
- [ ] Demo outcome tracking
- [ ] Proposal/quote generation

#### 3.3 📚 Vendor-Specific Content Delivery
**Impact:** ⭐⭐⭐ | **Effort:** Medium | **Revenue:** Enterprise customization
- [ ] Custom content libraries per organization
- [ ] Branded experience options
- [ ] Organization-specific daily plans
- [ ] Private cohorts
- [ ] Custom assessments

### Priority 4: Engagement & Retention Boosters
*Keep users coming back and forming habits*

#### 4.1 🏆 Gamification Enhancement
**Impact:** ⭐⭐⭐⭐ | **Effort:** Low-Medium | **Revenue:** Retention
- [ ] Achievement badges (already started)
- [ ] Leaderboards (opt-in)
- [ ] Weekly challenges
- [ ] Team competitions
- [ ] Milestone rewards
- [ ] Public recognition in Leader Circles

#### 4.2 👥 Peer Accountability Partners
**Impact:** ⭐⭐⭐⭐ | **Effort:** Medium | **Revenue:** Retention + community
- [ ] Partner matching algorithm
- [ ] Shared goal visibility
- [ ] Check-in prompts
- [ ] Partner chat/messaging
- [ ] Accountability streaks

#### 4.3 📱 Mobile App (PWA Enhancement)
**Impact:** ⭐⭐⭐⭐ | **Effort:** Medium | **Revenue:** Accessibility
- [ ] Offline support for daily activities
- [ ] Push notification improvements
- [ ] Quick-capture for reflections
- [ ] Widget for home screen
- [ ] Apple Watch / Wear OS companion

### Implementation Plan

**Phase 1: Foundation (Next 4 weeks)**
1. **SMART/WOOP Goal Setting** - Core to habit formation
2. **AI Leadership Coach Enhancement** - Differentiation
3. **Leader Analytics Dashboard** - Value demonstration

**Phase 2: Growth Engine (Weeks 5-8)**
4. **Built-in Scheduling** - Cost savings, better UX
5. **Public Demo Experience** - Lead conversion
6. **Prospect Database** - Pipeline building

**Phase 3: Scale (Weeks 9-12)**
7. **Vendor Control Center** - Enterprise readiness
8. **Outreach System** - Replace LinkedIn Helper
9. **Peer Accountability** - Retention boost

**Phase 4: Polish (Weeks 13+)**
10. **Content Amplification** - Brand building
11. **Integration Hub** - Enterprise requirements
12. **Mobile App Enhancement** - Accessibility

### Quick Wins (This Week)
1. **Add Goal Setting fields to Leader Profile** - Simple form additions
2. **Enhance AI Feedback Coach prompts** - Copy/prompt updates
3. **Create demo request landing page** - Marketing asset
4. **Add "Share to LinkedIn" buttons** - Organic amplification
5. **Implement accountability partner matching** - Algorithm + UI

### Success Metrics
*   **Habit Formation**: DAU, Streak maintenance, Goal completion.
*   **Business Growth**: Demo requests, Conversions, CAC, NRR.
*   **Engagement**: Time in app, Feature adoption, NPS, Churn.

