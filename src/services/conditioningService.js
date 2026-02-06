import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit as firestoreLimit
} from 'firebase/firestore';
import { timeService } from './timeService';

/**
 * Conditioning Layer Service
 * 
 * Manages real leadership rep accountability between Foundation sessions.
 * Core rule: Each leader must complete ≥1 real rep per week.
 * 
 * Data Model:
 * /users/{uid}/conditioning_reps/{repId}
 *   - person: string (who the rep is with)
 *   - repType: 'feedback' | '1:1' | 'tension' | 'other'
 *   - status: 'active' | 'completed' | 'missed' | 'canceled'
 *   - deadline: Timestamp (defaults to end of week - Saturday 11:59 PM)
 *   - weekId: string (YYYY-Www format, e.g., "2026-W06")
 *   - cohortId: string (ties rep to specific cohort)
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *   - completedAt?: Timestamp
 *   - canceledAt?: Timestamp
 *   - cancelReason?: string (required if canceled)
 *   - rolledForwardFrom?: string (repId if this was rolled from missed week)
 *   - prep?: { text?: string, voiceUrl?: string, transcription?: string } (Phase 2)
 *   - evidence?: { ... } (Phase 2)
 * 
 * /users/{uid}/conditioning_weeks/{weekId}
 *   - weekStart: Timestamp (Sunday 00:00)
 *   - weekEnd: Timestamp (Saturday 23:59)
 *   - requiredRepCompleted: boolean
 *   - totalRepsCommitted: number
 *   - totalRepsCompleted: number
 *   - totalRepsMissed: number
 *   - cohortId: string
 *   - consecutiveMissedWeeks: number (for escalation logic)
 */

// Rep types available for commitment
export const REP_TYPES = [
  { id: 'feedback', label: 'Feedback', description: 'Give or request feedback' },
  { id: '1:1', label: '1:1', description: 'One-on-one conversation' },
  { id: 'tension', label: 'Tension', description: 'Address a tension or conflict' },
  { id: 'other', label: 'Other', description: 'Other leadership rep' }
];

// Rep statuses
export const REP_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  MISSED: 'missed',
  CANCELED: 'canceled'
};

// ============================================
// PHASE 2: EVIDENCE & QUALITY ASSESSMENT
// ============================================

// Evidence levels based on submission timing
export const EVIDENCE_LEVEL = {
  LEVEL_1: 'level_1', // Submitted same business day
  LEVEL_2: 'level_2'  // Submitted 24+ hours later
};

// Quality assessment dimensions
export const QUALITY_DIMENSIONS = {
  SPECIFIC_LANGUAGE: 'specific_language',    // Did they use specific language?
  CLEAR_REQUEST: 'clear_request',            // Was there a clear request/ask?
  NAMED_COMMITMENT: 'named_commitment',      // Was a commitment named (or explicitly absent)?
  REFLECTION: 'reflection'                   // Did they reflect on the outcome?
};

// Debrief prompts for Level 1 (same day)
export const LEVEL_1_PROMPTS = [
  { id: 'what_said', label: 'What I said', prompt: 'What did you actually say? (exact language or close paraphrase)' },
  { id: 'response', label: 'Their response', prompt: 'How did the other person respond?' },
  { id: 'commitment', label: 'Commitment', prompt: 'What commitment (if any) was made?' },
  { id: 'next_time', label: 'Next time', prompt: 'What would you do differently next time?' }
];

// Debrief prompts for Level 2 (24+ hours later - different focus)
export const LEVEL_2_PROMPTS = [
  { id: 'what_happened', label: 'What happened', prompt: 'Describe the conversation as you remember it.' },
  { id: 'key_moment', label: 'Key moment', prompt: 'What was the most important moment in the conversation?' },
  { id: 'outcome', label: 'Outcome', prompt: 'What was the outcome? Any follow-up needed?' },
  { id: 'learning', label: 'Learning', prompt: 'What did you learn from this rep?' }
];

/**
 * Get the current week ID (Sunday-Saturday)
 * Format: YYYY-Www (e.g., "2026-W06")
 */
export const getCurrentWeekId = (date = null) => {
  const d = date || timeService.getNow();
  
  // Get the Sunday of the current week
  const sunday = new Date(d);
  const dayOfWeek = sunday.getDay(); // 0 = Sunday
  sunday.setDate(sunday.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  
  // Calculate ISO week number (adjusted for Sunday start)
  const startOfYear = new Date(sunday.getFullYear(), 0, 1);
  const days = Math.floor((sunday - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${sunday.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * Get the week boundaries (Sunday 00:00 to Saturday 23:59)
 */
export const getWeekBoundaries = (weekId = null) => {
  const targetWeekId = weekId || getCurrentWeekId();
  const [year, weekPart] = targetWeekId.split('-W');
  const weekNumber = parseInt(weekPart, 10);
  
  // Calculate the first Sunday of the year
  const jan1 = new Date(parseInt(year, 10), 0, 1);
  const jan1Day = jan1.getDay();
  const firstSunday = new Date(jan1);
  firstSunday.setDate(jan1.getDate() - jan1Day);
  
  // Calculate the Sunday of the target week
  const weekStart = new Date(firstSunday);
  weekStart.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
  weekStart.setHours(0, 0, 0, 0);
  
  // Saturday 23:59:59
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
};

/**
 * Get default deadline (end of current week - Saturday 23:59)
 */
export const getDefaultDeadline = () => {
  const { weekEnd } = getWeekBoundaries();
  return Timestamp.fromDate(weekEnd);
};

export const conditioningService = {
  
  // ============================================
  // REP CRUD OPERATIONS
  // ============================================
  
  /**
   * Commit a new leadership rep
   */
  commitRep: async (db, userId, repData) => {
    if (!userId) throw new Error('User ID required');
    if (!repData.person) throw new Error('Person is required');
    if (!repData.repType) throw new Error('Rep type is required');
    if (!repData.cohortId) throw new Error('Cohort ID is required');
    
    const repId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const weekId = getCurrentWeekId();
    const { weekEnd } = getWeekBoundaries(weekId);
    
    const repDoc = {
      id: repId,
      person: repData.person.trim(),
      repType: repData.repType,
      status: REP_STATUS.ACTIVE,
      deadline: repData.deadline || Timestamp.fromDate(weekEnd),
      weekId,
      cohortId: repData.cohortId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Optional fields
      ...(repData.notes && { notes: repData.notes }),
      ...(repData.rolledForwardFrom && { rolledForwardFrom: repData.rolledForwardFrom })
    };
    
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    await setDoc(repRef, repDoc);
    
    // Update weekly stats
    await conditioningService.updateWeeklyStats(db, userId, weekId, repData.cohortId);
    
    return repId;
  },
  
  /**
   * Get a single rep by ID
   */
  getRep: async (db, userId, repId) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    return repSnap.exists() ? { id: repSnap.id, ...repSnap.data() } : null;
  },
  
  /**
   * Update a rep (can edit person, repType, deadline, notes)
   * Cannot delete to avoid - must cancel with reason
   */
  updateRep: async (db, userId, repId, updates) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Cannot update completed or canceled reps
    if (currentRep.status === REP_STATUS.COMPLETED) {
      throw new Error('Cannot update a completed rep');
    }
    if (currentRep.status === REP_STATUS.CANCELED) {
      throw new Error('Cannot update a canceled rep');
    }
    
    // Only allow updating specific fields
    const allowedUpdates = {};
    if (updates.person) allowedUpdates.person = updates.person.trim();
    if (updates.repType) allowedUpdates.repType = updates.repType;
    if (updates.deadline) allowedUpdates.deadline = updates.deadline;
    if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;
    
    await updateDoc(repRef, {
      ...allowedUpdates,
      updatedAt: serverTimestamp()
    });
    
    return true;
  },
  
  /**
   * Save prep notes for a rep (optional pre-execution preparation)
   * No rewriting, no validation - just stores the leader's raw thinking
   */
  saveRepPrep: async (db, userId, repId, prepData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Can only add prep to active or missed reps
    if (currentRep.status === REP_STATUS.COMPLETED) {
      throw new Error('Cannot add prep to a completed rep');
    }
    if (currentRep.status === REP_STATUS.CANCELED) {
      throw new Error('Cannot add prep to a canceled rep');
    }
    
    // Structure the prep data
    const prep = {
      opening_language: prepData.opening_language || null,
      behavior_to_address: prepData.behavior_to_address || null,
      commitment_to_request: prepData.commitment_to_request || null,
      inputMethod: prepData.inputMethod || 'written', // 'written' | 'voice'
      savedAt: serverTimestamp(),
      voiceUrl: prepData.voiceUrl || null, // For future voice support
      transcription: prepData.transcription || null // For future voice support
    };
    
    await updateDoc(repRef, {
      prep,
      updatedAt: serverTimestamp()
    });
    
    return true;
  },
  
  /**
   * Get prep data for a rep
   */
  getRepPrep: async (db, userId, repId) => {
    const rep = await conditioningService.getRep(db, userId, repId);
    if (!rep) throw new Error('Rep not found');
    return rep.prep || null;
  },
  
  /**
   * Complete a rep
   */
  completeRep: async (db, userId, repId) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    if (currentRep.status === REP_STATUS.COMPLETED) {
      throw new Error('Rep already completed');
    }
    if (currentRep.status === REP_STATUS.CANCELED) {
      throw new Error('Cannot complete a canceled rep');
    }
    
    await updateDoc(repRef, {
      status: REP_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update weekly stats
    await conditioningService.updateWeeklyStats(db, userId, currentRep.weekId, currentRep.cohortId);
    
    return true;
  },
  
  /**
   * Cancel a rep (requires reason)
   */
  cancelRep: async (db, userId, repId, cancelReason) => {
    if (!cancelReason || cancelReason.trim().length === 0) {
      throw new Error('Cancel reason is required');
    }
    
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    if (currentRep.status === REP_STATUS.COMPLETED) {
      throw new Error('Cannot cancel a completed rep');
    }
    if (currentRep.status === REP_STATUS.CANCELED) {
      throw new Error('Rep already canceled');
    }
    
    await updateDoc(repRef, {
      status: REP_STATUS.CANCELED,
      cancelReason: cancelReason.trim(),
      canceledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update weekly stats
    await conditioningService.updateWeeklyStats(db, userId, currentRep.weekId, currentRep.cohortId);
    
    return true;
  },
  
  /**
   * Mark a rep as missed (called by deadline check logic)
   */
  markRepMissed: async (db, userId, repId) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Only active reps can be marked as missed
    if (currentRep.status !== REP_STATUS.ACTIVE) {
      return false; // Already handled
    }
    
    await updateDoc(repRef, {
      status: REP_STATUS.MISSED,
      updatedAt: serverTimestamp()
    });
    
    return true;
  },
  
  /**
   * Roll forward a missed rep to the current week
   * Creates a new rep referencing the original
   */
  rollForwardRep: async (db, userId, missedRepId, cohortId) => {
    const missedRep = await conditioningService.getRep(db, userId, missedRepId);
    
    if (!missedRep) throw new Error('Missed rep not found');
    if (missedRep.status !== REP_STATUS.MISSED) {
      throw new Error('Can only roll forward missed reps');
    }
    
    // Create new rep with reference to original
    const newRepId = await conditioningService.commitRep(db, userId, {
      person: missedRep.person,
      repType: missedRep.repType,
      cohortId,
      notes: missedRep.notes,
      rolledForwardFrom: missedRepId
    });
    
    return newRepId;
  },
  
  // ============================================
  // QUERY OPERATIONS
  // ============================================
  
  /**
   * Get all reps for the current week
   */
  getCurrentWeekReps: async (db, userId, cohortId = null) => {
    const weekId = getCurrentWeekId();
    return conditioningService.getRepsByWeek(db, userId, weekId, cohortId);
  },
  
  /**
   * Get reps for a specific week
   */
  getRepsByWeek: async (db, userId, weekId, cohortId = null) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    let q;
    if (cohortId) {
      q = query(
        repsRef, 
        where('weekId', '==', weekId),
        where('cohortId', '==', cohortId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        repsRef, 
        where('weekId', '==', weekId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * Get all active reps (current + missed that need attention)
   */
  getActiveReps: async (db, userId, cohortId = null) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    let q;
    if (cohortId) {
      q = query(
        repsRef, 
        where('status', 'in', [REP_STATUS.ACTIVE, REP_STATUS.MISSED]),
        where('cohortId', '==', cohortId),
        orderBy('deadline', 'asc')
      );
    } else {
      q = query(
        repsRef, 
        where('status', 'in', [REP_STATUS.ACTIVE, REP_STATUS.MISSED]),
        orderBy('deadline', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * Get all missed reps that haven't been resolved
   */
  getMissedReps: async (db, userId, cohortId = null) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    let q;
    if (cohortId) {
      q = query(
        repsRef, 
        where('status', '==', REP_STATUS.MISSED),
        where('cohortId', '==', cohortId),
        orderBy('deadline', 'asc')
      );
    } else {
      q = query(
        repsRef, 
        where('status', '==', REP_STATUS.MISSED),
        orderBy('deadline', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * Get rep history (completed + canceled)
   */
  getRepHistory: async (db, userId, cohortId = null, limitCount = 50) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // Note: Firestore doesn't support OR in where clauses with different fields easily
    // So we'll fetch all and filter in memory for now
    const q = query(
      repsRef,
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    let reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter to completed and canceled
    reps = reps.filter(rep => 
      rep.status === REP_STATUS.COMPLETED || rep.status === REP_STATUS.CANCELED
    );
    
    // Filter by cohort if specified
    if (cohortId) {
      reps = reps.filter(rep => rep.cohortId === cohortId);
    }
    
    return reps.slice(0, limitCount);
  },
  
  /**
   * Subscribe to current week reps (real-time updates)
   */
  subscribeToCurrentWeekReps: (db, userId, cohortId, callback) => {
    if (!userId) return () => {};
    
    const weekId = getCurrentWeekId();
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    const q = query(
      repsRef,
      where('weekId', '==', weekId),
      where('cohortId', '==', cohortId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(reps);
    });
  },
  
  /**
   * Subscribe to all active reps (real-time)
   */
  subscribeToActiveReps: (db, userId, cohortId, callback) => {
    if (!userId) return () => {};
    
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    const q = query(
      repsRef,
      where('status', 'in', [REP_STATUS.ACTIVE, REP_STATUS.MISSED]),
      where('cohortId', '==', cohortId),
      orderBy('deadline', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(reps);
    });
  },
  
  // ============================================
  // WEEKLY STATUS & STATS
  // ============================================
  
  /**
   * Get weekly status summary
   */
  getWeeklyStatus: async (db, userId, weekId = null, cohortId = null) => {
    const targetWeekId = weekId || getCurrentWeekId();
    const reps = await conditioningService.getRepsByWeek(db, userId, targetWeekId, cohortId);
    
    const completed = reps.filter(r => r.status === REP_STATUS.COMPLETED);
    const active = reps.filter(r => r.status === REP_STATUS.ACTIVE);
    const missed = reps.filter(r => r.status === REP_STATUS.MISSED);
    const canceled = reps.filter(r => r.status === REP_STATUS.CANCELED);
    
    const { weekStart, weekEnd } = getWeekBoundaries(targetWeekId);
    
    return {
      weekId: targetWeekId,
      weekStart,
      weekEnd,
      requiredRepCompleted: completed.length >= 1,
      totalCommitted: reps.length - canceled.length,
      totalCompleted: completed.length,
      totalActive: active.length,
      totalMissed: missed.length,
      totalCanceled: canceled.length,
      reps
    };
  },
  
  /**
   * Update weekly stats document
   */
  updateWeeklyStats: async (db, userId, weekId, cohortId) => {
    const status = await conditioningService.getWeeklyStatus(db, userId, weekId, cohortId);
    
    const weekRef = doc(db, 'users', userId, 'conditioning_weeks', weekId);
    
    await setDoc(weekRef, {
      weekId,
      weekStart: Timestamp.fromDate(status.weekStart),
      weekEnd: Timestamp.fromDate(status.weekEnd),
      cohortId,
      requiredRepCompleted: status.requiredRepCompleted,
      totalRepsCommitted: status.totalCommitted,
      totalRepsCompleted: status.totalCompleted,
      totalRepsMissed: status.totalMissed,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return status;
  },
  
  /**
   * Subscribe to weekly status
   */
  subscribeToWeeklyStatus: (db, userId, weekId, callback) => {
    if (!userId) return () => {};
    
    const weekRef = doc(db, 'users', userId, 'conditioning_weeks', weekId);
    
    return onSnapshot(weekRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback(null);
      }
    });
  },
  
  // ============================================
  // DEADLINE & ROLLOVER LOGIC
  // ============================================
  
  /**
   * Check for overdue reps and mark them as missed
   * Should be called on app load and periodically
   */
  checkAndMarkOverdueReps: async (db, userId, cohortId = null) => {
    const now = timeService.getNow();
    const activeReps = await conditioningService.getActiveReps(db, userId, cohortId);
    
    const overdueReps = activeReps.filter(rep => {
      if (rep.status !== REP_STATUS.ACTIVE) return false;
      const deadline = rep.deadline?.toDate ? rep.deadline.toDate() : new Date(rep.deadline);
      return deadline < now;
    });
    
    const markedMissed = [];
    for (const rep of overdueReps) {
      const marked = await conditioningService.markRepMissed(db, userId, rep.id);
      if (marked) {
        markedMissed.push(rep.id);
        // Update weekly stats after marking
        await conditioningService.updateWeeklyStats(db, userId, rep.weekId, rep.cohortId);
      }
    }
    
    return markedMissed;
  },
  
  /**
   * Get consecutive missed weeks count (for escalation logic)
   */
  getConsecutiveMissedWeeks: async (db, userId, cohortId) => {
    const weeksRef = collection(db, 'users', userId, 'conditioning_weeks');
    const q = query(
      weeksRef,
      where('cohortId', '==', cohortId),
      orderBy('weekId', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const weeks = snapshot.docs.map(doc => doc.data());
    
    let consecutiveMissed = 0;
    for (const week of weeks) {
      if (week.requiredRepCompleted) {
        break; // Found a successful week, stop counting
      }
      consecutiveMissed++;
    }
    
    return consecutiveMissed;
  },
  
  // ============================================
  // NUDGE LOGIC (Phase 1 - Basic)
  // ============================================
  
  /**
   * Get nudge status for a user
   * Returns what nudge (if any) should be shown
   */
  getNudgeStatus: async (db, userId, cohortId) => {
    const now = timeService.getNow();
    const weekId = getCurrentWeekId();
    const status = await conditioningService.getWeeklyStatus(db, userId, weekId, cohortId);
    
    // Calculate day of week (0 = Sunday)
    const dayOfWeek = now.getDay();
    
    // If already completed a rep this week, no nudge needed
    if (status.requiredRepCompleted) {
      return { type: 'none', message: null };
    }
    
    // Check for consecutive missed weeks
    const consecutiveMissed = await conditioningService.getConsecutiveMissedWeeks(db, userId, cohortId);
    
    if (consecutiveMissed >= 2) {
      return {
        type: 'escalation',
        level: 'trainer_flag',
        message: `You've missed your required rep for ${consecutiveMissed} consecutive weeks. Your trainer has been notified.`,
        consecutiveMissed
      };
    }
    
    // No reps committed yet
    if (status.totalActive === 0 && status.totalCommitted === 0) {
      if (dayOfWeek >= 4) { // Thursday or later
        return {
          type: 'warning',
          message: "You haven't committed to a rep this week yet. Commit now to stay on track."
        };
      }
      return {
        type: 'reminder',
        message: "Commit to at least one leadership rep this week."
      };
    }
    
    // Has active reps but not completed
    if (status.totalActive > 0) {
      const daysRemaining = 6 - dayOfWeek; // Days until Saturday
      
      if (daysRemaining <= 1) {
        return {
          type: 'urgent',
          message: `${daysRemaining === 0 ? 'Today is your deadline!' : 'Only 1 day left'} to complete your rep.`
        };
      }
      
      if (dayOfWeek >= 4) {
        return {
          type: 'reminder',
          message: `${daysRemaining} days left to complete your rep this week.`
        };
      }
    }
    
    return { type: 'none', message: null };
  },
  
  // ============================================
  // PHASE 2: EVIDENCE CAPTURE & DEBRIEF
  // ============================================
  
  /**
   * Determine evidence level based on when rep was completed vs when evidence is submitted
   */
  getEvidenceLevel: (completedAt) => {
    if (!completedAt) return EVIDENCE_LEVEL.LEVEL_2;
    
    const now = timeService.getNow();
    const completed = completedAt.toDate ? completedAt.toDate() : new Date(completedAt);
    
    // Same business day = Level 1 (within 24 hours and same calendar day)
    const hoursDiff = (now - completed) / (1000 * 60 * 60);
    const sameDay = now.toDateString() === completed.toDateString();
    
    if (hoursDiff < 24 && sameDay) {
      return EVIDENCE_LEVEL.LEVEL_1;
    }
    return EVIDENCE_LEVEL.LEVEL_2;
  },
  
  /**
   * Get the appropriate debrief prompts based on evidence level
   */
  getDebriefPrompts: (evidenceLevel) => {
    return evidenceLevel === EVIDENCE_LEVEL.LEVEL_1 ? LEVEL_1_PROMPTS : LEVEL_2_PROMPTS;
  },
  
  /**
   * Submit evidence/debrief for a completed rep
   */
  submitEvidence: async (db, userId, repId, evidenceData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Can only submit evidence for completed reps
    if (currentRep.status !== REP_STATUS.COMPLETED) {
      throw new Error('Can only submit evidence for completed reps');
    }
    
    // Determine evidence level
    const evidenceLevel = conditioningService.getEvidenceLevel(currentRep.completedAt);
    
    // Structure the evidence data
    const evidence = {
      level: evidenceLevel,
      submittedAt: serverTimestamp(),
      responses: evidenceData.responses || {}, // Map of promptId -> response text
      voiceUrl: evidenceData.voiceUrl || null,  // Optional voice recording URL
      transcription: evidenceData.transcription || null, // Voice transcription
      inputMethod: evidenceData.inputMethod || 'written' // 'written' | 'voice'
    };
    
    await updateDoc(repRef, {
      evidence,
      updatedAt: serverTimestamp()
    });
    
    // Run quality assessment
    const quality = conditioningService.assessQuality(evidence, currentRep);
    
    // Store quality assessment
    await updateDoc(repRef, {
      qualityAssessment: quality,
      updatedAt: serverTimestamp()
    });
    
    return { evidence, quality };
  },
  
  /**
   * Get evidence for a rep
   */
  getEvidence: async (db, userId, repId) => {
    const rep = await conditioningService.getRep(db, userId, repId);
    if (!rep) throw new Error('Rep not found');
    
    return {
      evidence: rep.evidence || null,
      qualityAssessment: rep.qualityAssessment || null,
      evidenceLevel: rep.evidence?.level || null,
      hasEvidence: !!rep.evidence
    };
  },
  
  // ============================================
  // PHASE 2: QUALITY ASSESSMENT
  // ============================================
  
  /**
   * Assess the quality of submitted evidence
   * Returns dimension scores and overall assessment
   */
  assessQuality: (evidence, _rep) => {
    const responses = evidence.responses || {};
    const dimensions = {};
    let passedCount = 0;
    const totalDimensions = 4;
    
    // Check for specific language
    const whatSaid = responses.what_said || responses.what_happened || '';
    dimensions[QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE] = {
      passed: whatSaid.length >= 20 && /["']/.test(whatSaid), // Has quotes = specific language
      feedback: whatSaid.length < 20 
        ? 'Try to include the actual words you used'
        : !/["']/.test(whatSaid)
        ? 'Include the specific language you used (in quotes)'
        : 'Good - you included specific language'
    };
    if (dimensions[QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE].passed) passedCount++;
    
    // Check for clear request
    const commitment = responses.commitment || responses.outcome || '';
    const hasRequest = /ask|request|commit|agree|will you|can you|would you/i.test(whatSaid);
    dimensions[QUALITY_DIMENSIONS.CLEAR_REQUEST] = {
      passed: hasRequest || whatSaid.length >= 50,
      feedback: hasRequest 
        ? 'Good - you made a clear request or ask'
        : 'Consider making a more explicit request in future reps'
    };
    if (dimensions[QUALITY_DIMENSIONS.CLEAR_REQUEST].passed) passedCount++;
    
    // Check for named commitment
    const hasCommitment = commitment.length >= 10 && 
      !/no commitment|none|n\/a|nothing/i.test(commitment);
    const explicitlyNoCommitment = /no commitment|chose not to|decided against/i.test(commitment);
    dimensions[QUALITY_DIMENSIONS.NAMED_COMMITMENT] = {
      passed: hasCommitment || explicitlyNoCommitment,
      feedback: hasCommitment 
        ? 'Good - you named a specific commitment'
        : explicitlyNoCommitment
        ? 'Good - you explicitly noted no commitment was made'
        : 'Try to get a specific commitment or note explicitly that none was made'
    };
    if (dimensions[QUALITY_DIMENSIONS.NAMED_COMMITMENT].passed) passedCount++;
    
    // Check for reflection
    const nextTime = responses.next_time || responses.learning || '';
    dimensions[QUALITY_DIMENSIONS.REFLECTION] = {
      passed: nextTime.length >= 15,
      feedback: nextTime.length >= 15
        ? 'Good - you reflected on the experience'
        : 'Add more detail about what you learned or would do differently'
    };
    if (dimensions[QUALITY_DIMENSIONS.REFLECTION].passed) passedCount++;
    
    // Overall assessment
    const meetsStandard = passedCount >= 3; // Pass 3 of 4 dimensions
    
    return {
      dimensions,
      passedCount,
      totalDimensions,
      meetsStandard,
      assessedAt: new Date().toISOString(),
      summary: meetsStandard 
        ? 'This rep meets the quality standard'
        : `This rep needs improvement in ${totalDimensions - passedCount} area(s)`
    };
  },
  
  /**
   * Get quality statistics for a user
   */
  getQualityStats: async (db, userId, cohortId = null) => {
    const history = await conditioningService.getRepHistory(db, userId, cohortId, 100);
    
    const repsWithEvidence = history.filter(r => r.evidence);
    const repsWithQuality = history.filter(r => r.qualityAssessment);
    
    const level1Count = repsWithEvidence.filter(r => r.evidence.level === EVIDENCE_LEVEL.LEVEL_1).length;
    const level2Count = repsWithEvidence.filter(r => r.evidence.level === EVIDENCE_LEVEL.LEVEL_2).length;
    const meetsStandardCount = repsWithQuality.filter(r => r.qualityAssessment.meetsStandard).length;
    
    // Dimension breakdown
    const dimensionStats = {};
    Object.values(QUALITY_DIMENSIONS).forEach(dim => {
      const passed = repsWithQuality.filter(r => r.qualityAssessment.dimensions?.[dim]?.passed).length;
      dimensionStats[dim] = {
        passed,
        total: repsWithQuality.length,
        rate: repsWithQuality.length > 0 ? Math.round((passed / repsWithQuality.length) * 100) : 0
      };
    });
    
    return {
      totalCompleted: history.filter(r => r.status === REP_STATUS.COMPLETED).length,
      evidenceSubmitted: repsWithEvidence.length,
      level1Evidence: level1Count,
      level2Evidence: level2Count,
      level1Rate: repsWithEvidence.length > 0 
        ? Math.round((level1Count / repsWithEvidence.length) * 100) 
        : 0,
      meetsStandard: meetsStandardCount,
      qualityRate: repsWithQuality.length > 0 
        ? Math.round((meetsStandardCount / repsWithQuality.length) * 100) 
        : 0,
      dimensionStats
    };
  },
  
  // ============================================
  // PHASE 2: PRACTICE RETRY FLOW
  // ============================================
  
  /**
   * Create a practice retry for a rep that didn't meet quality standard
   * Practice retries don't replace the original rep, but help build the skill
   */
  createPracticeRetry: async (db, userId, originalRepId, targetDimension) => {
    const originalRep = await conditioningService.getRep(db, userId, originalRepId);
    
    if (!originalRep) throw new Error('Original rep not found');
    if (!originalRep.qualityAssessment) {
      throw new Error('Original rep has not been assessed');
    }
    
    const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const practiceRetry = {
      id: retryId,
      originalRepId,
      targetDimension, // The specific dimension to focus on
      status: 'pending', // 'pending' | 'completed'
      createdAt: serverTimestamp(),
      // Copy context from original rep
      person: originalRep.person,
      repType: originalRep.repType,
      originalEvidence: originalRep.evidence,
      // Retry prompt based on dimension
      prompt: conditioningService.getPracticePrompt(targetDimension),
      response: null, // User's practice response
      completedAt: null
    };
    
    const retryRef = doc(db, 'users', userId, 'practice_retries', retryId);
    await setDoc(retryRef, practiceRetry);
    
    return retryId;
  },
  
  /**
   * Get practice prompt for a specific dimension
   */
  getPracticePrompt: (dimension) => {
    const prompts = {
      [QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE]: 
        'Rewrite what you said using the exact words you used or would use. Put your language in quotes.',
      [QUALITY_DIMENSIONS.CLEAR_REQUEST]: 
        'Write out a clear request or ask that you could make in this situation. Be specific about what you want the other person to do.',
      [QUALITY_DIMENSIONS.NAMED_COMMITMENT]: 
        'What specific commitment would you ask for? Write it as: "I\'d like you to commit to [specific action] by [specific time]."',
      [QUALITY_DIMENSIONS.REFLECTION]: 
        'What did you learn from this rep that you can apply next time? Be specific about what you would do differently.'
    };
    return prompts[dimension] || 'Practice this dimension again with more specific detail.';
  },
  
  /**
   * Complete a practice retry
   */
  completePracticeRetry: async (db, userId, retryId, response) => {
    const retryRef = doc(db, 'users', userId, 'practice_retries', retryId);
    
    await updateDoc(retryRef, {
      status: 'completed',
      response: response.trim(),
      completedAt: serverTimestamp()
    });
    
    return true;
  },
  
  /**
   * Get pending practice retries for a user
   */
  getPendingRetries: async (db, userId) => {
    const retriesRef = collection(db, 'users', userId, 'practice_retries');
    const q = query(retriesRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * Get all practice retries for a rep
   */
  getRetriesForRep: async (db, userId, originalRepId) => {
    const retriesRef = collection(db, 'users', userId, 'practice_retries');
    const q = query(retriesRef, where('originalRepId', '==', originalRepId), orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // ============================================
  // TRAINER VISIBILITY (Phase 1 - Basic)
  // ============================================
  
  /**
   * Get conditioning summary for a specific user (for trainer view)
   */
  getUserConditioningSummary: async (db, userId, cohortId) => {
    const weekId = getCurrentWeekId();
    const weeklyStatus = await conditioningService.getWeeklyStatus(db, userId, weekId, cohortId);
    const consecutiveMissed = await conditioningService.getConsecutiveMissedWeeks(db, userId, cohortId);
    const missedReps = await conditioningService.getMissedReps(db, userId, cohortId);
    const patterns = await conditioningService.analyzeUserPatterns(db, userId, cohortId);
    
    // Determine attention level based on patterns and misses
    const highSeverityPatterns = patterns.patterns?.filter(p => p.severity === 'high') || [];
    const mediumSeverityPatterns = patterns.patterns?.filter(p => p.severity === 'medium') || [];
    
    return {
      userId,
      currentWeek: weeklyStatus,
      consecutiveMissedWeeks: consecutiveMissed,
      unresolvedMissedReps: missedReps.length,
      needsAttention: consecutiveMissed >= 2 || missedReps.length > 2 || highSeverityPatterns.length > 0,
      patterns: patterns.patterns || [],
      patternSeverity: highSeverityPatterns.length > 0 ? 'high' : mediumSeverityPatterns.length > 0 ? 'medium' : 'low',
      lastUpdated: new Date().toISOString()
    };
  },
  
  /**
   * Get conditioning summary for all users in a cohort (for trainer dashboard)
   */
  getCohortConditioningSummary: async (db, cohortId, userIds) => {
    const summaries = await Promise.all(
      userIds.map(userId => conditioningService.getUserConditioningSummary(db, userId, cohortId))
    );
    
    return {
      cohortId,
      weekId: getCurrentWeekId(),
      totalUsers: summaries.length,
      usersCompleted: summaries.filter(s => s.currentWeek.requiredRepCompleted).length,
      usersNeedingAttention: summaries.filter(s => s.needsAttention).length,
      userSummaries: summaries
    };
  },
  
  // ============================================
  // PHASE 3: PATTERN RECOGNITION
  // ============================================
  
  /**
   * Pattern types that get flagged
   */
  PATTERN_TYPES: {
    CONSECUTIVE_MISSES: 'consecutive_misses',  // Missed 2+ weeks in a row
    CHRONIC_LATE: 'chronic_late',              // Consistently completing on deadline day
    VAGUE_DEBRIEFS: 'vague_debriefs',          // Debriefs lacking specificity
    SAFETY_REPS: 'safety_reps',                // Only doing "safe" rep types (avoiding tension)
    NO_COMMITMENT: 'no_commitment',            // Reps without clear commitments
    QUALITY_DECLINE: 'quality_decline'         // Quality dropping over time
  },
  
  /**
   * Analyze patterns for a single user over last N weeks
   */
  analyzeUserPatterns: async (db, userId, cohortId, weeksToAnalyze = 6) => {
    const patterns = [];
    
    // Get all reps for this user in the cohort
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    const q = query(
      repsRef,
      where('cohortId', '==', cohortId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(50)
    );
    
    const snapshot = await getDocs(q);
    const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (reps.length === 0) {
      return { patterns: [], reps: [] };
    }
    
    // 1. Check consecutive misses
    const consecutiveMissed = await conditioningService.getConsecutiveMissedWeeks(db, userId, cohortId);
    if (consecutiveMissed >= 2) {
      patterns.push({
        type: 'consecutive_misses',
        severity: consecutiveMissed >= 3 ? 'high' : 'medium',
        message: `Missed required rep for ${consecutiveMissed} consecutive weeks`,
        data: { weeksCount: consecutiveMissed }
      });
    }
    
    // 2. Check for late completions (completing on Friday/Saturday consistently)
    const completedReps = reps.filter(r => r.status === REP_STATUS.COMPLETED && r.completedAt);
    if (completedReps.length >= 3) {
      const lateCompletions = completedReps.filter(r => {
        const completedDay = (r.completedAt.toDate ? r.completedAt.toDate() : new Date(r.completedAt)).getDay();
        return completedDay >= 5; // Friday = 5, Saturday = 6
      });
      
      if (lateCompletions.length / completedReps.length >= 0.7) {
        patterns.push({
          type: 'chronic_late',
          severity: 'low',
          message: 'Consistently completing reps at the last minute',
          data: { 
            lateCount: lateCompletions.length, 
            totalCount: completedReps.length,
            rate: Math.round((lateCompletions.length / completedReps.length) * 100)
          }
        });
      }
    }
    
    // 3. Check for "safety reps" - avoiding tension/feedback
    if (completedReps.length >= 4) {
      const tensionFeedbackReps = completedReps.filter(r => 
        r.repType === 'tension' || r.repType === 'feedback'
      );
      
      if (tensionFeedbackReps.length / completedReps.length < 0.25) {
        patterns.push({
          type: 'safety_reps',
          severity: 'medium',
          message: 'Avoiding challenging rep types (tension/feedback)',
          data: { 
            challengingCount: tensionFeedbackReps.length, 
            totalCount: completedReps.length,
            rate: Math.round((tensionFeedbackReps.length / completedReps.length) * 100)
          }
        });
      }
    }
    
    // 4. Check for vague debriefs (evidence without specific language)
    const qualityStats = await conditioningService.getQualityStats(db, userId, cohortId);
    if (qualityStats && qualityStats.evidenceSubmitted >= 3) {
      const specificityRate = qualityStats.dimensionStats?.specific_language?.rate || 0;
      if (specificityRate < 50) {
        patterns.push({
          type: 'vague_debriefs',
          severity: specificityRate < 30 ? 'high' : 'medium',
          message: 'Debriefs lack specific language',
          data: { rate: specificityRate }
        });
      }
      
      // 5. Check for no commitments
      const commitmentRate = qualityStats.dimensionStats?.named_commitment?.rate || 0;
      if (commitmentRate < 40) {
        patterns.push({
          type: 'no_commitment',
          severity: 'medium',
          message: 'Reps rarely result in named commitments',
          data: { rate: commitmentRate }
        });
      }
    }
    
    return {
      patterns,
      repCount: reps.length,
      completedCount: completedReps.length,
      analyzedWeeks: weeksToAnalyze
    };
  },
  
  /**
   * Get pattern analysis for all users in a cohort (for trainer dashboard)
   */
  getCohortPatterns: async (db, cohortId, userIds) => {
    const results = await Promise.all(
      userIds.map(async (userId) => {
        const analysis = await conditioningService.analyzeUserPatterns(db, userId, cohortId);
        return {
          userId,
          ...analysis
        };
      })
    );
    
    // Aggregate pattern counts
    const patternCounts = {};
    const usersWithPatterns = [];
    
    results.forEach(result => {
      if (result.patterns && result.patterns.length > 0) {
        usersWithPatterns.push({
          userId: result.userId,
          patterns: result.patterns
        });
        
        result.patterns.forEach(p => {
          patternCounts[p.type] = (patternCounts[p.type] || 0) + 1;
        });
      }
    });
    
    return {
      cohortId,
      totalUsers: userIds.length,
      usersWithPatterns: usersWithPatterns.length,
      patternCounts,
      userPatterns: usersWithPatterns
    };
  },
  
  // ============================================
  // PHASE 3: TRAINER PUSH INTEGRATION
  // ============================================
  
  /**
   * Nudge types for trainer push
   */
  NUDGE_TYPES: {
    REMINDER: 'reminder',     // Gentle reminder to commit/complete
    ENCOURAGEMENT: 'encouragement', // Positive reinforcement
    CHECK_IN: 'check_in',     // Direct check-in from trainer
    ESCALATION: 'escalation'  // Formal escalation notice
  },
  
  /**
   * Send a nudge from trainer to a specific leader
   */
  sendTrainerNudge: async (db, trainerId, targetUserId, cohortId, nudgeType, message) => {
    const nudgesRef = collection(db, 'conditioning_nudges');
    
    const nudge = {
      trainerId,
      targetUserId,
      cohortId,
      type: nudgeType,
      message: message || conditioningService.getDefaultNudgeMessage(nudgeType),
      sentAt: serverTimestamp(),
      readAt: null,
      weekId: getCurrentWeekId()
    };
    
    const docRef = await addDoc(nudgesRef, nudge);
    
    // Also add to user's notification queue (for in-app display)
    const userNotifRef = collection(db, 'users', targetUserId, 'conditioning_notifications');
    await addDoc(userNotifRef, {
      ...nudge,
      nudgeId: docRef.id,
      status: 'unread'
    });
    
    return docRef.id;
  },
  
  /**
   * Get default message templates for nudge types
   */
  getDefaultNudgeMessage: (nudgeType) => {
    const messages = {
      reminder: "Just a friendly reminder to commit to your leadership rep this week. Small steps lead to big growth!",
      encouragement: "I see you're making progress - keep up the great work on your leadership reps!",
      check_in: "Checking in on your leadership journey. How can I support you this week?",
      escalation: "I noticed you've missed a few weeks of reps. let's connect to discuss how we can get you back on track."
    };
    return messages[nudgeType] || messages.reminder;
  },
  
  /**
   * Send bulk nudges to multiple leaders
   */
  sendBulkNudges: async (db, trainerId, targetUserIds, cohortId, nudgeType, message) => {
    const results = await Promise.all(
      targetUserIds.map(userId => 
        conditioningService.sendTrainerNudge(db, trainerId, userId, cohortId, nudgeType, message)
          .then(id => ({ userId, nudgeId: id, success: true }))
          .catch(err => ({ userId, error: err.message, success: false }))
      )
    );
    
    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success),
      nudgeIds: results.filter(r => r.success).map(r => r.nudgeId)
    };
  },
  
  /**
   * Get nudge history for a cohort (trainer view)
   */
  getCohortNudgeHistory: async (db, cohortId, limit = 50) => {
    const nudgesRef = collection(db, 'conditioning_nudges');
    const q = query(
      nudgesRef, 
      where('cohortId', '==', cohortId),
      orderBy('sentAt', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * Get nudges sent to a specific user (for user's view)
   */
  getUserNudges: async (db, userId, unreadOnly = false) => {
    const notifsRef = collection(db, 'users', userId, 'conditioning_notifications');
    let q;
    
    if (unreadOnly) {
      q = query(notifsRef, where('status', '==', 'unread'), orderBy('sentAt', 'desc'));
    } else {
      q = query(notifsRef, orderBy('sentAt', 'desc'), firestoreLimit(20));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * Mark a nudge as read by the user
   */
  markNudgeAsRead: async (db, userId, notificationId) => {
    const notifRef = doc(db, 'users', userId, 'conditioning_notifications', notificationId);
    await updateDoc(notifRef, {
      status: 'read',
      readAt: serverTimestamp()
    });
    
    return true;
  },
  
  /**
   * Get leaders who need nudging (no commitment or no completion this week)
   */
  getLeadersNeedingNudge: async (db, cohortId, userIds) => {
    const weekId = getCurrentWeekId();
    const results = [];
    
    for (const userId of userIds) {
      const status = await conditioningService.getWeeklyStatus(db, userId, weekId, cohortId);
      const consecutiveMissed = await conditioningService.getConsecutiveMissedWeeks(db, userId, cohortId);
      
      if (!status.requiredRepCompleted) {
        results.push({
          userId,
          hasActiveRep: status.totalActive > 0,
          hasCommitted: status.totalActive > 0 || status.totalCompleted > 0,
          consecutiveMissedWeeks: consecutiveMissed,
          suggestedNudgeType: consecutiveMissed >= 2 
            ? 'escalation' 
            : (status.totalActive > 0 ? 'encouragement' : 'reminder')
        });
      }
    }
    
    return results;
  },
  
  /**
   * Record an escalation event
   */
  recordEscalation: async (db, trainerId, targetUserId, cohortId, reason, notes) => {
    const escalationsRef = collection(db, 'conditioning_escalations');
    
    const escalation = {
      trainerId,
      targetUserId,
      cohortId,
      reason,
      notes: notes || null,
      weekId: getCurrentWeekId(),
      createdAt: serverTimestamp(),
      status: 'open',
      resolvedAt: null,
      resolution: null
    };
    
    const docRef = await addDoc(escalationsRef, escalation);
    return docRef.id;
  },
  
  /**
   * Get open escalations for a cohort
   */
  getOpenEscalations: async (db, cohortId) => {
    const escalationsRef = collection(db, 'conditioning_escalations');
    const q = query(
      escalationsRef,
      where('cohortId', '==', cohortId),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * Resolve an escalation
   */
  resolveEscalation: async (db, escalationId, resolution) => {
    const escalationRef = doc(db, 'conditioning_escalations', escalationId);
    await updateDoc(escalationRef, {
      status: 'resolved',
      resolution,
      resolvedAt: serverTimestamp()
    });
    
    return true;
  }
};

export default conditioningService;
