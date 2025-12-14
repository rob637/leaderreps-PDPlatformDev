/**
 * Community Service
 * 
 * Service layer for community session operations.
 * Handles admin functions like creating sessions, managing templates, registrations, etc.
 * Mirrors the coaching service pattern.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

import {
  COMMUNITY_SESSIONS_COLLECTION,
  COMMUNITY_SESSION_TYPES_COLLECTION,
  COMMUNITY_REGISTRATIONS_COLLECTION,
  COMMUNITY_SESSION_TYPES,
  COMMUNITY_RECURRENCE,
  SESSION_STATUS,
  REGISTRATION_STATUS
} from '../data/Constants';

// Re-export for convenience
export { COMMUNITY_SESSION_TYPES, COMMUNITY_RECURRENCE, SESSION_STATUS, REGISTRATION_STATUS };

// Collection references
export const COMMUNITY_COLLECTIONS = {
  SESSION_TYPES: COMMUNITY_SESSION_TYPES_COLLECTION,
  SESSIONS: COMMUNITY_SESSIONS_COLLECTION,
  REGISTRATIONS: COMMUNITY_REGISTRATIONS_COLLECTION
};

// Session Type Configurations for display
export const COMMUNITY_SESSION_TYPE_CONFIG = {
  leader_circle: {
    label: 'Leader Circle',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '🔮',
    description: 'Peer discussion and accountability groups'
  },
  community_event: {
    label: 'Community Event',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '🎉',
    description: 'Live networking and learning events'
  },
  accountability_pod: {
    label: 'Accountability Pod',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
    icon: '👥',
    description: 'Small group check-ins and support'
  },
  mastermind: {
    label: 'Mastermind',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '🧠',
    description: 'Expert-led group problem-solving sessions'
  },
  networking: {
    label: 'Networking',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '🤝',
    description: 'Casual networking and connection building'
  }
};

/**
 * Create a new community session type (template for recurring sessions)
 */
export const createCommunitySessionType = async (db, sessionTypeData) => {
  if (!db) throw new Error('Database not initialized');
  
  const typeId = sessionTypeData.id || `community-type-${Date.now()}`;
  const docRef = doc(db, COMMUNITY_COLLECTIONS.SESSION_TYPES, typeId);
  
  const data = {
    ...sessionTypeData,
    id: typeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: sessionTypeData.status || 'active'
  };
  
  await setDoc(docRef, data);
  console.log('[communityService] Created session type:', typeId);
  return typeId;
};

/**
 * Create a single community session instance
 */
export const createCommunitySession = async (db, sessionData) => {
  if (!db) throw new Error('Database not initialized');
  
  const sessionId = sessionData.id || `community-session-${Date.now()}`;
  const docRef = doc(db, COMMUNITY_COLLECTIONS.SESSIONS, sessionId);
  
  const data = {
    ...sessionData,
    id: sessionId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: sessionData.status || SESSION_STATUS.SCHEDULED,
    spotsLeft: sessionData.maxAttendees || 20
  };
  
  await setDoc(docRef, data);
  console.log('[communityService] Created session:', sessionId);
  return sessionId;
};

/**
 * Generate community session instances from a session type template
 * Creates sessions for the next N weeks based on recurrence pattern
 */
export const generateCommunitySessionsFromType = async (db, sessionTypeId, weeksAhead = 4) => {
  if (!db) throw new Error('Database not initialized');
  
  // Get the session type template
  const typeSnap = await getDocs(query(
    collection(db, COMMUNITY_COLLECTIONS.SESSION_TYPES),
    where('__name__', '==', sessionTypeId)
  ));
  
  if (typeSnap.empty) {
    throw new Error(`Community session type not found: ${sessionTypeId}`);
  }
  
  const sessionType = { id: typeSnap.docs[0].id, ...typeSnap.docs[0].data() };
  const { recurrence } = sessionType;
  
  if (!recurrence || recurrence.type === 'none') {
    console.log('[communityService] No recurrence pattern, skipping generation');
    return [];
  }
  
  const sessionsCreated = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate dates based on recurrence
  const dates = [];
  let currentDate = new Date(today);
  
  // Find first occurrence (next matching day of week)
  if (recurrence.dayOfWeek !== undefined) {
    const daysUntilTarget = (recurrence.dayOfWeek - currentDate.getDay() + 7) % 7;
    currentDate.setDate(currentDate.getDate() + (daysUntilTarget || 7));
  }
  
  // Generate dates
  const weeksToGenerate = weeksAhead;
  const weekIncrement = recurrence.type === 'weekly' ? 1 : 
                        recurrence.type === 'biweekly' ? 2 : 4;
  
  for (let i = 0; i < weeksToGenerate; i += weekIncrement) {
    const sessionDate = new Date(currentDate);
    sessionDate.setDate(sessionDate.getDate() + (i * 7));
    dates.push(sessionDate);
  }
  
  // Create sessions for each date
  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    const sessionId = `${sessionTypeId}-${dateStr}`;
    
    // Check if session already exists
    const existingRef = doc(db, COMMUNITY_COLLECTIONS.SESSIONS, sessionId);
    
    const sessionData = {
      id: sessionId,
      sessionTypeId: sessionTypeId,
      
      // Copy from template
      title: sessionType.title,
      description: sessionType.description,
      sessionType: sessionType.sessionType,
      host: sessionType.host,
      durationMinutes: sessionType.durationMinutes || 60,
      maxAttendees: sessionType.maxAttendees || 20,
      topicFocus: sessionType.topicFocus || [],
      prerequisites: sessionType.prerequisites || '',
      targetAudience: sessionType.targetAudience || '',
      
      // Instance-specific
      date: dateStr,
      time: recurrence.time || '12:00 PM',
      timezone: recurrence.timezone || 'America/Chicago',
      
      // Recurrence info
      recurrence: recurrence.type || 'none',
      
      // Status
      status: SESSION_STATUS.SCHEDULED,
      spotsLeft: sessionType.maxAttendees || 20,
      
      // Links (to be filled in later)
      meetingLink: null,
      replayUrl: null,
      notesUrl: null
    };
    
    await setDoc(existingRef, sessionData, { merge: true });
    sessionsCreated.push(sessionId);
  }
  
  console.log('[communityService] Generated sessions:', sessionsCreated);
  return sessionsCreated;
};

/**
 * Update community session
 */
export const updateCommunitySession = async (db, sessionId, updates) => {
  if (!db) throw new Error('Database not initialized');
  
  const docRef = doc(db, COMMUNITY_COLLECTIONS.SESSIONS, sessionId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
  
  console.log('[communityService] Updated session:', sessionId);
};

/**
 * Delete community session
 */
export const deleteCommunitySession = async (db, sessionId) => {
  if (!db) throw new Error('Database not initialized');
  
  const docRef = doc(db, COMMUNITY_COLLECTIONS.SESSIONS, sessionId);
  await deleteDoc(docRef);
  
  console.log('[communityService] Deleted session:', sessionId);
};

/**
 * Cancel a community session
 */
export const cancelCommunitySession = async (db, sessionId, reason = '') => {
  if (!db) throw new Error('Database not initialized');
  
  await updateCommunitySession(db, sessionId, {
    status: SESSION_STATUS.CANCELLED,
    cancellationReason: reason,
    cancelledAt: serverTimestamp()
  });
  
  console.log('[communityService] Cancelled session:', sessionId);
};

/**
 * Register a user for a community session
 */
export const registerForCommunitySession = async (db, userId, sessionId, sessionData = {}) => {
  if (!db) throw new Error('Database not initialized');
  if (!userId || !sessionId) throw new Error('userId and sessionId required');
  
  const registrationId = `${userId}_${sessionId}`;
  const docRef = doc(db, COMMUNITY_COLLECTIONS.REGISTRATIONS, registrationId);
  
  const registration = {
    id: registrationId,
    userId,
    sessionId,
    sessionTitle: sessionData.title || '',
    sessionDate: sessionData.date || '',
    sessionTime: sessionData.time || '',
    sessionType: sessionData.sessionType || '',
    status: REGISTRATION_STATUS.REGISTERED,
    registeredAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(docRef, registration);
  
  // Update spots left on session
  if (sessionData.spotsLeft > 0) {
    const sessionRef = doc(db, COMMUNITY_COLLECTIONS.SESSIONS, sessionId);
    await updateDoc(sessionRef, {
      spotsLeft: sessionData.spotsLeft - 1,
      updatedAt: serverTimestamp()
    });
  }
  
  console.log('[communityService] User registered:', registrationId);
  return registrationId;
};

/**
 * Cancel a user's registration
 */
export const cancelCommunityRegistration = async (db, userId, sessionId) => {
  if (!db) throw new Error('Database not initialized');
  
  const registrationId = `${userId}_${sessionId}`;
  const docRef = doc(db, COMMUNITY_COLLECTIONS.REGISTRATIONS, registrationId);
  
  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.CANCELLED,
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  // Update spots left on session (add back the spot)
  const sessionRef = doc(db, COMMUNITY_COLLECTIONS.SESSIONS, sessionId);
  const sessionSnap = await getDocs(query(
    collection(db, COMMUNITY_COLLECTIONS.SESSIONS),
    where('__name__', '==', sessionId)
  ));
  
  if (!sessionSnap.empty) {
    const session = sessionSnap.docs[0].data();
    await updateDoc(sessionRef, {
      spotsLeft: (session.spotsLeft || 0) + 1,
      updatedAt: serverTimestamp()
    });
  }
  
  console.log('[communityService] Registration cancelled:', registrationId);
};

/**
 * Get all registrations for a session
 */
export const getSessionRegistrations = async (db, sessionId) => {
  if (!db) throw new Error('Database not initialized');
  
  const q = query(
    collection(db, COMMUNITY_COLLECTIONS.REGISTRATIONS),
    where('sessionId', '==', sessionId),
    where('status', '==', REGISTRATION_STATUS.REGISTERED)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get all registrations for a user
 */
export const getUserCommunityRegistrations = async (db, userId) => {
  if (!db) throw new Error('Database not initialized');
  
  const q = query(
    collection(db, COMMUNITY_COLLECTIONS.REGISTRATIONS),
    where('userId', '==', userId),
    where('status', '==', REGISTRATION_STATUS.REGISTERED)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Duplicate a session (for admins)
 */
export const duplicateCommunitySession = async (db, sessionId, newDate) => {
  if (!db) throw new Error('Database not initialized');
  
  // Get original session
  const sessionsRef = collection(db, COMMUNITY_COLLECTIONS.SESSIONS);
  const q = query(sessionsRef, where('id', '==', sessionId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  const originalSession = snapshot.docs[0].data();
  const newSessionId = `community-session-${Date.now()}`;
  
  const newSession = {
    ...originalSession,
    id: newSessionId,
    date: newDate,
    status: SESSION_STATUS.SCHEDULED,
    spotsLeft: originalSession.maxAttendees || 20,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    meetingLink: null,
    replayUrl: null
  };
  
  delete newSession.cancelledAt;
  delete newSession.cancellationReason;
  
  await setDoc(doc(db, COMMUNITY_COLLECTIONS.SESSIONS, newSessionId), newSession);
  
  console.log('[communityService] Duplicated session:', newSessionId);
  return newSessionId;
};

// Seed sample data for development
export const seedCommunitySessions = async (db) => {
  if (!db) throw new Error('Database not initialized');
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const sampleSessions = [
    {
      id: 'community-sample-1',
      title: 'Weekly Leader Circle',
      description: 'Join fellow leaders for peer discussion, accountability, and support. Share wins, challenges, and get feedback from your cohort.',
      sessionType: COMMUNITY_SESSION_TYPES.LEADER_CIRCLE,
      host: 'Ryan',
      date: tomorrow.toISOString().split('T')[0],
      time: '2:00 PM',
      timezone: 'America/Chicago',
      durationMinutes: 60,
      maxAttendees: 12,
      spotsLeft: 12,
      topicFocus: ['Accountability', 'Peer Support'],
      recurrence: 'weekly',
      status: SESSION_STATUS.SCHEDULED
    },
    {
      id: 'community-sample-2',
      title: 'New Member Networking',
      description: 'Welcome event for new Arena members. Meet your cohort, learn about the community, and connect with experienced leaders.',
      sessionType: COMMUNITY_SESSION_TYPES.NETWORKING,
      host: 'Community Team',
      date: nextWeek.toISOString().split('T')[0],
      time: '12:00 PM',
      timezone: 'America/Chicago',
      durationMinutes: 45,
      maxAttendees: 30,
      spotsLeft: 30,
      topicFocus: ['Introductions', 'Community Overview'],
      recurrence: 'none',
      status: SESSION_STATUS.SCHEDULED
    },
    {
      id: 'community-sample-3',
      title: 'Delegation Mastermind',
      description: 'Deep dive into delegation challenges with expert facilitation. Bring your real-world scenarios for group problem-solving.',
      sessionType: COMMUNITY_SESSION_TYPES.MASTERMIND,
      host: 'Ryan',
      date: nextWeek.toISOString().split('T')[0],
      time: '3:00 PM',
      timezone: 'America/Chicago',
      durationMinutes: 90,
      maxAttendees: 8,
      spotsLeft: 8,
      topicFocus: ['Delegation', 'Leadership'],
      recurrence: 'biweekly',
      status: SESSION_STATUS.SCHEDULED
    }
  ];
  
  for (const session of sampleSessions) {
    await createCommunitySession(db, session);
  }
  
  console.log('[communityService] Seeded sample community sessions');
  return sampleSessions.map(s => s.id);
};

export default {
  COMMUNITY_COLLECTIONS,
  COMMUNITY_SESSION_TYPE_CONFIG,
  createCommunitySessionType,
  createCommunitySession,
  generateCommunitySessionsFromType,
  updateCommunitySession,
  deleteCommunitySession,
  cancelCommunitySession,
  registerForCommunitySession,
  cancelCommunityRegistration,
  getSessionRegistrations,
  getUserCommunityRegistrations,
  duplicateCommunitySession,
  seedCommunitySessions
};
