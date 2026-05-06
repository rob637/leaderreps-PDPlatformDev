// src/services/eventsService.js
//
// Ascent Revamp WS-2 — Unified Events service.
//
// READ-ONLY aggregator over existing `coaching_sessions` and
// `community_sessions` collections. No new collections; no migration.
// Writes for register/cancel are routed through the existing per-source
// services so legacy Cloud Function triggers (calendar invites, etc.)
// keep working unchanged.
//
// Public API (consumed by Events.jsx):
//   - subscribeUpcomingEvents(db, userId, callback) -> unsubscribe
//   - registerForEvent(db, userId, event)
//   - cancelRegistrationForEvent(db, userId, event)
//
// Normalized Event shape:
//   {
//     id,                 // stable composite: `${sourceType}:${sourceId}`
//     sourceType,         // 'coaching' | 'community'
//     sourceId,           // original Firestore doc id
//     title, description,
//     hostName,           // 'coach' or 'host' field
//     sessionType,
//     startsAt,           // Date object (combined date+time, best-effort)
//     date, time, timezone,
//     durationMinutes,
//     status,             // 'scheduled' | 'live' | 'completed' | 'cancelled'
//     spotsLeft,
//     link,               // zoomLink (coaching) or meetingLink (community)
//     replayUrl,
//     isRegistered,       // computed from user's registration docs
//   }

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import {
  COACHING_SESSIONS_COLLECTION,
  COACHING_REGISTRATIONS_COLLECTION,
  COMMUNITY_SESSIONS_COLLECTION,
  COMMUNITY_REGISTRATIONS_COLLECTION,
  REGISTRATION_STATUS,
} from '../data/Constants';

import {
  registerForCommunitySession,
  cancelCommunityRegistration,
} from './communityService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Best-effort parse of "12:00 PM" / "2:30 pm" / "14:00" plus a "YYYY-MM-DD"
 * date string into a Date. Returns null if either piece is missing.
 */
const parseStartsAt = (dateStr, timeStr, _timezone) => {
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
  // Treat YYYY-MM-DD as local date.
  const [y, mo, d] = dateStr.split('-').map((s) => parseInt(s, 10));
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d, hour, minute, 0, 0);
};

const normalizeCoachingSession = (raw, isRegistered) => ({
  id: `coaching:${raw.id}`,
  sourceType: 'coaching',
  sourceId: raw.id,
  title: raw.title || 'Coaching Session',
  description: raw.description || '',
  hostName: raw.coach || '',
  sessionType: raw.sessionType || 'coaching',
  startsAt: parseStartsAt(raw.date, raw.time, raw.timezone),
  date: raw.date || '',
  time: raw.time || '',
  timezone: raw.timezone || '',
  durationMinutes: raw.durationMinutes || 60,
  status: raw.status || 'scheduled',
  spotsLeft: typeof raw.spotsLeft === 'number' ? raw.spotsLeft : null,
  link: raw.zoomLink || null,
  replayUrl: raw.replayUrl || null,
  isRegistered: !!isRegistered,
});

const normalizeCommunitySession = (raw, isRegistered) => ({
  id: `community:${raw.id}`,
  sourceType: 'community',
  sourceId: raw.id,
  title: raw.title || 'Community Event',
  description: raw.description || '',
  hostName: raw.host || '',
  sessionType: raw.sessionType || 'community',
  startsAt: parseStartsAt(raw.date, raw.time, raw.timezone),
  date: raw.date || '',
  time: raw.time || '',
  timezone: raw.timezone || '',
  durationMinutes: raw.durationMinutes || 60,
  status: raw.status || 'scheduled',
  spotsLeft: typeof raw.spotsLeft === 'number' ? raw.spotsLeft : null,
  link: raw.meetingLink || null,
  replayUrl: raw.replayUrl || null,
  isRegistered: !!isRegistered,
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
    coaching: new Map(),
    community: new Map(),
    coachingRegs: new Set(),
    communityRegs: new Set(),
  };

  const emit = () => {
    const all = [];
    state.coaching.forEach((raw) => {
      all.push(normalizeCoachingSession(raw, state.coachingRegs.has(raw.id)));
    });
    state.community.forEach((raw) => {
      all.push(
        normalizeCommunitySession(raw, state.communityRegs.has(raw.id))
      );
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

  // Coaching sessions
  unsubs.push(
    onSnapshot(
      collection(db, COACHING_SESSIONS_COLLECTION),
      (snap) => {
        state.coaching.clear();
        snap.forEach((d) => {
          const data = { id: d.id, ...d.data() };
          state.coaching.set(d.id, data);
        });
        emit();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[eventsService] coaching subscription error', err);
      }
    )
  );

  // Community sessions
  unsubs.push(
    onSnapshot(
      collection(db, COMMUNITY_SESSIONS_COLLECTION),
      (snap) => {
        state.community.clear();
        snap.forEach((d) => {
          const data = { id: d.id, ...d.data() };
          state.community.set(d.id, data);
        });
        emit();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[eventsService] community subscription error', err);
      }
    )
  );

  // Coaching registrations for this user
  unsubs.push(
    onSnapshot(
      query(
        collection(db, COACHING_REGISTRATIONS_COLLECTION),
        where('userId', '==', userId)
      ),
      (snap) => {
        state.coachingRegs.clear();
        snap.forEach((d) => {
          const data = d.data();
          if (
            data.sessionId &&
            data.status !== REGISTRATION_STATUS.CANCELLED
          ) {
            state.coachingRegs.add(data.sessionId);
          }
        });
        emit();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[eventsService] coaching reg subscription error', err);
      }
    )
  );

  // Community registrations for this user
  unsubs.push(
    onSnapshot(
      query(
        collection(db, COMMUNITY_REGISTRATIONS_COLLECTION),
        where('userId', '==', userId)
      ),
      (snap) => {
        state.communityRegs.clear();
        snap.forEach((d) => {
          const data = d.data();
          if (
            data.sessionId &&
            data.status !== REGISTRATION_STATUS.CANCELLED
          ) {
            state.communityRegs.add(data.sessionId);
          }
        });
        emit();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[eventsService] community reg subscription error', err);
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
    });

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

  if (event.sourceType === 'coaching') {
    return registerForCoachingSession(db, userId, event);
  }

  if (event.sourceType === 'community') {
    // Pull current spotsLeft so the helper can decrement.
    const ref = doc(db, COMMUNITY_SESSIONS_COLLECTION, event.sourceId);
    const snap = await getDoc(ref);
    const sessionData = snap.exists()
      ? { ...snap.data(), spotsLeft: snap.data().spotsLeft }
      : { title: event.title, date: event.date, time: event.time, sessionType: event.sessionType };
    return registerForCommunitySession(db, userId, event.sourceId, sessionData);
  }

  throw new Error(`Unknown event sourceType: ${event.sourceType}`);
};

export const cancelRegistrationForEvent = async (db, userId, event) => {
  if (!db || !userId || !event) throw new Error('Missing args');

  if (event.sourceType === 'coaching') {
    return cancelCoachingRegistration(db, userId, event);
  }
  if (event.sourceType === 'community') {
    return cancelCommunityRegistration(db, userId, event.sourceId);
  }
  throw new Error(`Unknown event sourceType: ${event.sourceType}`);
};

export default {
  subscribeUpcomingEvents,
  registerForEvent,
  cancelRegistrationForEvent,
};
