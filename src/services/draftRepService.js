// src/services/draftRepService.js
// Draft Rep Service - Manages saving/loading in-progress rep form state
// Allows users to resume rep commitment flows where they left off
//
// Data Model:
// /users/{uid}/rep_drafts/{draftId}
//   - id: string (draft_planned_repType OR draft_planned for generic)
//   - flowType: 'planned' | 'in_moment'
//   - repType: string (optional - the rep type being worked on)
//   - currentStep: number
//   - formData: {...} (all form field values)
//   - sourceItemId?: string (if opened from milestone action item)
//   - createdAt: Timestamp
//   - updatedAt: Timestamp
//
// Draft IDs:
// - With rep type: draft_planned_set_clear_expectations
// - Without (generic): draft_planned

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';

// ============================================
// CONSTANTS
// ============================================

export const DRAFT_FLOW_TYPES = {
  PLANNED: 'planned',
  IN_MOMENT: 'in_moment',
  EVIDENCE: 'evidence'  // For evidence capture wizard state
};

// Max drafts to keep per user (oldest get cleaned up)
const MAX_DRAFTS_PER_USER = 15; // Supports multiple rep types AND multiple sources

/**
 * Generate draft ID
 * Draft ID structure allows multiple concurrent drafts:
 * - With sourceItemId (from Dashboard action): draft_planned_set_clear_expectations_action123
 * - Without sourceItemId (from Conditioning): draft_planned_set_clear_expectations
 * - Generic (no repType yet): draft_planned
 * 
 * @param {string} flowType - 'planned' or 'in_moment'
 * @param {string} repType - Optional rep type (e.g., 'set_clear_expectations')
 * @param {string} sourceItemId - Optional source item ID (from Dashboard action)
 * @returns {string} Draft document ID
 */
const getDraftId = (flowType, repType = null, sourceItemId = null) => {
  let id = `draft_${flowType}`;
  if (repType) {
    id += `_${repType}`;
  }
  if (sourceItemId) {
    // Append source to distinguish Dashboard action drafts from Conditioning generic drafts
    id += `_${sourceItemId}`;
  }
  return id;
};

// ============================================
// DRAFT OPERATIONS
// ============================================

/**
 * Save or update a draft rep
 * Draft is uniquely identified by: flowType + repType + sourceItemId
 * This allows:
 * - Different rep types to have separate drafts
 * - Same rep type from Dashboard vs Conditioning to be separate
 * - Multiple Dashboard actions of same type to be separate (different sourceItemId)
 */
export const saveDraft = async (db, userId, flowType, draftData) => {
  if (!userId) throw new Error('User ID required');
  if (!flowType) throw new Error('Flow type required');
  if (!Object.values(DRAFT_FLOW_TYPES).includes(flowType)) {
    throw new Error(`Invalid flow type: ${flowType}`);
  }

  // Determine repType from preselect or form data
  const repType = draftData.preselectedRepType || draftData.formData?.repTypeId || null;
  // sourceItemId distinguishes Dashboard action drafts from Conditioning generic drafts
  const sourceItemId = draftData.sourceItemId || null;
  
  const draftId = getDraftId(flowType, repType, sourceItemId);
  const draftRef = doc(db, 'users', userId, 'rep_drafts', draftId);
  
  // Check if draft already exists
  const existingSnap = await getDoc(draftRef);
  const isNew = !existingSnap.exists();
  
  const draftDoc = {
    id: draftId,
    flowType,
    repType, // Store repType at top level for easier querying
    sourceItemId, // Store sourceItemId for lookup
    currentStep: draftData.currentStep ?? 0,
    formData: draftData.formData ?? {},
    ...(draftData.preselectedRepType && { preselectedRepType: draftData.preselectedRepType }),
    updatedAt: serverTimestamp(),
    ...(isNew && { createdAt: serverTimestamp() })
  };
  
  await setDoc(draftRef, draftDoc, { merge: true });
  
  return draftId;
};

/**
 * Get a specific draft by flow type, rep type, and optional source item ID
 * @param {Firestore} db
 * @param {string} userId
 * @param {string} flowType - 'planned' or 'in_moment'
 * @param {string} repType - Optional rep type for specific lookup
 * @param {string} sourceItemId - Optional source item ID (for Dashboard action drafts)
 */
export const getDraft = async (db, userId, flowType, repType = null, sourceItemId = null) => {
  if (!userId) return null;
  
  const draftId = getDraftId(flowType, repType, sourceItemId);
  const draftRef = doc(db, 'users', userId, 'rep_drafts', draftId);
  const draftSnap = await getDoc(draftRef);
  
  if (!draftSnap.exists()) return null;
  
  return { id: draftSnap.id, ...draftSnap.data() };
};

/**
 * Get a draft by rep type and source item ID
 * Searches both planned and in_moment flows
 * @param {Firestore} db
 * @param {string} userId
 * @param {string} repType - The rep type to look for
 * @param {string} sourceItemId - Optional source item ID (for Dashboard action drafts)
 */
export const getDraftByRepType = async (db, userId, repType, sourceItemId = null) => {
  if (!userId || !repType) return null;
  
  // Try planned first (most common)
  const plannedDraft = await getDraft(db, userId, DRAFT_FLOW_TYPES.PLANNED, repType, sourceItemId);
  if (plannedDraft) return plannedDraft;
  
  // Try in_moment
  const inMomentDraft = await getDraft(db, userId, DRAFT_FLOW_TYPES.IN_MOMENT, repType, sourceItemId);
  if (inMomentDraft) return inMomentDraft;
  
  return null;
};

/**
 * Get all active drafts for a user
 * Returns array sorted by most recently updated
 */
export const getAllDrafts = async (db, userId) => {
  if (!userId) return [];
  
  const draftsRef = collection(db, 'users', userId, 'rep_drafts');
  const q = query(draftsRef, orderBy('updatedAt', 'desc'), limit(MAX_DRAFTS_PER_USER));
  
  const snapshot = await getDocs(q);
  const drafts = [];
  
  snapshot.forEach(docSnap => {
    drafts.push({ id: docSnap.id, ...docSnap.data() });
  });
  
  return drafts;
};


/**
 * Subscribe to all active drafts for a user
 * Returns array sorted by most recently updated
 */
export const subscribeToDrafts = (db, userId, callback) => {
  if (!userId) {
    if (callback) callback([]);
    return () => {};
  }
  
  const draftsRef = collection(db, 'users', userId, 'rep_drafts');
  // Order by update time to show most recent first
  const q = query(draftsRef, orderBy('updatedAt', 'desc'), limit(MAX_DRAFTS_PER_USER));
  
  return onSnapshot(q, (snapshot) => {
    const drafts = [];
    snapshot.forEach(docSnap => {
      drafts.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(drafts);
  });
};

/**
 * Delete a draft (typically after successful submission)
 * @param {Firestore} db
 * @param {string} userId
 * @param {string} flowType - 'planned' or 'in_moment'
 * @param {string} repType - Optional rep type for specific draft deletion
 * @param {string} sourceItemId - Optional source item ID (for Dashboard action drafts)
 */
export const deleteDraft = async (db, userId, flowType, repType = null, sourceItemId = null) => {
  if (!userId) return;
  
  const draftId = getDraftId(flowType, repType, sourceItemId);
  const draftRef = doc(db, 'users', userId, 'rep_drafts', draftId);
  
  try {
    await deleteDoc(draftRef);
  } catch (err) {
    console.warn('Failed to delete draft:', err);
    // Non-critical error - don't throw
  }
};

/**
 * Delete a draft by rep type and optional source item ID (deletes from both flow types if exists)
 * @param {string} sourceItemId - Optional source item ID (for Dashboard action drafts)
 */
export const deleteDraftByRepType = async (db, userId, repType, sourceItemId = null) => {
  if (!userId || !repType) return;
  
  // Delete from both flow types
  await Promise.all([
    deleteDraft(db, userId, DRAFT_FLOW_TYPES.PLANNED, repType, sourceItemId),
    deleteDraft(db, userId, DRAFT_FLOW_TYPES.IN_MOMENT, repType, sourceItemId)
  ]);
};

/**
 * Delete all drafts for a user
 */
export const deleteAllDrafts = async (db, userId) => {
  if (!userId) return;
  
  const drafts = await getAllDrafts(db, userId);
  
  await Promise.all(
    drafts.map(draft => {
      const draftRef = doc(db, 'users', userId, 'rep_drafts', draft.id);
      return deleteDoc(draftRef);
    })
  );
};

// ============================================
// FORM DATA HELPERS
// ============================================

/**
 * Extract form data from PlannedRepForm state
 */
export const extractPlannedFormData = (formState) => ({
  repTypeId: formState.repTypeId || null,
  selectedCategory: formState.selectedCategory || null,
  person: formState.person || '',
  selectedSituation: formState.selectedSituation || null,
  customContext: formState.customContext || '',
  useEndOfWeek: formState.useEndOfWeek ?? true,
  customDeadline: formState.customDeadline || '',
  notes: formState.notes || ''
});

/**
 * Extract form data from InMomentRepForm state
 */
export const extractInMomentFormData = (formState) => ({
  repTypeId: formState.repTypeId || null,
  selectedCategory: formState.selectedCategory || null,
  person: formState.person || '',
  selectedSituation: formState.selectedSituation || null,
  customContext: formState.customContext || '',
  whenOption: formState.whenOption || 'just_now',
  specificDate: formState.specificDate || '',
  specificTime: formState.specificTime || ''
});

// ============================================
// EVIDENCE CAPTURE DRAFT OPERATIONS
// ============================================

/**
 * Save evidence capture wizard state
 * Keyed by repId since each committed rep is unique
 * @param {Firestore} db
 * @param {string} userId
 * @param {string} repId - The committed rep being captured
 * @param {Object} evidenceState - Current wizard state
 */
export const saveEvidenceDraft = async (db, userId, repId, evidenceState) => {
  if (!userId || !repId) return;
  
  const draftId = `evidence_${repId}`;
  const draftRef = doc(db, 'users', userId, 'rep_drafts', draftId);
  
  const existingSnap = await getDoc(draftRef);
  const isNew = !existingSnap.exists();
  
  const draftDoc = {
    id: draftId,
    flowType: DRAFT_FLOW_TYPES.EVIDENCE,
    repId,
    currentScreen: evidenceState.currentScreen ?? 1,
    formData: {
      whatHappened: evidenceState.whatHappened || '',
      sceResponses: evidenceState.sceResponses || {},
      drfResponses: evidenceState.drfResponses || {},
      selfAssessmentResponses: evidenceState.selfAssessmentResponses || {},
      response: evidenceState.response || null,
      pushbackLogOption: evidenceState.pushbackLogOption || null,
      pushbackResponses: evidenceState.pushbackResponses || [],
      pushbackNote: evidenceState.pushbackNote || '',
      closeLoopOption: evidenceState.closeLoopOption || null,
      closeLoopLogOption: evidenceState.closeLoopLogOption || null,
      behaviorChange: evidenceState.behaviorChange || null,
      behaviorChangeNote: evidenceState.behaviorChangeNote || '',
      notes: evidenceState.notes || '',
      artifacts: evidenceState.artifacts || [],
      outcome: evidenceState.outcome || null,
      whatWentWell: evidenceState.whatWentWell || '',
      whatDifferent: evidenceState.whatDifferent || '',
      completeLoopResponses: evidenceState.completeLoopResponses || {}
    },
    updatedAt: serverTimestamp(),
    ...(isNew && { createdAt: serverTimestamp() })
  };
  
  await setDoc(draftRef, draftDoc, { merge: true });
  return draftId;
};

/**
 * Get evidence capture draft for a specific rep
 * @param {Firestore} db
 * @param {string} userId
 * @param {string} repId - The committed rep ID
 */
export const getEvidenceDraft = async (db, userId, repId) => {
  if (!userId || !repId) return null;
  
  const draftId = `evidence_${repId}`;
  const draftRef = doc(db, 'users', userId, 'rep_drafts', draftId);
  const draftSnap = await getDoc(draftRef);
  
  if (!draftSnap.exists()) return null;
  
  return { id: draftSnap.id, ...draftSnap.data() };
};

/**
 * Delete evidence capture draft (after successful submission)
 * @param {Firestore} db
 * @param {string} userId
 * @param {string} repId - The committed rep ID
 */
export const deleteEvidenceDraft = async (db, userId, repId) => {
  if (!userId || !repId) return;
  
  const draftId = `evidence_${repId}`;
  const draftRef = doc(db, 'users', userId, 'rep_drafts', draftId);
  
  try {
    await deleteDoc(draftRef);
  } catch (err) {
    console.warn('Failed to delete evidence draft:', err);
  }
};

/**
 * Check if evidence draft has meaningful progress
 */
export const hasEvidenceProgress = (draft) => {
  if (!draft?.formData) return false;
  
  const { formData, currentScreen } = draft;
  
  // Past screen 1, user has made progress
  if (currentScreen > 1) return true;
  
  // Any text input filled = progress
  if (formData.whatHappened?.trim()) return true;
  if (formData.notes?.trim()) return true;
  if (formData.whatWentWell?.trim()) return true;
  if (formData.whatDifferent?.trim()) return true;
  
  // Structured responses filled = progress
  if (Object.keys(formData.sceResponses || {}).length > 0) return true;
  if (Object.keys(formData.drfResponses || {}).length > 0) return true;
  if (Object.keys(formData.selfAssessmentResponses || {}).length > 0) return true;
  
  // Any selection made = progress
  if (formData.response) return true;
  if (formData.outcome) return true;
  
  return false;
};

/**
 * Check if a draft has meaningful progress worth resuming
 * Returns false if draft is essentially empty (just opened, not filled)
 */
export const hasMeaningfulProgress = (draft) => {
  if (!draft?.formData) return false;
  
  const { formData, currentStep } = draft;
  
  // If past step 0, user has made progress
  if (currentStep > 0) return true;
  
  // If on step 0 but selected a rep type, that's progress
  if (formData.repTypeId) return true;
  
  // If person is filled in, that's progress
  if (formData.person?.trim()) return true;
  
  // Otherwise, draft is effectively empty
  return false;
};

/**
 * Get a human-readable summary of a draft for display
 */
export const getDraftSummary = (draft) => {
  if (!draft) return null;
  
  const { flowType, formData, currentStep, sourceItemId, repType } = draft;
  const totalSteps = flowType === DRAFT_FLOW_TYPES.PLANNED ? 5 : 4;
  const stepLabels = flowType === DRAFT_FLOW_TYPES.PLANNED 
    ? ['Type', 'Who', 'Situation', 'When', 'Commit']
    : ['Type', 'Who', 'Situation', 'When'];
  
  return {
    flowType,
    flowLabel: flowType === DRAFT_FLOW_TYPES.PLANNED ? 'Planned Rep' : 'In-the-Moment Rep',
    currentStep,
    totalSteps,
    currentStepLabel: stepLabels[currentStep] || 'Unknown',
    progress: Math.round((currentStep / (totalSteps - 1)) * 100),
    repTypeId: repType || formData?.repTypeId,
    person: formData?.person || null,
    sourceItemId: sourceItemId || null, // Non-null means it came from a Dashboard action
    isFromDashboard: !!sourceItemId,
    hasMeaningfulProgress: hasMeaningfulProgress(draft)
  };
};

// ============================================
// SERVICE EXPORT
// ============================================

const draftRepService = {
  saveDraft,
  getDraft,
  getDraftByRepType,
  getAllDrafts,
  subscribeToDrafts,
  deleteDraft,
  deleteDraftByRepType,
  deleteAllDrafts,
  extractPlannedFormData,
  extractInMomentFormData,
  hasMeaningfulProgress,
  getDraftSummary,
  // Evidence capture drafts
  saveEvidenceDraft,
  getEvidenceDraft,
  deleteEvidenceDraft,
  hasEvidenceProgress,
  DRAFT_FLOW_TYPES
};

export default draftRepService;
