# Instantly.ai Integration - Next Steps

**Status:** Core integration built, pending deployment and testing

## Completed
- [x] Cloud Function proxy (`instantlyProxy`) for API calls
- [x] Webhook handler (`instantlyWebhook`) for event sync
- [x] Client-side service (`team-sales/src/lib/instantly.js`)
- [x] Zustand store for state management
- [x] Push modal UI component
- [x] Status badge component
- [x] "Push to Instantly" button on prospect detail panel
- [x] Documentation

## To Deploy
1. Set Instantly API key:
   ```bash
   firebase functions:secrets:set INSTANTLY_API_KEY
   ```

2. Deploy functions:
   ```bash
   cd functions && npm install && cd ..
   firebase deploy --only functions:instantlyProxy,functions:instantlyWebhook
   ```

3. Configure webhooks in Instantly dashboard:
   - URL: `https://us-central1-leaderreps-pd-platform.cloudfunctions.net/instantlyWebhook`
   - Events: `email_replied`, `email_bounced`, `lead_interested`, `meeting_booked`

## Future Enhancements
- [ ] Bulk push from list view (select multiple → push all)
- [ ] Campaign analytics dashboard in Team Sales Hub
- [ ] Auto-push when prospect reaches certain pipeline stage
- [ ] Two-way sync (update prospect stage when Instantly status changes)
- [ ] Campaign performance metrics per prospect
- [ ] Sequence step tracking (which email in sequence)
- [ ] A/B test results display
- [ ] Unsubscribe handling (mark prospect as do-not-contact)

## Testing Checklist
- [ ] Push single prospect to campaign
- [ ] Push multiple prospects
- [ ] Verify status badge displays
- [ ] Test webhook receives reply event
- [ ] Test webhook receives bounce event
- [ ] Verify activity log entries
- [ ] Test pause/resume lead
- [ ] Test remove lead from campaign

---
*Last updated: February 16, 2026*
