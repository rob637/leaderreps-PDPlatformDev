# LeaderReps Ascent — Viral & Community Growth Spec Sheet

**Prepared for:** Rob Pfleghardt & Ryan Yeoman
**Date:** May 21, 2026
**Purpose:** Detailed specifications for three high-leverage growth combinations (A, B, C) — designed for build planning, scoping, and pitch discussion.

---

## Executive Summary

| Combo | Theme | Primary Growth Loop | Time-to-Value | Build Effort |
|---|---|---|---|---|
| **A** | B2B Land-and-Expand | Manager → Team → Org | 60–90 days | Medium-High |
| **B** | Content Flywheel ("Strava for Leaders") | Member → LinkedIn → New Member | 30–45 days | Low-Medium |
| **C** | Community Identity & Retention | Cohort → Pod → Chapter → Summit | 90–180 days | Medium (Ops-heavy) |

**Recommendation:** Run B first (fastest signal, lowest cost), A second (highest LTV), C in parallel as long-game retention play.

---

# COMBO A — Manager Multiplier + Team Dashboard + Slack/Teams Integration

> *"The Slack/Notion/Dropbox B2B playbook applied to leadership development."*

## Strategic Thesis
Most leadership platforms sell top-down to L&D. We flip it: a single manager experiences value, invites their direct reports, and the manager dashboard creates a compelling reason for HR/L&D to formalize and pay for the whole org. The platform becomes infrastructure, not a course.

## The Three Components

### A1. Manager Multiplier (Referral Mechanic)
**What it is:** When a paying leader invites direct reports, both sides get unlocked benefits.

**Mechanics:**
- Manager invites N direct reports via email/Slack handle
- Each accepted invite grants:
  - Manager: +30 min/month Rep AI Coach time, +1 human coaching session per quarter
  - Report: 14-day free full-access trial, then 25% off first program
- Cap: 8 invites/manager to prevent spam
- Tracked via `referrals` collection with status (sent / accepted / converted)

**Success metric:** Avg invites sent per active manager; invite-to-conversion %.

### A2. Team Dashboard (Manager View)
**What it is:** Privacy-respecting analytics dashboard a manager sees once 3+ of their reports are enrolled.

**Privacy model (critical):**
- Reports opt-in during onboarding to share with manager
- Manager sees: aggregate completion %, skills being practiced, themes from wins (NOT individual content)
- Reports see exactly what manager sees ("Your manager can view: …")
- Any individual data requires explicit per-item share by the report

**Dashboard sections:**
- **Team Pulse** — % active this week, avg streak length
- **Skills in Development** — Top 5 skills the team is practicing
- **Win Themes** — Anonymized topic clusters from win logs (e.g., "Hard Conversations: 12 wins this month")
- **Coaching Activity** — Sessions completed (counts only)
- **Suggested 1:1 Topics** — Auto-generated talking points the manager can use

**Unlock trigger:** 3 reports enrolled with sharing on.

### A3. Slack / MS Teams Integration
**What it is:** Daily and weekly touchpoints inside the team's existing chat tool.

**Bot capabilities:**
- **AM Nudge (opt-in):** "Good morning. Your daily rep is ready — 8 min."
- **Win Share:** Slash command `/leaderreps win` opens a modal; posts to a chosen channel as a styled card (with consent settings)
- **Weekly Team Digest:** Posted to manager only — summary of team's week
- **1:1 Prep Card:** Before scheduled 1:1s (via calendar integration), a card appears with suggested topics
- **Cohort Channel:** Auto-provisioned private channel for cohort members in their company

## Data Model Additions

```
companies/{companyId}
  - name, domain, plan, seats, billingContact
  - adminUserIds: []
  - integrations: { slack: {teamId, botToken}, teams: {...} }

memberships/{userId}
  - companyId
  - managerId (userId or external email)
  - directReportIds: []
  - sharingConsent: { manager: bool, teamDashboard: bool, slack: bool }

referrals/{referralId}
  - fromUserId, toEmail, type ('manager-multiplier' | 'team-seat' | 'peer')
  - status, sentAt, acceptedAt, convertedAt
  - rewardGranted: bool

teamDashboardSnapshots/{managerId}/{yyyy-mm-dd}
  - aggregateMetrics: {...}
  - winThemes: [{theme, count}]
  - generatedAt
```

## Cloud Functions Needed
- `processReferralAcceptance` — grants rewards, emails both parties
- `generateTeamDashboard` — daily aggregation respecting consent
- `slackEventHandler` — Gen 2 HTTPS, OAuth + event subscriptions
- `slackDailyNudge` — scheduled per-user based on timezone
- `extractWinThemes` — AI clustering of win-log entries (Gemini)

## UI Surfaces to Build
- New screen: `manager-dashboard` (registered in `ScreenRouter.jsx`)
- New widget: `TeamPulseWidget` for the home dashboard
- New onboarding step: "Connect your manager" (optional)
- Settings panel: Privacy & Sharing Controls
- New admin screen: Company management (for L&D buyers)

## Pricing & Packaging Hooks
- **Team Plan** introduced: $X/seat with 5-seat minimum, unlocks dashboard
- **Slack integration** is paid-only (or 3-seat-minimum gated)
- **Enterprise Plan** adds SSO, custom cohorts, dedicated coach allocation

## Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Reports feel surveilled | Hard opt-in, transparent "your manager sees X" UI on every page |
| Manager spam invites | 8-invite cap, throttling, unsubscribe in invite emails |
| Slack token security | Store in Secret Manager, scope minimally, rotate quarterly |
| Win-theme clustering reveals identities (small teams) | Suppress themes with count < 3, suppress dashboard if team < 3 |

## Success Metrics (90-day targets)
- 40% of paying users invite ≥1 direct report
- 25% invite acceptance rate
- 15% of inviters convert to Team Plan within 90 days
- Slack-connected users have 2x weekly active rate vs. non-connected

---

# COMBO B — Shareable Win Cards + Leadership Wrapped + LinkedIn Badges

> *"Strava for leaders — every active user is a billboard."*

## Strategic Thesis
Leadership growth is invisible — that's why it's hard to market. We make growth visible, beautiful, and shareable on the one platform our buyers live on (LinkedIn). Every shared artifact is both a user identity statement AND a top-of-funnel ad. Zero paid acquisition required.

## The Three Components

### B1. Shareable Win Cards
**What it is:** When a leader logs a PM win, they can generate a polished, branded image to post on LinkedIn / Slack / text.

**Card formats (user picks):**
- **Win Card** — "Day 34 of my leadership reps. Today I had the hard conversation I'd been avoiding for 3 weeks."
- **Insight Card** — quote pulled from their reflection
- **Streak Card** — "30-day rep streak unlocked"
- **Skill Card** — "Practicing: Coaching for Performance — Week 2"

**Design system:**
- Generated server-side via Cloud Function (`@vercel/og` or `satori` style)
- Brand consistent (Nunito Sans, corporate-navy / teal / orange)
- Subtle wordmark — not aggressive
- Optional pseudonym mode (first name + last initial)
- Square (IG/LinkedIn feed) and 9:16 (Stories) variants

**Flow:**
1. User logs win in PM session
2. "Share this win" CTA appears
3. Card preview → edit text → choose template → download or one-click share
4. UTM-tagged link auto-included: `leaderreps.com/r/{shortId}`

### B2. Leadership Wrapped (Annual)
**What it is:** Spotify-Wrapped-style year-in-review released the first week of January.

**Story slides (auto-generated per user):**
1. "You completed **187 leadership reps** in 2026."
2. "Your top skill: **Difficult Conversations** — 34 reps."
3. "Your biggest win month: **March** — 22 wins logged."
4. "Your longest streak: **47 days**."
5. "Your most-used principle from the RR Rubric: **[X]**."
6. "Words you used most when reflecting: [word cloud]."
7. "You're in the **top 12%** of leaders by consistency."
8. "Coaches you worked with: [avatars]."
9. "Pods you supported: [names]."
10. "Share your 2026 wrapped" — Big share CTA.

**Tech:**
- Pre-computed Dec 28 via batch Cloud Function
- Stored in `wrapped/{year}/{userId}`
- New screen `leadership-wrapped` with Framer Motion swipe-through
- Each slide exportable as image

**Distribution play:** Email blast to all alumni Dec 28 — "Your 2026 Leadership Wrapped is ready." Reactivation engine.

### B3. LinkedIn-Verified Badges
**What it is:** Real, verifiable credentials issued to LinkedIn via the LinkedIn Certifications API.

**Badge ladder:**
- **30-Day Rep Streak** (consistency)
- **First Program Completion** (milestone)
- **Skill Mastery** — per skill in the RR Rubric (specificity)
- **Pod Leader** (community contribution)
- **Coach-Certified** (assessment-based)
- **Founding Member** (cohort < 1,000) — permanent identity badge

**Why this works:** Recruiters and execs search LinkedIn for "leadership-certified" candidates. Our badge becomes a searchable credential. Members WANT to display them.

**Tech:**
- Issue via LinkedIn Add-to-Profile API
- Backing credential page at `leaderreps.com/credentials/{credentialId}` (public)
- Stored in `credentials/{credentialId}` collection
- Verification endpoint (Cloud Function) for third parties

## Data Model Additions

```
shareCards/{cardId}
  - userId, type, content, imageUrl, createdAt
  - shareCount: int, lastSharedAt
  - shortLink

wrapped/{year}/{userId}
  - stats: {...}
  - slides: [...]
  - generatedAt
  - sharedSlides: []

credentials/{credentialId}
  - userId, type, awardedAt, verificationCode
  - linkedinAdded: bool, linkedinUrl
  - public: bool

shortLinks/{shortId}
  - longUrl, userId (referrer), createdAt
  - clicks: int, signups: int
```

## Cloud Functions Needed
- `generateShareCard` — HTTPS Gen 2, returns PNG via @vercel/og-style renderer
- `generateLeadershipWrapped` — Scheduled, batch user processing
- `issueLinkedInCredential` — issues to LinkedIn API on milestone
- `trackShortLink` — redirect + click attribution
- `attributeSignupToReferrer` — on signup, credit referring share

## UI Surfaces to Build
- New widget: `WinShareCardWidget` (appears after PM win logging)
- New screen: `leadership-wrapped`
- New screen: `my-credentials` (display badges + share to LinkedIn)
- New component: `ShareCardPreview` modal
- Public route (new public app or static SSG): credential verification pages

## Viral Math (target)
- 100 active leaders × 30% post a win card monthly × 500 avg LinkedIn impressions = **15,000 monthly brand impressions** from zero ad spend
- Conservative 0.5% click-to-trial = 75 trials/month organic
- 20% trial-to-paid = 15 paid conversions/month from viral loop alone

## Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Cards look "templated" / spammy | Hire designer for templates, allow heavy customization, no required watermark |
| LinkedIn API approval lag | Start with shareable image badges + dedicated credential page; LinkedIn integration as Phase 2 |
| Wrapped feels generic | Include qualitative AI-written insight slide using their actual reflections |
| Privacy — sharing reflections | Default OFF for any reflection content; explicit per-card consent |

## Success Metrics (60-day targets)
- 35% of active users generate ≥1 share card/month
- 8% share rate (downloaded card → actually posted)
- 1,000 credential verification page views/month
- 5% of new signups attributed to viral short links

---

# COMBO C — Pods of 5 + Alumni Chapters + Annual Summit

> *"CrossFit-style identity & retention — turn customers into evangelists."*

## Strategic Thesis
Software churns. Identity doesn't. CrossFit's moat isn't workouts; it's that members say "I'm a CrossFitter." We need leaders to say "I'm a LeaderReps leader." That requires small-group intimacy (pods), local belonging (chapters), and an annual ritual (summit). This is the longest payback but the deepest moat.

## The Three Components

### C1. Pods of 5
**What it is:** Within every cohort, automatically form pods of 5 leaders who stay together through the program — and ideally for life.

**Formation algorithm:**
- Match on: timezone (±2hrs), experience level, industry diversity (optional), goal alignment
- Avoid: same-company pairings (default off, opt-in for intra-company)
- Pod confirmed by Day 3 of cohort

**Pod rituals (built into the product):**
- **Pod Intro Call** (Day 3) — 30 min, guided agenda in-app
- **Weekly Pod Sync** — 30 min, async or live, structured prompts
- **Pod Wins Channel** — private feed visible only to pod
- **Pod Streak** — collective streak metric (gamification)
- **Pod Graduation Ceremony** — at week 8, structured retrospective

**Post-program:**
- Pods can opt into "Lifetime Pod" status
- Quarterly auto-prompted check-ins
- Pod-only access to certain alumni events

**Tech:**
- New collection: `pods/{podId}` with members, cohortId, rituals[], status
- New screen: `pod-home`
- Async messaging within pod (Firestore-backed simple chat)
- Calendar integration for sync scheduling

### C2. Alumni Chapters (City-Based)
**What it is:** Local, member-run chapters in major cities. The CrossFit "box" model — but ad-hoc and lightweight.

**Chapter playbook (we provide):**
- Chapter starter kit: agenda templates, marketing graphics, venue checklist, conversation guides
- Minimum: 5 alumni in a metro to charter a chapter
- Chapter lead role (1-2 alumni); revenue share if they recruit new members
- Quarterly meetup format: 90 min, structured (15 min wins / 30 min case study / 30 min skill / 15 min social)

**Platform support:**
- Chapter directory in-app
- Event creation tool with RSVP
- Chapter lead dashboard
- Stipend/budget per chapter ($200/quarter for venue/snacks)

**Tech:**
- `chapters/{chapterId}` — name, city, leadUserIds, memberCount, nextEvent
- `chapterEvents/{eventId}` — date, agenda, RSVPs, recap
- New screen: `chapters` and `chapter-detail`
- Email automation for chapter event reminders

### C3. Annual Summit
**What it is:** One physical, multi-day event per year that becomes THE ritual of the community.

**Format (Year 1 — keep small):**
- 200 attendees, 2 days
- Mix of: keynotes (Rob, Ryan, outside speakers), workshops, pod reunions, chapter meetups, awards
- Pricing: $799 alumni / $1,299 non-alumni — drives reactivation
- Optional: pre-summit pod meetups, post-summit retreats

**Why this matters:**
- Creates an annual reason to stay engaged year-round ("I'll see them at Summit")
- Generates content (talks, sessions) that fuel marketing for 6+ months
- Press, sponsors, and partnership opportunities
- Awards ceremony — "Leader of the Year," "Chapter of the Year," "Pod of the Year" — recognition deepens identity

**Platform integration:**
- Summit hub screen with agenda, attendees, networking
- Pre-event matchmaking ("3 leaders you should meet at Summit")
- Post-event content vault (talks, frameworks) — alumni-only access
- Year-round countdown widget

## Data Model Additions

```
pods/{podId}
  - cohortId, memberUserIds, formedAt, status ('active' | 'lifetime' | 'dissolved')
  - rituals: [{type, scheduledAt, completedAt}]
  - podStreak: int

podMessages/{podId}/{messageId}
  - userId, text, createdAt, reactions

chapters/{chapterId}
  - name, city, region, leadUserIds, memberUserIds
  - chartered: bool, charteredAt, status
  - quarterlyBudget

chapterEvents/{chapterId}/{eventId}
  - date, venue, agenda, rsvpUserIds, recap

summits/{summitYear}
  - dates, venue, capacity, agendaItems[], speakers[]
  - registrations/{userId}: { ticketType, paid, dietary, podId }

awards/{year}/{awardId}
  - category, nominees[], winnerUserId, citation
```

## Cloud Functions Needed
- `formPods` — runs at cohort Day 3; matching algorithm
- `schedulePodRituals` — creates ritual calendar invites
- `chapterEventReminder` — scheduled emails before events
- `summitMatchmaker` — pre-summit networking recommendations
- `nominateAward` / `tallyAwardVotes` — annual awards flow

## UI Surfaces to Build
- New screens: `pod-home`, `pod-history`, `chapters`, `chapter-detail`, `summit-hub`, `awards`
- New widgets: `PodTodayWidget`, `NextChapterEventWidget`, `SummitCountdownWidget`
- Async pod chat (lightweight; not a full messaging product)
- Chapter lead admin tools

## Ops Reality Check
This combo is **ops-heavy**, not just product:
- 1 community manager hire (Year 1)
- Chapter lead recruitment + training program
- Summit event production (venue, vendors, speakers)
- Quarterly chapter stipend ($200 × N chapters)
- Conservative Year-1 budget: **$80K–$120K** beyond product build

## Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Pods fizzle if 1 person ghosts | Pod design supports 3-active-of-5 model; auto-reshuffle if drops below 3 |
| Chapters require alumni density we don't have yet | Start with 3 pilot cities (Austin / Boston / SF), seed with current alumni |
| Summit Year 1 underattended | Set target at 100; make 200 a stretch; package as "founding summit" exclusivity |
| Community manager dependency | Document playbooks heavily; recruit chapter leads as co-owners |

## Success Metrics
| Metric | 6-month target | 12-month target |
|---|---|---|
| Pods formed | 100% of cohorts | 100% + 40% opt into Lifetime |
| Chartered chapters | 3 | 8 |
| Chapter event attendance | — | 60% of metro alumni attend ≥1/yr |
| Summit attendance Y1 | — | 150–200 |
| Retention lift (alumni in pod vs not) | +15pp | +25pp |
| NPS lift | +10 | +20 |

---

# Cross-Combo Considerations

## Build Sequencing (Recommended)
**Q3 2026:** Combo B Phase 1 (Win Cards + basic Wrapped infrastructure)
**Q4 2026:** Combo A Phase 1 (Manager Multiplier + minimal Team Dashboard); Combo B Phase 2 (LinkedIn badges)
**Q1 2027:** Wrapped launch (Jan 2); Combo C Pods rollout
**Q2 2027:** Slack integration (Combo A); first 3 chapters chartered (Combo C)
**Q3 2027:** First Annual Summit

## Shared Infrastructure (Build Once, Use Across)
- **Short-link / referral attribution service** — used by A1, B1, and C2
- **Consent & sharing controls UX** — used by A2, B1, C1
- **Image generation pipeline** — used by B1, B2, B3
- **Event/RSVP system** — used by A (cohort events), C2 (chapters), C3 (summit)

## Provider/Service Additions (Code Architecture)
New services to add to `src/services/createAppServices.js`:
- `referralService.js`
- `shareCardService.js`
- `credentialService.js`
- `podService.js`
- `chapterService.js`
- `companyService.js`

New providers (slot into `App.jsx`):
- `CompanyProvider` (membership context — sits next to `DataProvider`)
- `PodProvider` (under `DataProvider`)

## What We're Explicitly NOT Building
- A full chat product (pod messaging is intentionally minimal)
- A learning marketplace (peer coaching is a future Phase 2)
- A general social network (no public feed, no follows)
- Mobile-native apps (PWA continues to be the bet)

---

# Decision Framework — For the Rob + Ryan Conversation

**Three questions to align on:**

1. **Bet:** Is our growth bet primarily *B2B contracts* (Combo A), *B2C virality* (Combo B), or *community moat* (Combo C)? They're not mutually exclusive but the answer drives priority.
2. **Capacity:** Do we have ops bandwidth (or budget) for the community-manager hire that Combo C requires?
3. **Speed:** Do we need a fast viral signal in 60 days (push B) or can we play a 12-month moat-building game (push C)?

---

*End of Spec Sheet — print to PDF via browser or run `npx markdown-pdf` for distribution.*
