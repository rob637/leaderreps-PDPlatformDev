# LeaderReps CRM — Quick Start Guide

**For:** Ryan  
**Date:** March 2026

---

## Overview

The LeaderReps CRM is your central hub for managing leads, tracking outreach, and closing deals. Access it at **arena.leaderreps.com** and click **CRM** in the top navigation.

---

## 🧭 Navigation

The left sidebar has these main sections:

| Section | What It's For |
|---------|---------------|
| **Prospects** | Your lead database — everyone you're pursuing |
| **Apollo Search** | Find new leads by searching company/title |
| **Outreach** | Email sequences and templates |
| **Activities** | Timeline of all calls, emails, meetings |
| **Analytics** | (Coming soon) Pipeline metrics |
| **Tasks** | Follow-up reminders and to-dos |
| **Settings** | Connect Gmail, API keys, preferences |

---

## 👥 Prospects

### Viewing Prospects
- **List View** (default): Sortable table showing all prospects
- **Kanban View**: Drag-and-drop cards across stages

### Adding Prospects
1. **Import CSV**: Click "Import CSV" and upload a spreadsheet
2. **Add Manually**: Click "+ Add Prospect" and fill in details
3. **From Apollo**: Search in Apollo → select → "Add to CRM"

### Prospect Stages
Prospects move through these stages:

`New` → `Contacted` → `Engaged` → `Meeting Set` → `Proposal` → `Negotiation` → `Won` / `Lost`

### Filtering
- Use the **search bar** to find by name/company
- **My Prospects** dropdown to filter by owner
- **Stage filter** to focus on specific pipeline stages

### Prospect Detail Panel
Click any prospect to open their details panel on the right:
- **Contact info** at the top (email, phone, LinkedIn)
- **Activity Log** — all emails, calls, and notes
- **Tasks** — upcoming follow-ups for this person
- **Actions** — Call, Email, Meeting, Note buttons at bottom

---

## 🔍 Apollo Search

Apollo.io integration lets you find new leads based on criteria.

### How to Search
1. Go to **Apollo Search** in sidebar
2. Choose **People** or **Companies**
3. Set your filters:
   - **Job Titles**: "VP HR", "Chief People Officer", etc.
   - **Seniority**: Director, VP, C-Suite
   - **Company Size**: 100-500 employees
   - **Location**: United States
   - **Industry**: Any relevant industries

4. Click **Search**
5. Review results and check boxes to select leads
6. Click **"Add to CRM"** to import selected leads

### Enrichment
If a lead is missing email/phone, click the **Enrich** button to pull additional data from Apollo.

### Tips
- Start specific (exact titles) then broaden if needed
- The system detects duplicates — it won't import someone already in your CRM
- Apollo has usage limits; search strategically

---

## 📧 Gmail Integration

### Connecting Your Gmail
1. Go to **Settings** in sidebar
2. Under "Gmail Account," click **Connect Gmail**
3. Sign in with your Google account
4. Authorize the requested permissions

Once connected, your Gmail will sync with the CRM.

### Syncing Emails for a Prospect
1. Open any prospect's detail panel
2. Click **"Sync Gmail"** button (top right of Activity Log)
3. The system pulls the last 30 days of emails between you and this prospect
4. Emails appear in the Activity Log timeline

**What gets synced:**
- Sent emails TO this person
- Received emails FROM this person
- Only relevant correspondence — not your whole inbox

### Sending Email from CRM
1. Open a prospect's detail panel
2. Click the **Email** button at bottom
3. Compose your message (or use a template)
4. Click **Send**

The email sends from your connected Gmail and logs automatically.

---

## 📤 Outreach (Sequences)

Sequences are automated multi-step email campaigns.

### Templates
Reusable email drafts with merge fields:
- `{{firstName}}` — Prospect's first name
- `{{company}}` — Company name
- `{{title}}` — Job title

**To create a template:**
1. Go to **Outreach** → **Templates** tab
2. Click **New Template**
3. Write your email with merge fields
4. Save

### Sequences
A sequence is a series of emails sent over time.

**Example 3-step sequence:**
- Day 1: Initial outreach
- Day 3: Follow-up if no reply
- Day 7: Final touch

**To create a sequence:**
1. Go to **Outreach** → **Sequences** tab
2. Click **New Sequence**
3. Add steps with your templates
4. Set day delays between each step
5. Save

### Enrolling Prospects
1. On a prospect's detail panel, click **Sequence** button
2. Select which sequence to enroll them in
3. They'll automatically receive emails on schedule

**Auto-stop on reply:** If a prospect replies, they're automatically removed from the sequence.

### Queue
Before emails send, they appear in the **Queue** tab for review:
- Edit if needed
- Approve to send
- Skip to cancel that email

---

## 📊 Activities

The Activities screen shows a unified timeline of all touchpoints across all prospects.

### Activity Types
- 📧 **Email** — Sent/received emails
- 📞 **Call** — Phone calls
- 💼 **LinkedIn** — LinkedIn messages
- 📅 **Meeting** — Scheduled meetings
- 📝 **Note** — Manual notes you add

### Logging an Activity
1. Open a prospect's detail panel
2. Click **+ Log Activity** (or the specific action button)
3. Select type, add notes, save

### Daily Stats
The Activities page shows quick metrics:
- Activities today
- Activities this week
- Reply rate

---

## ✅ Tasks

Tasks are follow-up reminders tied to prospects.

### Creating a Task
1. On a prospect's detail panel, click **Task** button or go to Tasks page
2. Set:
   - **Type**: Follow Up, Send Email, Schedule Meeting, LinkedIn Outreach, Research
   - **Due Date**
   - **Priority** (Low/Medium/High)
   - **Notes**
3. Save

### Managing Tasks
- **Tasks page** shows all pending tasks
- **Overdue** tasks show in red
- Click a task to open the linked prospect
- Check off when complete

---

## ⚙️ Settings

### Gmail
- Connect/disconnect your Gmail account
- Sending limits (emails per day/hour)

### Apollo
- Enter your Apollo API key for search integration

### Theme
- Light or Dark mode

---

## Quick Tips

1. **Start each day** by checking Tasks for overdue items
2. **After calls**, log them immediately with notes
3. **Use sequences** for cold outreach — saves time on follow-ups
4. **Sync Gmail** before meetings to review recent correspondence
5. **Tag prospects** to organize by campaign or source
6. **Update stages** as deals progress to keep pipeline accurate

---

## Getting Help

Questions? Reach out to Rob or check the Activity Log for examples of how others are using the system.

Happy selling! 🎯
