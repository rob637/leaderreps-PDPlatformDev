# Team Sales Hub - HubSpot-Style Integration Plan

## Vision

Transform Team Sales Hub into a unified sales command center with native LinkedHelper and Gmail integrations, giving the team HubSpot-level visibility without HubSpot costs.

**Goal:** Every prospect interaction (LinkedIn, email, calls) is automatically logged and visible in one place.

---

## Current State

| Channel | Current Workflow | Pain Points |
|---------|------------------|-------------|
| **Email (Instantly)** | Push to Instantly, manual status check | ✅ Integration built, needs deployment |
| **LinkedIn** | Manual LinkedHelper, no CRM sync | Data lives in LinkedHelper, not CRM |
| **Gmail** | Manual logging with Quick Log | Friction, incomplete history |
| **Calls** | Manual Quick Log | Works, but easy to forget |

---

## Target State

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TEAM SALES HUB                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │  Prospects  │  │  Pipeline   │  │  Tasks      │  │  Analytics  ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│                              │                                      │
│                    ┌─────────▼─────────┐                           │
│                    │  UNIFIED TIMELINE │                           │
│                    │  • Emails sent    │                           │
│                    │  • LinkedIn msgs  │                           │
│                    │  • Calls logged   │                           │
│                    │  • Meetings       │                           │
│                    │  • Notes          │                           │
│                    └───────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌───────────┐        ┌───────────┐        ┌───────────┐
    │ INSTANTLY │        │ LINKED    │        │  GMAIL    │
    │ (Email)   │        │ HELPER    │        │  (Inbox)  │
    └───────────┘        └───────────┘        └───────────┘
```

---

## Phase 1: LinkedHelper Integration (Week 1) ✅ BUILT

### Features
- ✅ **Push to LinkedHelper** — Send prospects to LinkedIn campaigns
- ✅ **Status Sync** — Connection accepted, message replied, ignored
- ✅ **Activity Timeline** — All LinkedIn touches logged automatically
- ✅ **Campaign Selection** — Choose which LinkedHelper campaign/sequence
- ✅ **Scheduled Sync Job** — Auto-sync every 15 minutes

### Technical Approach

```
Team Sales Hub  →  Cloud Function  →  LinkedHelper API
                         ↑
         LinkedHelper webhooks (optional)
         OR scheduled sync every 15 min
```

### LinkedHelper API Endpoints We'll Use
| Endpoint | Purpose |
|----------|---------|
| `POST /campaigns/{id}/contacts` | Add prospect to campaign |
| `GET /contacts/{email}/status` | Get connection/reply status |
| `GET /campaigns/{id}/results` | Bulk sync campaign results |

### Data Model Updates
```javascript
// Prospect document additions
{
  linkedHelperStatus: 'pending' | 'connected' | 'replied' | 'ignored',
  linkedHelperCampaignId: 'abc123',
  linkedHelperLastSync: Timestamp,
  linkedInUrl: 'https://linkedin.com/in/...'
}
```

### UI Components
- [x] "Push to LinkedHelper" button (same pattern as Instantly)
- [x] LinkedHelper status badge
- [x] LinkedIn campaign selector modal
- [x] Activity timeline entries for LinkedIn events

### Requirements from You
- [ ] LinkedHelper API key (Settings → API in LinkedHelper 2)
- [x] LinkedHelper account — v2.102.19 confirmed
- [ ] Configure webhook URL in LinkedHelper

---

## Phase 2: Gmail Integration (Week 2-3)

### Two-Part Architecture

#### Part A: Chrome Extension (Sidebar + Logging)
Shows CRM data while in Gmail, enables one-click logging.

**Features:**
- Sidebar shows prospect info when viewing an email
- "Log to CRM" button on any email
- "Add to CRM" for new contacts
- See recent activities/notes
- Quick reply templates

**How it works:**
```
Gmail (browser)  →  Chrome Extension  →  Firebase (direct)
                         ↓
         Reads email metadata (to, from, subject, date)
         Shows CRM sidebar with prospect data
```

#### Part B: Gmail API Sync (Auto-logging)
Automatically syncs sent/received emails for tracked prospects.

**Features:**
- Auto-log outgoing emails to tracked prospects
- Auto-log incoming replies
- Thread association (full conversation history)
- Attachment indicators

**How it works:**
```
Gmail API  →  Cloud Function (scheduled)  →  Firestore
                  │
         Checks for new emails every 5 min
         Matches sender/recipient to prospects
         Creates activity entries
```

### Gmail OAuth Setup
Requires:
- Google Cloud project with Gmail API enabled
- OAuth consent screen (internal use = easy)
- OAuth credentials for web app
- User grants "read email" permission once

### Data Model Updates
```javascript
// Activity document for email
{
  type: 'email_sent' | 'email_received',
  prospectId: '...',
  subject: 'Re: Leadership Program',
  snippet: 'Thanks for reaching out...',
  threadId: 'gmail_thread_123',
  messageId: 'gmail_msg_456',
  timestamp: Date,
  attachments: ['proposal.pdf'],
  synced: true // auto-logged vs manual
}
```

### UI Components
- [ ] Chrome extension sidebar
- [ ] Email history in prospect timeline
- [ ] Thread view (expand to see full conversation)
- [ ] "Tracked" badge on prospects with email sync
- [ ] Settings page for Gmail connection

### Requirements from You
- [ ] Google Workspace admin access (to approve OAuth app)
- [ ] Decision: Track all emails or opt-in per prospect?
- [ ] Reply template content (if desired)

---

## Phase 3: Unified Timeline & Analytics (Week 3-4)

### Timeline Enhancements
- Combined view of all touchpoints (email, LinkedIn, calls, meetings)
- Filter by channel
- Expandable email threads
- "Last contacted" auto-calculation
- "Days since last touch" alerts

### Analytics Dashboard
- Outreach volume by channel (email vs LinkedIn)
- Response rates by channel
- Best time to send analysis
- Pipeline progression by outreach type
- Team activity leaderboard

### Smart Features
- **Auto stage progression** — Move to "Contacted" when first outreach sent
- **Reply detection** — Move to "Engaged" when they reply
- **Stale prospect alerts** — Badge when no touch in 7+ days
- **Suggested next action** — "No LinkedIn connection yet" prompt

---

## Technical Architecture Summary

```
┌────────────────────────────────────────────────────────────────────────┐
│                           CLOUD FUNCTIONS                              │
├────────────────┬─────────────────┬─────────────────┬──────────────────┤
│ instantlyProxy │ linkedHelperProxy│ gmailSyncJob    │ webhookHandlers │
│ (built ✅)     │ (Phase 1)        │ (Phase 2)       │ (Phase 1-2)     │
└───────┬────────┴────────┬────────┴────────┬────────┴────────┬─────────┘
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
   Instantly API    LinkedHelper API    Gmail API      Incoming webhooks
        │                 │                 │                 │
        └─────────────────┴─────────────────┴─────────────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │  FIRESTORE  │
                            │ ─────────── │
                            │ prospects   │
                            │ activities  │
                            │ sync_status │
                            └─────────────┘
                                   ▲
                    ┌──────────────┼──────────────┐
                    │              │              │
              Team Sales Hub   Chrome Ext    Mobile (future)
```

---

## Implementation Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| **1** | LinkedHelper | Cloud function, push UI, status sync, timeline entries |
| **2** | Gmail Extension | Chrome extension scaffold, sidebar, manual logging |
| **3** | Gmail API Sync | OAuth flow, auto-sync job, thread display |
| **4** | Polish & Analytics | Unified timeline, dashboards, smart alerts |

---

## Effort Estimates

| Component | Effort | Complexity |
|-----------|--------|------------|
| LinkedHelper Cloud Function | 1 day | Low (same pattern as Instantly) |
| LinkedHelper UI | 1 day | Low (copy Instantly components) |
| Chrome Extension Scaffold | 2 days | Medium |
| Extension Sidebar UI | 2 days | Medium |
| Gmail OAuth Setup | 1 day | Medium (one-time) |
| Gmail Sync Cloud Function | 2 days | Medium |
| Unified Timeline UI | 2 days | Medium |
| Analytics Dashboard | 2 days | Medium |
| **Total** | **~13 days** | |

---

## Questions to Resolve

1. **LinkedHelper Version** — ✅ LinkedHelper 2 Launcher v2.102.19 (API supported)
2. **Gmail Accounts** — ✅ Google Workspace (easier admin approval)
3. **Email Tracking Scope** — ✅ Opt-in per prospect (toggle on prospect card)
4. **Extension Distribution** — ✅ Internal team only (unlisted Chrome extension)
5. **Mobile Needs** — TBD

---

## Next Steps

1. Confirm LinkedHelper version and get API key
2. Confirm Google Workspace setup
3. I'll build LinkedHelper integration first (fastest win)
4. Then scaffold Chrome extension
5. Then Gmail API sync

Ready to start Phase 1 (LinkedHelper) whenever you give the green light!

---

*Created: February 16, 2026*
