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
import { REP_TYPES, getRepType, isPrepRequired } from './repTaxonomy';

// Re-export REP_TYPES from repTaxonomy for backward compatibility
export { REP_TYPES };

/**
 * Conditioning Layer Service
 * 
 * Manages real leadership rep accountability between Foundation sessions.
 * Core rule: Each leader must complete ≥1 real rep per week.
 * 
 * Data Model (Updated for 16 Rep Types):
 * /users/{uid}/conditioning_reps/{repId}
 *   - person: string (who the rep is with)
 *   - repType: string (one of 16 canonical rep types from repTaxonomy)
 *   - riskLevel: 'low' | 'medium' | 'high'
 *   - difficulty: 'level_1' | 'level_2' | 'level_3'
 *   - context: { trigger, intended_outcome, standard, hard_move, close_next }
 *   - status: 'committed' | 'prepared' | 'scheduled' | 'executed' | 'debriefed' | 'missed' | 'canceled'
 *   - prepRequired: boolean
 *   - deadline: Timestamp (defaults to end of week - Saturday 11:59 PM)
 *   - weekId: string (YYYY-Www format, e.g., "2026-W06")
 *   - cohortId: string (ties rep to specific cohort)
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *   - preparedAt?: Timestamp
 *   - scheduledAt?: Timestamp
 *   - executedAt?: Timestamp
 *   - debriefedAt?: Timestamp
 *   - completedAt?: Timestamp (legacy alias for debriefedAt)
 *   - canceledAt?: Timestamp
 *   - cancelReason?: string (required if canceled)
 *   - rolledForwardFrom?: string (repId if this was rolled from missed week)
 *   - prep?: { rubricResponses, riskResponses, inputMethod, savedAt }
 *   - evidence?: { structured, reflection, level, submittedAt }
 *   - missedDebrief?: { what_blocked, standard_breakdown, next_week_different }
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

// Rep statuses (expanded for new state machine)
export const REP_STATUS = {
  // New granular states
  COMMITTED: 'committed',     // Rep is set, nothing else done
  PREPARED: 'prepared',       // Optional prep completed
  SCHEDULED: 'scheduled',     // For reps requiring scheduling
  EXECUTED: 'executed',       // Real-world rep done, awaiting debrief
  DEBRIEFED: 'debriefed',     // Debrief submitted, awaiting follow-up
  FOLLOW_UP_PENDING: 'follow_up_pending',  // Tracking behavior change
  LOOP_CLOSED: 'loop_closed', // Follow-up confirmed, rep complete
  MISSED: 'missed',           // Past deadline without execution
  CANCELED: 'canceled',       // Rare, with reason required
  
  // Legacy aliases for backward compatibility
  ACTIVE: 'committed',        // Alias: active -> committed
  COMPLETED: 'debriefed'      // Alias: completed -> debriefed
};

// State transitions (what states can follow each state)
export const STATE_TRANSITIONS = {
  committed: ['prepared', 'scheduled', 'executed', 'missed', 'canceled'],
  prepared: ['scheduled', 'executed', 'missed', 'canceled'],
  scheduled: ['executed', 'missed', 'canceled'],
  executed: ['debriefed', 'missed'],  // Can still miss if no debrief
  debriefed: ['follow_up_pending', 'loop_closed'],  // Can skip follow-up or track it
  follow_up_pending: ['loop_closed'],  // Complete follow-up
  loop_closed: [],  // Terminal state - rep fully complete
  missed: ['committed'],  // Roll forward
  canceled: [],  // Terminal state
  // Legacy status - treat same as committed
  active: ['prepared', 'scheduled', 'executed', 'debriefed', 'missed', 'canceled']
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

// ============================================
// PHASE 7: COACH/TRAINER PROMPTS
// ============================================

/**
 * COACH_PROMPTS - Pattern definitions for trainer coaching prompts
 * Each pattern has: id, name, description, detectionRule, coachingQuestion, priority
 */
export const COACH_PROMPTS = {
  low_risk_pattern: {
    id: 'low_risk_pattern',
    name: 'Comfort Zone Loop',
    description: 'Same skill at low difficulty ≥3 times in 4 weeks',
    priority: 'medium',
    coachingQuestion: 'What would pushing to a harder edge look like for you right now?',
    nudgeMessage: "I've noticed you're consistently executing well on familiar reps. Ready to stretch into something more challenging?"
  },
  
  avoidance_pattern: {
    id: 'avoidance_pattern',
    name: 'Delayed Execution',
    description: 'Commits early in week, executes late (after Thursday)',
    priority: 'medium',
    coachingQuestion: 'What makes you wait until late in the week to execute?',
    nudgeMessage: "I see a pattern of committing early but executing late. What's getting in the way of acting sooner?"
  },
  
  prep_strong_followthrough_weak: {
    id: 'prep_strong_followthrough_weak',
    name: 'Prep Without Action',
    description: 'High prep completion rate, but low execution rate',
    priority: 'high',
    coachingQuestion: 'You prepare well but something blocks execution. What happens between prep and the conversation?',
    nudgeMessage: "Your prep is thorough, but the rep isn't happening. What's the real barrier?"
  },
  
  no_close_pattern: {
    id: 'no_close_pattern',
    name: 'Missing the Close',
    description: 'No commitment or next step in ≥50% of debriefs',
    priority: 'medium',
    coachingQuestion: 'How could you incorporate a clearer ask or next step into your conversations?',
    nudgeMessage: "Your reps often lack a defined next step. What commitment could you ask for?"
  },
  
  consecutive_misses: {
    id: 'consecutive_misses',
    name: 'Consecutive Weeks Missed',
    description: '≥2 missed reps in last 4 weeks',
    priority: 'critical',
    coachingQuestion: "What's blocking your ability to do reps right now? Let's problem-solve together.",
    nudgeMessage: "You've missed multiple weeks. Let's connect and figure out what's going on."
  }
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
   * Commit a new leadership rep (Updated for 16 Rep Types)
   */
  commitRep: async (db, userId, repData) => {
    if (!userId) throw new Error('User ID required');
    if (!repData.person) throw new Error('Person is required');
    if (!repData.repType) throw new Error('Rep type is required');
    if (!repData.cohortId) throw new Error('Cohort ID is required');
    
    // Validate rep type exists
    const repTypeInfo = getRepType(repData.repType);
    if (!repTypeInfo) {
      throw new Error(`Invalid rep type: ${repData.repType}`);
    }
    
    const repId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const weekId = getCurrentWeekId();
    const { weekEnd } = getWeekBoundaries(weekId);
    
    // Determine if prep is required based on rep type and risk level
    const prepRequired = isPrepRequired(repData.repType, repData.riskLevel);
    
    const repDoc = {
      id: repId,
      person: repData.person.trim(),
      repType: repData.repType,
      repCategory: repTypeInfo.category,
      status: REP_STATUS.COMMITTED,
      deadline: repData.deadline || Timestamp.fromDate(weekEnd),
      weekId,
      cohortId: repData.cohortId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // New fields for 16 rep types
      riskLevel: repData.riskLevel || repTypeInfo.defaultRisk || 'medium',
      difficulty: repData.difficulty || repTypeInfo.defaultDifficulty || 'level_1',
      prepRequired,
      
      // Universal context structure
      ...(repData.context && { 
        context: {
          trigger: repData.context.trigger || '',
          intended_outcome: repData.context.intended_outcome || '',
          standard: repData.context.standard || '',
          hard_move: repData.context.hard_move || '',
          close_next: repData.context.close_next || ''
        }
      }),
      
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
  
  // NOTE: saveRepPrep is defined later (line ~589) with Sprint 2 risk-based prep support
  // That version properly transitions to 'prepared' state
  
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
    
    // Mark original as resolved so it no longer appears in missed reps list
    const missedRepRef = doc(db, 'users', userId, 'conditioning_reps', missedRepId);
    await updateDoc(missedRepRef, {
      rolledForwardTo: newRepId,
      missedDebriefComplete: true,
      updatedAt: serverTimestamp()
    });
    
    return newRepId;
  },
  
  /**
   * Transition rep to a new state (Sprint 2: State Machine)
   * Validates transition is allowed and updates timestamps
   */
  transitionRepState: async (db, userId, repId, newState, additionalData = {}) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    const currentState = currentRep.status;
    
    // Validate transition is allowed
    const allowedTransitions = STATE_TRANSITIONS[currentState] || [];
    if (!allowedTransitions.includes(newState)) {
      throw new Error(`Cannot transition from ${currentState} to ${newState}`);
    }
    
    // Build update object
    const updateData = {
      status: newState,
      updatedAt: serverTimestamp()
    };
    
    // Add state-specific timestamps
    switch (newState) {
      case 'prepared':
        updateData.preparedAt = serverTimestamp();
        break;
      case 'scheduled':
        updateData.scheduledAt = serverTimestamp();
        if (additionalData.scheduledFor) {
          updateData.scheduledFor = additionalData.scheduledFor;
        }
        break;
      case 'executed':
        updateData.executedAt = serverTimestamp();
        break;
      case 'debriefed':
        updateData.debriefedAt = serverTimestamp();
        updateData.completedAt = serverTimestamp(); // Legacy compatibility
        break;
      case 'missed':
        updateData.missedAt = serverTimestamp();
        break;
      case 'canceled':
        if (!additionalData.cancelReason) {
          throw new Error('Cancel reason required');
        }
        updateData.canceledAt = serverTimestamp();
        updateData.cancelReason = additionalData.cancelReason;
        break;
    }
    
    // Merge any additional data (like prep responses)
    if (additionalData.prep) {
      updateData.prep = additionalData.prep;
    }
    
    await updateDoc(repRef, updateData);
    
    // Update weekly stats for terminal states
    if (['debriefed', 'missed', 'canceled'].includes(newState)) {
      await conditioningService.updateWeeklyStats(db, userId, currentRep.weekId, currentRep.cohortId);
    }
    
    return true;
  },
  
  /**
   * Save prep data for a rep (Sprint 2: Risk-Based Prep)
   * Also transitions to 'prepared' state
   */
  saveRepPrep: async (db, userId, repId, prepData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Can only prep from committed state
    if (currentRep.status !== 'committed') {
      throw new Error('Can only prep a committed rep');
    }
    
    await updateDoc(repRef, {
      status: 'prepared',
      preparedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      prep: {
        rubricResponses: prepData.rubricResponses || {},
        riskResponses: prepData.riskResponses || {},
        inputMethod: prepData.inputMethod || 'manual',
        savedAt: serverTimestamp()
      }
    });
    
    return true;
  },
  
  /**
   * Save debrief data for a missed rep (Sprint 4: Missed Rep Accountability)
   * Records what blocked completion and plan for next week
   */
  saveMissedRepDebrief: async (db, userId, repId, debriefData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Can only debrief missed reps
    if (currentRep.status !== 'missed') {
      throw new Error('Can only debrief a missed rep');
    }
    
    await updateDoc(repRef, {
      updatedAt: serverTimestamp(),
      missedDebriefComplete: true,
      missedDebrief: {
        what_blocked: debriefData.what_blocked,
        standard_breakdown: debriefData.standard_breakdown,
        next_week_different: debriefData.next_week_different,
        recommit_decision: debriefData.recommit_decision,
        cancelReason: debriefData.cancelReason || null,
        submittedAt: serverTimestamp()
      }
    });
    
    return true;
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
   * Get all active reps (in-progress + missed that need attention)
   * Includes all non-terminal statuses: committed, prepared, scheduled, executed, active (legacy), missed
   */
  getActiveReps: async (db, userId, cohortId = null) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // All statuses that need user attention (shown in "Active Reps" section)
    const inProgressStatuses = [
      'committed',         // Just committed, not yet prepped
      'prepared',          // Prep completed, ready to execute
      'scheduled',         // Has a scheduled time
      'executed',          // Done but not yet debriefed
      'follow_up_pending', // Debriefed but needs to close the loop
      'active',            // Legacy status (backward compatibility)
      'missed'             // Past deadline, needs attention
    ];
    
    let q;
    if (cohortId) {
      q = query(
        repsRef, 
        where('status', 'in', inProgressStatuses),
        where('cohortId', '==', cohortId),
        orderBy('deadline', 'asc')
      );
    } else {
      q = query(
        repsRef, 
        where('status', 'in', inProgressStatuses),
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
    // Filter out missed reps that have already been debriefed
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(rep => !rep.missedDebriefComplete);
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
   * Updated to handle both new state machine values and legacy status values
   */
  getWeeklyStatus: async (db, userId, weekId = null, cohortId = null) => {
    const targetWeekId = weekId || getCurrentWeekId();
    const reps = await conditioningService.getRepsByWeek(db, userId, targetWeekId, cohortId);
    
    // Completed states = rep is fully done (shown in "Completed This Week")
    // Note: 'completed' is legacy status for backward compatibility
    const completedStates = ['debriefed', 'loop_closed', 'completed'];
    
    // Active/in-progress states = reps needing attention (shown in "Active Reps")
    // Note: 'follow_up_pending' needs attention (close the loop) but counts toward requirement
    const activeStates = ['committed', 'prepared', 'scheduled', 'executed', 'follow_up_pending', 'active'];
    
    const completed = reps.filter(r => completedStates.includes(r.status));
    const active = reps.filter(r => activeStates.includes(r.status));
    const missed = reps.filter(r => r.status === 'missed');
    const canceled = reps.filter(r => r.status === 'canceled');
    
    // For weekly requirement: debriefed, loop_closed, OR follow_up_pending all count
    // (they've done the rep, even if follow-up is pending)
    const doneForRequirement = reps.filter(r => 
      ['debriefed', 'loop_closed', 'follow_up_pending', 'completed'].includes(r.status)
    );
    
    const { weekStart, weekEnd } = getWeekBoundaries(targetWeekId);
    
    return {
      weekId: targetWeekId,
      weekStart,
      weekEnd,
      requiredRepCompleted: doneForRequirement.length >= 1,
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
   * Submit evidence/debrief for a rep that has been executed
   * Accepts reps in 'prepared', 'scheduled', 'executed', or 'active' (legacy) status
   * Transitions the rep to 'debriefed' status upon successful submission
   */
  submitEvidence: async (db, userId, repId, evidenceData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Valid statuses for submitting evidence (user is saying "I did it, here's what happened")
    const validStatuses = [
      REP_STATUS.PREPARED,   // Did prep, now debriefing
      REP_STATUS.SCHEDULED,  // Was scheduled, now debriefing
      REP_STATUS.EXECUTED,   // Marked as done, now debriefing
      REP_STATUS.COMMITTED,  // Committed directly to debrief (no prep)
      'active'               // Legacy status
    ];
    
    if (!validStatuses.includes(currentRep.status)) {
      throw new Error(`Cannot submit evidence for rep in '${currentRep.status}' status. Valid statuses: prepared, scheduled, executed, committed`);
    }
    
    // Determine evidence level based on when evidence is being submitted vs deadline
    const evidenceLevel = conditioningService.getEvidenceLevel(currentRep.deadline);
    
    // Structure the evidence data
    const evidence = {
      level: evidenceLevel,
      submittedAt: serverTimestamp(),
      responses: evidenceData.responses || {}, // Map of promptId -> response text
      voiceUrl: evidenceData.voiceUrl || null,  // Optional voice recording URL
      transcription: evidenceData.transcription || null, // Voice transcription
      inputMethod: evidenceData.inputMethod || 'written', // 'written' | 'voice' | 'structured_v2'
      structured: evidenceData.structured || null // Structured evidence from StructuredEvidenceModal
    };
    
    // Update rep with evidence and transition to debriefed status
    await updateDoc(repRef, {
      evidence,
      status: REP_STATUS.DEBRIEFED,
      executedAt: currentRep.executedAt || serverTimestamp(), // Set executedAt if not already set
      debriefedAt: serverTimestamp(),
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
  // PHASE 5: LOOP CLOSURE & FOLLOW-UP
  // ============================================
  
  /**
   * Start follow-up tracking for a debriefed rep
   * Sets reminder date and transitions to follow_up_pending
   */
  startFollowUp: async (db, userId, repId, followUpData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    if (currentRep.status !== REP_STATUS.DEBRIEFED) {
      throw new Error('Can only start follow-up for a debriefed rep');
    }
    
    await updateDoc(repRef, {
      status: REP_STATUS.FOLLOW_UP_PENDING,
      followUp: {
        reminderDate: followUpData.reminderDate,
        what_to_check: followUpData.what_to_check || null,
        expected_change: followUpData.expected_change || null,
        createdAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    
    return true;
  },
  
  /**
   * Close the loop on a rep - record follow-up outcome
   * Transitions to loop_closed (terminal state)
   */
  closeLoop: async (db, userId, repId, closureData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Can close loop from either debriefed or follow_up_pending
    const validStatuses = [REP_STATUS.DEBRIEFED, REP_STATUS.FOLLOW_UP_PENDING];
    if (!validStatuses.includes(currentRep.status)) {
      throw new Error('Can only close loop for debriefed or follow-up pending rep');
    }
    
    await updateDoc(repRef, {
      status: REP_STATUS.LOOP_CLOSED,
      loopClosure: {
        outcome: closureData.outcome, // 'behavior_changed' | 'needs_another_rep' | 'commitment_held' | 'no_change'
        notes: closureData.notes || null,
        behavior_observed: closureData.behavior_observed || null,
        recommend_follow_up: closureData.recommend_follow_up || false,
        closedAt: serverTimestamp()
      },
      loopClosedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return true;
  },
  
  /**
   * Get reps that need follow-up (debriefed but not loop_closed, past reminder date)
   */
  getRepsNeedingFollowUp: async (db, userId, cohortId = null) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // Get all follow-up pending reps
    const pendingQuery = query(
      repsRef,
      where('status', '==', REP_STATUS.FOLLOW_UP_PENDING)
    );
    
    // Get debriefed reps (might need follow-up scheduling)
    const debriefedQuery = query(
      repsRef,
      where('status', '==', REP_STATUS.DEBRIEFED)
    );
    
    const [pendingSnap, debriefedSnap] = await Promise.all([
      getDocs(pendingQuery),
      getDocs(debriefedQuery)
    ]);
    
    const now = new Date();
    const reps = [];
    
    // All follow-up pending reps
    pendingSnap.forEach(doc => {
      const data = doc.data();
      if (!cohortId || data.cohortId === cohortId) {
        const reminderDate = data.followUp?.reminderDate?.toDate?.() || data.followUp?.reminderDate;
        reps.push({
          id: doc.id,
          ...data,
          isOverdue: reminderDate && new Date(reminderDate) <= now
        });
      }
    });
    
    // Debriefed reps older than 7 days without follow-up scheduled
    debriefedSnap.forEach(doc => {
      const data = doc.data();
      if (!cohortId || data.cohortId === cohortId) {
        const debriefedAt = data.debriefedAt?.toDate?.() || data.debriefedAt;
        const daysSinceDebrief = debriefedAt ? 
          Math.floor((now - new Date(debriefedAt)) / (1000 * 60 * 60 * 24)) : 0;
        
        if (daysSinceDebrief >= 7) {
          reps.push({
            id: doc.id,
            ...data,
            needsFollowUpScheduling: true,
            daysSinceDebrief
          });
        }
      }
    });
    
    return reps.sort((a, b) => (b.isOverdue ? 1 : 0) - (a.isOverdue ? 1 : 0));
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
  },
  
  // ============================================
  // PHASE 7: COACH PROMPT DETECTION
  // ============================================
  
  /**
   * Get all reps for a user within a date range
   */
  getRepsInRange: async (db, userId, cohortId, weeksBack = 4) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // Calculate the start date (weeksBack weeks ago)
    const now = timeService.getNow();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (weeksBack * 7));
    
    const q = query(
      repsRef,
      where('cohortId', '==', cohortId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by date range in memory (Firestore compound queries are limited)
    return reps.filter(rep => {
      const createdAt = rep.createdAt?.toDate?.() || new Date(rep.createdAt);
      return createdAt >= startDate;
    });
  },
  
  /**
   * Detect low_risk_pattern: Same skill + low difficulty ≥3 times in 4 weeks
   */
  detectLowRiskPattern: (reps) => {
    // Group by repType
    const byType = {};
    reps.forEach(rep => {
      if (rep.difficulty === 'level_1' || rep.difficulty === 'low') {
        const key = rep.repType;
        byType[key] = (byType[key] || 0) + 1;
      }
    });
    
    // Find any type repeated 3+ times
    const repeatedTypes = Object.entries(byType)
      .filter(([_, count]) => count >= 3)
      .map(([type, count]) => ({ type, count }));
    
    if (repeatedTypes.length > 0) {
      return {
        detected: true,
        pattern: 'low_risk_pattern',
        details: repeatedTypes,
        summary: `Repeated ${repeatedTypes[0].type} at low difficulty ${repeatedTypes[0].count} times`
      };
    }
    return { detected: false };
  },
  
  /**
   * Detect avoidance_pattern: Commits Monday, executes after Thursday
   */
  detectAvoidancePattern: (reps) => {
    let lateExecutionCount = 0;
    let totalExecuted = 0;
    
    reps.forEach(rep => {
      if (rep.status === REP_STATUS.DEBRIEFED || rep.status === REP_STATUS.EXECUTED) {
        totalExecuted++;
        
        const createdAt = rep.createdAt?.toDate?.() || new Date(rep.createdAt);
        const executedAt = rep.executedAt?.toDate?.() || rep.debriefedAt?.toDate?.() || null;
        
        if (executedAt && createdAt) {
          const createdDay = createdAt.getDay(); // 0=Sun, 1=Mon, etc
          const executedDay = executedAt.getDay();
          
          // Committed early (Sun-Tue = 0-2), executed late (Fri-Sat = 5-6)
          if (createdDay <= 2 && executedDay >= 5) {
            lateExecutionCount++;
          }
        }
      }
    });
    
    // Pattern if ≥50% are late executions
    if (totalExecuted >= 2 && lateExecutionCount / totalExecuted >= 0.5) {
      return {
        detected: true,
        pattern: 'avoidance_pattern',
        details: { lateExecutionCount, totalExecuted },
        summary: `${lateExecutionCount} of ${totalExecuted} reps executed late in week`
      };
    }
    return { detected: false };
  },
  
  /**
   * Detect prep_strong_followthrough_weak: High prep, low execution
   */
  detectPrepFollowthroughPattern: (reps) => {
    const prepCompleted = reps.filter(r => r.prep && Object.keys(r.prep).length > 0).length;
    const executed = reps.filter(r => 
      r.status === REP_STATUS.DEBRIEFED || 
      r.status === REP_STATUS.EXECUTED
    ).length;
    const totalCommitted = reps.length;
    
    if (totalCommitted < 3) return { detected: false };
    
    const prepRate = prepCompleted / totalCommitted;
    const executionRate = executed / totalCommitted;
    
    // High prep (≥70%) but low execution (≤50%)
    if (prepRate >= 0.7 && executionRate <= 0.5) {
      return {
        detected: true,
        pattern: 'prep_strong_followthrough_weak',
        details: { prepRate: Math.round(prepRate * 100), executionRate: Math.round(executionRate * 100) },
        summary: `${Math.round(prepRate * 100)}% prep rate, but only ${Math.round(executionRate * 100)}% execution`
      };
    }
    return { detected: false };
  },
  
  /**
   * Detect no_close_pattern: Missing close/next step in ≥50% of debriefs
   */
  detectNoClosePattern: (reps) => {
    const debriefedReps = reps.filter(r => r.status === REP_STATUS.DEBRIEFED && r.evidence);
    
    if (debriefedReps.length < 3) return { detected: false };
    
    let missingCloseCount = 0;
    debriefedReps.forEach(rep => {
      const evidence = rep.evidence;
      // Check structured evidence for commitment field
      const hasClose = evidence.structured?.commitment || 
                       evidence.commitment ||
                       (evidence.reflection && evidence.reflection.toLowerCase().includes('next'));
      
      if (!hasClose || (typeof hasClose === 'string' && hasClose.trim().length < 10)) {
        missingCloseCount++;
      }
    });
    
    if (missingCloseCount / debriefedReps.length >= 0.5) {
      return {
        detected: true,
        pattern: 'no_close_pattern',
        details: { missingCloseCount, totalDebriefed: debriefedReps.length },
        summary: `${missingCloseCount} of ${debriefedReps.length} debriefs missing clear next step`
      };
    }
    return { detected: false };
  },
  
  /**
   * Detect consecutive_misses: ≥2 missed reps in last 4 weeks
   */
  detectConsecutiveMisses: (reps) => {
    const missedReps = reps.filter(r => r.status === REP_STATUS.MISSED);
    
    if (missedReps.length >= 2) {
      return {
        detected: true,
        pattern: 'consecutive_misses',
        details: { missedCount: missedReps.length },
        summary: `${missedReps.length} missed reps in last 4 weeks`
      };
    }
    return { detected: false };
  },
  
  /**
   * Run all pattern detections for a user
   * Returns array of detected patterns with coaching prompts
   */
  detectCoachPrompts: async (db, userId, cohortId) => {
    const reps = await conditioningService.getRepsInRange(db, userId, cohortId, 4);
    
    if (!reps || reps.length === 0) {
      return { detectedPatterns: [], totalReps: 0 };
    }
    
    const detectors = [
      { fn: conditioningService.detectLowRiskPattern, prompt: COACH_PROMPTS.low_risk_pattern },
      { fn: conditioningService.detectAvoidancePattern, prompt: COACH_PROMPTS.avoidance_pattern },
      { fn: conditioningService.detectPrepFollowthroughPattern, prompt: COACH_PROMPTS.prep_strong_followthrough_weak },
      { fn: conditioningService.detectNoClosePattern, prompt: COACH_PROMPTS.no_close_pattern },
      { fn: conditioningService.detectConsecutiveMisses, prompt: COACH_PROMPTS.consecutive_misses }
    ];
    
    const detectedPatterns = [];
    
    for (const { fn, prompt } of detectors) {
      const result = fn(reps);
      if (result.detected) {
        detectedPatterns.push({
          ...prompt,
          detection: result
        });
      }
    }
    
    // Sort by priority (critical first)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    detectedPatterns.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
    
    return {
      detectedPatterns,
      totalReps: reps.length,
      analyzedWeeks: 4
    };
  },
  
  /**
   * Get coach prompts for all users in a cohort (trainer dashboard)
   */
  getCohortCoachPrompts: async (db, cohortId, userIds) => {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const { detectedPatterns, totalReps } = await conditioningService.detectCoachPrompts(db, userId, cohortId);
        
        if (detectedPatterns.length > 0) {
          results.push({
            userId,
            patterns: detectedPatterns,
            totalReps,
            topPattern: detectedPatterns[0]
          });
        }
      } catch (err) {
        console.error(`Error detecting patterns for user ${userId}:`, err);
      }
    }
    
    // Sort by priority of top pattern
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    results.sort((a, b) => 
      (priorityOrder[a.topPattern?.priority] || 3) - (priorityOrder[b.topPattern?.priority] || 3)
    );
    
    return results;
  },
  
  // ============================================
  // PHASE 8: DETECTION HEURISTICS
  // ============================================
  
  /**
   * Get weekly completion data for a user (last N weeks)
   */
  getWeeklyData: async (db, userId, cohortId, weeksBack = 4) => {
    const weeksRef = collection(db, 'users', userId, 'conditioning_weeks');
    
    const q = query(
      weeksRef,
      where('cohortId', '==', cohortId),
      orderBy('weekStart', 'desc'),
      firestoreLimit(weeksBack)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * DETECTION HEURISTIC 1: difficulty_repetition
   * Same skill + difficulty repeated 3+ times in 4 weeks
   * More strict than low_risk_pattern - groups by exact skill+difficulty
   */
  detectDifficultyRepetition: (reps) => {
    // Group by repType + difficulty
    const bySkillDifficulty = {};
    reps.forEach(rep => {
      const key = `${rep.repType}-${rep.difficulty || 'level_1'}`;
      bySkillDifficulty[key] = (bySkillDifficulty[key] || []);
      bySkillDifficulty[key].push(rep);
    });
    
    // Find any combination repeated 3+ times
    const repeated = Object.entries(bySkillDifficulty)
      .filter(([_, reps]) => reps.length >= 3)
      .map(([key, reps]) => ({
        key,
        count: reps.length,
        repType: key.split('-')[0],
        difficulty: key.split('-')[1]
      }));
    
    if (repeated.length > 0) {
      return {
        detected: true,
        heuristic: 'difficulty_repetition',
        details: repeated,
        suggestion: 'Prompt stretch to harder difficulty or different skill',
        summary: `Same skill+difficulty (${repeated[0].key}) repeated ${repeated[0].count}x`
      };
    }
    return { detected: false };
  },
  
  /**
   * DETECTION HEURISTIC 2: latency_pattern
   * Execution consistently after Thursday (3+ of last 4 completed)
   */
  detectLatencyPattern: (reps) => {
    // Get last 4 completed reps
    const completedReps = reps
      .filter(r => r.status === REP_STATUS.DEBRIEFED || r.status === REP_STATUS.EXECUTED)
      .slice(0, 4);
    
    if (completedReps.length < 3) return { detected: false };
    
    let lateCount = 0;
    completedReps.forEach(rep => {
      const executedAt = rep.executedAt?.toDate?.() || rep.debriefedAt?.toDate?.() || null;
      if (executedAt) {
        const dayOfWeek = executedAt.getDay(); // 0=Sun, 5=Fri, 6=Sat
        if (dayOfWeek >= 5 || dayOfWeek === 0) { // Fri, Sat, Sun = late
          lateCount++;
        }
      }
    });
    
    if (lateCount >= 3) {
      return {
        detected: true,
        heuristic: 'latency_pattern',
        details: { lateCount, total: completedReps.length },
        suggestion: 'Flag avoidance pattern - challenge to execute earlier',
        summary: `${lateCount} of last ${completedReps.length} reps executed late in week`
      };
    }
    return { detected: false };
  },
  
  /**
   * DETECTION HEURISTIC 3: non_completion
   * Missed ≥2 of last 4 weeks (based on weekly data)
   */
  detectNonCompletion: async (db, userId, cohortId) => {
    const weeks = await conditioningService.getWeeklyData(db, userId, cohortId, 4);
    
    if (weeks.length < 2) return { detected: false };
    
    const missedWeeks = weeks.filter(w => !w.requiredRepCompleted);
    
    if (missedWeeks.length >= 2) {
      return {
        detected: true,
        heuristic: 'non_completion',
        details: { 
          missedCount: missedWeeks.length, 
          totalWeeks: weeks.length,
          missedWeekIds: missedWeeks.map(w => w.id)
        },
        suggestion: 'Flag for trainer follow-up',
        summary: `Missed ${missedWeeks.length} of last ${weeks.length} weeks`
      };
    }
    return { detected: false };
  },
  
  /**
   * Run all detection heuristics for a user
   * Returns structured analysis for trainer visibility
   */
  runDetectionHeuristics: async (db, userId, cohortId) => {
    const reps = await conditioningService.getRepsInRange(db, userId, cohortId, 4);
    
    const results = {
      difficulty_repetition: conditioningService.detectDifficultyRepetition(reps),
      latency_pattern: conditioningService.detectLatencyPattern(reps),
      non_completion: await conditioningService.detectNonCompletion(db, userId, cohortId)
    };
    
    const detectedHeuristics = Object.entries(results)
      .filter(([_, result]) => result.detected)
      .map(([name, result]) => ({ name, ...result }));
    
    return {
      heuristics: results,
      detectedCount: detectedHeuristics.length,
      detected: detectedHeuristics,
      repsAnalyzed: reps.length
    };
  },
  
  /**
   * Get cohort health score based on aggregated patterns
   * Returns 0-100 score with breakdown
   */
  getCohortHealthScore: async (db, cohortId, userIds) => {
    if (!userIds?.length) return { score: 100, breakdown: {} };
    
    let completedUserCount = 0;
    let activeUserCount = 0;
    let criticalPatternCount = 0;
    let highPatternCount = 0;
    let mediumPatternCount = 0;
    
    const weekId = getCurrentWeekId();
    
    for (const userId of userIds) {
      try {
        // Check current week status
        const status = await conditioningService.getWeeklyStatus(db, userId, weekId, cohortId);
        if (status.requiredRepCompleted) {
          completedUserCount++;
        } else if (status.totalActive > 0) {
          activeUserCount++;
        }
        
        // Get pattern detections
        const { detectedPatterns } = await conditioningService.detectCoachPrompts(db, userId, cohortId);
        detectedPatterns.forEach(p => {
          if (p.priority === 'critical') criticalPatternCount++;
          else if (p.priority === 'high') highPatternCount++;
          else mediumPatternCount++;
        });
      } catch (err) {
        console.error(`Error checking user ${userId}:`, err);
      }
    }
    
    const totalUsers = userIds.length;
    const completionRate = totalUsers > 0 ? completedUserCount / totalUsers : 0;
    
    // Calculate health score
    // Base score from completion rate (0-60 points)
    let score = completionRate * 60;
    
    // Add points for active users (up to 20 points)
    const activeRate = (completedUserCount + activeUserCount) / totalUsers;
    score += activeRate * 20;
    
    // Deduct for patterns detected
    score -= criticalPatternCount * 10;
    score -= highPatternCount * 5;
    score -= mediumPatternCount * 2;
    
    // Clamp to 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    // Determine health level
    let healthLevel;
    if (score >= 80) healthLevel = 'healthy';
    else if (score >= 60) healthLevel = 'caution';
    else if (score >= 40) healthLevel = 'at-risk';
    else healthLevel = 'critical';
    
    return {
      score,
      healthLevel,
      breakdown: {
        totalUsers,
        completedUserCount,
        activeUserCount,
        incompleteUserCount: totalUsers - completedUserCount - activeUserCount,
        completionRate: Math.round(completionRate * 100),
        criticalPatternCount,
        highPatternCount,
        mediumPatternCount
      }
    };
  }
};

export default conditioningService;
