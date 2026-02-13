# Team Sales Hub — Strategic Plan

## Status: Phase 1 MVP Complete ✅

The Team Sales Hub has been scaffolded and the CRM core is built:
- **App URL (dev):** http://localhost:5175
- **Deployment target:** `leaderreps-team.web.app` (Firebase hosting configured)

---

## Executive Summary

This document outlines the strategy for creating a **Team Sales Hub** — a simplified, focused CRM and Sales Navigation tool for the LeaderReps team, while preserving the full "Corporate Command Center" for Rob's exclusive use.

---

## Current State Analysis

### Corporate Command Center (leaderrepscorp.web.app)
- **Scope:** 20+ modules across 6 categories (Sales, Marketing, Ops, Product, Coaching, Analytics)
- **Complexity:** Enterprise-grade with Apollo API integration, AI email personalization, Kanban pipelines, multi-step sequences, proposal builders, PDF generation
- **Value:** Replaces ~$320/mo ($3,840/yr) in SaaS tools
- **Tech Stack:** React, Vite, Tailwind, Firebase (Firestore), React Router
- **Auth:** Domain-restricted (leaderreps.com, sagecg.com)

### Key Assets in Current System

| Module | Lines of Code | Complexity | Team Relevance |
|--------|--------------|------------|----------------|
| Prospects.jsx | 2,648 | Very High | ✅ Core for CRM |
| Outreach.jsx | 2,080 | Very High | ✅ Core for Sales Nav |
| DemoManager.jsx | ~800 | Medium | ⚠️ Useful but optional |
| ProposalBuilder.jsx | ~600 | Medium | ⚠️ Rob-only for now |
| ExecutiveDashboard.jsx | ~400 | Medium | ✅ Slimmed version |
| SequenceManager.jsx | ~500 | Medium | ✅ Simplified version |

---

## Recommendation: Hybrid Approach 🏆

**Build a new "Team Sales Hub" as a separate app that:**
1. Shares the **same Firebase backend/data** as Corporate Command Center
2. Has a **fresh, simplified UI** designed for daily sales workflows
3. Leverages **core business logic** extracted into shared services
4. Uses **modern patterns** inspired by best-in-breed tools

### Why Hybrid Over Pure Extract or Pure Rebuild?

| Approach | Pros | Cons |
|----------|------|------|
| **Extract from existing** | Fast, existing code | Inherits complexity, harder to simplify |
| **Build from scratch** | Clean, modern | Throw away working code, data sync issues |
| **Hybrid (Recommended)** | Best of both, shared data, fresh UX | Requires service extraction |

---

## Best-in-Breed Inspiration

### CRM Features (Inspired by: Attio, Folk, Close, Pipedrive)

| Feature | Source Inspiration | Implementation Priority |
|---------|-------------------|------------------------|
| **Unified Contact View** | Attio's object-based records | P0 - Core |
| **Smart Lists / Filters** | Folk's flexible views | P0 - Core |
| **Activity Timeline** | Close's interaction history | P0 - Core |
| **Pipeline Kanban** | Pipedrive's visual flow | P0 - Core |
| **Quick Actions** | Folk's keyboard shortcuts | P1 - Important |
| **AI Contact Enrichment** | Apollo, Clay | P2 - Nice to have |
| **Email Sync** | Close, HubSpot | P2 - Phase 2 |

### Sales Navigation Features (Inspired by: Apollo, ZoomInfo, LinkedIn Sales Nav)

| Feature | Source Inspiration | Implementation Priority |
|---------|-------------------|------------------------|
| **Prospect Search** | Apollo's multi-filter search | P0 - Core |
| **Company Intelligence** | ZoomInfo company profiles | P1 - Important |
| **Outreach Queue** | Apollo's sequence engine | P0 - Core |
| **Email Templates** | Outreach.io | P0 - Core |
| **Activity Tracking** | Sales Nav's "Who Viewed" | P1 - Important |
| **Lead Scoring** | HubSpot, Salesforce | P2 - Phase 2 |

### Modern UX Patterns (Inspired by: Linear, Notion, Superhuman)

| Pattern | Source | Why It Matters |
|---------|--------|----------------|
| **Command Palette (⌘K)** | Linear, Raycast | Power user efficiency |
| **Keyboard-First Nav** | Superhuman | Speed for daily use |
| **Clean, Focused Views** | Linear | Reduce cognitive load |
| **Inline Editing** | Notion | Fewer modals, faster updates |
| **Real-time Sync** | Notion, Linear | Team collaboration |
| **Dark Mode** | Universal | User preference |

---

## Architecture Plan

### Option A: Separate Vite App (Recommended)
```
/leaderreps-PDPlatformDev
├── corporate/          # Full Command Center (Rob only)
├── team-sales/         # NEW: Team Sales Hub
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── hooks/
│   │   └── shared/     # Symlink or copy from corporate
│   └── package.json
├── shared/             # NEW: Extracted business logic
│   ├── services/       # Firestore operations
│   ├── schemas/        # Data models
│   └── utils/          # Common utilities
```

### Option B: Integrated Mono-App (Alternative)
```
/corporate
├── src/
│   ├── apps/
│   │   ├── command/    # Full Command Center
│   │   └── team/       # Team Sales Hub
│   ├── shared/         # Common code
```

**Recommendation:** Option A — cleaner separation, independent deployments, easier to maintain access control.

---

## Data Model (Shared)

Both apps will use the same Firestore collections:

```
corporate_prospects/        # CRM contacts/leads
  ├── id
  ├── name, email, phone, linkedin
  ├── company, title, industry
  ├── stage (pipeline position)
  ├── owner (team member assigned)
  ├── source, tags, notes
  ├── lastContactedAt
  └── activities[]          # Interaction history

corporate_outreach_tasks/   # Outreach queue items
  ├── prospectId
  ├── type (email, call, linkedin)
  ├── scheduledDate
  ├── status (pending, completed, skipped)
  ├── owner
  └── templateUsed

corporate_sequences/        # Campaign templates
corporate_demo_links/       # Demo tracking
corporate_proposals/        # ROI proposals
corporate_activities/       # Call/meeting logs
```

---

## Team Sales Hub — Feature Specification

### Core Views (MVP - 4 Weeks)

#### 1. Dashboard
- **Today's Focus:** Tasks due today, hot leads, recent activity
- **Pipeline Summary:** Visual funnel with counts
- **Team Activity Feed:** Who did what (if multi-user)
- **Quick Actions:** Add prospect, log call, send email

#### 2. CRM (Prospects)
- **List View:** Sortable, filterable table with inline editing
- **Kanban View:** Drag-and-drop pipeline stages
- **Detail Panel:** Slide-out with full contact info, timeline, notes
- **Smart Filters:** By owner, stage, last contacted, tags
- **Bulk Actions:** Mass stage update, bulk email, bulk assign

#### 3. Sales Navigation (Search)
- **Prospect Finder:** Multi-criteria search (title, company, location, industry)
- **Apollo Integration:** Optional API-powered enrichment
- **Save to CRM:** One-click add from search results
- **Saved Searches:** Store common search criteria

#### 4. Outreach Center
- **Daily Queue:** Prioritized list of outreach tasks
- **Email Composer:** Templates with merge fields
- **LinkedIn Helper:** Action reminders (connect, message)
- **Call Scripts:** Integrated talk tracks
- **Complete/Skip/Snooze:** Action buttons

#### 5. Activity Log
- **Timeline View:** All interactions per prospect
- **Log New:** Quick entry for calls, meetings, notes
- **Outcomes:** Track results (meeting booked, no answer, etc.)

### Enhanced Features (Phase 2 - +4 Weeks)

- **AI Email Writer:** Gemini-powered personalization
- **Lead Scoring:** Priority indicators based on engagement
- **Calendar Sync:** See availability when scheduling
- **Email Tracking:** Open/click tracking (requires email infra)
- **Mobile PWA:** Native-feeling mobile experience
- **Team Analytics:** Individual and team performance metrics

---

## Access Control Strategy

### Corporate Command Center (Full Version)
```javascript
// In AuthContext.jsx
const ADMIN_USERS = ['rob@leaderreps.com'];

// Full access check
const hasFullAccess = ADMIN_USERS.includes(user?.email);
```

### Team Sales Hub (Simplified Version)
```javascript
// Separate app with team-level auth
const TEAM_USERS = [
  'ryan@leaderreps.com',
  'jeff@leaderreps.com',
  'cristina@leaderreps.com',
  // Rob also has access
  'rob@leaderreps.com'
];
```

---

## Tech Stack for Team Sales Hub

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | React 18 + Vite | Match main platform |
| **Styling** | Tailwind CSS 3 | Consistent design system |
| **State** | Zustand or Jotai | Simpler than Redux for this scope |
| **Data** | Firebase Firestore | Shared with Command Center |
| **Auth** | Firebase Auth | Existing infra |
| **Icons** | Lucide React | Already in use |
| **Tables** | TanStack Table | Best-in-class for data grids |
| **DnD** | @dnd-kit | Kanban drag-and-drop |
| **Forms** | React Hook Form | Clean form handling |
| **Commands** | cmdk (⌘K) | Linear-style command palette |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Scaffold `team-sales/` Vite app
- [ ] Set up Firebase connection (shared project)
- [ ] Implement auth with team user list
- [ ] Create shared Firestore service layer
- [ ] Build basic Layout with navigation
- [ ] Implement ⌘K command palette

### Phase 2: CRM Core (Week 3-4)
- [ ] Prospect list with TanStack Table
- [ ] Inline editing support
- [ ] Detail slide-over panel
- [ ] Pipeline Kanban view
- [ ] Smart filters (owner, stage, date)
- [ ] Activity timeline per contact

### Phase 3: Outreach (Week 5-6)
- [ ] Daily task queue
- [ ] Email composer with templates
- [ ] Complete/Skip/Snooze actions
- [ ] Call logging
- [ ] LinkedIn action tracking

### Phase 4: Search & Polish (Week 7-8)
- [ ] Prospect search interface
- [ ] Apollo API integration (optional)
- [ ] Dashboard with metrics
- [ ] Mobile responsive design
- [ ] PWA manifest
- [ ] User onboarding flow

### Phase 5: Enhancement (Week 9+)
- [ ] AI email personalization
- [ ] Lead scoring
- [ ] Team analytics
- [ ] Email tracking

---

## Decision Points for You

Before starting, please confirm:

1. **Separate App vs. Integrated?**
   - A) New `/team-sales/` folder (recommended)
   - B) New route group in `/corporate/`

2. **Hosting Strategy?**
   - A) `team.leaderrepscorp.web.app` (subdomain)
   - B) `leaderreps-team.web.app` (new site)
   - C) Same domain, different route (`/team/`)

3. **Team Access Control?**
   - A) Hardcoded email list (simple)
   - B) Firestore role document (flexible)
   - C) Firebase custom claims (robust)

4. **MVP Priority?**
   - A) CRM-first (contacts, pipeline)
   - B) Outreach-first (daily tasks, email)
   - C) Full MVP as specified above

5. **Timeline?**
   - A) Fast track (4 weeks) — Core features only
   - B) Standard (8 weeks) — Full MVP
   - C) Phased releases — Ship incrementally

---

## Summary

**Recommendation:** Build a **new Team Sales Hub** as a separate Vite app that:

1. **Shares data** with Corporate Command Center via Firestore
2. **Has a fresh, focused UI** inspired by Linear/Notion/Close
3. **Targets daily sales workflows** — not executive dashboards
4. **Uses modern patterns**: ⌘K commands, keyboard nav, inline editing
5. **Deploys independently** to a team-specific subdomain

This approach gives you:
- ✅ Full Command Center preserved for power use
- ✅ Simple, team-friendly sales tool
- ✅ Single source of truth (shared Firestore)
- ✅ Modern, best-in-breed UX
- ✅ Clean codebase without legacy complexity

**Next Step:** Confirm the decision points above, and I'll scaffold the new app with the core architecture.
