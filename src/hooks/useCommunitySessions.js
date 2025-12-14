import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import {
  COMMUNITY_SESSIONS_COLLECTION,
  COMMUNITY_SESSION_TYPES_COLLECTION,
  COMMUNITY_SESSION_TYPES,
  COMMUNITY_RECURRENCE,
  SESSION_STATUS
} from '../data/Constants';

/**
 * Community Sessions Hook
 * 
 * Fetches and manages community sessions (live events, leader circles, etc.).
 * Sessions are time-based instances that users can register for.
 * 
 * Collections:
 * - community_session_types: Templates for recurring sessions (evergreen)
 * - community_sessions: Actual session instances with dates (time-bound)
 */

// Re-export constants for convenience
export { COMMUNITY_SESSION_TYPES, COMMUNITY_RECURRENCE, SESSION_STATUS };

// Helper to check if a session is in the current week
const isThisWeek = (dateString) => {
  if (!dateString) return false;
  // Parse YYYY-MM-DD as local date
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;
  const sessionDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
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
  // Parse YYYY-MM-DD as local date
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;
  const sessionDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sessionDate >= today;
};

// Helper to check if session is today
const isToday = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateString === todayStr;
};

// Helper to check if a session is live now (within 15 min buffer)
const isLiveNow = (dateString, timeString, durationMinutes = 60) => {
  if (!dateString || !timeString) return false;
  
  // Parse date
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;
  
  // Parse time (e.g., "2:00 PM")
  const timeParts = timeString.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!timeParts) return false;
  
  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);
  const meridiem = timeParts[3]?.toUpperCase();
  
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  
  const sessionStart = new Date(
    parseInt(parts[0]), 
    parseInt(parts[1]) - 1, 
    parseInt(parts[2]),
    hours,
    minutes
  );
  const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60000);
  const now = new Date();
  const bufferStart = new Date(sessionStart.getTime() - 15 * 60000); // 15 min before
  
  return now >= bufferStart && now <= sessionEnd;
};

export const useCommunitySessions = (options = {}) => {
  const { db } = useAppServices();
  const [sessions, setSessions] = useState([]);
  const [sessionTypes, setSessionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    filterType = null,        // Filter by session type (leader_circle, etc.)
    filterTopic = null,       // Filter by topic focus
    filterHost = null,        // Filter by host
    dateRange = 'all',        // 'this_week', 'this_month', 'upcoming', 'all'
    includeCompleted = false, // Include past sessions
    limit = 50
  } = options;

  // Fetch session types (templates)
  useEffect(() => {
    if (!db) return;

    const typesRef = collection(db, COMMUNITY_SESSION_TYPES_COLLECTION);
    const q = query(typesRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const types = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessionTypes(types);
    }, (err) => {
      console.error('[useCommunitySessions] Error fetching session types:', err);
    });

    return () => unsubscribe();
  }, [db]);

  // Fetch session instances
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const sessionsRef = collection(db, COMMUNITY_SESSIONS_COLLECTION);
    
    // Build query - start simple, filter client-side for flexibility
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
          const parts = s.date?.split('-');
          if (!parts || parts.length !== 3) return false;
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return d >= startOfMonth && d <= endOfMonth;
        });
      }

      // Filter by session type
      if (filterType) {
        items = items.filter(s => s.sessionType === filterType);
      }

      // Filter by topic focus
      if (filterTopic) {
        items = items.filter(s => 
          s.topicFocus?.includes(filterTopic) || 
          s.topics?.includes(filterTopic)
        );
      }

      // Filter by host
      if (filterHost) {
        items = items.filter(s => s.host === filterHost);
      }

      // Limit results
      if (limit && items.length > limit) {
        items = items.slice(0, limit);
      }

      setSessions(items);
      setLoading(false);
    }, (err) => {
      console.error('[useCommunitySessions] Error fetching sessions:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, filterType, filterTopic, filterHost, dateRange, includeCompleted, limit]);

  // Get session by ID
  const getSession = useCallback(async (sessionId) => {
    if (!db || !sessionId) return null;
    
    try {
      const docRef = doc(db, COMMUNITY_SESSIONS_COLLECTION, sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error('[useCommunitySessions] Error getting session:', err);
      return null;
    }
  }, [db]);

  // Computed: Sessions happening this week
  const thisWeekSessions = useMemo(() => {
    return sessions.filter(s => isThisWeek(s.date));
  }, [sessions]);

  // Computed: Sessions happening today
  const todaySessions = useMemo(() => {
    return sessions.filter(s => isToday(s.date));
  }, [sessions]);

  // Computed: Live now sessions
  const liveNowSessions = useMemo(() => {
    return sessions.filter(s => isLiveNow(s.date, s.time, s.durationMinutes));
  }, [sessions]);

  // Computed: Upcoming sessions (today + future)
  const upcomingSessions = useMemo(() => {
    return sessions.filter(s => isUpcoming(s.date));
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

  // Computed: Leader Circles only
  const leaderCircles = useMemo(() => {
    return sessions.filter(s => s.sessionType === COMMUNITY_SESSION_TYPES.LEADER_CIRCLE);
  }, [sessions]);

  // Computed: Community Events only
  const communityEvents = useMemo(() => {
    return sessions.filter(s => s.sessionType === COMMUNITY_SESSION_TYPES.COMMUNITY_EVENT);
  }, [sessions]);

  // Computed: Masterminds only
  const masterminds = useMemo(() => {
    return sessions.filter(s => s.sessionType === COMMUNITY_SESSION_TYPES.MASTERMIND);
  }, [sessions]);

  // Get sessions matching Dev Plan community filter
  const getSessionsForDevPlan = useCallback((communityFilter) => {
    if (!communityFilter) return sessions;
    
    let filtered = [...sessions];
    
    // Filter by session type
    if (communityFilter.sessionType) {
      filtered = filtered.filter(s => s.sessionType === communityFilter.sessionType);
    }
    
    // Filter by topic focus
    if (communityFilter.topicFocus?.length > 0) {
      filtered = filtered.filter(s => 
        communityFilter.topicFocus.some(topic => 
          s.topicFocus?.includes(topic) || s.topics?.includes(topic)
        )
      );
    }
    
    // Filter by date range
    if (communityFilter.dateRange === 'current_week') {
      filtered = filtered.filter(s => isThisWeek(s.date));
    } else if (communityFilter.dateRange === 'upcoming') {
      filtered = filtered.filter(s => isUpcoming(s.date));
    }
    
    return filtered;
  }, [sessions]);

  // Format session date for display (handles YYYY-MM-DD as local)
  const formatSessionDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get relative day label
  const getRelativeDay = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    
    const sessionDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (sessionDate.getTime() === today.getTime()) return 'Today';
    if (sessionDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return formatSessionDate(dateString);
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
    upcomingSessions,
    sessionsByDate,
    sessionsByType,
    leaderCircles,
    communityEvents,
    masterminds,
    
    // Methods
    getSession,
    getSessionsForDevPlan,
    
    // Utilities
    formatSessionDate,
    getRelativeDay,
    isThisWeek,
    isUpcoming,
    isToday,
    isLiveNow,
    
    // Constants
    COMMUNITY_SESSION_TYPES,
    COMMUNITY_RECURRENCE,
    SESSION_STATUS
  };
};

export default useCommunitySessions;
