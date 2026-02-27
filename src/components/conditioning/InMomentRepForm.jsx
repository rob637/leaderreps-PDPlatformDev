// src/components/conditioning/InMomentRepForm.jsx
// V2 In-the-Moment Rep logging flow - 4 steps
// Step 1: Type (+ behavior focus), Step 2: Who, Step 3: Situation, Step 4: When + Log

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../ui';
import ConditioningModal from './ConditioningModal';
import RepTypePickerV2 from './RepTypePickerV2';
import SituationStep from './SituationStep';
import { BehaviorFocusReminder } from './BehaviorFocusReminder';
import { getRepTypeV2 } from '../../services/repTaxonomy';
import { getWeekBoundaries } from '../../services/conditioningService';
import { Timestamp } from 'firebase/firestore';

// ============================================
// STEP CONFIGURATION
// ============================================
const TOTAL_STEPS = 4;
const STEP_LABELS = ['Type', 'Who', 'Situation', 'When'];

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
const InMomentRepForm = ({ onSubmit, onClose, isLoading }) => {
  // Form state
  const [repTypeId, setRepTypeId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [person, setPerson] = useState('');
  const [selectedSituation, setSelectedSituation] = useState(null);
  const [customContext, setCustomContext] = useState('');
  const [whenOption, setWhenOption] = useState('just_now');
  const [specificDate, setSpecificDate] = useState('');
  const [specificTime, setSpecificTime] = useState('');
  
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
  
  // Calculate date constraints
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const minDate = oneWeekAgo.toISOString().split('T')[0];

  // Step validation
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: return !!repTypeId;
      case 1: return person.trim().length > 0 || selectedRepType?.allowSoloRep;
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
  }, [currentStep, repTypeId, person, selectedRepType, selectedSituation, customContext, whenOption, specificDate]);

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
    
    const { weekEnd } = getWeekBoundaries();
    
    const repData = {
      repType: repTypeId,
      person: person.trim() || (selectedRepType?.allowSoloRep ? 'Solo Rep' : ''),
      commitmentType: 'in_moment',
      situation: {
        selected: selectedSituation,
        customContext: customContext.trim(),
        isRequired: selectedSituation === 'something_else'
      },
      occurredAt: getOccurredAt(),
      deadline: Timestamp.fromDate(weekEnd)
    };
    
    await onSubmit(repData);
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
            />
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Who was involved?
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={person === '' || person === 'Solo Rep'}
                  onChange={(e) => setPerson(e.target.checked ? 'Solo Rep' : '')}
                  className="rounded text-corporate-teal"
                />
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  This was a solo rep (no other person involved)
                </span>
              </label>
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
            isInMoment={true}
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
              <div className="flex gap-2">
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  min={minDate}
                  max={today}
                  className="flex-1 p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
                />
                <input
                  type="time"
                  value={specificTime}
                  onChange={(e) => setSpecificTime(e.target.value)}
                  className="w-32 p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
                />
              </div>
            )}
            
            {nextAttempted && whenOption === 'specific' && !specificDate && (
              <p className="text-sm text-red-600">Please select a date</p>
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
      title="Log a Real Rep"
      subtitle={selectedRepType ? selectedRepType.label : 'What rep did you just run?'}
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
              {isLoading ? 'Logging...' : 'Log In-the-moment RR'}
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
