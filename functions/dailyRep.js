/**
 * The Daily Rep - public SMS coaching nudges.
 *
 * One short, single-sentence prompt sent to opted-in subscribers each US weekday
 * at 10 AM Eastern. No links, no homework - just a nudge. STOP/HELP handled by
 * the inbound Telnyx webhook (see `telnyxInboundWebhook` in index.js).
 *
 * Subscriber consent + delivery tracking:
 *   - sms_opt_ins: { phone, consent: bool, unsubscribed?: bool, ... }
 *   - daily-rep-sends/{YYYY-MM-DD}: idempotency + per-day delivery counts
 *   - daily-rep-prompts: optional Firestore overrides keyed by index
 *
 * Telnyx 10DLC campaign CPNJ6BU (Brand: LeaderReps) provisioned 22 Apr 2026.
 */

const Telnyx = require("telnyx");
const logger = require("firebase-functions/logger");

// Program epoch - day 0 of the rotation. Pinned so re-deploys don't shuffle.
const DAILY_REP_EPOCH = new Date(Date.UTC(2026, 3, 23)); // 2026-04-23 UTC

// ----------------------------------------------------------------------------
// Prompt corpus - 75 prompts covering accountability, follow-through, clarity,
// candor, ownership, recovery, and small-rep leadership behaviors. Edit in
// Firestore (`daily-rep-prompts/{index}`) without redeploying - see
// resolvePromptForToday().
// ----------------------------------------------------------------------------
const PROMPTS = [
  // Clarity / expectations
  "Pick your most important goal this week. Write the one sentence that says what 'done' looks like.",
  "Today, ask one direct report: what does done look like for your top priority?",
  "Before your next 1:1, list the 3 outcomes you expect from them this week. Share them out loud.",
  "Send one message that replaces 'soon' with a specific date.",
  "Find one expectation you've been hinting at. Say it plainly today.",
  "Name the one priority you'd defend if everything else slipped this week.",
  "Reread the last assignment you delegated. Is the deadline crystal clear? Fix it if not.",
  "Pick a recurring meeting. Write its one-sentence purpose. If you can't, change it or kill it.",
  "What's one thing your team thinks is optional that you actually need? Tell them today.",
  "Identify one 'we should' from last week. Convert it to a who and a when.",

  // Follow-through / accountability
  "Open your last team meeting notes. Pick one commitment that's gone quiet. Follow up today.",
  "Look at last Friday's promises - yours and theirs. What got done? What didn't?",
  "Pick one task you've moved twice. Either schedule it for this week or kill it on purpose.",
  "Think of a deadline that quietly slipped. Acknowledge it out loud to someone today.",
  "What's one ball you've dropped in the last two weeks? Make the recovery call today.",
  "Find a commitment you made to yourself last month. Score yourself honestly: did you keep it?",
  "Send a 2-line status update on something you owe - even if it's not done yet.",
  "Pick one open loop with your boss. Close it or give a real ETA today.",
  "Review the last decision you made. Did you follow through, or did it become a nice idea?",
  "Identify one agreement you let slide because it was uncomfortable. Reset it today.",

  // Candor / hard conversations
  "Think of the conversation you've been avoiding. Schedule it on the calendar today.",
  "Give one piece of feedback today you've been saving up. Be specific. Be kind.",
  "Tell one person what you actually think about their last piece of work.",
  "Name the elephant in your team that everyone sees and no one names.",
  "Where are you trading honesty for harmony? Pick one spot and tell the truth this week.",
  "Ask one person: 'What's one thing I do that gets in your way?' Don't defend the answer.",
  "Think of someone who needs a hard truth from you. Write the opening sentence today.",
  "Where did you say 'fine' this week when you meant something else? Go back and clarify.",
  "Send one message that starts with 'I was wrong about...' or 'I changed my mind because...'",
  "Pick a conflict you've been routing around. Walk straight at it today.",

  // Ownership / no-blame leadership
  "What's one outcome you've been blaming on circumstances? Take ownership of one piece of it today.",
  "Find a place you said 'they' when you should've said 'I'. Rewrite it in your head.",
  "Pick a team result this week. If it slipped, what did you not do that you could have?",
  "Where are you waiting for permission you don't actually need?",
  "Name one thing you control today that you've been treating as someone else's job.",
  "What standard have you stopped enforcing because it was tiring? Reset it today.",
  "Where have you been managing optics instead of fixing the underlying problem?",
  "Identify one excuse you've used twice this month. Retire it.",
  "Pick a team behavior you tolerate but don't endorse. Address it today.",
  "Where have you been hoping a problem solves itself? Step in today.",

  // Recovery / repair
  "Apologize for one thing today - small or large. No excuses, no caveats.",
  "Think of someone you've been short with. Reach out and reset.",
  "What's a relationship at work that's gone slightly cold? Send one warm message today.",
  "Where did you overreact this week? Acknowledge it with the person who saw it.",
  "Pick one promise you broke. Name it, repair it, recommit to it.",
  "Send a thank-you to someone whose work you've taken for granted.",
  "Think of feedback you brushed off recently. Go back and tell the giver they were right.",
  "Re-engage one person you've stopped checking in with.",

  // Reflection / self-awareness
  "Where did your energy go this week? Was it where your priorities were?",
  "What did you spend time on yesterday that didn't matter today?",
  "Identify the meeting that drained you most last week. Either fix it or stop attending.",
  "What's one thing you're doing because you've always done it?",
  "When did you last say no to something you wanted to say no to?",
  "Where are you confusing being busy with being valuable?",
  "What did you learn last week that you haven't applied yet?",
  "Score yourself 1–10 on follow-through this week. What would make it a 9?",

  // Small-rep behaviors
  "In your next meeting, ask one clarifying question before reacting.",
  "Today, end one conversation with: 'What do you need from me by when?'",
  "Make one decision today you've been deferring. Even an imperfect call beats a stalled one.",
  "Replace one 'I think we should' with 'I've decided we will' today.",
  "In your next 1:1, spend the first 5 minutes only listening.",
  "Write one note of recognition today. Specific, in writing, public if possible.",
  "Cut one meeting from your week. Send the cancellation today.",
  "Today, follow up on one thing within 24 hours of someone asking.",
  "Reply to one message you've been avoiding. Do it before noon.",
  "End your day by writing tomorrow's one most important rep.",

  // Strategic discipline
  "What's the one number you'd track if you could only track one this quarter?",
  "Look at your calendar this week. What does it say your priorities actually are?",
  "Cut one item from your to-do list because it's not actually yours to do.",
  "Pick the quarter's biggest risk. Who's actively working on it right now?",
  "Where are you optimizing for activity over progress?",
  "What would you stop doing this month if you had to free up 5 hours?",
  "Identify one project that's drifted. Either re-charter it or shut it down.",
  "Where is your team busy on things that don't move the needle?",

  // Closing rep
  "One small rep, done today, beats a perfect plan written for Monday. What's yours?",
];

const PROMPT_COUNT = PROMPTS.length;

/**
 * Resolve today's prompt - checks Firestore overrides first, falls back to the
 * built-in corpus. Index = days since DAILY_REP_EPOCH (mod count).
 *
 * @param {admin.firestore.Firestore} db
 * @param {Date} now
 * @returns {Promise<{ index: number, text: string, source: 'firestore'|'builtin' }>}
 */
async function resolvePromptForToday(db, now) {
  const dayMs = 24 * 60 * 60 * 1000;
  const daysSinceEpoch = Math.floor((now.getTime() - DAILY_REP_EPOCH.getTime()) / dayMs);
  const index = ((daysSinceEpoch % PROMPT_COUNT) + PROMPT_COUNT) % PROMPT_COUNT;

  try {
    const snap = await db.collection('daily-rep-prompts').doc(String(index)).get();
    if (snap.exists) {
      const data = snap.data();
      if (data && data.active !== false && typeof data.text === 'string' && data.text.trim()) {
        return { index, text: data.text.trim(), source: 'firestore' };
      }
    }
  } catch (err) {
    logger.warn(`daily-rep-prompts lookup failed for index ${index}: ${err.message}`);
  }

  return { index, text: PROMPTS[index], source: 'builtin' };
}

// ----------------------------------------------------------------------------
// US federal holiday detection (with weekend → observed Mon/Fri shift).
// ----------------------------------------------------------------------------

/** Nth occurrence of `weekday` (0=Sun..6=Sat) in given month. */
function nthWeekdayOfMonth(year, monthIndex, weekday, n) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, monthIndex, 1 + offset + (n - 1) * 7));
}

/** Last occurrence of `weekday` in given month. */
function lastWeekdayOfMonth(year, monthIndex, weekday) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  const offset = (lastDay.getUTCDay() - weekday + 7) % 7;
  return new Date(Date.UTC(year, monthIndex, lastDay.getUTCDate() - offset));
}

/** Shift weekend holidays to observed weekday (Sat→Fri, Sun→Mon). */
function observed(date) {
  const dow = date.getUTCDay();
  if (dow === 0) return new Date(date.getTime() + 24 * 60 * 60 * 1000); // Sun → Mon
  if (dow === 6) return new Date(date.getTime() - 24 * 60 * 60 * 1000); // Sat → Fri
  return date;
}

/** Returns YYYY-MM-DD. */
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * @param {Date} dateUtc - a Date whose UTC Y/M/D match the date in ET
 *   (because we receive these from getDateInZone()).
 */
function isUsFederalHoliday(dateUtc) {
  const y = dateUtc.getUTCFullYear();
  const observedHolidays = new Set([
    observed(new Date(Date.UTC(y, 0, 1))),                  // New Year's Day
    nthWeekdayOfMonth(y, 0, 1, 3),                          // MLK Day (3rd Mon Jan)
    nthWeekdayOfMonth(y, 1, 1, 3),                          // Presidents Day (3rd Mon Feb)
    lastWeekdayOfMonth(y, 4, 1),                            // Memorial Day (last Mon May)
    observed(new Date(Date.UTC(y, 5, 19))),                 // Juneteenth
    observed(new Date(Date.UTC(y, 6, 4))),                  // Independence Day
    nthWeekdayOfMonth(y, 8, 1, 1),                          // Labor Day (1st Mon Sep)
    nthWeekdayOfMonth(y, 9, 1, 2),                          // Columbus Day (2nd Mon Oct)
    observed(new Date(Date.UTC(y, 10, 11))),                // Veterans Day
    nthWeekdayOfMonth(y, 10, 4, 4),                         // Thanksgiving (4th Thu Nov)
    observed(new Date(Date.UTC(y, 11, 25))),                // Christmas
  ].map(isoDate));

  return observedHolidays.has(isoDate(dateUtc));
}

/**
 * Returns a Date whose UTC fields are the calendar Y/M/D in America/New_York.
 * Lets the rest of the logic pretend it's working in ET without TZ libs.
 */
function getDateInEastern(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const lookup = Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  return new Date(Date.UTC(Number(lookup.year), Number(lookup.month) - 1, Number(lookup.day)));
}

// ----------------------------------------------------------------------------
// Lean SMS sender - no brand prefix, no auto link. Welcome message includes
// program disclosure; daily messages are pure text.
// ----------------------------------------------------------------------------

/**
 * @param {string} phoneNumber - E.164 (e.g. "+15551234567")
 * @param {string} message - exact body to send
 * @returns {Promise<{ id: string|null, ok: boolean, error?: string }>}
 */
async function sendDailyRepSms(phoneNumber, message) {
  const apiKey = process.env.TELNYX_API_KEY;
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID;
  const telnyxFrom = process.env.TELNYX_PHONE_NUMBER;

  if (!apiKey || (!messagingProfileId && !telnyxFrom)) {
    logger.warn("Telnyx credentials not configured. Daily Rep SMS not sent.");
    return { id: null, ok: false, error: 'telnyx-not-configured' };
  }

  try {
    const telnyx = new Telnyx({ apiKey });
    const opts = { to: phoneNumber, text: message };
    if (messagingProfileId) {
      opts.messaging_profile_id = messagingProfileId;
      if (telnyxFrom) opts.from = telnyxFrom;
    } else {
      opts.from = telnyxFrom;
    }
    const result = await telnyx.messages.send(opts);
    return { id: result.data?.id || null, ok: true };
  } catch (err) {
    logger.error(`Daily Rep SMS failed to ${phoneNumber}`, err);
    return { id: null, ok: false, error: err.message || String(err) };
  }
}

// ----------------------------------------------------------------------------
// Welcome message copy - A2P 10DLC compliant: program name, frequency,
// msg/data rates, STOP, HELP.
// ----------------------------------------------------------------------------
const WELCOME_SMS = (firstName) => {
  const name = firstName && firstName.trim() ? firstName.trim().split(/\s+/)[0] : '';
  const greeting = name ? `Welcome, ${name}! ` : 'Welcome! ';
  // Keep under 160 chars (GSM-7) so it's a single segment for typical names.
  return (
    `${greeting}The Daily Rep from LeaderReps: one coaching prompt each weekday ` +
    `at 10am ET. Reply STOP to cancel, HELP for help. Msg&data rates may apply.`
  );
};

const HELP_SMS =
  "LeaderReps Daily Rep: one coaching prompt each weekday at 10am ET. " +
  "Reply STOP to cancel. Msg & data rates may apply. Support: help@leaderreps.com";

const STOP_CONFIRM_SMS =
  "You're unsubscribed from The Daily Rep. No more messages will be sent. " +
  "Reply START to resubscribe.";

const RESTART_CONFIRM_SMS =
  "You're resubscribed to The Daily Rep. One coaching prompt each weekday at 10am ET. " +
  "Reply STOP to cancel.";

module.exports = {
  DAILY_REP_EPOCH,
  PROMPTS,
  PROMPT_COUNT,
  resolvePromptForToday,
  isUsFederalHoliday,
  getDateInEastern,
  sendDailyRepSms,
  WELCOME_SMS,
  HELP_SMS,
  STOP_CONFIRM_SMS,
  RESTART_CONFIRM_SMS,
};
