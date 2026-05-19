// src/services/eventsService.js
//
// Unified Events service — single source of truth.
//
// May 2026 events consolidation: community_sessions and coaching_sessions
// were merged into a single `coaching_sessions` collection (see
// scripts/migrations/merge-community-into-coaching-sessions.cjs). Legacy
// docs may still carry old field names (`host`/`meetingLink`/`topicFocus`)
// alongside the unified `coach`/`zoomLink`/`skillFocus` fields; the
// normalizer prefers the new names and falls back to the legacy ones.
//
// Public API (consumed by Events.jsx):
//   - subscribeUpcomingEvents(db, userId, callback) -> unsubscribe
//   - registerForEvent(db, userId, event)
//   - cancelRegistrationForEvent(db, userId, event)
//
// Normalized Event shape:
//   {
//     id,                 // stable composite: `coaching:${sourceId}`
//     sourceType,         // always 'coaching' (kept for back-compat)
//     sourceId,           // original Firestore doc id
//     title, description,
//     hostName,
//     sessionType,
//     startsAt,           // Date object (combined date+time, best-effort)
//     date, time, timezone,
//     durationMinutes,
//     status,             // 'scheduled' | 'live' | 'completed' | 'cancelled'
//     spotsLeft,
//     link,               // zoomLink (preferred) or legacy meetingLink
//     replayUrl,
//     isRegistered,       // computed from user's registration docs
//   }

import {
  collection,
  onSnapshot,
  query,
  where,
  getDoc,
} from 'firebase/firestore';

import {
  COACHING_SESSIONS_COLLECTION,
  COACHING_REGISTRATIONS_COLLECTION,
  COACHING_WAITLIST_COLLECTION,
  REGISTRATION_STATUS,
  WAITLIST_STATUS,
} from '../data/Constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a wall-clock time in a named IANA timezone to a UTC Date.
 * Zero-dependency Intl-based implementation (handles DST correctly).
 *
 * @param {number} year - 4-digit year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @param {number} hour - 0-23
 * @param {number} minute - 0-59
 * @param {string} tz - IANA timezone (e.g. 'America/New_York'); falsy = local
 * @returns {Date}
 */
const zonedWallClockToUtc = (year, month, day, hour, minute, tz) => {
  // Local-time fallback when timezone is missing/invalid.
  if (!tz) return new Date(year, month - 1, day, hour, minute, 0, 0);
  try {
    // Step 1: assume the wall-clock numbers are UTC and get a probe instant.
    const probeUtcMs = Date.UTC(year, month - 1, day, hour, minute);
    // Step 2: render that instant in the target zone — gives us "what would
    // it look like in tz". The diff between that and our intended wall-clock
    // is the timezone offset at this instant (DST-aware).
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const parts = fmt.formatToParts(new Date(probeUtcMs)).reduce((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
    const asZoned = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) === 24 ? 0 : Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const offsetMs = asZoned - probeUtcMs;
    return new Date(probeUtcMs - offsetMs);
  } catch (_) {
    // Invalid timezone string — fall back to local.
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }
};

/**
 * Best-effort parse of "12:00 PM" / "2:30 pm" / "14:00" plus a "YYYY-MM-DD"
 * date string into a Date. Honors the event's IANA timezone so the resulting
 * UTC instant is correct regardless of the viewer's local zone (important for
 * the "join 15 min before start" gating logic). Returns null if either piece
 * is missing.
 */
const parseStartsAt = (dateStr, timeStr, timezone) => {
  if (!dateStr) return null;
  const t = (timeStr || '12:00').trim();
  let hour = 12;
  let minute = 0;
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (m) {
    hour = parseInt(m[1], 10);
    minute = parseInt(m[2], 10);
    const meridian = (m[3] || '').toLowerCase();
    if (meridian === 'pm' && hour < 12) hour += 12;
    if (meridian === 'am' && hour === 12) hour = 0;
  }
  const [y, mo, d] = dateStr.split('-').map((s) => parseInt(s, 10));
  if (!y || !mo || !d) return null;
  return zonedWallClockToUtc(y, mo, d, hour, minute, timezone);
};

const normalizeEvent = (raw, isRegistered, isWaitlisted) => ({
  id: `coaching:${raw.id}`,
  sourceType: 'coaching',
  sourceId: raw.id,
  title: raw.title || 'Event',
  description: raw.description || '',
  hostName: raw.coach || raw.host || '',
  sessionType: raw.sessionType || 'coaching',
  startsAt: parseStartsAt(raw.date, raw.time, raw.timezone),
  date: raw.date || '',
  time: raw.time || '',
  timezone: raw.timezone || '',
  durationMinutes: raw.durationMinutes || 60,
  status: raw.status || 'scheduled',
  spotsLeft: typeof raw.spotsLeft === 'number' ? raw.spotsLeft : null,
  link: raw.zoomLink || raw.meetingLink || null,
  replayUrl: raw.replayUrl || null,
  isRegistered: !!isRegistered,
  isWaitlisted: !!isWaitlisted,
});

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

/**
 * Subscribe to all upcoming events (coaching + community) plus the user's
 * registrations. Calls `callback(events)` whenever any source updates.
 *
 * Filters in memory:
 *   - status !== 'cancelled' (still shown but flagged)
 *   - startsAt within the next 60 days OR no startsAt parseable
 *
 * Returns an unsubscribe function.
 */
export const subscribeUpcomingEvents = (db, userId, callback) => {
  if (!db) throw new Error('Database not initialized');
  if (!userId) throw new Error('userId required');

  const state = {
    sessions: new Map(),
    regs: new Set(),
    waitlist: new Set(),
  };

  const emit = () => {
    const all = [];
    state.sessions.forEach((raw) => {
      all.push(normalizeEvent(raw, state.regs.has(raw.id), state.waitlist.has(raw.id)));
    });

    // Sort: events with parseable startsAt first (chronological),
    // unparseable trailing.
    all.sort((a, b) => {
      if (a.startsAt && b.startsAt) return a.startsAt - b.startsAt;
      if (a.startsAt) return -1;
      if (b.startsAt) return 1;
      return (a.date || '').localeCompare(b.date || '');
    });

    callback(all);
  };

  const unsubs = [];

  // All event sessions (coaching_sessions is now the single source).
  unsubs.push(
    onSnapshot(
      collection(db, COACHING_SESSIONS_COLLECTION),
      (snap) => {
        state.sessions.clear();
        snap.forEach((d) => {
          const data = { id: d.id, ...d.data() };
          state.sessions.set(d.id, data);
        });
        emit();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[eventsService] sessions subscription error', err);
      }
    )
  );

  // Registrations for this user.
  unsubs.push(
    onSnapshot(
      query(
        collection(db, COACHING_REGISTRATIONS_COLLECTION),
        where('userId', '==', userId)
      ),
      (snap) => {
        state.regs.clear();
        snap.forEach((d) => {
          const data = d.data();
          if (
            data.sessionId &&
            data.status !== REGISTRATION_STATUS.CANCELLED
          ) {
            state.regs.add(data.sessionId);
          }
        });
        emit();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[eventsService] registrations subscription error', err);
      }
    )
  );

  // Waitlist entries for this user (added May 2026).
  unsubs.push(
    onSnapshot(
      query(
        collection(db, COACHING_WAITLIST_COLLECTION),
        where('userId', '==', userId)
      ),
      (snap) => {
        state.waitlist.clear();
        snap.forEach((d) => {
          const data = d.data();
          if (
            data.sessionId &&
            data.status === WAITLIST_STATUS.WAITING
          ) {
            state.waitlist.add(data.sessionId);
          }
        });
        emit();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[eventsService] waitlist subscription error', err);
      }
    )
  );

  return () => unsubs.forEach((u) => { try { u(); } catch { /* noop */ } });
};

// ---------------------------------------------------------------------------
// Register / cancel — routes to the correct underlying service
// ---------------------------------------------------------------------------

/**
 * For coaching sessions we replicate the lightweight registration write here
 * (rather than depending on a coaching-side helper that doesn't exist yet)
 * so we can ship WS-2 without modifying coachingService.js. The doc id
 * convention `${sessionId}_${userId}` matches how facilitator helpers in
 * coachingService.js read it (markParticipantAttended, certifyParticipant).
 */
const registerForCoachingSession = async (db, userId, event) => {
  const { runTransaction, doc: docFn, serverTimestamp } = await import(
    'firebase/firestore'
  );
  const { getAuth } = await import('firebase/auth');

  const registrationId = `${event.sourceId}_${userId}`;
  const regRef = docFn(db, COACHING_REGISTRATIONS_COLLECTION, registrationId);
  const sessionRef = docFn(db, COACHING_SESSIONS_COLLECTION, event.sourceId);
  const userRef = docFn(db, 'users', userId);

  // Read user profile up front (outside the txn). Email/name don't change
  // mid-flight in a way that affects capacity correctness.
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : {};
  const authUser = getAuth().currentUser;
  const userEmail =
    userData.email || userData.primaryEmail || authUser?.email || null;
  const userName =
    userData.displayName ||
    userData.name ||
    userData.fullName ||
    authUser?.displayName ||
    null;

  await runTransaction(db, async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists()) {
      throw new Error('SESSION_NOT_FOUND');
    }
    const sessionData = sessionSnap.data();

    const regSnap = await tx.get(regRef);
    const existing = regSnap.exists() ? regSnap.data() : null;
    const alreadyActive =
      existing && existing.status === REGISTRATION_STATUS.REGISTERED;

    // Capacity check (only when both fields are defined).
    const maxAttendees =
      typeof sessionData.maxAttendees === 'number'
        ? sessionData.maxAttendees
        : null;
    const currentSpots =
      typeof sessionData.spotsLeft === 'number'
        ? sessionData.spotsLeft
        : maxAttendees;

    if (!alreadyActive && maxAttendees !== null && currentSpots <= 0) {
      throw new Error('SESSION_FULL');
    }

    tx.set(regRef, {
      id: registrationId,
      userId,
      userEmail,
      userName,
      sessionId: event.sourceId,
      sessionTitle: event.title,
      sessionDate: event.date,
      sessionTime: event.time,
      sessionType: event.sessionType,
      coach: sessionData.coach || event.hostName || null,
      coachEmail: sessionData.coachEmail || event.coachEmail || null,
      zoomLink: sessionData.zoomLink || event.link || null,
      status: REGISTRATION_STATUS.REGISTERED,
      registeredAt: existing?.registeredAt || serverTimestamp(),
      attendedAt: existing?.attendedAt || null,
      watchedReplay: existing?.watchedReplay || false,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Only mutate the counter when transitioning into REGISTERED.
    if (!alreadyActive && maxAttendees !== null) {
      tx.update(sessionRef, {
        spotsLeft: Math.max(0, currentSpots - 1),
        updatedAt: serverTimestamp(),
      });
    }
  });
};

const cancelCoachingRegistration = async (db, userId, event) => {
  const { runTransaction, doc: docFn, serverTimestamp } = await import(
    'firebase/firestore'
  );
  const registrationId = `${event.sourceId}_${userId}`;
  const regRef = docFn(db, COACHING_REGISTRATIONS_COLLECTION, registrationId);
  const sessionRef = docFn(db, COACHING_SESSIONS_COLLECTION, event.sourceId);

  await runTransaction(db, async (tx) => {
    // 1) ALL READS FIRST (Firestore requires reads before writes in a tx)
    const regSnap = await tx.get(regRef);
    if (!regSnap.exists()) return;
    const regData = regSnap.data();
    const wasActive = regData.status === REGISTRATION_STATUS.REGISTERED;

    let sessionSnap = null;
    if (wasActive) {
      sessionSnap = await tx.get(sessionRef);
    }

    // 2) THEN ALL WRITES
    tx.update(regRef, {
      status: REGISTRATION_STATUS.CANCELLED,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (wasActive && sessionSnap && sessionSnap.exists()) {
      const sessionData = sessionSnap.data();
      const maxAttendees =
        typeof sessionData.maxAttendees === 'number'
          ? sessionData.maxAttendees
          : null;
      const currentSpots =
        typeof sessionData.spotsLeft === 'number' ? sessionData.spotsLeft : 0;
      const nextSpots =
        maxAttendees !== null
          ? Math.min(maxAttendees, currentSpots + 1)
          : currentSpots + 1;
      tx.update(sessionRef, {
        spotsLeft: nextSpots,
        updatedAt: serverTimestamp(),
      });
    }
  });
};

export const registerForEvent = async (db, userId, event) => {
  if (!db || !userId || !event) throw new Error('Missing args');
  // Post-consolidation, every event is a coaching_sessions doc. The
  // legacy 'community' sourceType is still accepted for back-compat with
  // any cached/persisted event objects.
  return registerForCoachingSession(db, userId, event);
};

export const cancelRegistrationForEvent = async (db, userId, event) => {
  if (!db || !userId || !event) throw new Error('Missing args');
  return cancelCoachingRegistration(db, userId, event);
};

// ---------------------------------------------------------------------------
// Waitlist — thin wrappers around the communityService primitives. Added
// May 2026 so a full session can offer "Join Waitlist" instead of a dead
// disabled button. The trainer-side promote action lives in
// TrainerSessionsPanel.
// ---------------------------------------------------------------------------
export const joinWaitlistForEvent = async (db, userId, event) => {
  if (!db || !userId || !event) throw new Error('Missing args');
  const { joinWaitlist } = await import('./communityService');
  return joinWaitlist(db, userId, event.sourceId, {
    title: event.title,
    date: event.date,
    time: event.time,
    sessionType: event.sessionType,
    host: event.hostName,
  });
};

export const leaveWaitlistForEvent = async (db, userId, event) => {
  if (!db || !userId || !event) throw new Error('Missing args');
  const { leaveWaitlist } = await import('./communityService');
  return leaveWaitlist(db, userId, event.sourceId);
};

export default {
  subscribeUpcomingEvents,
  registerForEvent,
  cancelRegistrationForEvent,
  joinWaitlistForEvent,
  leaveWaitlistForEvent,
};
