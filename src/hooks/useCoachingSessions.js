import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import {
  COACHING_SESSION_TYPES_COLLECTION,
  COACHING_SESSIONS_COLLECTION,
  SESSION_TYPES,
  SESSION_STATUS
} from '../data/Constants';

/**
 * Coaching Sessions Hook
 * 
 * Fetches and manages coaching sessions (live events).
 * Sessions are time-based instances that users can register for.
 * 
 * Collections:
 * - coaching_session_types: Templates for recurring sessions (evergreen)
 * - coaching_sessions: Actual session instances with dates (time-bound)
 */

// Re-export constants for convenience
export { SESSION_TYPES, SESSION_STATUS };

// Helper to check if a session is in the current week
const isThisWeek = (dateString) => {
  if (!dateString) return false;
  const sessionDate = new Date(dateString);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return sessionDate >= startOfWeek && sessionDate < endOfWeek;
};

// Helper to check if a session is upcoming (today or future)
const isUpcoming = (dateString) => {
  if (!dateString) return false;
  const sessionDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sessionDate >= today;
};

// Helper to check if a session is live now (within 15 min buffer)
const isLiveNow = (dateString, durationMinutes = 60) => {
  if (!dateString) return false;
  const sessionStart = new Date(dateString);
  const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60000);
  const now = new Date();
  const bufferStart = new Date(sessionStart.getTime() - 15 * 60000); // 15 min before
  return now >= bufferStart && now <= sessionEnd;
};

export const useCoachingSessions = (options = {}) => {
  const { db } = useAppServices();
  const [sessions, setSessions] = useState([]);
  const [sessionTypes, setSessionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    filterType = null,        // Filter by session type (OPEN_GYM, etc.)
    filterSkill = null,       // Filter by skill focus
    filterCoach = null,       // Filter by coach
    dateRange = 'all',        // 'this_week', 'this_month', 'upcoming', 'all'
    includeCompleted = false, // Include past sessions
    limit = 50
  } = options;

  // Fetch session types (templates)
  useEffect(() => {
    if (!db) return;

    const typesRef = collection(db, COACHING_SESSION_TYPES_COLLECTION);
    const q = query(typesRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const types = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessionTypes(types);
    }, (err) => {
      console.error('[useCoachingSessions] Error fetching session types:', err);
    });

    return () => unsubscribe();
  }, [db]);

  // Fetch session instances
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const sessionsRef = collection(db, COACHING_SESSIONS_COLLECTION);
    
    // Build query - start simple, filter client-side for flexibility
    // Firestore composite indexes would be needed for complex server-side queries
    let q = query(sessionsRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side filtering for flexibility
      
      // Filter by status (exclude cancelled unless specifically requested)
      items = items.filter(s => s.status !== SESSION_STATUS.CANCELLED);
      
      // Filter completed sessions
      if (!includeCompleted) {
        items = items.filter(s => s.status !== SESSION_STATUS.COMPLETED);
      }

      // Filter by date range
      if (dateRange === 'this_week') {
        items = items.filter(s => isThisWeek(s.date));
      } else if (dateRange === 'upcoming') {
        items = items.filter(s => isUpcoming(s.date));
      } else if (dateRange === 'this_month') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        items = items.filter(s => {
          const d = new Date(s.date);
          return d >= startOfMonth && d <= endOfMonth;
        });
      }

      // Filter by session type
      if (filterType) {
        items = items.filter(s => s.sessionType === filterType);
      }

      // Filter by skill focus
      if (filterSkill) {
        items = items.filter(s => 
          s.skillFocus?.includes(filterSkill) || 
          s.skills?.includes(filterSkill)
        );
      }

      // Filter by coach
      if (filterCoach) {
        items = items.filter(s => s.coach === filterCoach);
      }

      // Limit results
      if (limit && items.length > limit) {
        items = items.slice(0, limit);
      }

      setSessions(items);
      setLoading(false);
    }, (err) => {
      console.error('[useCoachingSessions] Error fetching sessions:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, filterType, filterSkill, filterCoach, dateRange, includeCompleted, limit]);

  // Get session by ID
  const getSession = useCallback(async (sessionId) => {
    if (!db || !sessionId) return null;
    
    try {
      const docRef = doc(db, COACHING_SESSIONS_COLLECTION, sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error('[useCoachingSessions] Error getting session:', err);
      return null;
    }
  }, [db]);

  // Computed: Sessions happening this week
  const thisWeekSessions = useMemo(() => {
    return sessions.filter(s => isThisWeek(s.date));
  }, [sessions]);

  // Computed: Sessions happening today
  const todaySessions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(s => s.date?.startsWith(today));
  }, [sessions]);

  // Computed: Live now sessions
  const liveNowSessions = useMemo(() => {
    return sessions.filter(s => isLiveNow(s.date, s.durationMinutes));
  }, [sessions]);

  // Computed: Group sessions by date (for calendar view)
  const sessionsByDate = useMemo(() => {
    const grouped = {};
    (sessions || []).forEach(session => {
      if (session.date) {
        const dateKey = session.date.split('T')[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(session);
      }
    });
    return grouped;
  }, [sessions]);

  // Computed: Group sessions by type
  const sessionsByType = useMemo(() => {
    const grouped = {};
    (sessions || []).forEach(session => {
      const type = session.sessionType || 'OTHER';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(session);
    });
    return grouped;
  }, [sessions]);

  // Get sessions matching Dev Plan coaching filter
  const getSessionsForDevPlan = useCallback((coachingFilter) => {
    if (!coachingFilter) return sessions;
    
    let filtered = [...sessions];
    
    // Filter by session type
    if (coachingFilter.sessionType) {
      filtered = filtered.filter(s => s.sessionType === coachingFilter.sessionType);
    }
    
    // Filter by skill focus
    if (coachingFilter.skillFocus?.length > 0) {
      filtered = filtered.filter(s => 
        coachingFilter.skillFocus.some(skill => 
          s.skillFocus?.includes(skill) || s.skills?.includes(skill)
        )
      );
    }
    
    // Filter by date range
    if (coachingFilter.dateRange === 'current_week') {
      filtered = filtered.filter(s => isThisWeek(s.date));
    } else if (coachingFilter.dateRange === 'upcoming') {
      filtered = filtered.filter(s => isUpcoming(s.date));
    }
    
    return filtered;
  }, [sessions]);

  // Utility functions
  const formatSessionDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatSessionTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return {
    // Data
    sessions,
    sessionTypes,
    loading,
    error,
    
    // Computed
    thisWeekSessions,
    todaySessions,
    liveNowSessions,
    sessionsByDate,
    sessionsByType,
    
    // Methods
    getSession,
    getSessionsForDevPlan,
    
    // Utilities
    formatSessionDate,
    formatSessionTime,
    isThisWeek,
    isUpcoming,
    isLiveNow,
    
    // Constants
    SESSION_TYPES,
    SESSION_STATUS
  };
};

export default useCoachingSessions;
