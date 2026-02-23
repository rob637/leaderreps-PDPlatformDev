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

  // Get registration for a specific coaching item (dev plan action)
  // Returns the active registration for this coaching item if one exists
  const getRegistrationForCoachingItem = useCallback((coachingItemId) => {
    if (!coachingItemId) return null;
    return registrations.find(
      r => r.coachingItemId === coachingItemId && 
           r.status !== REGISTRATION_STATUS.CANCELLED &&
           r.status !== REGISTRATION_STATUS.NO_SHOW
    );
  }, [registrations]);

  // Check if user has registered for a coaching item (any session)
  const hasRegisteredForCoachingItem = useCallback((coachingItemId) => {
    return !!getRegistrationForCoachingItem(coachingItemId);
  }, [getRegistrationForCoachingItem]);

  // Register for a session (cancels previous registration for same coaching item if switching)
  const registerForSession = useCallback(async (session, additionalData = {}) => {
    if (!db || !user?.uid) {
      console.error('[useCoachingRegistrations] Cannot register: no db or user');
      return { success: false, error: 'Not authenticated' };
    }

    if (!session?.id) {
      console.error('[useCoachingRegistrations] Cannot register: no session ID');
      return { success: false, error: 'Invalid session' };
    }

    const coachingItemId = additionalData.coachingItemId;
    const sessionType = session.sessionType || '';
    
    // For 1:1 coaching sessions, only allow ONE active registration at a time
    // (regardless of coaching item - you can only have one 1:1 scheduled)
    if (sessionType === 'one_on_one') {
      const existing1on1 = registrations.find(r =>
        r.sessionType === 'one_on_one' &&
        r.status !== REGISTRATION_STATUS.CANCELLED &&
        r.status !== REGISTRATION_STATUS.NO_SHOW &&
        r.status !== REGISTRATION_STATUS.CERTIFIED &&
        r.sessionId !== session.id
      );
      if (existing1on1) {
        // If switching (coachingItemId provided), cancel the old one first
        if (coachingItemId) {
          console.log('[useCoachingRegistrations] Switching 1:1 - cancelling previous:', existing1on1.sessionId);
          try {
            const oldRegRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, existing1on1.id);
            await setDoc(oldRegRef, {
              status: REGISTRATION_STATUS.CANCELLED,
              cancelledAt: serverTimestamp(),
              cancelReason: 'switched_session'
            }, { merge: true });
          } catch (err) {
            console.error('[useCoachingRegistrations] Error cancelling previous 1:1:', err);
            return { success: false, error: 'Failed to cancel previous session' };
          }
        } else {
          // No coachingItemId means they're not switching - block the registration
          console.log('[useCoachingRegistrations] Already have active 1:1 registration');
          return { 
            success: false, 
            error: 'You already have a 1:1 coaching session scheduled. Cancel or attend your current session first.' 
          };
        }
      }
    }
    
    // When switching sessions for a coaching item, handle cancellation first
    if (coachingItemId) {
      // Find ALL active registrations for this coaching item
      const existingRegistrations = registrations.filter(r => 
        r.coachingItemId === coachingItemId && 
        r.status !== REGISTRATION_STATUS.CANCELLED &&
        r.status !== REGISTRATION_STATUS.NO_SHOW
      );
      
      // Cancel any registrations for different sessions
      for (const existingReg of existingRegistrations) {
        if (existingReg.sessionId !== session.id) {
          console.log('[useCoachingRegistrations] Switching sessions - cancelling previous:', existingReg.sessionId);
          try {
            const oldRegRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, existingReg.id);
            await setDoc(oldRegRef, {
              status: REGISTRATION_STATUS.CANCELLED,
              cancelledAt: serverTimestamp(),
              cancelReason: 'switched_session'
            }, { merge: true });
          } catch (err) {
            console.error('[useCoachingRegistrations] Error cancelling previous registration:', err);
          }
        } else {
          // Already registered for this exact session for this coaching item - success!
          console.log('[useCoachingRegistrations] Already registered for target session');
          return { success: true, message: 'Already registered for this session' };
        }
      }
    } else {
      // No coachingItemId - standard registration check
      if (isRegistered(session.id)) {
        return { success: false, error: 'Already registered for this session' };
      }
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
        coachEmail: session.coachEmail || null, // For facilitator notifications
        skillFocus: session.skillFocus || session.skills || [],
        
        // Additional metadata (e.g. coachingItemId from dev plan)
        ...additionalData,
        
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
  }, [db, user, isRegistered, registrations]);

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
    return registrations.filter(r => r.status === REGISTRATION_STATUS.ATTENDED || r.status === REGISTRATION_STATUS.CERTIFIED);
  }, [registrations]);

  // Get certified sessions (for milestone progression)
  const getCertifiedSessions = useCallback(() => {
    return registrations.filter(r => r.status === REGISTRATION_STATUS.CERTIFIED);
  }, [registrations]);

  // Check if a session is certified (for milestone completion)
  const isCertified = useCallback((sessionId) => {
    const reg = registrations.find(r => r.sessionId === sessionId);
    return reg?.status === REGISTRATION_STATUS.CERTIFIED;
  }, [registrations]);

  // Calculate coaching stats
  const stats = {
    totalRegistrations: registrations.filter(r => r.status !== REGISTRATION_STATUS.CANCELLED).length,
    upcomingCount: getUpcomingRegistrations().length,
    attendedCount: getAttendedSessions().length,
    certifiedCount: getCertifiedSessions().length,
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
    getRegistrationForCoachingItem,
    hasRegisteredForCoachingItem,
    getUpcomingRegistrations,
    getPastRegistrations,
    getAttendedSessions,
    getCertifiedSessions,
    isCertified,
    
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
