/**
 * Coaching Service
 * 
 * Service layer for coaching-related operations.
 * Handles admin functions like creating sessions, managing templates, etc.
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
  COACHING_SESSION_TYPES_COLLECTION,
  COACHING_SESSIONS_COLLECTION,
  COACHING_REGISTRATIONS_COLLECTION,
  SESSION_TYPES,
  SESSION_STATUS
} from '../data/Constants';

// Re-export for convenience
export { SESSION_TYPES, SESSION_STATUS };

// Legacy collection object for backward compatibility
export const COACHING_COLLECTIONS = {
  SESSION_TYPES: COACHING_SESSION_TYPES_COLLECTION,
  SESSIONS: COACHING_SESSIONS_COLLECTION,
  REGISTRATIONS: COACHING_REGISTRATIONS_COLLECTION
};

/**
 * Create a new session type (template for recurring sessions)
 */
export const createSessionType = async (db, sessionTypeData) => {
  if (!db) throw new Error('Database not initialized');
  
  const typeId = sessionTypeData.id || `session-type-${Date.now()}`;
  const docRef = doc(db, COACHING_COLLECTIONS.SESSION_TYPES, typeId);
  
  const data = {
    ...sessionTypeData,
    id: typeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: sessionTypeData.status || 'active'
  };
  
  await setDoc(docRef, data);
  console.log('[coachingService] Created session type:', typeId);
  return typeId;
};

/**
 * Create a single session instance
 */
export const createSession = async (db, sessionData) => {
  if (!db) throw new Error('Database not initialized');
  
  const sessionId = sessionData.id || `session-${Date.now()}`;
  const docRef = doc(db, COACHING_COLLECTIONS.SESSIONS, sessionId);
  
  const data = {
    ...sessionData,
    id: sessionId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: sessionData.status || SESSION_STATUS.SCHEDULED,
    spotsLeft: sessionData.maxAttendees || 20
  };
  
  await setDoc(docRef, data);
  console.log('[coachingService] Created session:', sessionId);
  return sessionId;
};

/**
 * Generate session instances from a session type template
 * Creates sessions for the next N weeks based on recurrence pattern
 */
export const generateSessionsFromType = async (db, sessionTypeId, weeksAhead = 4) => {
  if (!db) throw new Error('Database not initialized');
  
  // Get the session type template
  const typeSnap = await getDocs(query(
    collection(db, COACHING_COLLECTIONS.SESSION_TYPES),
    where('__name__', '==', sessionTypeId)
  ));
  
  if (typeSnap.empty) {
    throw new Error(`Session type not found: ${sessionTypeId}`);
  }
  
  const sessionType = { id: typeSnap.docs[0].id, ...typeSnap.docs[0].data() };
  const { recurrence } = sessionType;
  
  if (!recurrence || recurrence.type === 'none') {
    console.log('[coachingService] No recurrence pattern, skipping generation');
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
    const existingRef = doc(db, COACHING_COLLECTIONS.SESSIONS, sessionId);
    
    const sessionData = {
      id: sessionId,
      sessionTypeId: sessionTypeId,
      
      // Copy from template
      title: sessionType.title,
      description: sessionType.description,
      sessionType: sessionType.sessionType,
      coach: sessionType.coach,
      durationMinutes: sessionType.durationMinutes || 60,
      maxAttendees: sessionType.maxAttendees || 20,
      skillFocus: sessionType.skillFocus || [],
      prerequisites: sessionType.prerequisites || '',
      targetAudience: sessionType.targetAudience || '',
      linkedWorkoutId: sessionType.linkedWorkoutId || null,
      linkedProgramId: sessionType.linkedProgramId || null,
      
      // Instance-specific
      date: dateStr,
      time: recurrence.time || '12:00 PM',
      timezone: recurrence.timezone || 'America/Chicago',
      
      // Status
      status: SESSION_STATUS.SCHEDULED,
      spotsLeft: sessionType.maxAttendees || 20,
      
      // Links (to be filled in later)
      zoomLink: null,
      replayUrl: null,
      notesUrl: null
    };
    
    await setDoc(existingRef, sessionData, { merge: true });
    sessionsCreated.push(sessionId);
  }
  
  console.log('[coachingService] Generated sessions:', sessionsCreated);
  return sessionsCreated;
};

/**
 * Update session status (e.g., mark as completed, add replay)
 */
export const updateSession = async (db, sessionId, updates) => {
  if (!db) throw new Error('Database not initialized');
  
  const docRef = doc(db, COACHING_COLLECTIONS.SESSIONS, sessionId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
  
  console.log('[coachingService] Updated session:', sessionId);
};

/**
 * Cancel a session
 */
export const cancelSession = async (db, sessionId, reason = '') => {
  if (!db) throw new Error('Database not initialized');
  
  const docRef = doc(db, COACHING_COLLECTIONS.SESSIONS, sessionId);
  await updateDoc(docRef, {
    status: SESSION_STATUS.CANCELLED,
    cancelledAt: serverTimestamp(),
    cancellationReason: reason
  });
  
  console.log('[coachingService] Cancelled session:', sessionId);
};

/**
 * Mark session as completed and add replay URL
 */
export const completeSession = async (db, sessionId, replayUrl = null, notesUrl = null) => {
  if (!db) throw new Error('Database not initialized');
  
  const docRef = doc(db, COACHING_COLLECTIONS.SESSIONS, sessionId);
  await updateDoc(docRef, {
    status: SESSION_STATUS.COMPLETED,
    completedAt: serverTimestamp(),
    replayUrl,
    notesUrl
  });
  
  console.log('[coachingService] Completed session:', sessionId);
};

/**
 * Get registration count for a session
 */
export const getRegistrationCount = async (db, sessionId) => {
  if (!db) throw new Error('Database not initialized');
  
  const q = query(
    collection(db, COACHING_COLLECTIONS.REGISTRATIONS),
    where('sessionId', '==', sessionId),
    where('status', '==', 'registered')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size;
};

/**
 * Update spots left for a session
 */
export const updateSpotsLeft = async (db, sessionId) => {
  if (!db) throw new Error('Database not initialized');
  
  // Get session max attendees
  const sessionRef = doc(db, COACHING_COLLECTIONS.SESSIONS, sessionId);
  const sessionSnap = await getDocs(query(
    collection(db, COACHING_COLLECTIONS.SESSIONS),
    where('__name__', '==', sessionId)
  ));
  
  if (sessionSnap.empty) return;
  
  const session = sessionSnap.docs[0].data();
  const maxAttendees = session.maxAttendees || 20;
  
  // Count registrations
  const regCount = await getRegistrationCount(db, sessionId);
  const spotsLeft = Math.max(0, maxAttendees - regCount);
  
  await updateDoc(sessionRef, { spotsLeft });
  console.log('[coachingService] Updated spots left:', sessionId, spotsLeft);
};

/**
 * Seed initial coaching data (for development/testing)
 */
export const seedCoachingData = async (db) => {
  if (!db) throw new Error('Database not initialized');
  
  console.log('[coachingService] Seeding coaching data...');
  
  // Create session types
  const sessionTypes = [
    {
      id: 'open-gym-feedback',
      title: 'Open Gym: Feedback',
      description: 'Live practice session for real-world feedback scenarios. Bring a situation you\'re facing and get coached through it.',
      sessionType: SESSION_TYPES.OPEN_GYM,
      coach: 'Ryan',
      durationMinutes: 60,
      maxAttendees: 15,
      skillFocus: ['feedback', 'coaching-conversations'],
      prerequisites: 'Come with 1 real feedback scenario you\'re working on',
      targetAudience: 'Leaders actively giving feedback to direct reports',
      recurrence: {
        type: 'weekly',
        dayOfWeek: 2, // Tuesday
        time: '12:00 PM',
        timezone: 'America/Chicago'
      },
      status: 'active'
    },
    {
      id: 'open-gym-delegation',
      title: 'Open Gym: Delegation',
      description: 'Practice delegating effectively. Learn to let go and empower your team.',
      sessionType: SESSION_TYPES.OPEN_GYM,
      coach: 'Ryan',
      durationMinutes: 60,
      maxAttendees: 15,
      skillFocus: ['delegation', 'empowerment'],
      prerequisites: 'Identify one task you should be delegating',
      targetAudience: 'Managers who struggle to let go',
      recurrence: {
        type: 'weekly',
        dayOfWeek: 4, // Thursday
        time: '1:00 PM',
        timezone: 'America/Chicago'
      },
      status: 'active'
    },
    {
      id: 'leader-circle-new-managers',
      title: 'Leader Circle: New Managers',
      description: 'Peer coaching circle for leaders in their first 2 years of management. Share challenges, get support.',
      sessionType: SESSION_TYPES.LEADER_CIRCLE,
      coach: 'Ryan',
      durationMinutes: 90,
      maxAttendees: 12,
      skillFocus: ['leadership', 'management'],
      prerequisites: 'Must be in first 2 years of people management',
      targetAudience: 'New managers and first-time leaders',
      recurrence: {
        type: 'biweekly',
        dayOfWeek: 3, // Wednesday
        time: '3:00 PM',
        timezone: 'America/Chicago'
      },
      status: 'active'
    },
    {
      id: 'live-workout-qs1',
      title: 'QuickStart Session 1: Foundation',
      description: 'Live delivery of QuickStart Week 1 workout. Interactive session with Q&A.',
      sessionType: SESSION_TYPES.LIVE_WORKOUT,
      coach: 'Ryan',
      durationMinutes: 90,
      maxAttendees: 30,
      skillFocus: ['leadership-foundations'],
      linkedWorkoutId: 'workout-qs1',
      linkedProgramId: 'quickstart',
      recurrence: {
        type: 'none'
      },
      status: 'active'
    }
  ];
  
  for (const type of sessionTypes) {
    await createSessionType(db, type);
  }
  
  // Generate next 4 weeks of sessions for recurring types
  for (const type of sessionTypes) {
    if (type.recurrence?.type !== 'none') {
      await generateSessionsFromType(db, type.id, 4);
    }
  }
  
  // Create some one-off sessions
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  await createSession(db, {
    id: 'workshop-difficult-conversations',
    title: 'Workshop: Difficult Conversations',
    description: 'Deep-dive workshop on handling tough conversations with empathy and clarity.',
    sessionType: SESSION_TYPES.WORKSHOP,
    coach: 'Ryan',
    durationMinutes: 120,
    maxAttendees: 25,
    skillFocus: ['feedback', 'communication', 'conflict'],
    date: nextWeek.toISOString().split('T')[0],
    time: '10:00 AM',
    timezone: 'America/Chicago',
    status: SESSION_STATUS.SCHEDULED
  });
  
  console.log('[coachingService] Seeding complete!');
};

/**
 * Clear all coaching data (for testing/reset purposes)
 */
export const clearCoachingData = async (db) => {
  if (!db) throw new Error('Database not initialized');
  
  console.log('[coachingService] Clearing coaching data...');
  
  let deletedCounts = {
    sessionTypes: 0,
    sessions: 0,
    registrations: 0
  };
  
  try {
    // Clear session types
    const typesSnap = await getDocs(collection(db, COACHING_COLLECTIONS.SESSION_TYPES));
    for (const docSnap of typesSnap.docs) {
      await deleteDoc(doc(db, COACHING_COLLECTIONS.SESSION_TYPES, docSnap.id));
      deletedCounts.sessionTypes++;
    }
    console.log(`[coachingService] Deleted ${deletedCounts.sessionTypes} session types`);
    
    // Clear sessions
    const sessionsSnap = await getDocs(collection(db, COACHING_COLLECTIONS.SESSIONS));
    for (const docSnap of sessionsSnap.docs) {
      await deleteDoc(doc(db, COACHING_COLLECTIONS.SESSIONS, docSnap.id));
      deletedCounts.sessions++;
    }
    console.log(`[coachingService] Deleted ${deletedCounts.sessions} sessions`);
    
    // Clear registrations
    const regsSnap = await getDocs(collection(db, COACHING_COLLECTIONS.REGISTRATIONS));
    for (const docSnap of regsSnap.docs) {
      await deleteDoc(doc(db, COACHING_COLLECTIONS.REGISTRATIONS, docSnap.id));
      deletedCounts.registrations++;
    }
    console.log(`[coachingService] Deleted ${deletedCounts.registrations} registrations`);
    
    console.log('[coachingService] Clear complete!');
    return deletedCounts;
  } catch (error) {
    console.error('[coachingService] Error clearing data:', error);
    throw error;
  }
};

export default {
  COACHING_COLLECTIONS,
  SESSION_TYPES,
  SESSION_STATUS,
  createSessionType,
  createSession,
  generateSessionsFromType,
  updateSession,
  cancelSession,
  completeSession,
  getRegistrationCount,
  updateSpotsLeft,
  seedCoachingData,
  clearCoachingData
};
