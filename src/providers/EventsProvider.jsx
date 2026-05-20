// src/providers/EventsProvider.jsx
//
// Single shared subscription to the unified events stream (coaching +
// community + this user's registrations). Hoists what was previously
// 3 listeners x N consumers (Dashboard widgets + Events screen) down to
// one set of 3 listeners app-wide.
//
// Consumers read via the `useEvents()` hook. Providers stays inert
// (returns empty list, loading=false) until both `db` and an
// authenticated `userId` are available.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAppServices } from '../services/useAppServices.jsx';
import {
  subscribeUpcomingEvents,
  registerForEvent as registerForEventService,
  cancelRegistrationForEvent as cancelRegistrationForEventService,
  joinWaitlistForEvent as joinWaitlistService,
  leaveWaitlistForEvent as leaveWaitlistService,
} from '../services/eventsService';

const EventsContext = createContext({
  events: [],
  loading: false,
  error: null,
  register: async () => {},
  cancel: async () => {},
  joinWaitlist: async () => {},
  leaveWaitlist: async () => {},
});

export const EventsProvider = ({ children }) => {
  const { db, user } = useAppServices();
  const userId = user?.uid || null;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep the latest db reference available to register/cancel callbacks
  // without forcing them to re-create on every render.
  const dbRef = useRef(db);
  const userIdRef = useRef(userId);
  useEffect(() => {
    dbRef.current = db;
    userIdRef.current = userId;
  }, [db, userId]);

  useEffect(() => {
    if (!db || !userId) {
      setEvents([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError(null);
    let unsub;
    try {
      unsub = subscribeUpcomingEvents(db, userId, (items) => {
        setEvents(items || []);
        setLoading(false);
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[EventsProvider] subscription failed', err);
      setError(err);
      setLoading(false);
    }
    return () => {
      if (typeof unsub === 'function') {
        try { unsub(); } catch { /* noop */ }
      }
    };
  }, [db, userId]);

  const register = useCallback(async (event) => {
    const curDb = dbRef.current;
    const curUid = userIdRef.current;
    if (!curDb || !curUid) throw new Error('Not ready');
    return registerForEventService(curDb, curUid, event);
  }, []);

  const cancel = useCallback(async (event) => {
    const curDb = dbRef.current;
    const curUid = userIdRef.current;
    if (!curDb || !curUid) throw new Error('Not ready');
    return cancelRegistrationForEventService(curDb, curUid, event);
  }, []);

  const joinWaitlist = useCallback(async (event) => {
    const curDb = dbRef.current;
    const curUid = userIdRef.current;
    if (!curDb || !curUid) throw new Error('Not ready');
    return joinWaitlistService(curDb, curUid, event);
  }, []);

  const leaveWaitlist = useCallback(async (event) => {
    const curDb = dbRef.current;
    const curUid = userIdRef.current;
    if (!curDb || !curUid) throw new Error('Not ready');
    return leaveWaitlistService(curDb, curUid, event);
  }, []);

  const value = useMemo(
    () => ({ events, loading, error, register, cancel, joinWaitlist, leaveWaitlist }),
    [events, loading, error, register, cancel, joinWaitlist, leaveWaitlist]
  );

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
};

export const useEvents = () => useContext(EventsContext);

export default EventsProvider;
