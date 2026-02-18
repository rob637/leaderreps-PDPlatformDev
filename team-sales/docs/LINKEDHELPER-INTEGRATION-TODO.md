# LinkedHelper Integration - TODO

> **Status:** Paused — return to this after sequence engine is fully tested

## Current Implementation Status

### ✅ Already Built
1. **Cloud Functions Backend** (`functions/index.js`)
   - `linkedHelperProxy` - API proxy for campaigns, contacts, status
   - `linkedHelperWebhook` - Receives events from LinkedHelper
   - `linkedHelperQueuePoll` - Chrome extension polls for pending tasks
   - `linkedHelperQueueComplete` - Reports task completion
   - `linkedHelperQueueAdd` - Adds prospects to queue
   - `linkedHelperSyncJob` - Scheduled sync every 15 minutes

2. **Chrome Extension** (`team-sales/chrome-extension/`)
   - Queue polling from Firestore
   - Bridge to LinkedHelper localhost:12080 API
   - Push contacts to campaigns via local API

3. **Frontend Components**
   - `linkedHelperStore.js` - Campaigns, pushing, status
   - `LinkedHelperPushModal.jsx` - Push prospects to campaigns
   - Settings page for API key storage

---

## What's Still Needed

### 1. LinkedHelper API Key / Subscription
- **Required:** LinkedHelper 2 Cloud license with API access
- **Where to Get:** https://linkedhelper.com → Pricing → Cloud or Professional plan
- **What you'll receive:** API key for cloud API (`api.linkedhelper.com`)

### 2. Webhook Configuration in LinkedHelper
Configure webhook URL in LinkedHelper settings:
```
https://us-central1-leaderreps-pd-platform.cloudfunctions.net/linkedHelperWebhook
```
Events received: connection_accepted, message_replied, declined, etc.

### 3. For Local Bridge (Alternative Architecture)
If using LinkedHelper 2 desktop (not cloud), partner needs:
- Chrome Extension loaded (`team-sales/chrome-extension/`)
- LinkedHelper 2 desktop running on their machine (localhost:12080)
- Sign into extension with LeaderReps credentials
- Enable "LinkedHelper Bridge" in extension settings

### 4. Environment Variables
Set in `functions/.env`:
```bash
LINKEDHELPER_API_KEY=your_cloud_api_key_here
```

### 5. API Endpoint Verification
The cloud proxy uses `https://api.linkedhelper.com/v1` — verify this is the correct base URL.

---

## Architecture Decision Needed

| Option | Pros | Cons |
|--------|------|------|
| **Cloud API** | Simpler, no partner setup needed | Requires LinkedHelper Cloud subscription |
| **Local Bridge** | Works with any LH license | Requires partner to run extension + LH desktop |

---

## When Returning to This

1. Decide on architecture (Cloud vs Local Bridge)
2. Obtain LinkedHelper API key if using Cloud
3. Configure webhook URL in LinkedHelper
4. Test the push flow end-to-end
5. Test webhook events are received properly
