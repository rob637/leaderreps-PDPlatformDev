// src/components/conditioning/InMomentRepForm.jsx
// V2 In-the-Moment Rep flow - 4 steps (Don't Know | Found Myself In)
// Step 1: I'm in a moment right now (select rep), Step 2: It's with..., Step 3: Where is this happening, Step 4: Execute
// Supports draft auto-save and resume functionality

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../ui';
import ConditioningModal from './ConditioningModal';
import RepTypePickerV2 from './RepTypePickerV2';
import SituationStep from './SituationStep';
import { BehaviorFocusReminder } from './BehaviorFocusReminder';
import { getRepTypeV2 } from '../../services/repTaxonomy';
import { DRAFT_FLOW_TYPES } from '../../services/draftRepService';
import useDraftAutoSave from '../../hooks/useDraftAutoSave';
import { Timestamp } from 'firebase/firestore';

// ============================================
// STEP CONFIGURATION
// ============================================
const TOTAL_STEPS = 4;
const STEP_LABELS = ['Rep Type', 'With', 'Situation', 'When'];

// ============================================
// WHEN OPTIONS
// ============================================
const WHEN_OPTIONS = [
  { id: 'just_now', label: 'Just now', description: 'Within the last hour' },
  { id: 'earlier_today', label: 'Earlier today', description: null },
  { id: 'yesterday', label: 'Yesterday', description: null },
  { id: 'specific', label: 'Specific date/time', description: null }
];

// ============================================
// MAIN FORM COMPONENT
// ============================================
const InMomentRepForm = ({ 
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
  // Optional: disable auto-save
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
  const [whenOption, setWhenOption] = useState(
    draftFormData.whenOption || 'just_now'
  );
  const [specificDate, setSpecificDate] = useState(
    draftFormData.specificDate || ''
  );
  const [specificTime, setSpecificTime] = useState(
    draftFormData.specificTime || ''
  );
  
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
  
  // Create form data object for auto-save
  const formData = useMemo(() => ({
    repTypeId,
    selectedCategory,
    person,
    selectedSituation,
    customContext,
    whenOption,
    specificDate,
    specificTime
  }), [repTypeId, selectedCategory, person, selectedSituation, customContext, whenOption, specificDate, specificTime]);
  
  // Auto-save draft as user progresses through form
  const { clearDraft } = useDraftAutoSave({
    flowType: DRAFT_FLOW_TYPES.IN_MOMENT,
    currentStep,
    formData,
    sourceItemId,
    preselectedRepType,
    enabled: !disableAutoSave
  });
  
  // Get selected rep type info
  const selectedRepType = useMemo(() => {
    return repTypeId ? getRepTypeV2(repTypeId) : null;
  }, [repTypeId]);
  
  // Calculate date constraints
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const minDate = oneWeekAgo.toISOString().split('T')[0];

  // Step validation
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: return !!repTypeId;
      case 1: return person.trim().length > 0;
      case 2: {
        if (!selectedSituation) return false;
        if (selectedSituation === 'something_else' && !customContext.trim()) return false;
        return true;
      }
      case 3: {
        // Specific requires date
        if (whenOption === 'specific' && !specificDate) return false;
        return true;
      }
      default: return true;
    }
  }, [currentStep, repTypeId, person, selectedSituation, customContext, whenOption, specificDate]);

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
      
      setTimeout(() => {
        const modalBody = document.querySelector('[data-modal-body="true"]');
        if (modalBody) modalBody.scrollTop = 0;
      }, 50);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 0) {
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
  
  // Handle rep type selection
  const handleRepTypeSelect = (id) => {
    const isFirstSelection = !repTypeId;
    setRepTypeId(id);
    setNextAttempted(false);
    
    if (isFirstSelection && id) {
      setCurrentStep(1);
      setVisitedSteps(prev => new Set([...prev, 1]));
      setTimeout(() => {
        const modalBody = document.querySelector('[data-modal-body="true"]');
        if (modalBody) modalBody.scrollTop = 0;
      }, 50);
    }
  };
  
  // Calculate occurrence timestamp
  const getOccurredAt = () => {
    const now = new Date();
    
    switch (whenOption) {
      case 'just_now':
        return Timestamp.fromDate(now);
      case 'earlier_today': {
        // Set to 9 AM today as approximation
        const earlierToday = new Date(now);
        earlierToday.setHours(9, 0, 0, 0);
        return Timestamp.fromDate(earlierToday);
      }
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(12, 0, 0, 0);
        return Timestamp.fromDate(yesterday);
      }
      case 'specific':
        if (specificDate) {
          const dateStr = specificTime 
            ? `${specificDate}T${specificTime}:00`
            : `${specificDate}T12:00:00`;
          return Timestamp.fromDate(new Date(dateStr));
        }
        return Timestamp.fromDate(now);
      default:
        return Timestamp.fromDate(now);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (isLoading) return;
    
    // For in-the-moment reps, use current date as deadline since it's already executed
    const now = new Date();
    
    // Check if this is a RED rep
    const isRedRep = repTypeId === 'deliver_redirecting_feedback';
    
    const repData = {
      repType: repTypeId,
      person: person.trim(),
      commitmentType: 'in_moment',
      situation: {
        selected: selectedSituation,
        customContext: customContext.trim(),
        isRequired: selectedSituation === 'something_else'
      },
      occurredAt: getOccurredAt(),
      deadline: Timestamp.fromDate(now)
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
          <div className="space-y-4">
            <RepTypePickerV2
              selectedRepTypeId={repTypeId}
              onSelect={handleRepTypeSelect}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              headerText="What Real Rep did you just run?"
              showBehaviorFocus={true}
              sessionAttendance={sessionAttendance}
              milestoneProgress={milestoneProgress}
              completedRepTypes={completedRepTypes}
            />
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Who did you complete this rep with?
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
            isInMoment={true}
            error={nextAttempted && !isStepValid ? 'Please select a situation' : null}
          />
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              When did this rep happen?
            </label>
            
            {/* When options */}
            <div className="space-y-2">
              {WHEN_OPTIONS.map((option) => (
                <label 
                  key={option.id}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                    whenOption === option.id
                      ? 'border-corporate-teal bg-corporate-teal/5 dark:bg-corporate-teal/10'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={whenOption === option.id}
                    onChange={() => setWhenOption(option.id)}
                    className="text-corporate-teal"
                  />
                  <div>
                    <span className={`text-sm font-medium ${
                      whenOption === option.id 
                        ? 'text-corporate-teal' 
                        : 'text-gray-700 dark:text-slate-200'
                    }`}>
                      {option.label}
                    </span>
                    {option.description && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {option.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            
            {/* Specific date/time inputs */}
            {whenOption === 'specific' && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-corporate-teal">Date & Time</span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    min={minDate}
                    max={today}
                    className="flex-1 p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 bg-white text-slate-900 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
                  />
                  <input
                    type="time"
                    value={specificTime}
                    onChange={(e) => setSpecificTime(e.target.value)}
                    className="w-32 p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 bg-white text-slate-900 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            )}
            
            {nextAttempted && whenOption === 'specific' && !specificDate && (
              <p className="text-sm text-corporate-orange">Please select a date</p>
            )}
            
            {/* Behavior Focus Reminder on final step */}
            <BehaviorFocusReminder repTypeId={repTypeId} className="mt-4" />
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
      title="I'm in a Moment Right Now"
      subtitle={selectedRepType ? selectedRepType.label : 'What Real Rep are you running?'}
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
              {isLoading ? 'Logging...' : 'Log In-the-moment Rep'}
            </Button>
          )}
        </div>
      }
    >
      {renderStepContent()}
    </ConditioningModal>
  );
};

export default InMomentRepForm;
