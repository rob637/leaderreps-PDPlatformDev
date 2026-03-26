// src/components/conditioning/PlannedRepForm.jsx
// V2 Planned Rep commitment flow - 5 steps (Known Next Step)
// Step 1: What Real Rep, Step 2: Who's it with, Step 3: Where, Step 4: Intent Lock + Time, Step 5: Commitment Lock
// Supports draft auto-save and resume functionality

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../ui';
import ConditioningModal from './ConditioningModal';
import RepTypePickerV2 from './RepTypePickerV2';
import SituationStep from './SituationStep';
import { BehaviorFocusReminder, ActiveRepReminder } from './BehaviorFocusReminder';
import VoiceTextarea from './VoiceTextarea';
import { getRepTypeV2 } from '../../services/repTaxonomy';
import { getWeekBoundaries } from '../../services/conditioningService';
import { DRAFT_FLOW_TYPES } from '../../services/draftRepService';
import { formatDisplayDate } from '../../services/dateUtils';
import { timeService } from '../../services/timeService';
import useDraftAutoSave from '../../hooks/useDraftAutoSave';
import { Timestamp } from 'firebase/firestore';

// ============================================
// STEP CONFIGURATION
// ============================================
const TOTAL_STEPS = 5;
const STEP_LABELS = ['Rep Type', 'With', 'Situation', 'When', 'Commit'];

// ============================================
// MAIN FORM COMPONENT
// ============================================
const PlannedRepForm = ({ 
  onSubmit, 
  onClose, 
  isLoading,
  // Session-based unlocking (primary)
  sessionAttendance = null,
  // Milestone-based unlocking props (legacy fallback)
  milestoneProgress = {},
  completedRepTypes = [],
  // Optional: preselected rep type (from action item click)
  preselectedRepType = null,
  // Optional: initial draft data for resuming
  initialDraft = null,
  // Optional: source item ID for tracking
  sourceItemId = null,
  // Optional: disable auto-save (e.g., for quick flows)
  disableAutoSave = false
}) => {
  // Initialize form state from draft if available
  const draftFormData = initialDraft?.formData || {};
  const draftStep = initialDraft?.currentStep ?? null;
  
  // Form state - use initialDraft > preselectedRepType > null
  const [repTypeId, setRepTypeId] = useState(
    draftFormData.repTypeId || preselectedRepType || null
  );
  const [selectedCategory, setSelectedCategory] = useState(
    draftFormData.selectedCategory || null
  );
  const [person, setPerson] = useState(draftFormData.person || '');
  const [selectedSituation, setSelectedSituation] = useState(
    draftFormData.selectedSituation || null
  );
  const [customContext, setCustomContext] = useState(
    draftFormData.customContext || ''
  );
  const [useEndOfWeek, setUseEndOfWeek] = useState(
    draftFormData.useEndOfWeek ?? true
  );
  const [customDeadline, setCustomDeadline] = useState(
    draftFormData.customDeadline || ''
  );
  const [notes, setNotes] = useState(draftFormData.notes || '');
  
  // Step tracking - use draft step if resuming, else step 1 if rep type is preselected
  const initialStep = draftStep !== null 
    ? draftStep 
    : (preselectedRepType ? 1 : 0);
  const [currentStep, setCurrentStep] = useState(initialStep);
  // eslint-disable-next-line no-unused-vars
  const [visitedSteps, setVisitedSteps] = useState(
    new Set(Array.from({ length: initialStep + 1 }, (_, i) => i))
  );
  const [nextAttempted, setNextAttempted] = useState(false);
  
  const personInputRef = useRef(null);
  
  // Get selected rep type info
  const selectedRepType = useMemo(() => {
    return repTypeId ? getRepTypeV2(repTypeId) : null;
  }, [repTypeId]);
  
  // Create form data object for auto-save
  const formData = useMemo(() => ({
    repTypeId,
    selectedCategory,
    person,
    selectedSituation,
    customContext,
    useEndOfWeek,
    customDeadline,
    notes
  }), [repTypeId, selectedCategory, person, selectedSituation, customContext, useEndOfWeek, customDeadline, notes]);
  
  // Auto-save draft as user progresses through form
  const { clearDraft } = useDraftAutoSave({
    flowType: DRAFT_FLOW_TYPES.PLANNED,
    currentStep,
    formData,
    sourceItemId,
    preselectedRepType,
    enabled: !disableAutoSave
  });
  
  // Calculate deadline dates
  const today = new Date().toISOString().split('T')[0];
  const { weekEnd } = getWeekBoundaries();
  const maxDeadline = new Date();
  maxDeadline.setDate(maxDeadline.getDate() + 14);
  const maxDeadlineStr = maxDeadline.toISOString().split('T')[0];

  // Step validation
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: return !!repTypeId;
      case 1: return person.trim().length > 0;
      case 2: {
        // Must select a situation
        if (!selectedSituation) return false;
        // If "Something else", must provide context
        if (selectedSituation === 'something_else' && !customContext.trim()) return false;
        return true;
      }
      case 3: return true; // When step is always valid (has default)
      case 4: return true; // Commit step is always valid if we got here
      default: return true;
    }
  }, [currentStep, repTypeId, person, selectedSituation, customContext]);

  // Navigation handlers
  const handleNext = () => {
    if (!isStepValid) {
      setNextAttempted(true);
      return;
    }
    
    if (currentStep < TOTAL_STEPS - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps(prev => new Set([...prev, nextStep]));
      setNextAttempted(false);
      
      // Scroll modal to top
      setTimeout(() => {
        const modalBody = document.querySelector('[data-modal-body="true"]');
        if (modalBody) modalBody.scrollTop = 0;
      }, 50);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 0) {
      // On step 0, handle internal picker navigation
      if (selectedCategory) {
        setSelectedCategory(null);
        setRepTypeId(null);
      }
      return;
    }
    setCurrentStep(prev => prev - 1);
  };

  // Auto-focus person input when reaching step 1
  useEffect(() => {
    if (currentStep === 1 && personInputRef.current) {
      setTimeout(() => {
        personInputRef.current?.focus({ preventScroll: true });
      }, 150);
    }
  }, [currentStep]);
  
  // Handle rep type selection (auto-advance on first selection)
  const handleRepTypeSelect = (id) => {
    const isFirstSelection = !repTypeId;
    setRepTypeId(id);
    setNextAttempted(false);
    
    if (isFirstSelection && id) {
      // Auto-advance to step 1 (Who)
      setCurrentStep(1);
      setVisitedSteps(prev => new Set([...prev, 1]));
      setTimeout(() => {
        const modalBody = document.querySelector('[data-modal-body="true"]');
        if (modalBody) modalBody.scrollTop = 0;
      }, 50);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (isLoading) return;
    
    // Calculate deadline
    const deadline = useEndOfWeek 
      ? Timestamp.fromDate(weekEnd)
      : customDeadline 
        ? Timestamp.fromDate(new Date(customDeadline + 'T23:59:59'))
        : Timestamp.fromDate(weekEnd);
    
    // Check if this is a RED rep
    const isRedRep = repTypeId === 'deliver_redirecting_feedback';
    
    const repData = {
      repType: repTypeId,
      person: person.trim(),
      commitmentType: 'planned',
      situation: {
        selected: selectedSituation,
        customContext: customContext.trim(),
        isRequired: selectedSituation === 'something_else'
      },
      deadline,
      notes: notes.trim() || null
    };
    
    // For RED reps, store scenario type which seeds intensity level
    if (isRedRep) {
      repData.scenario = selectedSituation; // one_time, repeated, team, high_stakes
      repData.situation = {
        selected: selectedSituation,
        customContext: customContext.trim(),
        isScenario: true // Flag to indicate this is a scenario, not a situation
      };
    }
    
    // Submit the rep
    await onSubmit(repData);
    
    // Clear the draft on successful submission
    await clearDraft();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <RepTypePickerV2
            selectedRepTypeId={repTypeId}
            onSelect={handleRepTypeSelect}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            headerText="Select the type of Real Rep"
            sessionAttendance={sessionAttendance}
            milestoneProgress={milestoneProgress}
            completedRepTypes={completedRepTypes}
          />
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Who will you complete this rep with?
            </label>
            <input
              ref={personInputRef}
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Enter their name..."
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
            />
            {nextAttempted && !isStepValid && (
              <p className="text-sm text-corporate-orange">Please enter a name</p>
            )}
          </div>
        );
        
      case 2:
        return (
          <SituationStep
            repTypeId={repTypeId}
            selectedSituation={selectedSituation}
            customContext={customContext}
            onSituationChange={setSelectedSituation}
            onCustomContextChange={setCustomContext}
            promptText="Which best describes this situation?"
            isInMoment={false}
            error={nextAttempted && !isStepValid ? 'Please select a situation' : null}
          />
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              When do you need to complete this rep?
            </label>
            
            {/* Time travel warning */}
            {timeService.isActive() && (
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                ⚠️ Time travel active: showing dates based on {timeService.getNow().toLocaleDateString()}
              </div>
            )}
            
            {/* Default: End of week */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
              <input
                type="radio"
                checked={useEndOfWeek}
                onChange={() => setUseEndOfWeek(true)}
                className="text-corporate-teal"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  End of week
                </span>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {formatDisplayDate(weekEnd)}
                </p>
              </div>
            </label>
            
            {/* Custom date option */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
              <input
                type="radio"
                checked={!useEndOfWeek}
                onChange={() => setUseEndOfWeek(false)}
                className="text-corporate-teal"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                Set a specific date
              </span>
            </label>
            
            {!useEndOfWeek && (
              <input
                type="date"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                min={today}
                max={maxDeadlineStr}
                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 bg-white text-slate-900 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
              />
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">Rep Type</span>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {selectedRepType?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">With</span>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {person || 'Solo Rep'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">Due</span>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {useEndOfWeek 
                    ? formatDisplayDate(weekEnd)
                    : customDeadline 
                      ? formatDisplayDate(new Date(customDeadline + 'T12:00:00'))
                      : 'End of week'
                  }
                </span>
              </div>
            </div>
            
            {/* Behavior Focus Reminder */}
            <BehaviorFocusReminder repTypeId={repTypeId} />
            
            {/* Active Rep Reminder (if applicable) */}
            <ActiveRepReminder repTypeId={repTypeId} />
            
            {/* Optional notes */}
            <VoiceTextarea
              id="commit-notes"
              label="Additional notes (optional)"
              value={notes}
              onChange={setNotes}
              placeholder="Any other context for this rep..."
              rows={2}
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Commit to your Real Rep"
      subtitle={selectedRepType ? selectedRepType.label : 'What Real Rep will you own?'}
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      stepLabels={STEP_LABELS}
      footer={
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0 && !selectedCategory && !repTypeId}
            variant="outline"
          >
            Previous
          </Button>
          
          {currentStep < TOTAL_STEPS - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid}
              className="bg-corporate-teal hover:bg-corporate-teal/90 text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-corporate-teal hover:bg-corporate-teal/90 text-white"
            >
              {isLoading ? 'Committing...' : 'Commit to the Rep'}
            </Button>
          )}
        </div>
      }
    >
      {renderStepContent()}
    </ConditioningModal>
  );
};

export default PlannedRepForm;
