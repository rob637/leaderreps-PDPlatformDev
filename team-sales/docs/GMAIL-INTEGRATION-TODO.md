# Gmail Integration - Setup Guide

> **Status:** Waiting on Jeff — code is ready, needs OAuth credentials and domain decision

---

## Current State

### ✅ Built and Ready
| Component | Status | Location |
|-----------|--------|----------|
| **gmailStore.js** | ✅ Complete | Token management, profile, email listing, sync |
| **gmail.js lib** | ✅ Complete | Full API client (send, list, sync, parse) |
| **Settings UI** | ✅ Complete | Connect/disconnect Gmail buttons |
| **Cloud Functions** | ⚠️ DISABLED | Code exists but prefixed with `_disabled_` |

### ❌ Why Functions Are Disabled

From `functions/index.js` lines 3315-3318:
```javascript
// GMAIL INTEGRATION (DISABLED - requires Google OAuth secrets)
// TODO: Set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets, then change
//       _disabled_gmailProxy back to exports.gmailProxy
```

---

## Key Decision: Which Gmail/Domain to Use?

### The Question
We have multiple Google workspaces and Gmail accounts. A separate workspace was created for cold email sending (like Instantly). Should we use that?

### Answer: YES — Use Dedicated Sending Domain

**Why separate sending domain is critical:**

| Risk | Main Domain | Dedicated Sending Domain |
|------|-------------|--------------------------|
| Get marked spam | Hurts ALL company email (proposals, invoices, support) | Only affects cold outreach |
| Domain reputation tanks | Client emails go to spam | Main business unaffected |
| Blacklisted | Disaster for business | Spin up new domain, warm it |

### Architecture Options

| Option | How It Works | Pros | Cons |
|--------|--------------|------|------|
| **A: Each user connects dedicated inbox** | Rob connects `rob@outreach.leaderreps.io` instead of `rob@leaderreps.com` | Uses existing code, personalized | Each user manages their account |
| **B: Centralized sending account** | One shared `sales@outreach.leaderreps.io` for all sequences | Simple to manage | Less personalized |
| **C: Multiple accounts with rotation** | Multiple sending accounts, rotate to spread volume | Best deliverability | More complex |

**Recommended:** Start with **Option A** — each user connects their dedicated cold email account.

---

## Information Needed From Jeff

1. **What's the dedicated sending domain?** (e.g., `outreach.leaderreps.io`)
2. **Are there individual accounts per person?** (e.g., `rob@`, `ryan@`, `jeff@`)
3. **Or is it one shared account?** (e.g., `sales@`)
4. **Who has admin access to that Google Workspace?** (needed for OAuth setup)

---

## Setup Steps (Once Info is Provided)

### Step 1: Create OAuth Credentials (5-10 min)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Use the `leaderreps-pd-platform` project (same as Firebase)
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Application type: Web application
5. Add authorized redirect URI:
   ```
   https://us-central1-leaderreps-pd-platform.cloudfunctions.net/gmailOAuthCallback
   ```
6. Copy **Client ID** and **Client Secret**

### Step 2: Set Firebase Secrets (2 min)
```bash
firebase functions:secrets:set GOOGLE_CLIENT_ID
# Paste client ID when prompted

firebase functions:secrets:set GOOGLE_CLIENT_SECRET  
# Paste client secret when prompted
```

### Step 3: Enable Cloud Functions
In `functions/index.js`, rename:
- `_disabled_gmailProxy` → `exports.gmailProxy`
- `_disabled_gmailOAuthCallback` → `exports.gmailOAuthCallback`
- `_disabled_gmailSyncJob` → `exports.gmailSyncJob`

### Step 4: Add Client ID to Frontend
In `team-sales/.env`:
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

### Step 5: Deploy
```bash
cd functions && firebase deploy --only functions
cd ../team-sales && npm run build && firebase deploy --only hosting
```

---

## How Gmail Sync Will Work

### Two Parts:

1. **OAuth App Credentials** (one-time, project-level)
   - Created in Google Cloud Console
   - Just registers our "app" with Google
   - Use any admin Google account

2. **User Gmail Connections** (per-person)
   - Each team member connects their sending account
   - Tokens stored in `users/{userId}/settings/gmail`
   - Each person uses whichever email they send outreach from

### What Gets Synced

- **Sent emails** to tracked prospects → auto-logged to activity timeline
- **Received emails** from tracked prospects → auto-logged as replies
- **Thread association** → full conversation history

### Sync Schedule
- Scheduled job runs every 5 minutes
- Checks for new sent/received emails
- Matches sender/recipient to prospects in CRM
- Creates activity entries automatically

---

## Related Files

| File | Purpose |
|------|---------|
| `team-sales/src/stores/gmailStore.js` | Token management, email operations |
| `team-sales/src/lib/gmail.js` | Gmail API client |
| `team-sales/src/pages/SettingsPage.jsx` | Connect/disconnect UI |
| `functions/index.js` (lines 3315-3600) | Disabled Gmail functions |

---

## Questions for Discussion

1. Should sequence emails also sync back to prospect timelines? (Currently: yes, planned)
2. Do we need email open/click tracking? (Pixel tracking, separate feature)
3. Multiple sending accounts per user? (Rotation for higher volume)

---

*Last updated: February 18, 2026*
*Waiting on: Jeff — domain info and OAuth access*
