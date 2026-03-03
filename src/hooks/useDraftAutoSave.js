// src/hooks/useDraftAutoSave.js
// Hook for auto-saving rep form drafts
// Saves progress on step changes and debounced field changes

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppServices } from '../services/useAppServices';
import draftRepService, { DRAFT_FLOW_TYPES } from '../services/draftRepService';

// Debounce delay for field change saves (ms)
const SAVE_DEBOUNCE_MS = 1500;

/**
 * Hook for auto-saving rep form drafts
 * 
 * @param {Object} options
 * @param {string} options.flowType - 'planned' or 'in_moment'
 * @param {number} options.currentStep - Current form step
 * @param {Object} options.formData - Current form field values
 * @param {string} options.sourceItemId - Optional source item ID
 * @param {string} options.preselectedRepType - Optional preselected rep type
 * @param {boolean} options.enabled - Whether auto-save is enabled (default: true)
 * @returns {Object} { saveDraft, clearDraft, isSaving }
 */
const useDraftAutoSave = ({
  flowType,
  currentStep,
  formData,
  sourceItemId = null,
  preselectedRepType = null,
  enabled = true
}) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isSavingRef = useRef(false);
  
  // Validate flow type
  const isValidFlowType = useMemo(() => {
    return Object.values(DRAFT_FLOW_TYPES).includes(flowType);
  }, [flowType]);
  
  // Save draft immediately
  const saveDraft = useCallback(async () => {
    if (!enabled || !userId || !db || !isValidFlowType) return;
    if (isSavingRef.current) return; // Prevent concurrent saves
    
    try {
      isSavingRef.current = true;
      
      await draftRepService.saveDraft(db, userId, flowType, {
        currentStep,
        formData,
        sourceItemId,
        preselectedRepType
      });
      
      lastSavedRef.current = JSON.stringify({ currentStep, formData });
    } catch (err) {
      console.warn('Draft auto-save failed:', err);
      // Non-critical - don't throw
    } finally {
      isSavingRef.current = false;
    }
  }, [enabled, userId, db, flowType, isValidFlowType, currentStep, formData, sourceItemId, preselectedRepType]);
  
  // Clear/delete draft
  const clearDraft = useCallback(async () => {
    if (!userId || !db || !isValidFlowType) return;
    
    // Use the same repType and sourceItemId logic as saveDraft for consistent draft ID
    const repType = preselectedRepType || formData?.repTypeId || null;
    
    try {
      await draftRepService.deleteDraft(db, userId, flowType, repType, sourceItemId);
      lastSavedRef.current = null;
    } catch (err) {
      console.warn('Draft delete failed:', err);
    }
  }, [userId, db, flowType, isValidFlowType, preselectedRepType, formData?.repTypeId, sourceItemId]);
  
  // Debounced save on form data change
  useEffect(() => {
    if (!enabled || !userId || !db || !isValidFlowType) return;
    
    // Check if data actually changed
    const currentData = JSON.stringify({ currentStep, formData });
    if (currentData === lastSavedRef.current) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, SAVE_DEBOUNCE_MS);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, userId, db, isValidFlowType, currentStep, formData, saveDraft]);
  
  // Save immediately on step change
  const lastStepRef = useRef(currentStep);
  useEffect(() => {
    if (!enabled || !userId || !db || !isValidFlowType) return;
    if (currentStep === lastStepRef.current) return;
    
    lastStepRef.current = currentStep;
    
    // Clear debounce timeout and save immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveDraft();
  }, [enabled, userId, db, isValidFlowType, currentStep, saveDraft]);
  
  // Cleanup on unmount - save final state
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Note: Can't await in cleanup, but saveDraft handles concurrency
    };
  }, []);
  
  return {
    saveDraft,
    clearDraft,
    isSaving: isSavingRef.current
  };
};

export default useDraftAutoSave;
