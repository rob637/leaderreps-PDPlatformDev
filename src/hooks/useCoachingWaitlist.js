// src/hooks/useCoachingWaitlist.js
//
// Subscribes to the current user's coaching_waitlist entries and exposes
// helpers for joining and leaving session waitlists. Mirrors
// `useCoachingRegistrations` in shape so callers can pass a Set of waitlisted
// session ids alongside `registeredIds` into widget scopes.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppServices } from '../services/useAppServices';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  COACHING_WAITLIST_COLLECTION,
  WAITLIST_STATUS,
} from '../data/Constants';
import {
  joinWaitlist as joinWaitlistService,
  leaveWaitlist as leaveWaitlistService,
} from '../services/communityService';

export const useCoachingWaitlist = () => {
  const { db, user } = useAppServices();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !user?.uid) {
      setEntries([]);
      setLoading(false);
      return undefined;
    }
    const q = query(
      collection(db, COACHING_WAITLIST_COLLECTION),
      where('userId', '==', user.uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[useCoachingWaitlist] subscription error', err);
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [db, user?.uid]);

  // Set of sessionIds the user is currently waitlisted on.
  const waitlistedIds = useMemo(
    () => new Set(
      entries
        .filter((e) => e.status === WAITLIST_STATUS.WAITING)
        .map((e) => e.sessionId)
    ),
    [entries]
  );

  const joinWaitlist = useCallback(
    async (session) => {
      if (!db || !user?.uid || !session?.id) {
        return { success: false, error: 'Not ready' };
      }
      try {
        await joinWaitlistService(db, user.uid, session.id, {
          title: session.title,
          date: session.date,
          time: session.time,
          sessionType: session.sessionType,
          host: session.coach || session.host,
        });
        return { success: true };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[useCoachingWaitlist] joinWaitlist failed', err);
        return { success: false, error: err?.message || 'Failed to join waitlist' };
      }
    },
    [db, user?.uid]
  );

  const leaveWaitlist = useCallback(
    async (session) => {
      if (!db || !user?.uid || !session?.id) {
        return { success: false, error: 'Not ready' };
      }
      try {
        await leaveWaitlistService(db, user.uid, session.id);
        return { success: true };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[useCoachingWaitlist] leaveWaitlist failed', err);
        return { success: false, error: err?.message || 'Failed to leave waitlist' };
      }
    },
    [db, user?.uid]
  );

  return {
    entries,
    waitlistedIds,
    loading,
    error,
    joinWaitlist,
    leaveWaitlist,
  };
};

export default useCoachingWaitlist;
