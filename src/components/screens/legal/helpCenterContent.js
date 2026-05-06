// src/components/screens/legal/helpCenterContent.js
//
// Help Center knowledge base — written from the live code, not legacy docs.
// Every article describes a feature that actually exists in the current
// Ascent Revamp UI (sidebar items: Dashboard, Events, Content, Conditioning,
// Ask a Coach, Your Locker + RepUp floating button + Settings).
//
// If a feature is not yet shipped (e.g., Ascent pillars, milestones, daily
// "bookends", grounding rep, four-core-rep taxonomy), it does NOT have an
// article. We will add articles when those features go live.
//
// Article schema:
//   { id, title, summary, readTime, featured?, content (Markdown string),
//     relatedArticles: [articleId, ...] }
//
// Category schema:
//   { id, category, categoryId, icon, color, description, articles: [...] }

import {
  Zap,
  Compass,
  Calendar,
  Megaphone,
  BookOpen,
  Award,
  Settings,
  Lightbulb,
} from 'lucide-react';

export const HELP_ARTICLES = {
  // ──────────────────────────────────────────────────────────────────────────
  'getting-started': {
    id: 'getting-started',
    category: 'Getting Started',
    categoryId: 'getting-started',
    icon: Compass,
    color: 'emerald',
    description: 'New here? Start with these.',
    articles: [
      {
        id: 'what-is-leaderreps',
        title: 'What is LeaderReps?',
        summary: 'The short version: practice the leadership reps that matter, get coaching, see your history.',
        readTime: 2,
        featured: true,
        content: `
## What is LeaderReps?

LeaderReps is a leadership practice platform. Instead of one-shot training, you work on real leadership behaviors through small reps and coaching.

## What you can do today

- **Practice a Rep** — Write up a rep you ran (or want to run), get an instant Pass / Not Yet read on it.
- **Events** — Join live coaching and community sessions.
- **Ask a Coach** — Send a question to a real coach and get a short video reply.
- **Content** — Read & Reps, Videos, Documents, and Tools you can apply at work.
- **Your Locker** — Your history of reps, reflections, and account settings.
- **RepUp** — A floating AI coach available across the app.

## How to get the most out of it

1. Fill out your profile so coaches and the AI know your context.
2. Practice a rep this week — it takes a few minutes.
3. Drop into one Event or send one question through Ask a Coach.

The platform rewards consistency, not intensity. A few real reps a week beats a binge every month.
        `,
        relatedArticles: ['leader-profile', 'practice-a-rep', 'ask-a-coach'],
      },
      {
        id: 'leader-profile',
        title: 'Setting up your profile',
        summary: 'Where your name, email, and account settings live.',
        readTime: 1,
        content: `
## Your profile

Your profile is in **Settings** (avatar menu in the top bar, or "My Settings" in Your Locker).

You'll see:

- **Full Name** — set when you created your account.
- **Email** — your sign-in address.
- **Last sign-in** — when you were last active.

To change your password, use the **Reset Password** button — we'll email you a secure reset link.
        `,
        relatedArticles: ['account-settings', 'notifications'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'practice': {
    id: 'practice',
    category: 'Practice a Rep',
    categoryId: 'practice',
    icon: Zap,
    color: 'orange',
    description: 'How the Conditioning practice works.',
    articles: [
      {
        id: 'practice-a-rep',
        title: 'How Practice a Rep works',
        summary: 'Pick a rep type, describe what happened, get a Pass / Not Yet verdict with specific feedback.',
        readTime: 3,
        featured: true,
        content: `
## What it is

**Practice a Rep** lives on the **Conditioning** screen. It's a quick way to get feedback on a leadership rep — either one you just ran or one you're rehearsing.

## How it works

1. Open **Conditioning** from the sidebar.
2. Tap **Practice a Rep**.
3. Pick one of four rep types (see below).
4. Describe the rep in the text box — or tap the mic and speak it. The more specific the better (what was said, by whom, what changed).
5. Tap **Submit**. Our engine reads what you wrote and returns:
   - A **Pass** or **Not Yet** badge.
   - **Quick Read** pills (Strong / Adequate / Weak / Missing) for each part of the rep.
   - One short observation, plus one question if anything wasn't Strong.

There are no numeric scores shown, by design. The point is the read, not the number.

## Where it's saved

Every rep you submit is saved to **Your Locker** under your practice history. You can scroll back and reread your reps any time.
        `,
        relatedArticles: ['rep-types', 'why-not-yet', 'locker'],
      },
      {
        id: 'rep-types',
        title: 'The four rep types',
        summary: 'DRF, RED, FUW, SCE — what each one is and when to use it.',
        readTime: 3,
        featured: true,
        content: `
## The four rep types

Practice a Rep covers four foundational leadership behaviors:

### DRF — Reinforcing Feedback
Catch a specific behavior, name the impact, reinforce it so it repeats. Use this when someone did something well and you want more of it.

### RED — Redirecting Feedback
Name the behavior, name the impact, and make a clear request — directly. Use this when something needs to change.

### FUW — Follow-Up on Work
Anchor follow-up to a specific piece of work, surface progress, and keep ownership clear. Use this for status check-ins that actually move things forward.

### SCE — Set Clear Expectations
Name the expectation, define what success looks like, and confirm who owns delivering it. Use this at the start of any new piece of work.

## Picking one

If you're not sure, pick the one that matches the conversation you most recently had — or the one you've been avoiding.
        `,
        relatedArticles: ['practice-a-rep', 'why-not-yet'],
      },
      {
        id: 'why-not-yet',
        title: 'Why did I get "Not Yet"?',
        summary: 'The most common reasons a rep falls short of Pass.',
        readTime: 2,
        content: `
## "Not Yet" isn't a fail

A **Not Yet** verdict means one or more parts of the rep were missing or weak. It's a read, not a grade.

Look at the **Quick Read** pills under the verdict. Anything marked **Weak** or **Missing** is the part to tighten next time.

## Common reasons

- **Vague behavior** — "She did a great job" is not a behavior. "She rewrote the deck after I gave her the new audience" is.
- **No impact named** — Tell the person *why* it mattered (to the customer, the team, the deliverable).
- **No clear request (RED)** — A redirect without a specific ask is just a complaint.
- **No success criteria (SCE)** — If you didn't say what done looks like, it isn't a real expectation.
- **No ownership confirmed (FUW / SCE)** — Who owns the next step? When?

## What to do

Re-run the rep. Submit a tighter version. Two or three iterations on the same rep is normal and useful.
        `,
        relatedArticles: ['practice-a-rep', 'rep-types'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'events': {
    id: 'events',
    category: 'Events',
    categoryId: 'events',
    icon: Calendar,
    color: 'blue',
    description: 'Live coaching and community sessions.',
    articles: [
      {
        id: 'events-overview',
        title: 'Events: coaching + community in one place',
        summary: 'Browse upcoming sessions, register, and join when it\'s time.',
        readTime: 2,
        featured: true,
        content: `
## What you'll see

**Events** is the unified place for live sessions. It shows both **Coaching** sessions (with a trainer) and **Community** sessions (with peers). A small badge on each card tells you which is which.

## The three tabs

- **Upcoming** — Everything coming up. Filter by **All / Coaching / Community / This Week / Open Spots**.
- **My Events** — Just the ones you're registered for, with an Upcoming / Past toggle.
- **Calendar** — Month view, with dots on the days that have sessions.

## Registering and cancelling

- Tap **Register** on any session card with open spots.
- Tap **Cancel** on a session you're registered for to free up your spot.
- Sessions with a capacity cap will say "Full" once they hit the limit.
        `,
        relatedArticles: ['joining-event', 'ask-a-coach'],
      },
      {
        id: 'joining-event',
        title: 'Joining a live event',
        summary: 'The Join button appears 15 minutes before start.',
        readTime: 1,
        content: `
## When can I join?

The **Join** button on an event you're registered for becomes active **15 minutes before the start time** (and stays active until the session ends).

If you don't see Join yet, you're early — the card will update on its own when it's time.

## What if I missed it?

Past events show in **My Events → Past**. If a session has a recording, the card will link to it after the event ends.
        `,
        relatedArticles: ['events-overview'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'ask-a-coach': {
    id: 'ask-a-coach',
    category: 'Ask a Coach',
    categoryId: 'ask-a-coach',
    icon: Megaphone,
    color: 'teal',
    description: 'Get a short video reply from a real coach.',
    articles: [
      {
        id: 'ask-a-coach',
        title: 'How Ask a Coach works',
        summary: 'Post a question, a coach responds with a short video.',
        readTime: 2,
        featured: true,
        content: `
## What it is

**Ask a Coach** is for the questions you don't want to wait for an event to ask. You post a question; a real LeaderReps coach reviews it and replies with a short video.

## What to include

When you submit a question, you'll see fields for:

- **Title** — A short, scannable summary.
- **Question** — The actual question you want answered.
- **Context (optional)** — Anything the coach should know: the situation, who's involved, what you've already tried.
- **Tag (optional)** — Pick a rep type if your question is about one (Reinforcing Feedback, Redirecting Feedback, Follow-Up on Work, Set Clear Expectations).

## Question status

Each question shows a status pill:

- **Awaiting reply** — Submitted, waiting for a coach.
- **Answered** — A coach has replied. Tap the card to watch the video.
- **Cancelled** — You cancelled the question before it was answered.

You can have more than one open question, but we suggest keeping one at a time so each gets your full attention when it comes back.

## Why video, not text?

Coaches reply with video so you get tone, nuance, and specific phrasing — the parts that matter most for leadership skill. There's no text reply to read.
        `,
        relatedArticles: ['events-overview', 'rep-types'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'content': {
    id: 'content',
    category: 'Content',
    categoryId: 'content',
    icon: BookOpen,
    color: 'blue',
    description: 'Read & Reps, Videos, Documents, Tools.',
    articles: [
      {
        id: 'content-overview',
        title: 'What\'s in Content',
        summary: 'Four pillars: Read & Reps, Videos, Documents, Tools.',
        readTime: 2,
        featured: true,
        content: `
## The Content tabs

The **Content** screen organizes everything into four pillars:

- **Read & Reps** — Curated readings paired with a short exercise to apply what you read.
- **Videos** — Leadership videos, talks, and curated playlists.
- **Documents** — Reference materials, guides, and whitepapers.
- **Tools** — Checklists, templates, and job aids you can use immediately at work.

## How to use it

Content is built to be applied, not consumed. The fastest path:

1. Find one Read & Rep that matches what you're working on this month.
2. Do the rep, not just the reading.
3. If it goes anywhere interesting, **Practice a Rep** about it on the Conditioning screen.

If you can't find what you need, **Ask a Coach** — coaches often link you to the right piece.
        `,
        relatedArticles: ['practice-a-rep', 'ask-a-coach'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'locker': {
    id: 'locker',
    category: 'Your Locker',
    categoryId: 'locker',
    icon: Award,
    color: 'amber',
    description: 'Your history and personal settings.',
    articles: [
      {
        id: 'locker',
        title: 'What\'s in Your Locker',
        summary: 'Your practice history, conditioning history, and account settings.',
        readTime: 2,
        featured: true,
        content: `
## What it is

**Your Locker** is your personal space. It holds the history of what you've done and quick links to your account.

## What you'll find

- **Practice a Rep history** — Every rep you've submitted on the Conditioning screen, with the verdict and the Quick Read pills.
- **Conditioning history** — Reps tracked over time so you can see patterns.
- **My Settings** — Quick access to your profile, password reset, and notification preferences.

## Why it matters

The Locker is where consistency becomes visible. Coming back and reading old reps is one of the highest-leverage things you can do — you'll see your own thinking change.
        `,
        relatedArticles: ['practice-a-rep', 'account-settings'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'account': {
    id: 'account',
    category: 'Account & Settings',
    categoryId: 'account',
    icon: Settings,
    color: 'slate',
    description: 'Profile, password, notifications.',
    articles: [
      {
        id: 'account-settings',
        title: 'Profile and password',
        summary: 'Where to find your account info and reset your password.',
        readTime: 1,
        content: `
## Where it lives

Open **Settings** from the avatar menu in the top bar (or **My Settings** inside Your Locker).

## What you can do

- **View your name and email** (set at signup).
- **Reset your password** — tap the button and we'll email you a secure reset link.
- **See your last sign-in** time.

If your name or email is wrong, contact support — we'll fix it for you.
        `,
        relatedArticles: ['leader-profile', 'notifications'],
      },
      {
        id: 'notifications',
        title: 'Push notifications',
        summary: 'Turn browser/app notifications on or off.',
        readTime: 1,
        content: `
## How it works

Push notifications are on a single toggle in **Settings**:

- **Enabled** — You'll get the occasional reminder.
- **Disabled** — You won't get any push notifications.
- **Blocked** — Your browser or device blocked notifications. Re-enable them in your browser/OS settings, then come back to this screen.

If your device or browser doesn't support push notifications, the section will say so.
        `,
        relatedArticles: ['account-settings'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'troubleshooting': {
    id: 'troubleshooting',
    category: 'Troubleshooting',
    categoryId: 'troubleshooting',
    icon: Lightbulb,
    color: 'red',
    description: 'Stuck? Try these first.',
    articles: [
      {
        id: 'practice-rep-failed',
        title: 'My Practice a Rep didn\'t score',
        summary: 'What to do if the engine errors or hangs.',
        readTime: 1,
        content: `
## First, try again

If a rep submission errors or hangs, tap **Try Again**. Most failures are transient.

## If it still fails

- Check your internet connection.
- Make sure you wrote at least a sentence or two — very short submissions can fail.
- Refresh the page and resubmit. Your draft text isn't saved automatically, so copy it before refreshing if you wrote a lot.

If the issue persists, contact support with the rep type you were submitting and the time it happened.
        `,
        relatedArticles: ['practice-a-rep', 'contact-support'],
      },
      {
        id: 'session-full',
        title: 'A session shows "Full"',
        summary: 'What to do when an event hits capacity.',
        readTime: 1,
        content: `
## Why it happens

Some sessions have a capacity cap. Once that's reached, the **Register** button changes to **Full**.

## What to do

- Check **Events → Upcoming** for the next session of the same type.
- Use **Ask a Coach** for the question that prompted you — you'll often get an answer faster than the next live session.
        `,
        relatedArticles: ['events-overview', 'ask-a-coach'],
      },
      {
        id: 'cant-find-content',
        title: 'I can\'t find a piece of content',
        summary: 'Where to look and who to ask.',
        readTime: 1,
        content: `
## Try this first

- Open **Content** and check each tab: **Read & Reps**, **Videos**, **Documents**, **Tools**.
- Use the search bar at the top of the Help Center for the topic you're after.

## If you still can't find it

Send a question through **Ask a Coach** — coaches often know where the right piece lives, or can point you to a session that covers it.
        `,
        relatedArticles: ['content-overview', 'ask-a-coach'],
      },
      {
        id: 'contact-support',
        title: 'Contact support',
        summary: 'Email us when you need a human.',
        readTime: 1,
        content: `
## We\'re here

For anything not covered here, email us at **team@leaderreps.com**. Include:

- What you were trying to do.
- What happened instead.
- A screenshot if you have one.

We read everything and reply within one business day.
        `,
        relatedArticles: [],
      },
    ],
  },
};

// Articles surfaced as "Popular" on the Help Center home.
export const POPULAR_ARTICLE_IDS = [
  'practice-a-rep',
  'rep-types',
  'events-overview',
  'ask-a-coach',
  'content-overview',
  'what-is-leaderreps',
];

export default HELP_ARTICLES;
