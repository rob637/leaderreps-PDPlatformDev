import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp
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
    
    return {
      userId,
      currentWeek: weeklyStatus,
      consecutiveMissedWeeks: consecutiveMissed,
      unresolvedMissedReps: missedReps.length,
      needsAttention: consecutiveMissed >= 2 || missedReps.length > 2,
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
  }
};

export default conditioningService;
