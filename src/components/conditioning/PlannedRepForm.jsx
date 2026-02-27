// src/components/conditioning/PlannedRepForm.jsx
// V2 Planned Rep commitment flow - 5 steps
// Step 1: Type, Step 2: Who, Step 3: Situation, Step 4: When, Step 5: Commit

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../ui';
import ConditioningModal from './ConditioningModal';
import RepTypePickerV2 from './RepTypePickerV2';
import SituationStep from './SituationStep';
import { BehaviorFocusReminder, ActiveRepReminder } from './BehaviorFocusReminder';
import VoiceTextarea from './VoiceTextarea';
import { getRepTypeV2 } from '../../services/repTaxonomy';
import { getWeekBoundaries } from '../../services/conditioningService';
import { Timestamp } from 'firebase/firestore';

// ============================================
// STEP CONFIGURATION
// ============================================
const TOTAL_STEPS = 5;
const STEP_LABELS = ['Type', 'Who', 'Situation', 'When', 'Commit'];

// ============================================
// MAIN FORM COMPONENT
// ============================================
const PlannedRepForm = ({ onSubmit, onClose, isLoading }) => {
  // Form state
  const [repTypeId, setRepTypeId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [person, setPerson] = useState('');
  const [selectedSituation, setSelectedSituation] = useState(null);
  const [customContext, setCustomContext] = useState('');
  const [useEndOfWeek, setUseEndOfWeek] = useState(true);
  const [customDeadline, setCustomDeadline] = useState('');
  const [notes, setNotes] = useState('');
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [nextAttempted, setNextAttempted] = useState(false);
  
  const personInputRef = useRef(null);
  
  // Get selected rep type info
  const selectedRepType = useMemo(() => {
    return repTypeId ? getRepTypeV2(repTypeId) : null;
  }, [repTypeId]);
  
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
      case 1: return person.trim().length > 0 || selectedRepType?.allowSoloRep;
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
  }, [currentStep, repTypeId, person, selectedRepType, selectedSituation, customContext]);

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
    
    const repData = {
      repType: repTypeId,
      person: person.trim() || (selectedRepType?.allowSoloRep ? 'Solo Rep' : ''),
      commitmentType: 'planned',
      situation: {
        selected: selectedSituation,
        customContext: customContext.trim(),
        isRequired: selectedSituation === 'something_else'
      },
      deadline,
      notes: notes.trim() || null
    };
    
    await onSubmit(repData);
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
          />
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Who will you have this rep with?
            </label>
            <input
              ref={personInputRef}
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Enter their name..."
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:text-white"
            />
            {selectedRepType?.allowSoloRep && (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                This rep type can be done solo. Leave blank if not involving another person.
              </p>
            )}
            {nextAttempted && !isStepValid && !selectedRepType?.allowSoloRep && (
              <p className="text-sm text-red-600">Please enter a name</p>
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
          />
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              When do you need to complete this rep?
            </label>
            
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
                  {weekEnd.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
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
                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
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
                    ? weekEnd.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                    : customDeadline 
                      ? new Date(customDeadline).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
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
      subtitle={selectedRepType ? selectedRepType.label : 'Select a rep type to begin'}
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
              disabled={!isStepValid && nextAttempted}
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
              {isLoading ? 'Committing...' : 'Commit'}
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
