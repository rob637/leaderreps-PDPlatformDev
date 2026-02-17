# Instantly.ai Integration Guide

This guide explains how to set up and use the Instantly.ai integration in the Team Sales Hub.

## Overview

The integration allows you to:
- **Push prospects** from Team Sales Hub directly to Instantly campaigns
- **Sync status** back from Instantly (replies, bounces, opens)
- **Track outreach progress** with status badges on prospect cards
- **Manage leads** (pause, resume, remove) from within the CRM

## Setup

### 1. Get Your Instantly API Key

1. Log in to [Instantly.ai](https://instantly.ai)
2. Go to **Settings → Integrations → API**
3. Copy your API key

### 2. Configure Firebase Functions

Add the API key to your Firebase functions config:

```bash
# Set the Instantly API key as a secret
firebase functions:secrets:set INSTANTLY_API_KEY

# Or use environment variable in .env (for local development)
INSTANTLY_API_KEY=your_api_key_here
```

### 3. Set Up Webhooks (Optional but Recommended)

To receive real-time updates when leads reply, bounce, or interact with emails:

1. In Instantly, go to **Settings → Webhooks**
2. Add a new webhook with URL:
   ```
   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/instantlyWebhook
   ```
3. Select events to receive:
   - `email_replied` - Lead replied to an email
   - `email_bounced` - Email bounced
   - `email_opened` - Lead opened an email
   - `lead_unsubscribed` - Lead unsubscribed
   - `lead_interested` - Lead marked as interested
   - `meeting_booked` - Meeting was booked

Replace `YOUR_PROJECT_ID` with your Firebase project ID (e.g., `leaderreps-pd-platform`).

### 4. Deploy the Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:instantlyProxy,functions:instantlyWebhook
```

## Usage

### Pushing Prospects to Instantly

1. Open a prospect in Team Sales Hub
2. Click the **Zap** button (purple) in the action bar
3. Select an Instantly campaign from the dropdown
4. Click **Push to Instantly**

The prospect will be added to the selected campaign and start receiving emails according to the campaign sequence.

### Bulk Push

1. Select multiple prospects in the list view
2. Click the **Push to Instantly** action in the bulk actions bar
3. Select a campaign and confirm

### Viewing Status

Prospects synced to Instantly will show a status badge:
- **In Sequence** (blue) - Actively receiving emails
- **Paused** (yellow) - Sequence paused
- **Replied** (green) - Lead replied
- **Bounced** (red) - Email bounced
- **Meeting Booked** (purple) - Meeting scheduled

### Managing Leads

From the prospect detail panel, you can:
- **Pause** - Stop sending emails temporarily
- **Resume** - Continue the sequence
- **Remove** - Remove from the campaign entirely

## Data Flow

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────┐
│  Team Sales Hub │────▶│  Cloud Functions  │────▶│ Instantly   │
│  (Frontend)     │     │  (instantlyProxy) │     │ API         │
└─────────────────┘     └───────────────────┘     └──────┬──────┘
        ▲                        ▲                       │
        │                        │                       │
        │                        │         Webhooks      │
        │                        └───────────────────────┘
        │                                instantlyWebhook
        │
        └──────── Firestore (sync status, activities)
```

## Firestore Data Model

### Prospect Fields (added by integration)

```javascript
{
  // ... existing prospect fields ...
  
  // Instantly sync status
  instantlyStatus: 'active' | 'paused' | 'replied' | 'bounced' | 'unsubscribed',
  instantlyLastEvent: 'email_opened' | 'email_replied' | etc.,
  instantlyLastEventAt: Timestamp
}
```

### Activities Collection

Each Instantly event creates an activity record:

```javascript
{
  type: 'instantly_event',
  event: 'email_replied',
  campaignId: 'abc123',
  timestamp: Date,
  createdAt: Timestamp
}
```

## Troubleshooting

### "Instantly API key not configured"

Make sure you've set the API key:
```bash
firebase functions:secrets:set INSTANTLY_API_KEY
```

### "Not authorized to use Instantly API"

Only team members (rob, ryan, jeff, cristina) and admins can use the integration. Check that your email is in the authorized list in [functions/index.js](../functions/index.js#L1723).

### Webhook events not syncing

1. Verify the webhook URL is correct in Instantly settings
2. Check Cloud Functions logs for errors:
   ```bash
   firebase functions:log --only instantlyWebhook
   ```
3. Ensure the prospect email in Firestore matches the email in Instantly (case-insensitive)

### Campaign not showing in dropdown

1. Click the **Refresh** button to fetch the latest campaigns
2. Make sure the campaign is active in Instantly
3. Check that your API key has access to the campaign

## API Reference

The `instantlyProxy` Cloud Function supports these actions:

| Action | Description | Parameters |
|--------|-------------|------------|
| `listCampaigns` | Get all campaigns | - |
| `getCampaign` | Get campaign details | `campaignId` |
| `getCampaignAnalytics` | Get campaign stats | `campaignId` |
| `addLead` | Add single lead | `campaignId`, `lead` |
| `addLeads` | Add multiple leads | `campaignId`, `leads[]` |
| `getLeadStatus` | Get lead status | `email` |
| `getCampaignLeads` | List campaign leads | `campaignId`, `limit`, `skip` |
| `pauseLead` | Pause a lead | `campaignId`, `email` |
| `resumeLead` | Resume a lead | `campaignId`, `email` |
| `removeLead` | Remove a lead | `campaignId`, `email` |

## Security

- API key is stored securely as a Firebase Functions secret
- Only authenticated users can call the proxy function
- Additional authorization check ensures only team members can access
- Frontend never sees the API key directly
