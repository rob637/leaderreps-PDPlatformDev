# Team Sales Hub Overview

**URL:** https://leaderreps-team.web.app  
**Purpose:** Unified sales outreach platform for the LeaderReps sales team

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TEAM SALES HUB                                  │
│                   (Your Central Command Center)                         │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Apollo    │  │  Outreach   │  │  Pipeline   │  │  Analytics  │    │
│  │   Search    │  │  Templates  │  │   Tracker   │  │  Dashboard  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                                   │                                     │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  APOLLO   │   │ INSTANTLY │   │  LINKED   │
            │   .io     │   │  (Email)  │   │  HELPER   │
            └───────────┘   └───────────┘   │ (LinkedIn)│
                                            └───────────┘
                 Find           Send            Send
               Prospects    Email Sequences  LinkedIn Messages
```

---

## What Each Tool Does

### 1. Apollo.io - Find Prospects
- Search for leads by job title, company, industry, location
- Export contact info (email, LinkedIn URL, company)
- Filter by company size, funding, technologies used

### 2. Instantly - Email Outreach
- Send cold email campaigns at scale (thousands per day)
- Automatic email warmup (protects deliverability)
- Track opens, clicks, and replies
- Multi-step sequences (follow-up emails automatically)

### 3. LinkedHelper - LinkedIn Outreach
- Automated connection requests
- Automated LinkedIn messages
- Profile visits and engagement
- Runs as Chrome extension on a desktop machine

---

## Why We Built Team Sales Hub

**Problem:** These tools don't talk to each other. You'd have to:
1. Search Apollo, export CSV
2. Import to Instantly, run campaign
3. Manually track who responded
4. Separately run LinkedHelper
5. Try to remember who got what message where

**Solution:** Team Sales Hub connects everything:

```
Apollo Search → Select prospects → Push to Instantly AND/OR LinkedHelper
                                          ↓
                              All activity syncs back
                                          ↓
                              See unified timeline & analytics
```

---

## The LinkedHelper Challenge (Why the Bridge)

**The Problem:**
LinkedHelper runs on someone's actual computer (desktop app). It's NOT a cloud service.
Your partner in the Philippines runs it. You can't access `localhost:12080` from 5000 miles away.

**The Solution - Queue-Based Bridge:**

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   YOU (anywhere)                          PARTNER (Philippines)      │
│                                                                      │
│   ┌─────────────┐                         ┌─────────────┐           │
│   │ Team Sales  │                         │  Chrome     │           │
│   │    Hub      │                         │ Extension   │           │
│   └──────┬──────┘                         └──────┬──────┘           │
│          │                                       │                   │
│          │ "Push John Smith                      │ Polls every       │
│          │  to LinkedIn"                         │ 5 seconds         │
│          ▼                                       ▼                   │
│   ┌─────────────────────────────────────────────────────┐           │
│   │              FIRESTORE QUEUE                         │           │
│   │   (Cloud database both can access)                   │           │
│   │                                                      │           │
│   │   { name: "John Smith",                              │           │
│   │     linkedInUrl: "linkedin.com/in/jsmith",           │           │
│   │     action: "connect",                               │           │
│   │     status: "pending" }                              │           │
│   └─────────────────────────────────────────────────────┘           │
│                                       │                              │
│                                       ▼                              │
│                               ┌─────────────┐                        │
│                               │ LinkedHelper│                        │
│                               │ localhost   │                        │
│                               │   :12080    │                        │
│                               └─────────────┘                        │
│                                       │                              │
│                                       ▼                              │
│                               Sends LinkedIn                         │
│                               connection request                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**In plain English:**
1. You click "Push to LinkedIn" in Team Sales Hub
2. It saves the request to Firestore (cloud database)
3. Your partner's Chrome extension checks Firestore every 5 seconds
4. When it finds a request, it tells LinkedHelper to execute it
5. LinkedHelper sends the connection/message on LinkedIn

---

## Team Sales Hub Features

| Page | What It Does |
|------|--------------|
| **Dashboard** | Overview stats, recent activity, quick actions |
| **Apollo Search** | Find and select prospects |
| **Pipeline** | Track deals through stages (Lead → Qualified → Demo → Proposal → Closed) |
| **Outreach** | Email/LinkedIn templates, push prospects to campaigns |
| **Activities** | Unified timeline of ALL outreach (email + LinkedIn + manual) |
| **Analytics** | Charts showing outreach volume, response rates, channel performance |
| **Settings** | API keys, team config |

---

## What You Still Need To Do

### 1. Get Instantly API Key
- Log into https://app.instantly.ai
- Go to Settings → Integrations → API
- Copy the API key
- Paste in Team Sales Hub → Settings

### 2. Set Up LinkedHelper Bridge
**Send your partner:**
- The Chrome extension folder (`team-sales/chrome-extension/`)
- Instructions to load it in Chrome (Extensions → Load unpacked)
- They need to keep LinkedHelper running + Chrome open

### 3. Get Apollo API Key (if using direct integration)
- Or just export CSVs manually and import

---

## Daily Workflow (Once Set Up)

```
Morning:
1. Search Apollo for new prospects
2. Select best matches
3. Push to Instantly (email sequence) AND LinkedHelper (LinkedIn)

Throughout Day:
4. Check Activities page for responses
5. Update Pipeline when meetings booked
6. Reply to interested prospects

Weekly:
7. Check Analytics for what's working
8. Adjust templates based on response rates
```

---

## Architecture Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| Team Sales Hub | https://leaderreps-team.web.app | Main web app |
| Firestore | Firebase cloud | Stores prospects, activities, queue |
| Cloud Functions | Firebase | API proxy for Instantly |
| Chrome Extension | Partner's browser | Bridges to LinkedHelper |
| LinkedHelper | Partner's desktop | Executes LinkedIn automation |
| Instantly | Cloud service | Executes email automation |
| Apollo | Cloud service | Prospect database |

---

## Key Files in Codebase

```
team-sales/
├── src/
│   ├── pages/
│   │   ├── DashboardPage.jsx    # Main dashboard
│   │   ├── ApolloSearchPage.jsx # Prospect search
│   │   ├── PipelinePage.jsx     # Deal tracking
│   │   ├── OutreachPage.jsx     # Templates & campaigns
│   │   ├── ActivitiesPage.jsx   # Unified timeline
│   │   ├── AnalyticsPage.jsx    # Charts & metrics
│   │   └── SettingsPage.jsx     # API keys
│   ├── lib/
│   │   ├── instantly.js         # Instantly API wrapper
│   │   └── linkedHelper.js      # LinkedHelper queue functions
│   └── stores/
│       ├── instantlyStore.js    # Instantly state
│       └── linkedHelperStore.js # LinkedHelper state
├── chrome-extension/
│   ├── manifest.json            # Extension config
│   └── background.js            # Queue polling + LinkedHelper bridge

functions/
├── index.js                     # Cloud Functions
    ├── linkedHelperQueueAdd     # Add to queue
    ├── linkedHelperQueuePoll    # Extension checks queue
    └── linkedHelperQueueComplete# Mark completed
```

---

## TL;DR

**Team Sales Hub = One place to:**
1. Find prospects (Apollo)
2. Email them at scale (Instantly)  
3. LinkedIn them at scale (LinkedHelper via your partner)
4. Track everything in one timeline
5. See what's working in analytics

**The LinkedHelper bridge exists because** your partner runs it locally - we queue actions in the cloud and their Chrome extension picks them up.
