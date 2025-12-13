import { useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  COACHING_REGISTRATIONS_COLLECTION,
  REGISTRATION_STATUS
} from '../data/Constants';

/**
 * Coaching Registrations Hook
 * 
 * Manages user registrations for coaching sessions.
 * Handles register, cancel, and attendance tracking.
 * 
 * Collection: coaching_registrations
 * Document ID: {sessionId}_{userId} for easy lookup
 */

// Re-export constants for convenience
export { REGISTRATION_STATUS };

export const useCoachingRegistrations = () => {
  const { db, user } = useAppServices();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's registrations
  useEffect(() => {
    if (!db || !user?.uid) {
      setLoading(false);
      return;
    }

    const registrationsRef = collection(db, COACHING_REGISTRATIONS_COLLECTION);
    const q = query(registrationsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by session date
      items.sort((a, b) => {
        const dateA = a.sessionDate ? new Date(a.sessionDate) : new Date(0);
        const dateB = b.sessionDate ? new Date(b.sessionDate) : new Date(0);
        return dateA - dateB;
      });
      
      setRegistrations(items);
      setLoading(false);
    }, (err) => {
      console.error('[useCoachingRegistrations] Error fetching registrations:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, user?.uid]);

  // Check if user is registered for a session
  const isRegistered = useCallback((sessionId) => {
    return registrations.some(
      r => r.sessionId === sessionId && r.status !== REGISTRATION_STATUS.CANCELLED
    );
  }, [registrations]);

  // Get registration for a specific session
  const getRegistration = useCallback((sessionId) => {
    return registrations.find(
      r => r.sessionId === sessionId && r.status !== REGISTRATION_STATUS.CANCELLED
    );
  }, [registrations]);

  // Register for a session
  const registerForSession = useCallback(async (session) => {
    if (!db || !user?.uid) {
      console.error('[useCoachingRegistrations] Cannot register: no db or user');
      return { success: false, error: 'Not authenticated' };
    }

    if (!session?.id) {
      console.error('[useCoachingRegistrations] Cannot register: no session ID');
      return { success: false, error: 'Invalid session' };
    }

    // Check if already registered
    if (isRegistered(session.id)) {
      return { success: false, error: 'Already registered' };
    }

    try {
      // Document ID format: sessionId_userId for easy dedup
      const registrationId = `${session.id}_${user.uid}`;
      const registrationRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, registrationId);

      const registrationData = {
        userId: user.uid,
        userEmail: user.email || null,
        userName: user.displayName || null,
        sessionId: session.id,
        
        // Denormalized session info for quick display
        sessionTitle: session.title || '',
        sessionType: session.sessionType || '',
        sessionDate: session.date || null,
        sessionTime: session.time || null,
        coach: session.coach || null,
        
        // Registration metadata
        registeredAt: serverTimestamp(),
        status: REGISTRATION_STATUS.REGISTERED,
        
        // Attendance tracking (updated after session)
        attendedAt: null,
        watchedReplay: false
      };

      await setDoc(registrationRef, registrationData);
      
      console.log('[useCoachingRegistrations] Registered for session:', session.id);
      return { success: true, registrationId };
    } catch (err) {
      console.error('[useCoachingRegistrations] Error registering:', err);
      return { success: false, error: err.message };
    }
  }, [db, user, isRegistered]);

  // Cancel registration
  const cancelRegistration = useCallback(async (sessionId) => {
    if (!db || !user?.uid) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const registrationId = `${sessionId}_${user.uid}`;
      const registrationRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, registrationId);

      // Soft delete - update status rather than delete document
      await setDoc(registrationRef, {
        status: REGISTRATION_STATUS.CANCELLED,
        cancelledAt: serverTimestamp()
      }, { merge: true });

      console.log('[useCoachingRegistrations] Cancelled registration:', sessionId);
      return { success: true };
    } catch (err) {
      console.error('[useCoachingRegistrations] Error cancelling:', err);
      return { success: false, error: err.message };
    }
  }, [db, user?.uid]);

  // Mark as attended (can be called by user or admin)
  const markAttended = useCallback(async (sessionId) => {
    if (!db || !user?.uid) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const registrationId = `${sessionId}_${user.uid}`;
      const registrationRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, registrationId);

      await setDoc(registrationRef, {
        status: REGISTRATION_STATUS.ATTENDED,
        attendedAt: serverTimestamp()
      }, { merge: true });

      console.log('[useCoachingRegistrations] Marked attended:', sessionId);
      return { success: true };
    } catch (err) {
      console.error('[useCoachingRegistrations] Error marking attended:', err);
      return { success: false, error: err.message };
    }
  }, [db, user?.uid]);

  // Mark replay as watched
  const markReplayWatched = useCallback(async (sessionId) => {
    if (!db || !user?.uid) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const registrationId = `${sessionId}_${user.uid}`;
      const registrationRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, registrationId);

      await setDoc(registrationRef, {
        watchedReplay: true,
        replayWatchedAt: serverTimestamp()
      }, { merge: true });

      console.log('[useCoachingRegistrations] Marked replay watched:', sessionId);
      return { success: true };
    } catch (err) {
      console.error('[useCoachingRegistrations] Error marking replay watched:', err);
      return { success: false, error: err.message };
    }
  }, [db, user?.uid]);

  // Get upcoming registered sessions (not cancelled, date in future)
  const getUpcomingRegistrations = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return registrations.filter(r => {
      if (r.status === REGISTRATION_STATUS.CANCELLED) return false;
      if (!r.sessionDate) return false;
      const sessionDate = new Date(r.sessionDate);
      return sessionDate >= now;
    });
  }, [registrations]);

  // Get past registered sessions (for replays)
  const getPastRegistrations = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return registrations.filter(r => {
      if (r.status === REGISTRATION_STATUS.CANCELLED) return false;
      if (!r.sessionDate) return false;
      const sessionDate = new Date(r.sessionDate);
      return sessionDate < now;
    });
  }, [registrations]);

  // Get attended sessions (for stats)
  const getAttendedSessions = useCallback(() => {
    return registrations.filter(r => r.status === REGISTRATION_STATUS.ATTENDED);
  }, [registrations]);

  // Calculate coaching stats
  const stats = {
    totalRegistrations: registrations.filter(r => r.status !== REGISTRATION_STATUS.CANCELLED).length,
    upcomingCount: getUpcomingRegistrations().length,
    attendedCount: getAttendedSessions().length,
    replaysWatched: registrations.filter(r => r.watchedReplay).length
  };

  return {
    // Data
    registrations,
    loading,
    error,
    stats,
    
    // Query methods
    isRegistered,
    getRegistration,
    getUpcomingRegistrations,
    getPastRegistrations,
    getAttendedSessions,
    
    // Action methods
    registerForSession,
    cancelRegistration,
    markAttended,
    markReplayWatched,
    
    // Constants
    REGISTRATION_STATUS
  };
};

export default useCoachingRegistrations;
