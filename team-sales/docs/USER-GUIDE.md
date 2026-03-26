# LR-CRM User Guide

Welcome to **LR-CRM**, LeaderReps' internal sales CRM for managing prospects, outreach, and team collaboration.

---

## Table of Contents

1. [Overview](#overview)
2. [Prospects](#prospects)
3. [Apollo Search](#apollo-search)
4. [Gmail Integration](#gmail-integration)
5. [LR-Outreach (Sequences)](#lr-outreach-sequences)
6. [Activities](#activities)
7. [Tasks](#tasks)
8. [Analytics](#analytics)
9. [Settings](#settings)

---

## Overview

LR-CRM is organized around six main sections, accessible from the left sidebar:

| Section | Purpose |
|---------|---------|
| **Prospects** | View and manage your sales pipeline |
| **Apollo Search** | Find and import new leads |
| **LR-Outreach** | Email automation with templates and sequences |
| **Activities** | Track all outreach touchpoints |
| **Analytics** | Team performance and pipeline metrics |
| **Tasks** | Personal to-do list for follow-ups |
| **Settings** | Integrations and preferences |

**Keyboard Shortcut:** Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) anywhere to open the Command Palette for quick navigation.

---

## Prospects

The Prospects page is your main workspace for managing sales leads through the pipeline.

### Views

Toggle between two views using the icons in the top toolbar:

- **List View** — Table format showing all prospects with sortable columns
- **Pipeline/Kanban View** — Visual board organized by pipeline stage

### Pipeline Stages

Prospects move through these stages:

| Stage | Description |
|-------|-------------|
| **New** | Fresh leads, not yet contacted |
| **Contacted** | Initial outreach has been made |
| **Qualified** | Confirmed as a good fit |
| **Meeting** | Discovery call or demo scheduled |
| **Proposal** | Proposal sent, awaiting decision |
| **Negotiation** | Active deal discussions |
| **Won** | Closed deal |
| **Lost** | Deal did not proceed |

### Prospect Fields

Each prospect record contains:

**Basic Info:**
- First Name / Last Name
- Email
- Phone (formatted as (XXX) XXX-XXXX)
- Company
- Title

**Professional Details:**
- LinkedIn URL
- LinkedIn Status (Not Connected, Request Sent, Connected, Following)
- Industry
- Location (City, State, Country)
- Company Size

**Tracking:**
- Owner (team member responsible)
- Tags (Hot Lead, Enterprise, SMB, Decision Maker, etc.)
- Deal Value ($)
- Notes

### Filtering

Use the toolbar filters to narrow your view:

1. **Search** — Type to search by name, company, email, or title
2. **Owner Filter** — View by:
   - "My Prospects" (default) — Only prospects you own
   - "All Team" (admin only) — See everyone's prospects
   - "Unassigned" — Prospects without an owner
   - Specific team member
3. **Stage Filter** — Filter by pipeline stage

### Adding Prospects

**Manually:**
1. Click the **+ Add Prospect** button
2. Fill in the required fields (First Name is required)
3. Assign an owner and initial stage
4. Click Save

**Import from CSV:**
1. Click **Import CSV**
2. Upload a CSV file with prospect data
3. Map columns to fields
4. Review and confirm import

**From Apollo Search:**
See the [Apollo Search](#apollo-search) section below.

### Prospect Detail Panel

Click any prospect to open the detail panel on the right side:

**Header Actions:**
- Change pipeline stage
- Assign/reassign owner
- Delete prospect
- Enrich with Apollo data

**Tabs:**
- **Tracking** — LinkedIn status, tags, sequence status
- **Contact** — Edit contact information
- **Tasks** — Tasks specific to this prospect
- **Activity** — Timeline of all interactions

**Quick Actions:**
- Log a call, email, LinkedIn message, or meeting
- Add notes
- Create a follow-up task
- Enroll in email sequence

---

## Apollo Search

Apollo Search integrates with Apollo.io to find and import new prospects.

### Setup

1. Go to **Settings**
2. Enter your Apollo.io API key
3. Save

### Search Modes

- **People Search** — Find individual contacts by job title, seniority, location
- **Company Search** — Find organizations by industry, size, location

### Search Filters

**For People:**
- Job Titles (e.g., "VP Sales", "CEO")
- Seniority Level (C-Suite, VP, Director, Manager, etc.)
- Department (Sales, Marketing, Engineering, etc.)
- Location (City, State, Country)
- Company Size

**For Companies:**
- Industry
- Company Size
- Location
- Keywords

### Advanced Filters

Click "Show Advanced Filters" for additional criteria:
- Revenue range
- Technologies used
- Funding status

### Working with Results

1. **Select** — Check boxes to select one or more results
2. **Select All** — Select all visible results
3. **Enrich** — Get additional data (email, phone) using Apollo credits
4. **Import** — Add selected contacts to your CRM as prospects

**Duplicate Detection:** The system automatically detects and skips contacts that already exist in your CRM (matched by Apollo ID, email, or LinkedIn URL).

### Credits

Apollo searches and enrichment use API credits. Your current usage is shown in the top-right corner.

---

## Gmail Integration

Connect Gmail accounts to send emails directly from the CRM and sync email history.

### Connecting Gmail

1. Go to **Settings**
2. In the Gmail Integration section, click **Connect Gmail**
3. A popup will open for Google OAuth
4. Sign in and grant permissions
5. Once connected, the account appears in your list

**Note:** Gmail accounts are connected at the team level — all team members with admin access can use connected accounts for sending.

### What Gets Synced

- **Sent emails** to prospect email addresses
- **Received emails** from prospects
- Email threads appear in the prospect's Activity timeline

### Sending Emails

From a prospect's detail panel:
1. Click the **Email** action
2. Select a connected Gmail account as the sender
3. Choose a template or write a custom message
4. Review and send

Or use the [LR-Outreach](#lr-outreach-sequences) system for automated sequences.

### Sending Limits

Admins can configure daily/hourly sending limits in Settings to prevent hitting Gmail's rate limits.

---

## LR-Outreach (Sequences)

LR-Outreach is the built-in email automation engine for multi-step outreach campaigns.

### Concepts

| Term | Definition |
|------|------------|
| **Template** | A reusable email with subject and body |
| **Sequence** | A series of steps (emails) sent over time |
| **Enrollment** | A prospect actively going through a sequence |
| **Queue** | Pending emails awaiting approval before sending |

### Templates

Create reusable email templates for consistency:

1. Go to **LR-Outreach** > **Templates** tab
2. Click **+ New Template**
3. Enter:
   - Template name
   - Category (Cold Outreach, Follow Up, Meeting Request, etc.)
   - Subject line
   - Email body

**Personalization Variables:**
Use double curly braces for merge fields:
- `{{firstName}}` — Prospect's first name
- `{{lastName}}` — Prospect's last name
- `{{company}}` — Prospect's company
- `{{title}}` — Prospect's job title
- `{{email}}` — Prospect's email

### Sequences

Build multi-step email campaigns:

1. Go to **LR-Outreach** > **Sequences** tab
2. Click **+ New Sequence**
3. Configure:
   - Sequence name
   - Description
   - Steps (add multiple email steps)

**Step Settings:**
- **Day** — Days after enrollment to send (Day 0 = immediately)
- **Channel** — Email, LinkedIn, Call, Text
- **Template** — Select from your templates
- **Subject** — Override template subject if needed

**Sequence Settings:**
- **Stop on Reply** — Automatically pause if prospect replies
- **Send Window** — Hours when emails can be sent (e.g., 8 AM - 6 PM)
- **Weekdays Only** — Skip weekends

**A/B Testing:**
Add variants to a step to test different messages. Set weight percentages for each variant.

### Enrolling Prospects

1. Open a prospect's detail panel
2. Click the **⚡ Add to Sequence** button
3. Select a sequence
4. Review personalization variables
5. Choose immediate or delayed start
6. Click Enroll

### The Queue

The **Queue** tab shows all emails pending review:

1. Review the personalized email preview
2. Select a Gmail account to send from
3. Choose:
   - **Send** — Approve and send immediately
   - **Skip** — Skip this step, advance to next
   - **Edit** — Modify subject/body before sending

**Check for Replies:** Click the refresh button to scan connected Gmail accounts for new replies, which automatically pause enrollments.

### Automations/Enrollments

The **Automations** tab shows all active sequence enrollments:

- Status (Active, Paused, Completed, Replied, Bounced)
- Current step progress
- Next scheduled email
- Pause/Resume controls

---

## Activities

The Activities page provides a unified timeline of all outreach across your prospects.

### Activity Types

| Type | Icon | Description |
|------|------|-------------|
| Email Sent | ✉️ | Outbound email |
| Email Received | 📥 | Reply from prospect |
| Phone Call | 📞 | Call attempt (with outcome) |
| LinkedIn Connect | 🔗 | Connection request |
| LinkedIn Message | 💬 | LinkedIn direct message |
| Meeting | 📅 | Scheduled meeting |
| Text/SMS | 💬 | Text message |
| Note | 📝 | Internal note |

### Logging Activities

**Quick Log:**
1. Click **Log Activity** button
2. Select channel type
3. Choose the prospect
4. Select outcome
5. Add notes
6. Save

**From Prospect Detail:**
Use the quick action buttons to log calls, emails, LinkedIn touches, or meetings directly on a prospect's record.

### Filtering

- **Channel Filter** — Show only specific activity types
- **Outcome Filter** — Filter by outcome (Sent, Replied, Meeting Booked, etc.)

### Stats

Quick stats at the top show:
- Activities logged today
- Activities this week
- Reply rate

---

## Tasks

Personal task management for follow-ups and reminders.

### Task Fields

- **Title** — What needs to be done
- **Type** — Follow Up, Send Email, Schedule Meeting, LinkedIn Outreach, Research, Other
- **Priority** — Low, Medium, High
- **Due Date** — When it's due
- **Prospect** — Optional link to a prospect

### Creating Tasks

1. Click **+ New Task**
2. Enter task details
3. (Optional) Link to a prospect
4. Save

**From Prospect Detail:**
Click "Add Task" in a prospect's Tasks section to create a task pre-linked to that prospect.

### Task Views

Filter tasks by:
- **Active** — All incomplete tasks
- **Today** — Due today
- **Upcoming** — Due in the future
- **Overdue** — Past due date
- **Completed** — Finished tasks

### Completing Tasks

Click the circle checkbox to mark complete. Completed tasks move to the Completed filter.

### Alerts

The badge on the Tasks nav item shows:
- 🔴 Red badge for overdue tasks
- 🟡 Yellow badge for tasks due today

---

## Analytics

Team performance metrics and pipeline health.

### Date Ranges

Select a time period: 7 Days, 30 Days, 90 Days, or All Time.

### Metrics Displayed

**Activity Stats:**
- Total activities by time period
- Channel breakdown (Email, LinkedIn, Calls, SMS)
- Reply rates

**Pipeline Stats:**
- Prospects by stage (funnel visualization)
- Deal value by stage
- Conversion rates

**Team Leaderboard:**
- Activities per team member
- Prospects owned per member

---

## Settings

Configure integrations and preferences.

### Theme

Toggle between Light and Dark mode.

### Apollo.io Integration

- **API Key** — Enter your Apollo.io API key
- **Credits Used** — View your credit consumption
- **Remove Key** — Disconnect Apollo integration

### Gmail Integration

- **Connect Gmail** — Add a new Gmail account via OAuth
- **Connected Accounts** — List of linked accounts with disconnect option
- **Sending Limits** — Configure max emails per day/hour

### LinkedHelper Integration (Advanced)

For users with LinkedHelper:
- **API Key** — Connect LinkedHelper for LinkedIn automation
- Push prospects to LinkedHelper campaigns

---

## Tips & Best Practices

1. **Claim Your Prospects** — Always assign an owner to new prospects
2. **Log Everything** — Activities create a clear history and help with team visibility
3. **Use Templates** — Consistent messaging with personalization variables
4. **Check the Queue Daily** — Review pending sequence emails before they're sent
5. **Tag Strategically** — Use tags like "Hot Lead" or "Decision Maker" for quick filtering
6. **Set Follow-up Tasks** — After every call or meeting, create a task for next steps

---

## Need Help?

Contact your team admin or check the technical documentation in `/team-sales/docs/`.
