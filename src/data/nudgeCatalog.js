// src/data/nudgeCatalog.js
//
// Catalog of common boss-issue patterns for the Constructive Nudges lab tool.
// Each entry pairs an observable behavior with concrete improvement suggestions
// the recipient can act on, and a list of LeaderReps Reps / R&Rs that address
// the underlying skill gap.
//
// Used by:
//   - src/components/admin/NudgeLeadMagnet.jsx (composer)
//   - functions/index.js (sendNudge — to enrich the outbound email)
//
// Keep entries short, behavior-focused (not personality-focused), and phrased
// so they can be combined into a single constructive message without sounding
// like an attack list.

export const NUDGE_CATEGORIES = [
  { id: 'communication', label: 'Communication' },
  { id: 'feedback', label: 'Feedback & Recognition' },
  { id: 'decisions', label: 'Decisions & Direction' },
  { id: 'trust', label: 'Trust & Autonomy' },
  { id: 'wellbeing', label: 'Team Well-being' },
  { id: 'meetings', label: 'Meetings & Time' },
  { id: 'growth', label: 'Development & Growth' },
];

export const NUDGE_ISSUES = [
  // ── Communication ─────────────────────────────────────────────
  {
    id: 'doesnt-listen',
    category: 'communication',
    label: 'Doesn’t feel heard in conversations',
    issue:
      'Team members feel interrupted or dismissed when raising issues, and walk away unsure whether their input registered.',
    improvements: [
      'Pause for three seconds after someone finishes a thought before responding.',
      'Reflect back what you heard before reacting — “What I’m hearing is X. Did I get that right?”',
      'Take notes during 1:1s so people see their input is being captured.',
    ],
    suggestedReps: ['Active Listening Rep', 'Powerful Questions Rep'],
  },
  {
    id: 'vague-expectations',
    category: 'communication',
    label: 'Expectations are unclear',
    issue:
      'Direction shifts often, and the team isn’t always sure what “done” looks like or what the priorities are this week.',
    improvements: [
      'End each assignment with: deliverable, due date, and definition of done.',
      'Publish the team’s top 3 priorities every Monday in one channel.',
      'Use written briefs for anything that takes more than a day.',
    ],
    suggestedReps: ['Setting Expectations Rep', 'Weekly Priorities R&R'],
  },
  {
    id: 'inconsistent-messages',
    category: 'communication',
    label: 'Messages from above don’t line up',
    issue:
      'What gets said in 1:1s, team meetings, and Slack sometimes contradicts itself, leaving people guessing which version is real.',
    improvements: [
      'Write decisions down in one shared place after they’re made.',
      'Before reversing a direction, tell the team why the change happened.',
      'Avoid contradicting yourself across audiences — pick one message.',
    ],
    suggestedReps: ['Decision Communication Rep'],
  },

  // ── Feedback & Recognition ────────────────────────────────────
  {
    id: 'no-feedback',
    category: 'feedback',
    label: 'Feedback is rare or only when something is wrong',
    issue:
      'People go long stretches without hearing how they’re doing, and feedback shows up mainly when something has gone sideways.',
    improvements: [
      'Give one piece of specific positive feedback per week, per direct report.',
      'Make “what’s one thing I could do differently for you?” a standing 1:1 question.',
      'Separate development feedback from performance reviews — keep it lightweight and ongoing.',
    ],
    suggestedReps: ['Feedback Loop Rep', 'Recognition Rep'],
  },
  {
    id: 'takes-credit',
    category: 'feedback',
    label: 'Team contributions aren’t visible upward',
    issue:
      'Wins land in front of senior leaders without the people who actually delivered them being named or recognized.',
    improvements: [
      'Name the contributor when you share a win up the chain.',
      'Forward upward-praise emails back down to the team.',
      'In status updates, attribute deliverables to people, not just to “the team.”',
    ],
    suggestedReps: ['Recognition Rep', 'Amplify Your Team R&R'],
  },

  // ── Decisions & Direction ─────────────────────────────────────
  {
    id: 'slow-decisions',
    category: 'decisions',
    label: 'Decisions take too long',
    issue:
      'Things sit in “waiting for a call” for days or weeks, and the team loses momentum on work that needs a green light.',
    improvements: [
      'Set a default decision SLA (e.g. 48 hours) and communicate it.',
      'Use a “decide / delegate / defer” triage on each open question.',
      'When deferring, say what would need to change to move it forward.',
    ],
    suggestedReps: ['Decision Velocity Rep'],
  },
  {
    id: 'reverses-decisions',
    category: 'decisions',
    label: 'Decisions get reversed without explanation',
    issue:
      'Work that was approved gets undone or redirected, and the team learns to wait rather than execute.',
    improvements: [
      'Before changing direction, share the new information that triggered it.',
      'Acknowledge the cost of the rework — don’t pretend it’s free.',
      'Distinguish a “better idea” from a “required change” when reopening a decision.',
    ],
    suggestedReps: ['Decision Communication Rep'],
  },

  // ── Trust & Autonomy ──────────────────────────────────────────
  {
    id: 'micromanages',
    category: 'trust',
    label: 'Reviews work at a level of detail that signals low trust',
    issue:
      'Drafts get rewritten line-by-line and tools / process choices get second-guessed, which slows the team down and signals they aren’t trusted to do their job.',
    improvements: [
      'Set the bar at the briefing stage, not in the rewrite.',
      'Distinguish “not how I’d do it” from “not good enough.” Only the second one is feedback.',
      'Agree up front on which decisions are yours, theirs, and shared.',
    ],
    suggestedReps: ['Delegation Rep', 'Trust Through Letting Go R&R'],
  },
  {
    id: 'no-air-cover',
    category: 'trust',
    label: 'Doesn’t shield the team from outside pressure',
    issue:
      'When pressure comes from above or from peers, it gets passed straight through to the team rather than absorbed and translated.',
    improvements: [
      'Buffer ad-hoc requests from senior stakeholders before forwarding them.',
      'Negotiate scope or timeline before saying yes on the team’s behalf.',
      'Tell the team what you said no to on their behalf — not just what got through.',
    ],
    suggestedReps: ['Air Cover Rep'],
  },

  // ── Team Well-being ───────────────────────────────────────────
  {
    id: 'always-on',
    category: 'wellbeing',
    label: 'Pings outside of working hours create pressure',
    issue:
      'Messages sent at night or on weekends land as implicit demands, even when not intended that way.',
    improvements: [
      'Use scheduled-send for non-urgent messages outside hours.',
      'Say explicitly “no response needed until Monday” when it’s true.',
      'Model boundaries by not replying to your own off-hours messages.',
    ],
    suggestedReps: ['Sustainable Pace Rep'],
  },
  {
    id: 'tone-under-stress',
    category: 'wellbeing',
    label: 'Tone gets sharp when things go wrong',
    issue:
      'Under stress, the team sees a different leader — shorter sentences, less patience — which makes people hesitant to bring problems forward early.',
    improvements: [
      'Name the stress out loud: “I’m frustrated; not at you.”',
      'Wait 10 minutes before responding to anything that triggered a reaction.',
      'Debrief after a hot moment: acknowledge the impact, not just the intent.',
    ],
    suggestedReps: ['Composure Under Pressure Rep', 'Repair Conversation R&R'],
  },

  // ── Meetings & Time ───────────────────────────────────────────
  {
    id: 'too-many-meetings',
    category: 'meetings',
    label: 'Too many meetings, too little outcome',
    issue:
      'Recurring meetings stay on the calendar past their useful life, and most leave the team unsure what was decided.',
    improvements: [
      'Audit recurring meetings quarterly — kill one for every one you add.',
      'Require every meeting to declare its decision or output up front.',
      'End each meeting with: decisions made, owners, due dates.',
    ],
    suggestedReps: ['Meeting Hygiene Rep'],
  },

  // ── Development & Growth ──────────────────────────────────────
  {
    id: 'no-career-conversations',
    category: 'growth',
    label: 'Career and growth rarely come up',
    issue:
      'Conversations stay at task level. The team doesn’t know what their next step looks like or what they’re being developed toward.',
    improvements: [
      'Add one career question to every monthly 1:1.',
      'Sponsor — don’t just mentor. Put names forward in rooms they’re not in.',
      'Co-write a one-page development plan with each direct report.',
    ],
    suggestedReps: ['Career Conversation Rep', 'Sponsorship R&R'],
  },
];

export const NUDGE_ISSUES_BY_ID = Object.fromEntries(
  NUDGE_ISSUES.map((i) => [i.id, i])
);

export const NUDGE_MAX_SELECTED = 3;
export const NUDGE_MAX_CONTEXT_CHARS = 800;
