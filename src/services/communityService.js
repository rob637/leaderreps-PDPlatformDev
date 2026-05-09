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
  getDoc,
  setDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
 * Transactional: hard-caps at maxAttendees and decrements spotsLeft atomically.
 */
export const registerForCommunitySession = async (db, userId, sessionId, sessionData = {}) => {
  if (!db) throw new Error('Database not initialized');
  if (!userId || !sessionId) throw new Error('userId and sessionId required');

  const registrationId = `${userId}_${sessionId}`;
  const regRef = doc(db, COMMUNITY_COLLECTIONS.REGISTRATIONS, registrationId);
  const sessionRef = doc(db, COMMUNITY_COLLECTIONS.SESSIONS, sessionId);

  // Fetch user profile up front (outside the txn) so the email cloud
  // function can deliver confirmations/cancellations.
  let userEmail = null;
  let userName = null;
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const userData = userSnap.exists() ? userSnap.data() : {};
    const authUser = getAuth().currentUser;
    userEmail = userData.email || userData.primaryEmail || authUser?.email || null;
    userName =
      userData.displayName ||
      userData.name ||
      userData.fullName ||
      authUser?.displayName ||
      null;
  } catch (e) {
    console.warn('[communityService] could not load user profile for registration:', e?.message);
  }

  await runTransaction(db, async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists()) {
      throw new Error('SESSION_NOT_FOUND');
    }
    const session = sessionSnap.data();

    const regSnap = await tx.get(regRef);
    const existing = regSnap.exists() ? regSnap.data() : null;
    const alreadyActive =
      existing && existing.status === REGISTRATION_STATUS.REGISTERED;

    const maxAttendees =
      typeof session.maxAttendees === 'number' ? session.maxAttendees : null;
    const currentSpots =
      typeof session.spotsLeft === 'number' ? session.spotsLeft : maxAttendees;

    if (!alreadyActive && maxAttendees !== null && currentSpots <= 0) {
      throw new Error('SESSION_FULL');
    }

    tx.set(regRef, {
      id: registrationId,
      userId,
      userEmail,
      userName,
      sessionId,
      sessionTitle: sessionData.title || session.title || '',
      sessionDate: sessionData.date || session.date || '',
      sessionTime: sessionData.time || session.time || '',
      sessionType: sessionData.sessionType || session.sessionType || '',
      host: session.host || sessionData.host || null,
      hostEmail: session.hostEmail || sessionData.hostEmail || null,
      zoomLink: session.zoomLink || session.meetingLink || sessionData.zoomLink || null,
      status: REGISTRATION_STATUS.REGISTERED,
      registeredAt: existing?.registeredAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (!alreadyActive && maxAttendees !== null) {
      tx.update(sessionRef, {
        spotsLeft: Math.max(0, currentSpots - 1),
        updatedAt: serverTimestamp(),
      });
    }
  });

  console.log('[communityService] User registered:', registrationId);
  return registrationId;
};

/**
 * Cancel a user's registration
 * Transactional: only restores a spot if the registration was active.
 */
export const cancelCommunityRegistration = async (db, userId, sessionId) => {
  if (!db) throw new Error('Database not initialized');

  const registrationId = `${userId}_${sessionId}`;
  const regRef = doc(db, COMMUNITY_COLLECTIONS.REGISTRATIONS, registrationId);
  const sessionRef = doc(db, COMMUNITY_COLLECTIONS.SESSIONS, sessionId);

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
      const session = sessionSnap.data();
      const maxAttendees =
        typeof session.maxAttendees === 'number'
          ? session.maxAttendees
          : null;
      const currentSpots =
        typeof session.spotsLeft === 'number' ? session.spotsLeft : 0;
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
