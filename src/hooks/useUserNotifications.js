// src/hooks/useUserNotifications.js
//
// Per-user inbox hook for the unified notifications redesign (Phase B).
//
// Reads from `users/{uid}/notifications`, which is fanned out by the
// `onAnnouncementWritten` Cloud Function (and, in future phases, by
// coaching / events / achievement triggers). All visibility, sorting,
// and grouping logic lives here so the UI components stay simple.
//
// Returns:
//   {
//     loading,
//     all,           // visible (non-dismissed, non-expired, snooze elapsed)
//     unread,        // visible items with read === false
//     critical,      // unread + tier === 'critical' (drives badge urgency)
//     groups: { today, yesterday, earlier },
//     unreadCount,   // unread.length (drives nav badge)
//     snoozed,       // snoozed but not dismissed (for Snoozed tab)
//   }
//
// Filtering rules (client-side, intentional — no extra indexes needed):
//   - hide if dismissedAt is set
//   - hide if expiresAt < now
//   - hide if startAt > now (scheduled for future)
//   - hide if snoozedUntil > now (rendered in `snoozed` instead)
//
// Sort order (within each bucket):
//   - tierWeight desc → unread first → createdAt desc

import { useEffect, useMemo, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAppServices } from '../services/useAppServices';
import { useDailyPlan, phaseKey } from './useDailyPlan';

const toMillis = (v) => {
  if (!v) return null;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  return null;
};

const isStartOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const groupByDay = (items) => {
  const todayStart = isStartOfDay(Date.now());
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const today = [];
  const yesterday = [];
  const earlier = [];
  items.forEach((n) => {
    const ms = toMillis(n.createdAt) ?? 0;
    if (ms >= todayStart) today.push(n);
    else if (ms >= yesterdayStart) yesterday.push(n);
    else earlier.push(n);
  });
  return { today, yesterday, earlier };
};

const compare = (a, b) => {
  const tw = (b.tierWeight || 0) - (a.tierWeight || 0);
  if (tw !== 0) return tw;
  // Unread before read at same tier.
  if (a.read !== b.read) return a.read ? 1 : -1;
  return (toMillis(b.createdAt) || 0) - (toMillis(a.createdAt) || 0);
};

const PAGE_LIMIT = 100;

const useUserNotifications = () => {
  const { db, user } = useAppServices();
  const { currentPhase } = useDailyPlan();
  const userPhase = phaseKey(currentPhase);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Refresh derived filters once per minute so snooze windows elapse without
  // the user reloading the page.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!db || !user?.uid) {
      setRaw([]);
      setLoading(false);
      return undefined;
    }
    const ref = collection(db, 'users', user.uid, 'notifications');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(PAGE_LIMIT));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setRaw(items);
        setLoading(false);
      },
      (err) => {
        // Subcollection may not exist yet for new users — that's not an error
        // worth surfacing. Just log and stay empty.
        // eslint-disable-next-line no-console
        console.warn('[useUserNotifications]', err?.message || err);
        setRaw([]);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [db, user?.uid]);

  const derived = useMemo(() => {
    const now = nowTick;
    const visible = [];
    const snoozed = [];
    raw.forEach((n) => {
      if (n.dismissedAt) return;
      // Hide phase-targeted items that don't match the viewer's phase.
      // If we can't yet resolve the user's phase (still loading), skip the
      // filter rather than hide everything — over-deliver beats silence.
      if (n.targetPhase && userPhase && n.targetPhase !== userPhase) return;
      const exp = toMillis(n.expiresAt);
      if (exp && exp < now) return;
      const start = toMillis(n.startAt);
      if (start && start > now) return;
      const snoozeMs = toMillis(n.snoozedUntil);
      if (snoozeMs && snoozeMs > now) {
        snoozed.push(n);
        return;
      }
      visible.push(n);
    });
    visible.sort(compare);
    snoozed.sort(compare);
    const unread = visible.filter((n) => !n.read);
    const critical = unread.filter((n) => n.tier === 'critical');
    return {
      all: visible,
      unread,
      critical,
      snoozed,
      groups: groupByDay(visible),
      unreadCount: unread.length,
    };
  }, [raw, nowTick, userPhase]);

  return { loading, ...derived };
};

export default useUserNotifications;
