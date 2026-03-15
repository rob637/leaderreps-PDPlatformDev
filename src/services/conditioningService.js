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
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { timeService } from './timeService';
import { REP_TYPES, getRepType, isPrepRequired, LEGACY_REP_TYPE_MAPPING } from './repTaxonomy';
import { 
  REP_TYPES_V2, 
  getRepTypeV2, 
  getBehaviorFocusReminder, 
  getActiveRepReminder,
  getSuggestedSituations 
} from './repTaxonomy';

// Re-export REP_TYPES from repTaxonomy for backward compatibility
export { REP_TYPES };
// Re-export V2 types
export { REP_TYPES_V2 };

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
  missed: ['committed', 'executed'],  // Roll forward OR rescue (actually did it)
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
// V2: 3 dimensions (specific_language, observed_response, reflection)
export const QUALITY_DIMENSIONS = {
  SPECIFIC_LANGUAGE: 'specific_language',    // Did they describe specifically what they said/did?
  OBSERVED_RESPONSE: 'observed_response',    // Did they describe how the person responded?
  REFLECTION: 'reflection',                  // Did they reflect on what went well & what to do differently?
  // Legacy V1 dimensions (for backward compatibility with old reps)
  CLEAR_REQUEST: 'clear_request',
  NAMED_COMMITMENT: 'named_commitment'
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
    
    // Prep required if: 1) user opted in via form, OR 2) forced by rep type/risk level
    const prepRequired = repData.prepRequired || isPrepRequired(repData.repType, repData.riskLevel);
    
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
   * Commit a new leadership rep using V2 taxonomy (10 types, 3 categories)
   * Supports both Planned and In-the-Moment commitment flows
   */
  commitRepV2: async (db, userId, repData) => {
    if (!userId) throw new Error('User ID required');
    if (!repData.person && !repData.allowSoloRep) throw new Error('Person is required');
    if (!repData.repType) throw new Error('Rep type is required');
    if (!repData.cohortId) throw new Error('Cohort ID is required');
    if (!repData.commitmentType) throw new Error('Commitment type is required (planned or in_moment)');
    
    // Validate rep type exists in V2 taxonomy
    const repTypeInfo = getRepTypeV2(repData.repType);
    if (!repTypeInfo) {
      throw new Error(`Invalid V2 rep type: ${repData.repType}`);
    }
    
    const repId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const weekId = getCurrentWeekId();
    const { weekEnd } = getWeekBoundaries(weekId);
    const now = new Date();
    
    // Build the rep document
    const repDoc = {
      id: repId,
      taxonomyVersion: 'v2',  // Mark as V2 rep
      
      // Core fields
      person: repData.person ? repData.person.trim() : 'Solo Rep',
      repType: repData.repType,
      category: repTypeInfo.category,
      commitmentType: repData.commitmentType, // 'planned' or 'in_moment'
      
      // Status
      status: repData.commitmentType === 'in_moment' ? REP_STATUS.EXECUTED : REP_STATUS.COMMITTED,
      
      // Timing — ITM reps use creation time as deadline (already happened)
      deadline: repData.deadline || Timestamp.fromDate(
        repData.commitmentType === 'in_moment' ? now : weekEnd
      ),
      weekId,
      cohortId: repData.cohortId,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(repData.commitmentType === 'planned' && repData.scheduledFor && {
        scheduledFor: repData.scheduledFor
      }),
      ...(repData.commitmentType === 'in_moment' && {
        occurredAt: repData.occurredAt || Timestamp.fromDate(now),
        executedAt: serverTimestamp()
      }),
      
      // Situation (new in V2)
      situation: {
        selected: repData.situation?.selected || null,
        customContext: repData.situation?.customContext || '',
        isRequired: repData.situation?.selected === 'something_else'
      },
      
      // Behavior focus (generated from taxonomy)
      behaviorFocus: getBehaviorFocusReminder(repData.repType),
      
      // Active card reminder (if applicable)
      ...(getActiveRepReminder(repData.repType) && {
        activeReminder: getActiveRepReminder(repData.repType)
      }),
      
      // Solo rep flag (for Lead Yourself types)
      allowSoloRep: repTypeInfo.allowSoloRep || false,
      
      // Prep is optional by default in V2
      prepOptional: true,
      prepCompleted: false,
      
      // Optional fields
      ...(repData.notes && { notes: repData.notes }),
      
      // Source tracking (for action item → rep linkage)
      ...(repData.sourceItemId && { sourceItemId: repData.sourceItemId })
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
   * Find an active rep by sourceItemId (for action item → rep linkage)
   * Returns the first active rep that was created from the given action item
   */
  getActiveRepBySourceItemId: async (db, userId, sourceItemId, cohortId = null) => {
    if (!sourceItemId) return null;
    
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // Active statuses (not yet fully complete)
    const activeStatuses = [
      'committed',
      'prepared',
      'scheduled',
      'executed',
      'follow_up_pending',
      'active'
    ];
    
    // Query by sourceItemId only to avoid needing composite indexes,
    // then filter in memory since a user will only have a few reps per item.
    const q = query(
      repsRef,
      where('sourceItemId', '==', sourceItemId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const activeRep = reps.find(rep => 
      activeStatuses.includes(rep.status) && 
      (!cohortId || rep.cohortId === cohortId)
    );
    
    return activeRep || null;
  },
  
  /**
   * Check if a rep has been completed for a given sourceItemId
   * Returns the completed rep if found, null otherwise
   */
  getCompletedRepBySourceItemId: async (db, userId, sourceItemId, cohortId = null) => {
    if (!sourceItemId) return null;
    
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // Completed statuses
    const completedStatuses = ['debriefed', 'loop_closed', 'completed'];
    
    // Query by sourceItemId only to avoid needing composite indexes,
    // then filter in memory since a user will only have a few reps per item.
    const q = query(
      repsRef,
      where('sourceItemId', '==', sourceItemId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const completedRep = reps.find(rep => 
      completedStatuses.includes(rep.status) && 
      (!cohortId || rep.cohortId === cohortId)
    );
    
    return completedRep || null;
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
    
    // All actionable statuses can be marked as missed
    const actionableStatuses = ['committed', 'prepared', 'scheduled', 'active'];
    if (!actionableStatuses.includes(currentRep.status)) {
      return false; // Already handled (executed, debriefed, etc.)
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
    
    // Map legacy rep types to canonical types
    let repType = missedRep.repType;
    if (LEGACY_REP_TYPE_MAPPING[repType]) {
      console.log(`[Conditioning] Mapping legacy rep type "${repType}" to "${LEGACY_REP_TYPE_MAPPING[repType]}"`);
      repType = LEGACY_REP_TYPE_MAPPING[repType];
    }
    
    // Create new rep with reference to original
    const newRepId = await conditioningService.commitRep(db, userId, {
      person: missedRep.person,
      repType,
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
   * V2: Save simplified prep (2 prompts max, 60-120 second alignment check)
   * No save-and-linger - once saved, user proceeds to rep
   */
  savePrepV2: async (db, userId, repId, prepData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Can only prep from committed state
    if (currentRep.status !== REP_STATUS.COMMITTED) {
      throw new Error('Can only prep a committed rep');
    }
    
    // V2 prep is just 2 prompts
    const prep = {
      prompt1: {
        question: prepData.prompt1?.question || '',
        answer: prepData.prompt1?.answer || ''
      },
      prompt2: {
        question: prepData.prompt2?.question || '',
        answer: prepData.prompt2?.answer || ''
      },
      completedAt: serverTimestamp(),
      durationSeconds: prepData.durationSeconds || null
    };
    
    await updateDoc(repRef, {
      prep,
      prepCompleted: true,
      status: REP_STATUS.PREPARED,
      preparedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
      'debriefed',         // Debriefed but needs to complete the loop (SCE/DRF)
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
    
    // Filter to truly finished states: debriefed, follow_up_pending, loop_closed, completed, and canceled
    // NOTE: 'executed' is NOT included because those reps are still active (awaiting debrief)
    const historyStates = ['debriefed', 'follow_up_pending', 'loop_closed', 'completed'];
    reps = reps.filter(rep => 
      historyStates.includes(rep.status) || rep.status === REP_STATUS.CANCELED
    );
    
    // Filter by cohort if specified
    if (cohortId) {
      reps = reps.filter(rep => rep.cohortId === cohortId);
    }
    
    return reps.slice(0, limitCount);
  },
  
  /**
   * Get total count of completed reps by rep type
   * @param {Object} db Firestore instance
   * @param {string} userId User ID
   * @returns {Object} Map of repType -> count
   */
  getCompletedRepCounts: async (db, userId) => {
    // If db or userId missing, return empty
    if (!db || !userId) return {};
    
    try {
      const repsRef = collection(db, 'users', userId, 'conditioning_reps');
      
      // Completed states (fully finished reps)
      const completedStates = ['debriefed', 'follow_up_pending', 'loop_closed', 'completed'];
      
      const q = query(
        repsRef,
        where('status', 'in', completedStates)
      );
      
      const snapshot = await getDocs(q);
      const counts = {};
      
      // SCE and DRF rep types require "Complete the Loop" step
      const repTypesRequiringLoop = ['set_clear_expectations', 'deliver_reinforcing_feedback', 'reinforce_public'];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const repType = data.repType;
        const status = data.status;
        
        if (!repType) return;
        
        // Only count reps that passed the quality assessment
        if (data.qualityAssessment && data.qualityAssessment.meetsStandard === false) return;
        
        // For SCE/DRF reps, only count as complete if loop is closed and we have completeLoopResponses
        if (repTypesRequiringLoop.includes(repType)) {
          const hasLoopResponses = repType === 'deliver_reinforcing_feedback' || repType === 'reinforce_public'
            ? !!data.evidence?.drfEvidence?.completeLoopResponses
            : !!data.evidence?.sceEvidence?.completeLoopResponses;
            
          // Only count if status is loop_closed OR has loop responses
          if (status === 'loop_closed' || hasLoopResponses) {
            counts[repType] = (counts[repType] || 0) + 1;
          }
          // Don't count debriefed SCE/DRF - they still need to complete the loop
        } else {
          // For other rep types, debriefed is complete
          counts[repType] = (counts[repType] || 0) + 1;
        }
      });
      
      return counts;
    } catch (err) {
      console.warn('Error fetching completed rep counts:', err);
      return {};
    }
  },

  /**
   * Get completed reps for a specific rep type
   * Used for displaying individual completed reps in the UI (e.g., showing all 3 DRF reps)
   * @param {Object} db Firestore instance
   * @param {string} userId User ID
   * @param {string} repTypeId Rep type ID to filter by
   * @returns {Object[]} Array of completed rep objects
   */
  getCompletedRepsByType: async (db, userId, repTypeId) => {
    if (!db || !userId || !repTypeId) return [];
    
    try {
      const repsRef = collection(db, 'users', userId, 'conditioning_reps');
      
      // Completed states that count as "done"
      const completedStates = ['debriefed', 'follow_up_pending', 'loop_closed', 'completed'];
      
      // SCE and DRF rep types require "Complete the Loop" step
      const repTypesRequiringLoop = ['set_clear_expectations', 'deliver_reinforcing_feedback', 'reinforce_public'];
      
      // Query without orderBy on completedAt since some docs may not have it
      const q = query(
        repsRef,
        where('repType', '==', repTypeId),
        where('status', 'in', completedStates)
      );
      
      const snapshot = await getDocs(q);
      const completedReps = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status;
        
        // Only include reps that passed the quality assessment
        if (data.qualityAssessment && data.qualityAssessment.meetsStandard === false) return;
        
        // For SCE/DRF reps, only include if loop is closed
        if (repTypesRequiringLoop.includes(repTypeId)) {
          const hasLoopResponses = repTypeId === 'deliver_reinforcing_feedback' || repTypeId === 'reinforce_public'
            ? !!data.evidence?.drfEvidence?.completeLoopResponses
            : !!data.evidence?.sceEvidence?.completeLoopResponses;
            
          if (status === 'loop_closed' || hasLoopResponses) {
            completedReps.push({ id: doc.id, ...data, isCompleted: true });
          }
        } else {
          completedReps.push({ id: doc.id, ...data, isCompleted: true });
        }
      });
      
      // Sort by completedAt descending (in memory since field may not exist on all docs)
      completedReps.sort((a, b) => {
        const aTime = a.completedAt?.toMillis?.() || a.completedAt?.seconds * 1000 || 0;
        const bTime = b.completedAt?.toMillis?.() || b.completedAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });
      
      return completedReps;
    } catch (err) {
      console.warn('Error fetching completed reps by type:', err);
      return [];
    }
  },

  /**
   * Subscribe to completed reps for a specific rep type (real-time)
   * Used for displaying individual completed reps in the UI (e.g., showing all 3 DRF reps)
   * @param {Object} db Firestore instance
   * @param {string} userId User ID
   * @param {string} repTypeId Rep type ID to filter by
   * @param {Function} callback Function to call with updated reps
   * @returns {Function} Unsubscribe function
   */
  subscribeToCompletedRepsByType: (db, userId, repTypeId, callback) => {
    if (!db || !userId || !repTypeId) {
      if (callback) callback([]);
      return () => {};
    }
    
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // Completed states that count as "done"
    const completedStates = ['debriefed', 'follow_up_pending', 'loop_closed', 'completed'];
    
    // SCE and DRF rep types require "Complete the Loop" step
    const repTypesRequiringLoop = ['set_clear_expectations', 'deliver_reinforcing_feedback', 'reinforce_public'];
    
    // Query without orderBy on completedAt since some docs may not have it
    const q = query(
      repsRef,
      where('repType', '==', repTypeId),
      where('status', 'in', completedStates)
    );
    
    return onSnapshot(q, (snapshot) => {
      const completedReps = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status;
        
        // Only include reps that passed the quality assessment
        if (data.qualityAssessment && data.qualityAssessment.meetsStandard === false) return;
        
        // For SCE/DRF reps, only include if loop is closed
        if (repTypesRequiringLoop.includes(repTypeId)) {
          const hasLoopResponses = repTypeId === 'deliver_reinforcing_feedback' || repTypeId === 'reinforce_public'
            ? !!data.evidence?.drfEvidence?.completeLoopResponses
            : !!data.evidence?.sceEvidence?.completeLoopResponses;
            
          if (status === 'loop_closed' || hasLoopResponses) {
            completedReps.push({ id: doc.id, ...data, isCompleted: true });
          }
        } else {
          completedReps.push({ id: doc.id, ...data, isCompleted: true });
        }
      });
      
      // Sort by completedAt descending (in memory since field may not exist on all docs)
      completedReps.sort((a, b) => {
        const aTime = a.completedAt?.toMillis?.() || a.completedAt?.seconds * 1000 || 0;
        const bTime = b.completedAt?.toMillis?.() || b.completedAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });
      
      callback(completedReps);
    }, (error) => {
      console.warn('Error in subscribeToCompletedRepsByType:', error);
      callback([]);
    });
  },

  /**
   * Get unique rep types the user has ever completed successfully
   * Used for linked rep unlocking (e.g., "Make a Clean Handoff" unlocks after completing "Set Expectations")
   * @returns {string[]} Array of unique rep type IDs
   */
  getCompletedRepTypes: async (db, userId) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // All states where some work has been done
    const relevantStates = ['debriefed', 'follow_up_pending', 'loop_closed', 'completed'];
    
    const q = query(
      repsRef,
      where('status', 'in', relevantStates)
    );
    
    const snapshot = await getDocs(q);
    const repTypes = new Set();
    
    // SCE and DRF rep types require "Complete the Loop" step
    const repTypesRequiringLoop = ['set_clear_expectations', 'deliver_reinforcing_feedback', 'reinforce_public'];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const repType = data.repType;
      const status = data.status;
      
      if (!repType) return;
      
      // Only count reps that passed the quality assessment
      if (data.qualityAssessment && data.qualityAssessment.meetsStandard === false) return;
      
      // For SCE/DRF reps, only count as complete if loop is closed and we also have completeLoopResponses
      if (repTypesRequiringLoop.includes(repType)) {
        // Must be loop_closed AND have completeLoopResponses
        const hasLoopResponses = repType === 'deliver_reinforcing_feedback' || repType === 'reinforce_public'
          ? !!data.evidence?.drfEvidence?.completeLoopResponses
          : !!data.evidence?.sceEvidence?.completeLoopResponses;
          
        if (status === 'loop_closed' || hasLoopResponses) {
          repTypes.add(repType);
        }
        // Don't add debriefed SCE/DRF - they still need to complete the loop
      } else {
        // For other rep types, debriefed is complete
        repTypes.add(repType);
      }
    });
    
    return Array.from(repTypes);
  },

  /**
   * Get count of completed reps per rep type (for milestone action item progress tracking)
   * Returns Map of repType → count of fully completed reps
   */
  getCompletedRepCounts: async (db, userId) => {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    const relevantStates = ['debriefed', 'follow_up_pending', 'loop_closed', 'completed'];
    const q = query(repsRef, where('status', 'in', relevantStates));
    const snapshot = await getDocs(q);
    
    const counts = {};
    const repTypesRequiringLoop = ['set_clear_expectations', 'deliver_reinforcing_feedback', 'reinforce_public'];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const repType = data.repType;
      const status = data.status;
      if (!repType) return;
      if (data.qualityAssessment && data.qualityAssessment.meetsStandard === false) return;
      
      if (repTypesRequiringLoop.includes(repType)) {
        const hasLoopResponses = repType === 'deliver_reinforcing_feedback' || repType === 'reinforce_public'
          ? !!data.evidence?.drfEvidence?.completeLoopResponses
          : !!data.evidence?.sceEvidence?.completeLoopResponses;
        if (status === 'loop_closed' || hasLoopResponses) {
          counts[repType] = (counts[repType] || 0) + 1;
        }
      } else {
        counts[repType] = (counts[repType] || 0) + 1;
      }
    });
    
    return counts;
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
    if (!userId) {
      if (callback) callback([]);
      return () => {};
    }
    
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    
    // Use the same comprehensive list of active statuses as getActiveReps
    const inProgressStatuses = [
      'committed',
      'prepared',
      'scheduled',
      'executed',
      'debriefed',         // Debriefed but needs to complete the loop (SCE/DRF)
      'follow_up_pending',
      'active',
      'missed'
    ];
    
    let q;
    
    // Only filter by cohortId if it is provided (avoid undefined error)
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
    
    // For weekly requirement: only reps that PASSED quality assessment count
    // A rep must be in a done state AND have passed the quality review
    const doneStates = ['debriefed', 'loop_closed', 'follow_up_pending', 'completed'];
    const doneForRequirement = reps.filter(r => {
      if (!doneStates.includes(r.status)) return false;
      // Check quality assessment: meetsStandard is the unified pass field
      // If no quality assessment yet (edge case), don't count it
      const qa = r.qualityAssessment;
      if (!qa) return false;
      return qa.meetsStandard === true;
    });
    
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
    
    // Check all actionable statuses, not just legacy 'active'
    const actionableStatuses = ['committed', 'prepared', 'scheduled', 'active'];
    
    // Only mark missed if the deadline DAY has fully passed (not same day)
    // A rep due today should not be missed until tomorrow
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const overdueReps = activeReps.filter(rep => {
      if (!actionableStatuses.includes(rep.status)) return false;
      const deadline = rep.deadline?.toDate?.() || new Date(rep.deadline);
      return deadline < startOfToday;
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
   * NOTE: Only counts PAST weeks as missed - the current week is still in progress
   */
  getConsecutiveMissedWeeks: async (db, userId, cohortId) => {
    const currentWeekId = getCurrentWeekId();
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
      // Skip the current week - it hasn't ended yet, so can't be "missed"
      if (week.weekId === currentWeekId) {
        continue;
      }
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
    const completed = completedAt?.toDate?.() || new Date(completedAt);
    
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
    
    // Run AI-powered quality assessment
    const quality = await conditioningService.assessQualityWithAI(evidence, currentRep);
    
    // Store quality assessment
    await updateDoc(repRef, {
      qualityAssessment: quality,
      updatedAt: serverTimestamp()
    });
    
    // Update weekly stats (pass/fail affects requiredRepCompleted)
    await conditioningService.updateWeeklyStats(db, userId, currentRep.weekId, currentRep.cohortId);
    
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
   * Complete a rep directly without follow-up planning
   * Transitions to loop_closed (terminal state)
   * For reps that don't require follow-up tracking (e.g., Lead with Vulnerability, Follow-up on Work)
   */
  completeRepDirectly: async (db, userId, repId) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Can complete from debriefed or follow_up_pending
    const validStatuses = [REP_STATUS.DEBRIEFED, REP_STATUS.FOLLOW_UP_PENDING];
    if (!validStatuses.includes(currentRep.status)) {
      throw new Error('Can only complete a debriefed or follow-up pending rep');
    }
    
    await updateDoc(repRef, {
      status: REP_STATUS.LOOP_CLOSED,
      loopClosedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update weekly stats
    await conditioningService.updateWeeklyStats(db, userId, currentRep.weekId, currentRep.cohortId);
    
    return true;
  },
  
  /**
   * Close the loop on a rep - record follow-up outcome
   * Transitions to loop_closed (terminal state)
   * NOTE: Currently disabled - use completeRepDirectly instead
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
  
  // ============================================
  // V2: EVIDENCE + CLOSE RR (Separate Steps)
  // ============================================
  
  /**
   * V2: Submit evidence capture (Step 1 of closing a rep)
   * This is separate from Close RR to maintain the two-step flow
   */
  submitEvidenceV2: async (db, userId, repId, evidenceData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // For V2, can submit evidence if rep is committed, prepared, or executed
    const validStatuses = [
      REP_STATUS.COMMITTED,
      REP_STATUS.PREPARED,
      REP_STATUS.EXECUTED,
      'active' // Legacy
    ];
    
    if (!validStatuses.includes(currentRep.status)) {
      throw new Error(`Cannot submit evidence for rep in '${currentRep.status}' status`);
    }
    
    // Determine evidence level based on timing (Level 1 = within 24h of scheduled/deadline)
    const evidenceLevel = conditioningService.getEvidenceLevel(
      currentRep.scheduledAt || currentRep.deadline
    );
    
    // Structure the V2 evidence data
    const evidence = {
      whatYouSaid: evidenceData.whatYouSaid || '',
      howTheyResponded: evidenceData.howTheyResponded || '',
      outcome: evidenceData.outcome || null,
      ...evidenceData, // Allow all other fields (structured evidence, artifacts, notes, etc.)
      level: evidenceLevel, // Track if evidence was submitted timely
      submittedAt: serverTimestamp(),
      inputMethod: evidenceData.inputMethod || 'written'
    };
    
    // Transition to 'executed' status (evidence captured, awaiting Close RR)
    await updateDoc(repRef, {
      evidence,
      status: REP_STATUS.EXECUTED,
      executedAt: currentRep.executedAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return evidence;
  },
  
  /**
   * V2: Close RR (Step 2 of closing a rep)
   * Called after evidence has been submitted
   * Adds reflection and finalizes the rep
   */
  closeRepV2: async (db, userId, repId, closureData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) throw new Error('Rep not found');
    
    const currentRep = repSnap.data();
    
    // Must be in executed status (evidence already submitted)
    if (currentRep.status !== REP_STATUS.EXECUTED) {
      throw new Error(`Cannot close rep in '${currentRep.status}' status. Submit evidence first.`);
    }
    
    // Check that evidence exists
    if (!currentRep.evidence) {
      throw new Error('Evidence must be submitted before closing rep');
    }
    
    // Structure the Close RR data
    const closeRR = {
      reflection: {
        whatWentWell: closureData.whatWentWell || null,
        whatDifferent: closureData.whatDifferent || null
      },
      closedAt: serverTimestamp()
    };
    
    // Transition to 'debriefed' status (rep is now complete)
    await updateDoc(repRef, {
      closeRR,
      status: REP_STATUS.DEBRIEFED,
      debriefedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Run AI-powered quality assessment (RepUp Review)
    const quality = await conditioningService.assessQualityWithAI(
      { ...currentRep.evidence, reflection: closeRR.reflection },
      currentRep
    );
    
    // Store quality assessment
    await updateDoc(repRef, {
      qualityAssessment: quality,
      updatedAt: serverTimestamp()
    });
    
    // Update weekly stats (pass/fail affects requiredRepCompleted)
    await conditioningService.updateWeeklyStats(db, userId, currentRep.weekId, currentRep.cohortId);
    
    return { closeRR, quality };
  },
  
  /**
   * Create a linked rep that continues from a completed rep
   * For example, completing "Delegate a Task" might create "Make a Clean Handoff"
   * 
   * @param {Object} db - Firestore instance
   * @param {string} userId - User ID
   * @param {string} sourceRepId - ID of the completed source rep
   * @param {string} linkedRepTypeId - Rep type ID for the linked rep
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - ID of the newly created linked rep
   */
  createLinkedRep: async (db, userId, sourceRepId, linkedRepTypeId, options = {}) => {
    // Get the source rep to copy context from
    const sourceRepRef = doc(db, 'users', userId, 'conditioning_reps', sourceRepId);
    const sourceRepSnap = await getDoc(sourceRepRef);
    
    if (!sourceRepSnap.exists()) {
      throw new Error('Source rep not found for linked rep creation');
    }
    
    const sourceRep = sourceRepSnap.data();
    
    // Calculate deadline (default: 7 days from now, or end of week)
    const deadline = options.deadline || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return Timestamp.fromDate(d);
    })();
    
    // Create the linked rep
    const newRep = {
      // Core identity
      repTypeId: linkedRepTypeId,
      repType: linkedRepTypeId, // Legacy compatibility
      status: REP_STATUS.COMMITTED,
      flowType: 'linked', // Special flow type for linked reps
      
      // Context carried from source rep
      person: options.person || sourceRep.person,
      context: options.context || `Follow-up from: ${sourceRep.repType}`,
      situation: options.situation || sourceRep.situation,
      
      // Link back to source
      linkedFrom: {
        repId: sourceRepId,
        repType: sourceRep.repType,
        createdAt: serverTimestamp()
      },
      requiresPrerequisite: true, // This rep requires the source rep as prerequisite
      
      // Timeline
      cohortId: sourceRep.cohortId,
      weekId: sourceRep.weekId,
      deadline,
      
      // Notes
      notes: options.notes || `Auto-created follow-up rep from "${sourceRep.repType}"`,
      
      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add to collection
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    const newRepRef = await addDoc(repsRef, newRep);
    
    // Update source rep to track the linked rep
    await updateDoc(sourceRepRef, {
      linkedRepId: newRepRef.id,
      linkedRepType: linkedRepTypeId,
      updatedAt: serverTimestamp()
    });
    
    console.log(`[conditioningService] Created linked rep ${newRepRef.id} (${linkedRepTypeId}) from source ${sourceRepId}`);
    
    return newRepRef.id;
  },
  
  /**
   * Check if a rep type should create a linked rep on completion
   * Uses admin-configured linked reps data from Firestore
   * 
   * @param {Object} db - Firestore instance 
   * @param {string} repTypeId - The rep type being completed
   * @returns {Promise<string|null>} - The linked rep type ID to create, or null
   */
  getLinkedRepTypeForCompletion: async (db, repTypeId) => {
    try {
      const linkedRepRef = doc(db, 'conditioning_linked_reps', repTypeId);
      const linkedRepSnap = await getDoc(linkedRepRef);
      
      if (!linkedRepSnap.exists()) return null;
      
      const config = linkedRepSnap.data();
      return config.createsLinkedRepId || null;
    } catch (error) {
      console.error('[conditioningService] Error checking linked rep config:', error);
      return null;
    }
  },
  
  /**
   * Check if a rep type requires a prerequisite rep to be completed first
   * 
   * @param {Object} db - Firestore instance
   * @param {string} repTypeId - The rep type to check
   * @returns {Promise<Object|null>} - Prerequisite config or null
   */
  checkPrerequisiteRequirement: async (db, repTypeId) => {
    try {
      const linkedRepRef = doc(db, 'conditioning_linked_reps', repTypeId);
      const linkedRepSnap = await getDoc(linkedRepRef);
      
      if (!linkedRepSnap.exists()) return null;
      
      const config = linkedRepSnap.data();
      if (!config.requiresPrerequisite) return null;
      
      return {
        required: true,
        prerequisiteRepType: config.prerequisiteRepType,
        message: config.prerequisiteMessage || 'This rep requires a prior action to be completed first.'
      };
    } catch (error) {
      console.error('[conditioningService] Error checking prerequisite:', error);
      return null;
    }
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

  /**
   * Get follow-up reminders that are due or overdue for a user.
   * Queries the top-level follow_up_reminders collection.
   * Returns reminders where reminderDate <= today and sent === false.
   */
  getDueFollowUpReminders: async (db, userId) => {
    const remindersRef = collection(db, 'follow_up_reminders');
    const todayStr = new Date().toISOString().split('T')[0];
    
    const remindersQuery = query(
      remindersRef,
      where('userId', '==', userId),
      where('sent', '==', false)
    );
    
    const snap = await getDocs(remindersQuery);
    const due = [];
    
    snap.forEach(doc => {
      const data = doc.data();
      if (data.reminderDate <= todayStr) {
        due.push({ id: doc.id, ...data });
      }
    });
    
    return due;
  },
  
  // ============================================
  // PHASE 2: QUALITY ASSESSMENT
  // ============================================
  
  /**
   * Basic rule-based quality assessment (fallback when AI is unavailable)
   * V2: Returns 3 dimension scores (specific_language, observed_response, reflection)
   */
  assessQualityBasic: (evidence, rep) => {
    // SCE reps use 4-condition scored fallback
    if (rep?.repType === 'set_clear_expectations' && evidence.sceEvidence) {
      return conditioningService._assessSCEBasic(evidence);
    }
    // DRF reps use 3-condition scored fallback
    if (rep?.repType === 'deliver_reinforcing_feedback' && evidence.drfEvidence) {
      return conditioningService._assessDRFBasic(evidence);
    }
    // FUW reps use 3-condition scored fallback
    if (rep?.repType === 'follow_up_work' && evidence.fuwEvidence) {
      return conditioningService._assessFUWBasic(evidence);
    }
    // LWV reps use 3-condition scored fallback
    if (rep?.repType === 'lead_with_vulnerability' && evidence.lwvEvidence) {
      return conditioningService._assessLWVBasic(evidence);
    }
    
    // Generic 3-dimension pass/fail for other rep types
    const responses = evidence.responses || {};
    const dimensions = {};
    let passedCount = 0;
    const totalDimensions = 3;
    
    const whatSaid = evidence.whatYouSaid || responses.what_said || responses.what_happened || '';
    const theirResponse = evidence.howTheyResponded || responses.their_response || '';
    const whatWentWell = evidence.reflection?.whatWentWell || '';
    const whatDifferent = evidence.reflection?.whatDifferent || responses.next_time || responses.learning || '';
    
    const hasSpecificLanguage = whatSaid.length >= 20;
    dimensions[QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE] = {
      passed: hasSpecificLanguage,
      feedback: hasSpecificLanguage 
        ? 'You captured what you said/did. Nice work being specific.'
        : 'Can you remember what you actually said or did? Replay the moment.',
      coachingQuestion: hasSpecificLanguage ? null : 'If you were watching a video of this moment, what would you see yourself doing or hear yourself saying?'
    };
    if (dimensions[QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE].passed) passedCount++;
    
    const hasResponse = theirResponse.length >= 5;
    dimensions[QUALITY_DIMENSIONS.OBSERVED_RESPONSE] = {
      passed: hasResponse,
      feedback: hasResponse 
        ? 'You noted how they responded. What did that tell you?'
        : 'How did they react? What did you notice?',
      coachingQuestion: hasResponse ? null : 'What did you observe when you finished? Their expression, their words, their body language?'
    };
    if (dimensions[QUALITY_DIMENSIONS.OBSERVED_RESPONSE].passed) passedCount++;
    
    const combinedReflection = [whatWentWell, whatDifferent].filter(Boolean).join(' ');
    const reflectionPassed = combinedReflection.length >= 15;
    dimensions[QUALITY_DIMENSIONS.REFLECTION] = {
      passed: reflectionPassed,
      feedback: reflectionPassed
        ? 'Good reflection. How will you apply this next time?'
        : 'What went well? What would you do differently?',
      coachingQuestion: reflectionPassed ? null : 'If you could replay this moment, what would you keep and what would you change?'
    };
    if (dimensions[QUALITY_DIMENSIONS.REFLECTION].passed) passedCount++;
    
    const meetsStandard = passedCount >= 2;
    
    return {
      dimensions,
      passedCount,
      totalDimensions,
      meetsStandard,
      isConstructive: true,
      assessedAt: new Date().toISOString(),
      assessedBy: 'rules',
      summary: meetsStandard 
        ? 'This rep meets the quality standard'
        : `This rep needs improvement in ${totalDimensions - passedCount} area(s)`
    };
  },

  /**
   * SCE-specific fallback scoring (rule-based, no AI)
   * Scores 4 conditions 0-3 based on evidence field lengths
   */
  _assessSCEBasic: (evidence) => {
    const sce = evidence.sceEvidence || {};
    const responses = sce.responses || {};
    
    // Score helper: map text length to 0-3
    const scoreText = (text) => {
      if (!text || typeof text !== 'string') return 0;
      const len = text.trim().length;
      if (len >= 50) return 3;
      if (len >= 20) return 2;
      if (len >= 5) return 1;
      return 0;
    };
    
    // Score yes/no fields
    const scoreYesNo = (val) => {
      if (!val) return 0;
      if (typeof val === 'object') {
        const hasAnswer = val.answer && val.answer !== 'no';
        const hasComment = val.comment && val.comment.trim().length >= 10;
        if (hasAnswer && hasComment) return 3;
        if (hasAnswer) return 2;
        return 1;
      }
      return val.length >= 5 ? 2 : 0;
    };

    // Condition 1: Expectation Stated
    const defineSuccess = responses.define_success || responses.behavior_standard || responses.previous_unclear || '';
    const expectationScore = scoreText(typeof defineSuccess === 'object' ? JSON.stringify(defineSuccess) : defineSuccess);

    // Condition 2: Success Defined
    const otherExpectations = responses.other_expectations || responses.boundaries || responses.restated_success || responses.good_looks_like || '';
    const successScore = scoreText(typeof otherExpectations === 'object' ? JSON.stringify(otherExpectations) : otherExpectations);

    // Condition 3: Understanding Confirmed
    const articulatedBack = responses.articulated_back || responses.test_understanding || responses.confirmed_alignment || '';
    const understandingScore = scoreYesNo(articulatedBack);

    // Condition 4: Ownership Established
    const ownership = responses.confirmed_ownership || '';
    const ownershipScore = scoreText(typeof ownership === 'object' ? JSON.stringify(ownership) : ownership);

    const scores = [expectationScore, successScore, understandingScore, ownershipScore];
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const expectationIsOne = expectationScore === 1;
    const successIsOne = successScore === 1;
    const autoFailTriggered = hasZero || onesCount >= 2 || expectationIsOne || successIsOne;
    const repPassed = !autoFailTriggered && totalScore >= 6;

    const scoreLabel = (s) => s === 3 ? 'Strong' : s === 2 ? 'Adequate' : s === 1 ? 'Weak' : 'None';

    return {
      evaluationType: 'sce_scored',
      repValidity: 'valid',
      conditions: {
        expectation_stated: { score: expectationScore, label: scoreLabel(expectationScore), feedback: 'Assessed by system rules.' },
        success_defined: { score: successScore, label: scoreLabel(successScore), feedback: 'Assessed by system rules.' },
        understanding_confirmed: { score: understandingScore, label: scoreLabel(understandingScore), feedback: 'Assessed by system rules.' },
        ownership_established: { score: ownershipScore, label: scoreLabel(ownershipScore), feedback: 'Assessed by system rules.' }
      },
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? 'Automatic fail condition met' : null,
      totalScore,
      maxScore: 12,
      repPassed,
      coachingQuestions: [],
      meetsStandard: repPassed,
      isConstructive: true,
      assessedAt: new Date().toISOString(),
      assessedBy: 'rules',
      summary: repPassed ? 'Rep Passed' : 'Rep Not Passed'
    };
  },
  
  /**
   * DRF-specific fallback scoring (rule-based, no AI)
   * Scores 3 conditions 0-3 based on evidence field lengths
   */
  _assessDRFBasic: (evidence) => {
    const drf = evidence.drfEvidence || {};
    const responses = drf.responses || {};
    
    const scoreText = (text) => {
      if (!text || typeof text !== 'string') return 0;
      const len = text.trim().length;
      if (len >= 50) return 3;
      if (len >= 20) return 2;
      if (len >= 5) return 1;
      return 0;
    };

    // Condition 1: Observable Behavior Clearly Named
    const behaviorScore = scoreText(responses.describe_behavior || '');

    // Condition 2: Impact or Meaning Explained
    const impactScore = scoreText(responses.why_matters || '');

    // Condition 3: Reinforcement of Repeat Behavior
    // Check message_components for explicit reinforcement, plus notes
    const hasRequestedContinue = Array.isArray(responses.message_components) && responses.message_components.includes('requested_continue');
    let reinforcementScore = hasRequestedContinue ? 2 : 1;
    // Boost if notes add context
    if (evidence.notes && evidence.notes.trim().length >= 20) {
      reinforcementScore = Math.min(reinforcementScore + 1, 3);
    }
    // If no behavior or impact, can't have reinforcement
    if (behaviorScore === 0 && impactScore === 0) reinforcementScore = 0;

    const scores = [behaviorScore, impactScore, reinforcementScore];
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const behaviorIsOne = behaviorScore === 1;
    const autoFailTriggered = hasZero || onesCount >= 2 || behaviorIsOne;
    const repPassed = !autoFailTriggered && totalScore >= 5;

    const scoreLabel = (s) => s === 3 ? 'Strong' : s === 2 ? 'Adequate' : s === 1 ? 'Weak' : 'None';

    return {
      evaluationType: 'drf_scored',
      repValidity: 'valid',
      conditions: {
        behavior_named: { score: behaviorScore, label: scoreLabel(behaviorScore), feedback: 'Assessed by system rules.' },
        impact_explained: { score: impactScore, label: scoreLabel(impactScore), feedback: 'Assessed by system rules.' },
        reinforcement_given: { score: reinforcementScore, label: scoreLabel(reinforcementScore), feedback: 'Assessed by system rules.' }
      },
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? 'Automatic fail condition met' : null,
      totalScore,
      maxScore: 9,
      repPassed,
      coachingQuestions: [],
      meetsStandard: repPassed,
      isConstructive: true,
      assessedAt: new Date().toISOString(),
      assessedBy: 'rules',
      summary: repPassed ? 'Rep Passed' : 'Rep Not Passed'
    };
  },

  /**
   * FUW-specific fallback scoring (rule-based, no AI)
   * Scores 3 conditions 0-3 based on evidence field lengths
   */
  _assessFUWBasic: (evidence) => {
    const fuw = evidence.fuwEvidence || {};
    const responses = fuw.responses || {};
    
    const scoreText = (text) => {
      if (!text || typeof text !== 'string') return 0;
      const len = text.trim().length;
      if (len >= 50) return 3;
      if (len >= 20) return 2;
      if (len >= 5) return 1;
      return 0;
    };

    // Condition 1: Work Anchored & Status Requested (Critical)
    const workAnchoredScore = scoreText(responses.what_said || '');

    // Condition 2: Progress Visibility
    const progressScore = scoreText(responses.what_they_said || responses.their_response || '');

    // Condition 3: Ownership Preserved
    // Check for reinforcement language in reflection
    let ownershipScore = 1; // Default to weak
    const reflection = fuw.nextTimeReflection || '';
    if (reflection.length >= 30) ownershipScore = 3;
    else if (reflection.length >= 15) ownershipScore = 2;
    // Boost if notes add context
    if (evidence.notes && evidence.notes.trim().length >= 20) {
      ownershipScore = Math.min(ownershipScore + 1, 3);
    }

    const scores = [workAnchoredScore, progressScore, ownershipScore];
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const workAnchoredIsOne = workAnchoredScore === 1;
    const autoFailTriggered = hasZero || onesCount >= 2 || workAnchoredIsOne;
    const repPassed = !autoFailTriggered && totalScore >= 5;

    const scoreLabel = (s) => s === 3 ? 'Strong' : s === 2 ? 'Adequate' : s === 1 ? 'Weak' : 'None';

    return {
      evaluationType: 'fuw_scored',
      repValidity: 'valid',
      conditions: {
        work_anchored: { score: workAnchoredScore, label: scoreLabel(workAnchoredScore), feedback: 'Assessed by system rules.' },
        progress_visible: { score: progressScore, label: scoreLabel(progressScore), feedback: 'Assessed by system rules.' },
        ownership_preserved: { score: ownershipScore, label: scoreLabel(ownershipScore), feedback: 'Assessed by system rules.' }
      },
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? 'Automatic fail condition met' : null,
      totalScore,
      maxScore: 9,
      repPassed,
      coachingQuestions: [],
      meetsStandard: repPassed,
      isConstructive: true,
      assessedAt: new Date().toISOString(),
      assessedBy: 'rules',
      summary: repPassed ? 'Rep Passed' : 'Rep Not Passed'
    };
  },

  /**
   * LWV-specific fallback scoring (rule-based, no AI)
   * Scores 3 conditions 0-3 based on evidence field lengths
   */
  _assessLWVBasic: (evidence) => {
    const lwv = evidence.lwvEvidence || {};
    const responses = lwv.responses || {};
    
    const scoreText = (text) => {
      if (!text || typeof text !== 'string') return 0;
      const len = text.trim().length;
      if (len >= 50) return 3;
      if (len >= 20) return 2;
      if (len >= 5) return 1;
      return 0;
    };

    // Condition 1: Ownership Present (Critical - must be >= 2)
    const ownershipScore = scoreText(responses.what_said || '');

    // Condition 2: Statement Clarity
    const clarityScore = scoreText(responses.what_they_said || responses.their_response || '');

    // Condition 3: Forward Strength
    let forwardScore = 1; // Default to weak
    const reflection = lwv.nextTimeReflection || '';
    if (reflection.length >= 30) forwardScore = 3;
    else if (reflection.length >= 15) forwardScore = 2;
    // Boost if notes add context
    if (evidence.notes && evidence.notes.trim().length >= 20) {
      forwardScore = Math.min(forwardScore + 1, 3);
    }

    const scores = [ownershipScore, clarityScore, forwardScore];
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const ownershipBelowTwo = ownershipScore < 2;
    const autoFailTriggered = hasZero || onesCount >= 2 || ownershipBelowTwo;
    const repPassed = !autoFailTriggered && totalScore >= 4;

    const scoreLabel = (s) => s === 3 ? 'Strong' : s === 2 ? 'Adequate' : s === 1 ? 'Weak' : 'None';

    return {
      evaluationType: 'lwv_scored',
      repValidity: 'valid',
      conditions: {
        ownership_present: { score: ownershipScore, label: scoreLabel(ownershipScore), feedback: 'Assessed by system rules.' },
        statement_clarity: { score: clarityScore, label: scoreLabel(clarityScore), feedback: 'Assessed by system rules.' },
        forward_strength: { score: forwardScore, label: scoreLabel(forwardScore), feedback: 'Assessed by system rules.' }
      },
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? 'Automatic fail condition met' : null,
      totalScore,
      maxScore: 9,
      repPassed,
      coachingQuestions: [],
      meetsStandard: repPassed,
      isConstructive: true,
      assessedAt: new Date().toISOString(),
      assessedBy: 'rules',
      summary: repPassed ? 'Rep Passed' : 'Rep Not Passed'
    };
  },

  assessQualityWithAI: async (evidence, rep) => {
    try {
      const assessRepQuality = httpsCallable(functions, 'assessRepQuality');
      
      // SCE reps use structured situation-specific evidence
      if (rep.repType === 'set_clear_expectations' && evidence.sceEvidence) {
        const sce = evidence.sceEvidence;
        
        // Extract context from rep.situation if available
        let commitContext = '';
        if (typeof rep.situation === 'object' && rep.situation?.customContext) {
          commitContext = rep.situation.customContext;
        }

        const structured = {
          situation_branch: sce.situationBranch || '',
          commit_context: commitContext,
          sce_responses: sce.responses || {},
          self_assessment: evidence.selfAssessment?.responses || {},
          response_type: evidence.responseType || evidence.outcome || '',
          outcome: evidence.outcome || '',
          notes: evidence.notes || ''
        };
        
        const result = await assessRepQuality({
          repType: rep.repType,
          person: rep.person,
          structured
        });
        
        return result.data;
      }
      
      // DRF reps use structured feedback-specific evidence
      if (rep.repType === 'deliver_reinforcing_feedback' && evidence.drfEvidence) {
        const drf = evidence.drfEvidence;

        // Extract context from rep.situation if available
        let commitContext = '';
        if (typeof rep.situation === 'object' && rep.situation?.customContext) {
          commitContext = rep.situation.customContext;
        }

        const structured = {
          situation_branch: rep.situationType || '',
          commit_context: commitContext,
          drf_responses: drf.responses || {},
          self_assessment: evidence.selfAssessment?.responses || {},
          response_type: evidence.responseType || '',
          notes: evidence.notes || ''
        };
        
        const result = await assessRepQuality({
          repType: rep.repType,
          person: rep.person,
          structured
        });
        
        return result.data;
      }
      
      // FUW reps use structured follow-up evidence
      if (rep.repType === 'follow_up_work' && evidence.fuwEvidence) {
        const fuw = evidence.fuwEvidence;

        // Extract context from rep.situation if available
        let commitContext = '';
        if (typeof rep.situation === 'object' && rep.situation?.customContext) {
          commitContext = rep.situation.customContext;
        }

        const structured = {
          situation_branch: fuw.situationBranch || '',
          commit_context: commitContext,
          fuw_responses: fuw.responses || {},
          self_assessment: evidence.selfAssessment?.responses || {},
          response_type: evidence.responseType || '',
          notes: evidence.notes || ''
        };
        
        const result = await assessRepQuality({
          repType: rep.repType,
          person: rep.person,
          structured
        });
        
        return result.data;
      }
      
      // LWV reps use structured vulnerability evidence
      if (rep.repType === 'lead_with_vulnerability' && evidence.lwvEvidence) {
        const lwv = evidence.lwvEvidence;

        // Extract context from rep.situation if available
        let commitContext = '';
        if (typeof rep.situation === 'object' && rep.situation?.customContext) {
          commitContext = rep.situation.customContext;
        }

        const structured = {
          situation_branch: lwv.situationBranch || '',
          commit_context: commitContext,
          lwv_responses: lwv.responses || {},
          self_assessment: evidence.selfAssessment?.responses || {},
          response_type: evidence.responseType || '',
          notes: evidence.notes || ''
        };
        
        const result = await assessRepQuality({
          repType: rep.repType,
          person: rep.person,
          structured
        });
        
        return result.data;
      }
      
      // Generic V2 evidence mapping for all other rep types
      const structured = {
        what_said: evidence.whatYouSaid || evidence.responses?.what_said || '',
        their_response: evidence.howTheyResponded || evidence.responses?.their_response || '',
        response_type: evidence.responseType || evidence.outcome || '',
        outcome: evidence.outcome || '',
        what_went_well: evidence.reflection?.whatWentWell || '',
        what_different: evidence.reflection?.whatDifferent || '',
        reflection: [
          evidence.reflection?.whatWentWell || '',
          evidence.reflection?.whatDifferent || ''
        ].filter(Boolean).join(' | ')
      };
      
      const result = await assessRepQuality({
        repType: rep.repType,
        person: rep.person,
        responses: evidence.responses || {},
        structured
      });
      
      return result.data;
    } catch (err) {
      console.error('AI quality assessment failed, falling back to basic:', err);
      return conditioningService.assessQualityBasic(evidence, rep);
    }
  },
  
  /**
   * Main quality assessment function - uses AI by default
   * @deprecated Use assessQualityWithAI for async assessment
   */
  assessQuality: (evidence, rep) => {
    // Keep synchronous version for backward compatibility
    // This is just the basic assessment - async callers should use assessQualityWithAI
    return conditioningService.assessQualityBasic(evidence, rep);
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
    
    const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const practiceRetry = {
      id: retryId,
      originalRepId,
      targetDimension,
      status: 'pending',
      createdAt: serverTimestamp(),
      person: originalRep.person,
      repType: originalRep.repType,
      prompt: conditioningService.getPracticePrompt(targetDimension),
      response: null,
      completedAt: null
    };
    
    const retryRef = doc(db, 'users', userId, 'practice_retries', retryId);
    await setDoc(retryRef, practiceRetry);
    
    return retryId;
  },
  
  /**
   * Get coaching question prompt for a specific dimension
   * Uses questions to prompt reflection, not prescriptive examples
   */
  getPracticePrompt: (dimension) => {
    const prompts = {
      [QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE]: 
        'Think back to that moment. If you were watching a video replay, what exact words would you hear yourself saying?',
      [QUALITY_DIMENSIONS.OBSERVED_RESPONSE]:
        'How did they react when you finished? What did you notice about their body language, tone, or words?',
      // Legacy V1 dimensions (for backward compatibility)
      [QUALITY_DIMENSIONS.CLEAR_REQUEST]: 
        'What do you actually need from this person? How might you say that in a way that makes the ask crystal clear?',
      [QUALITY_DIMENSIONS.NAMED_COMMITMENT]: 
        'What would a real commitment sound like from them? What specific action and timeline would you want them to agree to?',
      [QUALITY_DIMENSIONS.REFLECTION]: 
        'What surprised you about how this went? If you could go back and do it again, what would you do differently and why?'
    };
    return prompts[dimension] || 'What did you notice about this dimension? Where could you grow?';
  },
  
  /**
   * Assess a practice response for a specific dimension
   * Returns { passed, feedback } for the dimension
   */
  /**
   * Assess a practice response using coaching philosophy
   * Responds with questions that prompt deeper thinking, not prescriptive answers
   */
  assessPracticeResponse: (dimension, response) => {
    const text = (response || '').trim();
    
    switch (dimension) {
      case QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE:
        if (text.length < 10) {
          return { passed: false, feedback: 'What exact words did you use? Can you hear yourself saying them?' };
        }
        if (/["']/.test(text) && text.length >= 20) {
          return { passed: true, feedback: 'You captured the specific language. What made you choose those words?' };
        }
        if (/["']/.test(text)) {
          return { passed: true, feedback: 'Good start with the quotes. What else do you remember saying?' };
        }
        if (text.length >= 30) {
          return { passed: false, feedback: 'Good detail. Can you put the exact phrase in quotes so it\'s clear what you said?' };
        }
        return { passed: false, feedback: 'Close your eyes and replay the moment. What words came out of your mouth?' };
      
      case QUALITY_DIMENSIONS.OBSERVED_RESPONSE:
        if (text.length < 5) {
          return { passed: false, feedback: 'How did they react? What did you notice?' };
        }
        if (text.length >= 15) {
          return { passed: true, feedback: 'Good observation. What did their response tell you about how it landed?' };
        }
        return { passed: false, feedback: 'Can you say more about how they responded? Body language, tone, words?' };
        
      case QUALITY_DIMENSIONS.CLEAR_REQUEST:
        if (text.length < 10) {
          return { passed: false, feedback: 'What specifically did you need them to do? What was the ask?' };
        }
        if (/ask|request|need you to|want you to|commit|will you|can you|would you|I('d| would) like/i.test(text) && text.length >= 20) {
          return { passed: true, feedback: 'Clear ask. How do you think it landed with them?' };
        }
        if (text.length >= 30) {
          return { passed: true, feedback: 'Good context. Was your request clear to them in the moment?' };
        }
        return { passed: false, feedback: 'If someone asked "what did you actually ask for?", what would you tell them?' };
        
      case QUALITY_DIMENSIONS.NAMED_COMMITMENT:
        if (text.length < 10) {
          return { passed: false, feedback: 'What commitment did you seek? Or did you choose not to ask for one?' };
        }
        if (/commit|by .*(monday|tuesday|wednesday|thursday|friday|end of|tomorrow|next week)/i.test(text)) {
          return { passed: true, feedback: 'Specific commitment with timeline. How confident are you they\'ll follow through?' };
        }
        if (/commit|agree|will do|promise|plan to/i.test(text) && text.length >= 20) {
          return { passed: true, feedback: 'You got a commitment. What would make you even more confident about follow-through?' };
        }
        if (/no commitment|chose not to|decided against|not appropriate/i.test(text)) {
          return { passed: true, feedback: 'You made a conscious choice about commitment. What drove that decision?' };
        }
        return { passed: false, feedback: 'Did they agree to anything specific? If not, why did you choose not to push for a commitment?' };
        
      case QUALITY_DIMENSIONS.REFLECTION: {
        if (text.length < 15) {
          return { passed: false, feedback: 'What surprised you? What would you do differently?' };
        }
        const hasReflectionKeywords = /next time|would do|differently|learned|realized|noticed|insight/i.test(text);
        if (hasReflectionKeywords && text.length >= 30) {
          return { passed: true, feedback: 'Thoughtful reflection. How will you remember this lesson next time the moment arrives?' };
        }
        if (text.length >= 40) {
          return { passed: true, feedback: 'Good depth. What\'s one thing you\'ll do differently in your next rep?' };
        }
        if (hasReflectionKeywords) {
          return { passed: false, feedback: 'Good start. Can you get more specific about what you\'d change?' };
        }
        return { passed: false, feedback: 'Think about this: if you replayed this moment, what would you do differently and why?' };
      }
        
      default:
        return { passed: text.length >= 20, feedback: text.length >= 20 ? 'Noted. What else comes to mind?' : 'Can you say more?' };
    }
  },

  /**
   * Complete a practice retry
   */
  completePracticeRetry: async (db, userId, retryId, response, assessment = null) => {
    const retryRef = doc(db, 'users', userId, 'practice_retries', retryId);
    
    await updateDoc(retryRef, {
      status: 'completed',
      response: response.trim(),
      assessment: assessment || null,
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
        const completedDay = (r.completedAt?.toDate?.() || new Date(r.completedAt)).getDay();
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
  },

  // =============================================
  // FACILITATOR FEEDBACK
  // Advisory feedback on individual reps — does not gate sign-off
  // Stored as facilitatorFeedback field on rep document
  // =============================================

  saveFacilitatorFeedback: async (db, userId, repId, feedbackData) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const feedback = {
      facilitatorId: feedbackData.facilitatorId,
      facilitatorEmail: feedbackData.facilitatorEmail,
      strength: feedbackData.strength || '',
      improvement: feedbackData.improvement || '',
      nextRepSuggestion: feedbackData.nextRepSuggestion || '',
      status: 'sent',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewedAt: null,
      acknowledgedAt: null,
      leaderResponse: null,
    };
    await updateDoc(repRef, { facilitatorFeedback: feedback });
    return feedback;
  },

  getFacilitatorFeedback: async (db, userId, repId) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    const repSnap = await getDoc(repRef);
    if (!repSnap.exists()) return null;
    return repSnap.data().facilitatorFeedback || null;
  },

  markFeedbackViewed: async (db, userId, repId) => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    await updateDoc(repRef, {
      'facilitatorFeedback.status': 'viewed',
      'facilitatorFeedback.viewedAt': serverTimestamp(),
    });
  },

  markFeedbackAcknowledged: async (db, userId, repId, response = '') => {
    const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
    await updateDoc(repRef, {
      'facilitatorFeedback.status': 'acknowledged',
      'facilitatorFeedback.acknowledgedAt': serverTimestamp(),
      'facilitatorFeedback.leaderResponse': response,
    });
  },
};

export default conditioningService;
