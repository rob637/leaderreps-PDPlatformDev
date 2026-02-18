# Email Sequence Engine - Build Plan

> **Status:** ✅ IMPLEMENTED  
> **Last Updated:** Feb 18, 2026  
> **Context:** Replacing Instantly.ai with our own sequence engine to save ~$100+/month

## Summary

We built our own email sequence/automation engine using:
- **Existing Gmail OAuth integration** (already working in team-sales)
- **Existing templates/sequences infrastructure** (outreachStore.js)
- **New Cloud Function scheduler** to process the queue
- **Firebase as the database** (free tier)

**Estimated build time:** 2-3 days  
**Actual build time:** ~2 hours  
**Estimated monthly cost:** $0 (using Gmail API) or ~$1 (Amazon SES for higher volume)

## Implementation Summary

### Files Created/Modified

**New Files:**
- `src/stores/sequenceStore.js` - Enrollment management, stats, actions
- `src/components/sequences/SequenceBuilder.jsx` - Visual sequence step editor
- `src/components/sequences/EnrollInSequenceModal.jsx` - Enroll prospect modal
- `src/components/sequences/SequenceEnrollmentsDashboard.jsx` - Enrollments dashboard
- `src/components/sequences/index.js` - Exports

**Modified Files:**
- `src/pages/OutreachPage.jsx` - Added "Automation" tab, uses SequenceBuilder
- `src/components/prospects/ProspectDetailPanel.jsx` - Added "Sequence" button
- `functions/index.js` - Added `processSequenceQueue` Cloud Function

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Existing Infrastructure                      │
├─────────────────────────────────────────────────────────────────┤
│  team-sales UI → outreachStore.js → Firestore                  │
│  - outreach_templates collection ✅                              │
│  - outreach_sequences collection ✅                              │
│  - outreach_activities collection ✅                             │
│  - Gmail OAuth + sending via gmailProxy ✅                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     NEW: Sequence Engine                        │
├─────────────────────────────────────────────────────────────────┤
│  1. sequence_enrollments collection (new)                       │
│  2. Cloud Function: processSequenceQueue (scheduled)            │
│  3. UI: "Add to Sequence" from prospect detail                  │
│  4. Reply detection to auto-stop sequences                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### New Collection: `sequence_enrollments`

```javascript
{
  id: "enroll_abc123",
  
  // Who is enrolled
  prospectId: "prospect_xyz",
  prospectEmail: "lead@company.com",
  prospectName: "John Smith",
  
  // Which sequence
  sequenceId: "seq_001",
  sequenceName: "Cold Outreach v2",  // Denormalized for easy display
  
  // Owner (sales rep)
  ownerId: "ryan@leaderreps.com",
  ownerName: "Ryan",
  
  // Progress tracking
  currentStep: 0,                    // 0-indexed step number
  status: "active",                  // active | paused | completed | replied | bounced | error
  
  // Scheduling
  nextSendAt: Timestamp,             // When to send next email
  enrolledAt: Timestamp,
  completedAt: Timestamp | null,
  
  // Personalization variables (merged with template)
  variables: {
    firstName: "John",
    lastName: "Smith", 
    company: "Acme Corp",
    title: "VP Sales",
    customField: "anything you want"
  },
  
  // Error tracking
  lastError: null | "error message",
  retryCount: 0
}
```

### Update Existing: `outreach_sequences`

Add a `steps` array to define the sequence:

```javascript
{
  id: "seq_001",
  name: "Cold Outreach v2",
  description: "4-touch cold email sequence",
  
  // NEW: Steps array
  steps: [
    { 
      day: 0,           // Day 0 = send immediately on enrollment
      templateId: "tpl_001", 
      subject: "Quick question about {{company}}"
    },
    { 
      day: 2,           // 2 days after enrollment
      templateId: "tpl_002", 
      subject: "Following up, {{firstName}}"
    },
    { 
      day: 5,
      templateId: "tpl_003", 
      subject: "One more idea for {{company}}"
    },
    { 
      day: 10,
      templateId: "tpl_004", 
      subject: "Last try - worth a conversation?"
    }
  ],
  
  // Settings
  stopOnReply: true,        // Auto-stop when prospect replies
  sendWindow: {             // Only send during business hours
    startHour: 8,
    endHour: 18,
    timezone: "America/New_York",
    weekdaysOnly: true
  },
  
  // Stats (updated by Cloud Function)
  activeEnrollments: 0,
  totalEnrolled: 0,
  totalCompleted: 0,
  totalReplied: 0,
  
  // Ownership
  ownerId: "ryan@leaderreps.com",
  ownerName: "Ryan",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Cloud Function Implementation

### 1. processSequenceQueue (Scheduled)

```javascript
// functions/index.js - ADD THIS

const { onSchedule } = require('firebase-functions/v2/scheduler');

/**
 * Process sequence queue every 15 minutes
 * Sends emails that are due based on nextSendAt timestamp
 */
exports.processSequenceQueue = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: 'America/New_York',
  memory: '256MB',
}, async (event) => {
  const now = admin.firestore.Timestamp.now();
  const db = admin.firestore();
  
  // Get all active enrollments due for sending
  const dueEnrollments = await db.collection('sequence_enrollments')
    .where('status', '==', 'active')
    .where('nextSendAt', '<=', now)
    .limit(50)  // Process in batches to avoid timeouts
    .get();
  
  console.log(`Processing ${dueEnrollments.size} due enrollments`);
  
  const results = { sent: 0, errors: 0, completed: 0 };
  
  for (const doc of dueEnrollments.docs) {
    const enrollment = doc.data();
    
    try {
      // 1. Get the sequence definition
      const sequenceSnap = await db.collection('outreach_sequences')
        .doc(enrollment.sequenceId)
        .get();
      
      if (!sequenceSnap.exists) {
        throw new Error('Sequence not found');
      }
      const sequence = sequenceSnap.data();
      
      // 2. Get current step
      const step = sequence.steps[enrollment.currentStep];
      if (!step) {
        // No more steps, mark complete
        await doc.ref.update({ 
          status: 'completed',
          completedAt: now 
        });
        results.completed++;
        continue;
      }
      
      // 3. Get template
      const templateSnap = await db.collection('outreach_templates')
        .doc(step.templateId)
        .get();
      
      if (!templateSnap.exists) {
        throw new Error(`Template ${step.templateId} not found`);
      }
      const template = templateSnap.data();
      
      // 4. Get user's Gmail tokens
      const tokensSnap = await db.collection('users')
        .doc(enrollment.ownerId)
        .collection('settings')
        .doc('gmail')
        .get();
      
      if (!tokensSnap.exists) {
        throw new Error('Gmail not connected for this user');
      }
      const tokens = tokensSnap.data();
      
      // 5. Personalize content
      const subject = substituteVariables(step.subject, enrollment.variables);
      const body = substituteVariables(template.body, enrollment.variables);
      
      // 6. Send email via Gmail API
      await sendGmailEmail(tokens, {
        to: enrollment.prospectEmail,
        subject,
        body
      });
      
      // 7. Log activity
      await db.collection('outreach_activities').add({
        prospectId: enrollment.prospectId,
        prospectEmail: enrollment.prospectEmail,
        channel: 'email',
        outcome: 'sent',
        sequenceId: enrollment.sequenceId,
        sequenceName: enrollment.sequenceName,
        stepNumber: enrollment.currentStep,
        subject,
        ownerId: enrollment.ownerId,
        ownerName: enrollment.ownerName,
        createdAt: now
      });
      
      // 8. Update enrollment for next step
      const nextStepIndex = enrollment.currentStep + 1;
      
      if (nextStepIndex >= sequence.steps.length) {
        // Sequence complete!
        await doc.ref.update({ 
          status: 'completed',
          completedAt: now 
        });
        results.completed++;
      } else {
        // Schedule next email
        const nextStep = sequence.steps[nextStepIndex];
        const daysUntilNext = nextStep.day - step.day;
        const nextSendAt = addDays(now.toDate(), daysUntilNext);
        
        await doc.ref.update({ 
          currentStep: nextStepIndex,
          nextSendAt: admin.firestore.Timestamp.fromDate(nextSendAt)
        });
      }
      
      results.sent++;
      
    } catch (error) {
      console.error(`Error processing enrollment ${doc.id}:`, error);
      
      // Mark as error after 3 retries
      const retryCount = (enrollment.retryCount || 0) + 1;
      if (retryCount >= 3) {
        await doc.ref.update({ 
          status: 'error',
          lastError: error.message 
        });
      } else {
        // Retry in 1 hour
        await doc.ref.update({ 
          retryCount,
          lastError: error.message,
          nextSendAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 60 * 60 * 1000)
          )
        });
      }
      
      results.errors++;
    }
  }
  
  console.log('Sequence processing complete:', results);
  return results;
});

// Helper: Variable substitution
function substituteVariables(text, variables) {
  if (!text || !variables) return text;
  
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value || '');
  }
  return result;
}

// Helper: Add days to date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper: Send via Gmail (reuse existing gmailProxy logic)
async function sendGmailEmail(tokens, { to, subject, body }) {
  // This uses the same Gmail API approach you already have
  // Just extracted into a helper for the Cloud Function
  const { google } = require('googleapis');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken
  });
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Create email in base64 format
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body
  ].join('\n');
  
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail
    }
  });
}
```

### 2. Reply Detection (Optional Enhancement)

```javascript
// Poll for replies every hour and mark sequences as "replied"
exports.checkForReplies = onSchedule({
  schedule: 'every 1 hours',
  timeZone: 'America/New_York',
}, async (event) => {
  const db = admin.firestore();
  
  // Get active enrollments
  const activeEnrollments = await db.collection('sequence_enrollments')
    .where('status', '==', 'active')
    .get();
  
  // Group by owner to minimize Gmail API calls
  const byOwner = {};
  activeEnrollments.docs.forEach(doc => {
    const e = doc.data();
    if (!byOwner[e.ownerId]) byOwner[e.ownerId] = [];
    byOwner[e.ownerId].push({ id: doc.id, ...e });
  });
  
  for (const [ownerId, enrollments] of Object.entries(byOwner)) {
    try {
      // Get owner's Gmail tokens
      const tokensSnap = await db.collection('users')
        .doc(ownerId)
        .collection('settings')
        .doc('gmail')
        .get();
      
      if (!tokensSnap.exists) continue;
      const tokens = tokensSnap.data();
      
      // Check for replies from enrolled prospects
      for (const enrollment of enrollments) {
        const hasReply = await checkGmailForReply(
          tokens, 
          enrollment.prospectEmail,
          enrollment.enrolledAt.toDate()
        );
        
        if (hasReply) {
          await db.collection('sequence_enrollments')
            .doc(enrollment.id)
            .update({ 
              status: 'replied',
              completedAt: admin.firestore.Timestamp.now()
            });
          
          // Log activity
          await db.collection('outreach_activities').add({
            prospectId: enrollment.prospectId,
            channel: 'email',
            outcome: 'replied',
            sequenceId: enrollment.sequenceId,
            ownerId: enrollment.ownerId,
            createdAt: admin.firestore.Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error(`Reply check failed for ${ownerId}:`, error);
    }
  }
});
```

---

## UI Components Needed

### 1. SequenceBuilder.jsx (New)

A visual sequence builder:
- Drag-and-drop steps
- Set day delays
- Select template per step
- Preview personalized content

### 2. EnrollInSequenceModal.jsx (New)

Modal when clicking "Add to Sequence":
- Select sequence from dropdown
- Review/edit personalization variables
- Confirm enrollment

### 3. SequenceEnrollmentsList.jsx (New)

Dashboard showing:
- Active enrollments by sequence
- Current step progress
- Status badges (active, paused, replied, etc.)
- Ability to pause/resume/cancel

### 4. Update ProspectDetail.jsx

Add "Add to Sequence" button that opens EnrollInSequenceModal

---

## Implementation Order

1. **Data model** - Add `steps` to existing sequences, create `sequence_enrollments` collection
2. **Cloud Function** - `processSequenceQueue` scheduler
3. **Enrollment flow** - Button in UI to enroll prospect in sequence
4. **Sequence builder** - UI to create/edit sequences with steps
5. **Monitoring dashboard** - See active sequences and their status
6. **Reply detection** - Auto-stop on reply (optional but nice)

---

## Cost Comparison

| Service | Monthly Cost | Volume |
|---------|-------------|--------|
| Your Own (Gmail) | **$0** | 500/day (15K/mo) |
| Your Own (SES) | **~$1** | 62K/month |
| SendGrid Free | $0 | 100/day |
| SendGrid Essentials | $20 | 50K/month |
| **Instantly** | **$97+** | Depends on plan |

---

## Existing Files Reference

- `team-sales/src/lib/gmail.js` - Gmail OAuth and sending (already working)
- `team-sales/src/stores/outreachStore.js` - Templates, sequences, activities
- `team-sales/src/stores/gmailStore.js` - Gmail connection state
- `functions/index.js` - Add new Cloud Functions here

---

## When You're Ready

Just say: **"Let's build the sequence engine"** and I'll:

1. Create the Firestore data model updates
2. Add the Cloud Function scheduler
3. Build the enrollment UI components
4. Wire it all together

Total time: ~2-3 hours of focused work.
