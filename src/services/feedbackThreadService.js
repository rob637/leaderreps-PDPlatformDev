/**
 * feedbackThreadService.js
 * 
 * Manages the thread-based feedback loop system for RED (Deliver Redirecting Feedback)
 * and CTL (Close The Loop) cycles.
 * 
 * Thread Lifecycle:
 * 1. RED created → Thread opened (state: 'open'), CTL scheduled ~10 days later
 * 2. CTL completed:
 *    - Behavior changed → Thread closed (state: 'closed')
 *    - Behavior not changed + follow-up RED → Thread continues (state: 'open_continue')
 *    - Behavior not changed + no feedback → Thread continues with commitment
 *    - Not observed → Thread deferred (state: 'deferred'), rescheduled
 * 
 * Data Model:
 * users/{userId}/feedback_threads/{threadId}
 * {
 *   id, state, createdAt, updatedAt,
 *   originalRedId, originalBehavior, originalRequest, person,
 *   cycles: [{ redId, redTimestamp, ctlId, ctlTimestamp, ctlDecision, ctlPassed }],
 *   nextCtlDue, ctlReminderSent
 * }
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { CTL_THREAD_STATES, CTL_DEFAULT_SCHEDULE_DAYS, CTL_DEFER_DEFAULT_DAYS } from '../components/conditioning/constants';

// Default CTL scheduling: 10 days after RED
const DEFAULT_CTL_DAYS = CTL_DEFAULT_SCHEDULE_DAYS || 10;
// Default defer period: 7 days
const DEFAULT_DEFER_DAYS = CTL_DEFER_DEFAULT_DAYS || 7;

/**
 * Generate a unique thread ID
 */
const generateThreadId = () => {
  return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new feedback thread when a RED rep is created
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {Object} redRep - The RED rep data
 * @returns {string} Thread ID
 */
export const createFeedbackThread = async (db, userId, redRep) => {
  if (!db || !userId || !redRep?.id) {
    throw new Error('Missing required parameters for createFeedbackThread');
  }

  const threadId = generateThreadId();
  const now = new Date();
  const ctlDueDate = new Date(now.getTime() + DEFAULT_CTL_DAYS * 24 * 60 * 60 * 1000);

  // Extract behavior and request from evidence if available
  const evidence = redRep.evidence?.redEvidence?.responses || {};
  const originalBehavior = evidence.behavior_statement || '';
  const originalRequest = evidence.request_statement || '';

  const threadData = {
    id: threadId,
    state: CTL_THREAD_STATES.OPEN,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
    
    // Original RED reference
    originalRedId: redRep.id,
    originalBehavior,
    originalRequest,
    person: redRep.person || '',
    
    // Chain of RED → CTL cycles
    cycles: [{
      redId: redRep.id,
      redTimestamp: Timestamp.fromDate(now),
      ctlId: null,
      ctlTimestamp: null,
      ctlDecision: null,
      ctlPassed: null
    }],
    
    // Scheduling
    nextCtlDue: Timestamp.fromDate(ctlDueDate),
    ctlReminderSent: false,
    
    // Metadata
    cycleCount: 1,
    deferrals: 0
  };

  const threadRef = doc(db, 'users', userId, 'feedback_threads', threadId);
  await setDoc(threadRef, threadData);

  return threadId;
};

/**
 * Get a feedback thread by ID
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} threadId - Thread ID
 * @returns {Object|null} Thread data
 */
export const getFeedbackThread = async (db, userId, threadId) => {
  if (!db || !userId || !threadId) return null;

  const threadRef = doc(db, 'users', userId, 'feedback_threads', threadId);
  const threadSnap = await getDoc(threadRef);

  if (!threadSnap.exists()) return null;
  
  return { id: threadSnap.id, ...threadSnap.data() };
};

/**
 * Get thread by RED rep ID
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} redId - RED rep ID
 * @returns {Object|null} Thread data
 */
export const getThreadByRedId = async (db, userId, redId) => {
  if (!db || !userId || !redId) return null;

  const threadsRef = collection(db, 'users', userId, 'feedback_threads');
  const q = query(threadsRef, where('originalRedId', '==', redId));
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    // Also check cycles for continuation REDs
    const allThreadsSnap = await getDocs(threadsRef);
    for (const doc of allThreadsSnap.docs) {
      const thread = doc.data();
      const matchingCycle = thread.cycles?.find(c => c.redId === redId);
      if (matchingCycle) {
        return { id: doc.id, ...thread };
      }
    }
    return null;
  }
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

/**
 * Get all open threads for a user (for dashboard display)
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @returns {Array} Open threads
 */
export const getOpenThreads = async (db, userId) => {
  if (!db || !userId) return [];

  const threadsRef = collection(db, 'users', userId, 'feedback_threads');
  const q = query(
    threadsRef,
    where('state', 'in', [CTL_THREAD_STATES.OPEN, CTL_THREAD_STATES.OPEN_CONTINUE, CTL_THREAD_STATES.DEFERRED]),
    orderBy('nextCtlDue', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get threads due for CTL check
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @returns {Array} Threads due for CTL
 */
export const getThreadsDueForCtl = async (db, userId) => {
  if (!db || !userId) return [];

  const now = Timestamp.now();
  const threadsRef = collection(db, 'users', userId, 'feedback_threads');
  const q = query(
    threadsRef,
    where('state', 'in', [CTL_THREAD_STATES.OPEN, CTL_THREAD_STATES.DEFERRED]),
    where('nextCtlDue', '<=', now)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Complete a CTL check with decision: "changed"
 * Thread is closed, behavior changed successfully
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} threadId - Thread ID
 * @param {Object} ctlData - CTL completion data
 * @returns {Object} Updated thread
 */
export const completeCtlChanged = async (db, userId, threadId, ctlData) => {
  if (!db || !userId || !threadId) {
    throw new Error('Missing required parameters for completeCtlChanged');
  }

  const threadRef = doc(db, 'users', userId, 'feedback_threads', threadId);
  const threadSnap = await getDoc(threadRef);
  
  if (!threadSnap.exists()) {
    throw new Error('Thread not found');
  }

  const thread = threadSnap.data();
  const now = new Date();

  // Update the current cycle with CTL data
  const updatedCycles = [...(thread.cycles || [])];
  const currentCycleIndex = updatedCycles.length - 1;
  
  if (currentCycleIndex >= 0) {
    updatedCycles[currentCycleIndex] = {
      ...updatedCycles[currentCycleIndex],
      ctlId: ctlData.ctlId || `ctl_${Date.now()}`,
      ctlTimestamp: Timestamp.fromDate(now),
      ctlDecision: 'changed',
      ctlPassed: ctlData.ctlPassed ?? true,
      observation: ctlData.observation || null,
      gaveReinforcingFeedback: ctlData.gaveReinforcingFeedback || false
    };
  }

  // Close the thread
  const updateData = {
    state: CTL_THREAD_STATES.CLOSED,
    updatedAt: Timestamp.fromDate(now),
    cycles: updatedCycles,
    closedAt: Timestamp.fromDate(now),
    closedReason: 'behavior_changed'
  };

  await updateDoc(threadRef, updateData);
  
  return { id: threadId, ...thread, ...updateData };
};

/**
 * Complete a CTL check with decision: "not_changed"
 * Thread continues, may need new RED
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} threadId - Thread ID
 * @param {Object} ctlData - CTL completion data
 * @param {Object} newRedData - Optional new RED rep data if follow-up feedback was given
 * @returns {Object} Updated thread
 */
export const completeCtlNotChanged = async (db, userId, threadId, ctlData, newRedData = null) => {
  if (!db || !userId || !threadId) {
    throw new Error('Missing required parameters for completeCtlNotChanged');
  }

  const threadRef = doc(db, 'users', userId, 'feedback_threads', threadId);
  const threadSnap = await getDoc(threadRef);
  
  if (!threadSnap.exists()) {
    throw new Error('Thread not found');
  }

  const thread = threadSnap.data();
  const now = new Date();

  // Update the current cycle with CTL data
  const updatedCycles = [...(thread.cycles || [])];
  const currentCycleIndex = updatedCycles.length - 1;
  
  if (currentCycleIndex >= 0) {
    updatedCycles[currentCycleIndex] = {
      ...updatedCycles[currentCycleIndex],
      ctlId: ctlData.ctlId || `ctl_${Date.now()}`,
      ctlTimestamp: Timestamp.fromDate(now),
      ctlDecision: 'not_changed',
      ctlPassed: ctlData.ctlPassed ?? false,
      observation: ctlData.observation || null,
      gaveFollowupFeedback: ctlData.gaveFollowupFeedback || false
    };
  }

  // If new RED was given, add a new cycle and schedule next CTL
  if (newRedData?.redId) {
    const nextCtlDue = new Date(now.getTime() + DEFAULT_CTL_DAYS * 24 * 60 * 60 * 1000);
    
    updatedCycles.push({
      redId: newRedData.redId,
      redTimestamp: Timestamp.fromDate(now),
      ctlId: null,
      ctlTimestamp: null,
      ctlDecision: null,
      ctlPassed: null,
      continuationNumber: updatedCycles.length + 1
    });

    const updateData = {
      state: CTL_THREAD_STATES.OPEN_CONTINUE,
      updatedAt: Timestamp.fromDate(now),
      cycles: updatedCycles,
      cycleCount: updatedCycles.length,
      nextCtlDue: Timestamp.fromDate(nextCtlDue),
      ctlReminderSent: false
    };

    await updateDoc(threadRef, updateData);
    return { id: threadId, ...thread, ...updateData };
  }

  // No new RED - keep open with commitment date
  const nextActionDate = ctlData.nextActionDate 
    ? (ctlData.nextActionDate instanceof Date ? ctlData.nextActionDate : new Date(ctlData.nextActionDate))
    : new Date(now.getTime() + DEFAULT_CTL_DAYS * 24 * 60 * 60 * 1000);

  const updateData = {
    state: CTL_THREAD_STATES.OPEN_CONTINUE,
    updatedAt: Timestamp.fromDate(now),
    cycles: updatedCycles,
    nextCtlDue: Timestamp.fromDate(nextActionDate),
    ctlReminderSent: false,
    awaitingFollowup: true,
    noFeedbackReason: ctlData.noFeedbackReason || null
  };

  await updateDoc(threadRef, updateData);
  return { id: threadId, ...thread, ...updateData };
};

/**
 * Complete a CTL check with decision: "not_observed"
 * Thread is deferred, rescheduled for later
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} threadId - Thread ID
 * @param {Object} ctlData - CTL completion data
 * @returns {Object} Updated thread
 */
export const completeCtlDeferred = async (db, userId, threadId, ctlData) => {
  if (!db || !userId || !threadId) {
    throw new Error('Missing required parameters for completeCtlDeferred');
  }

  const threadRef = doc(db, 'users', userId, 'feedback_threads', threadId);
  const threadSnap = await getDoc(threadRef);
  
  if (!threadSnap.exists()) {
    throw new Error('Thread not found');
  }

  const thread = threadSnap.data();
  const now = new Date();

  // Calculate new due date (default 7 days or custom)
  const deferDays = ctlData.deferDays || DEFAULT_DEFER_DAYS;
  const nextCtlDue = ctlData.rescheduleDate 
    ? (ctlData.rescheduleDate instanceof Date ? ctlData.rescheduleDate : new Date(ctlData.rescheduleDate))
    : new Date(now.getTime() + deferDays * 24 * 60 * 60 * 1000);

  // Add deferral record to current cycle
  const updatedCycles = [...(thread.cycles || [])];
  const currentCycleIndex = updatedCycles.length - 1;
  
  if (currentCycleIndex >= 0) {
    const currentCycle = updatedCycles[currentCycleIndex];
    updatedCycles[currentCycleIndex] = {
      ...currentCycle,
      deferrals: [...(currentCycle.deferrals || []), {
        timestamp: Timestamp.fromDate(now),
        reason: ctlData.notObservedReason || 'no_opportunity',
        detail: ctlData.notObservedDetail || null,
        rescheduledTo: Timestamp.fromDate(nextCtlDue)
      }]
    };
  }

  const updateData = {
    state: CTL_THREAD_STATES.DEFERRED,
    updatedAt: Timestamp.fromDate(now),
    cycles: updatedCycles,
    nextCtlDue: Timestamp.fromDate(nextCtlDue),
    ctlReminderSent: false,
    deferrals: (thread.deferrals || 0) + 1,
    lastDeferralReason: ctlData.notObservedReason || 'no_opportunity'
  };

  await updateDoc(threadRef, updateData);
  return { id: threadId, ...thread, ...updateData };
};

/**
 * Add a continuation RED to an existing thread
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} threadId - Thread ID
 * @param {Object} redRep - The new RED rep data
 * @returns {Object} Updated thread
 */
export const addContinuationRed = async (db, userId, threadId, redRep) => {
  if (!db || !userId || !threadId || !redRep?.id) {
    throw new Error('Missing required parameters for addContinuationRed');
  }

  const threadRef = doc(db, 'users', userId, 'feedback_threads', threadId);
  const threadSnap = await getDoc(threadRef);
  
  if (!threadSnap.exists()) {
    throw new Error('Thread not found');
  }

  const thread = threadSnap.data();
  const now = new Date();
  const nextCtlDue = new Date(now.getTime() + DEFAULT_CTL_DAYS * 24 * 60 * 60 * 1000);

  const updatedCycles = [...(thread.cycles || [])];
  updatedCycles.push({
    redId: redRep.id,
    redTimestamp: Timestamp.fromDate(now),
    ctlId: null,
    ctlTimestamp: null,
    ctlDecision: null,
    ctlPassed: null,
    continuationNumber: updatedCycles.length + 1
  });

  const updateData = {
    state: CTL_THREAD_STATES.OPEN,
    updatedAt: Timestamp.fromDate(now),
    cycles: updatedCycles,
    cycleCount: updatedCycles.length,
    nextCtlDue: Timestamp.fromDate(nextCtlDue),
    ctlReminderSent: false,
    awaitingFollowup: false
  };

  await updateDoc(threadRef, updateData);
  return { id: threadId, ...thread, ...updateData };
};

/**
 * Link an existing RED rep to a thread (for retroactive linking)
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} redId - RED rep ID
 * @param {string} threadId - Thread ID to link to
 */
export const linkRedToThread = async (db, userId, redId, threadId) => {
  if (!db || !userId || !redId || !threadId) {
    throw new Error('Missing required parameters for linkRedToThread');
  }

  // Update the rep with thread reference
  const repRef = doc(db, 'users', userId, 'conditioning_reps', redId);
  await updateDoc(repRef, {
    threadId,
    updatedAt: serverTimestamp()
  });

  // Add to thread cycles if not already present
  const thread = await getFeedbackThread(db, userId, threadId);
  if (thread) {
    const existingCycle = thread.cycles?.find(c => c.redId === redId);
    if (!existingCycle) {
      await addContinuationRed(db, userId, threadId, { id: redId });
    }
  }
};

/**
 * Get thread analytics for a user
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @returns {Object} Thread analytics
 */
export const getThreadAnalytics = async (db, userId) => {
  if (!db || !userId) return null;

  const threadsRef = collection(db, 'users', userId, 'feedback_threads');
  const snapshot = await getDocs(threadsRef);
  
  const threads = snapshot.docs.map(doc => doc.data());
  
  const analytics = {
    totalThreads: threads.length,
    openThreads: threads.filter(t => t.state === CTL_THREAD_STATES.OPEN).length,
    openContinueThreads: threads.filter(t => t.state === CTL_THREAD_STATES.OPEN_CONTINUE).length,
    deferredThreads: threads.filter(t => t.state === CTL_THREAD_STATES.DEFERRED).length,
    closedThreads: threads.filter(t => t.state === CTL_THREAD_STATES.CLOSED).length,
    
    // CTL outcomes across all cycles
    ctlOutcomes: {
      changed: 0,
      not_changed: 0,
      deferred: 0
    },
    
    // Repeat thread tracking
    repeatThreads: 0, // Threads with 2+ cycles
    totalCycles: 0,
    avgCyclesPerThread: 0,
    
    // Deferral tracking
    totalDeferrals: 0,
    threadsWithDeferrals: 0
  };

  threads.forEach(thread => {
    const cycleCount = thread.cycles?.length || 0;
    analytics.totalCycles += cycleCount;
    
    if (cycleCount > 1) {
      analytics.repeatThreads++;
    }
    
    // Count CTL outcomes
    (thread.cycles || []).forEach(cycle => {
      if (cycle.ctlDecision === 'changed') analytics.ctlOutcomes.changed++;
      else if (cycle.ctlDecision === 'not_changed') analytics.ctlOutcomes.not_changed++;
      
      // Count deferrals within cycles
      const cycleDefers = cycle.deferrals?.length || 0;
      analytics.totalDeferrals += cycleDefers;
    });
    
    if (thread.deferrals > 0) {
      analytics.threadsWithDeferrals++;
      analytics.ctlOutcomes.deferred += thread.deferrals;
    }
  });

  if (analytics.totalThreads > 0) {
    analytics.avgCyclesPerThread = (analytics.totalCycles / analytics.totalThreads).toFixed(1);
  }

  return analytics;
};

/**
 * Mark CTL reminder as sent
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} threadId - Thread ID
 */
export const markCtlReminderSent = async (db, userId, threadId) => {
  if (!db || !userId || !threadId) return;

  const threadRef = doc(db, 'users', userId, 'feedback_threads', threadId);
  await updateDoc(threadRef, {
    ctlReminderSent: true,
    reminderSentAt: serverTimestamp()
  });
};

/**
 * Check if thread has anti-gaming pattern (repeated CTL without follow-up RED)
 * @param {Object} thread - Thread data
 * @returns {Object} Pattern detection result
 */
export const detectAntiGamingPattern = (thread) => {
  if (!thread?.cycles || thread.cycles.length < 2) {
    return { detected: false, patterns: [] };
  }

  const patterns = [];
  let consecutiveNoFollowup = 0;

  // Check for repeated "not_changed" without new RED
  for (let i = 1; i < thread.cycles.length; i++) {
    const prevCycle = thread.cycles[i - 1];
    
    if (prevCycle.ctlDecision === 'not_changed' && !prevCycle.gaveFollowupFeedback) {
      consecutiveNoFollowup++;
    } else {
      consecutiveNoFollowup = 0;
    }
  }

  if (consecutiveNoFollowup >= 2) {
    patterns.push({
      type: 'avoidance_pattern',
      severity: consecutiveNoFollowup >= 3 ? 'high' : 'medium',
      message: `Behavior not changed in ${consecutiveNoFollowup} consecutive CTL checks without follow-up feedback.`
    });
  }

  // Check for excessive deferrals
  if (thread.deferrals >= 3) {
    patterns.push({
      type: 'excessive_deferrals',
      severity: thread.deferrals >= 5 ? 'high' : 'medium',
      message: `This thread has been deferred ${thread.deferrals} times.`
    });
  }

  return {
    detected: patterns.length > 0,
    patterns
  };
};

export default {
  createFeedbackThread,
  getFeedbackThread,
  getThreadByRedId,
  getOpenThreads,
  getThreadsDueForCtl,
  completeCtlChanged,
  completeCtlNotChanged,
  completeCtlDeferred,
  addContinuationRed,
  linkRedToThread,
  getThreadAnalytics,
  markCtlReminderSent,
  detectAntiGamingPattern,
  // Re-export constants for convenience
  CTL_THREAD_STATES,
  CTL_DEFAULT_SCHEDULE_DAYS,
  CTL_DEFER_DEFAULT_DAYS
};
