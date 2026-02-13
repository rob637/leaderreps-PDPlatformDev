// src/components/conditioning/CommitRepForm.jsx
// New commitment form with 16 rep types and universal structure fields
// Based on Ryan's Conditioning Layer specs (020726)
// UX v2: Uses ConditioningModal + VoiceTextarea for consistency

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlertTriangle, Info, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../ui';
import RepTypePicker from './RepTypePicker';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';
import { 
  getRepType, 
  UNIVERSAL_REP_FIELDS, 
  RISK_LEVELS,
  DIFFICULTY_LEVELS,
  isPrepRequired,
  getProgression
} from '../../services/repTaxonomy';
import { getWeekBoundaries } from '../../services/conditioningService';
import { Timestamp } from 'firebase/firestore';

// ============================================
// FIELD INPUT COMPONENT — wraps VoiceTextarea
// ============================================
const FieldInput = ({ field, value, onChange, disabled = false, error = null, showError = false, autoFocus = false }) => {
  return (
    <VoiceTextarea
      id={`field-${field.id}`}
      label={`${field.label}${field.required ? '' : ' (optional)'}`}
      helpText={field.prompt}
      value={value || ''}
      onChange={onChange}
      placeholder={field.placeholder}
      rows={3}
      disabled={disabled}
      required={field.required}
      error={error && showError ? error : null}
      autoFocus={autoFocus}
    />
  );
};

// ============================================
// RISK SELECTOR
// ============================================
const RiskSelector = ({ value, onChange, repType }) => {
  const riskLevels = Object.values(RISK_LEVELS);
  
  // If rep type always requires prep, force high risk
  if (repType?.prepRequired) {
    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Prep Required</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              This rep type requires preparation before execution.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
        How risky is this conversation?
      </label>
      <div className="grid grid-cols-3 gap-2">
        {riskLevels.map((risk) => (
          <button
            key={risk.id}
            type="button"
            onClick={() => onChange(risk.id)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
              value === risk.id
                ? risk.id === 'high' 
                  ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 ring-2 ring-red-500'
                  : risk.id === 'medium'
                  ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500'
                  : 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 ring-2 ring-green-500'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500'
            }`}
          >
            {risk.label}
          </button>
        ))}
      </div>
      {value === 'high' && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          High-risk reps require preparation before execution.
        </p>
      )}
    </div>
  );
};

// ============================================
// DIFFICULTY SELECTOR
// ============================================
const DifficultySelector = ({ value, onChange, repType }) => {
  if (!repType) return null;
  
  const levels = Object.values(DIFFICULTY_LEVELS);
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
        Difficulty level
      </label>
      <div className="space-y-2">
        {levels.map((level) => {
          const progressionDesc = getProgression(repType.id, level.id);
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onChange(level.id)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                value === level.id
                  ? 'bg-corporate-teal/10 dark:bg-corporate-teal/20 border-corporate-teal ring-2 ring-corporate-teal text-corporate-teal'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`font-medium text-sm ${
                    value === level.id ? 'text-corporate-teal dark:text-corporate-teal' : 'text-gray-700 dark:text-slate-200'
                  }`}>
                    {level.label}
                  </div>
                  {progressionDesc && (
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{progressionDesc}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN FORM COMPONENT
// ============================================
const CommitRepForm = ({ onSubmit, onClose, isLoading, activeRepsCount = 0 }) => {
  // Form state
  const [repTypeId, setRepTypeId] = useState(null);
  const [person, setPerson] = useState('');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [difficulty, setDifficulty] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pendingCategory, setPendingCategory] = useState(null);
  
  // Step tracking - manual state like Debrief modal
  // Steps: 0=Type, 1=Who, 2=Details, 3=Commit
  const TOTAL_STEPS = 4;
  const STEP_LABELS = ['Type', 'Who', 'Details', 'Commit'];
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  
  // Universal structure fields
  const [universalFields, setUniversalFields] = useState({
    trigger: '',
    intended_outcome: '',
    standard: '',
    hard_move: '',
    close_next: ''
  });
  
  // Optional notes
  const [notes, setNotes] = useState('');
  
  // Prep preference (null = use default based on risk level)
  const [wantsPrep, setWantsPrep] = useState(null);
  
  // Deadline
  const [useCustomDeadline, setUseCustomDeadline] = useState(false);
  const [customDeadline, setCustomDeadline] = useState('');
  
  // V1 UX: Validation feedback state
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [nextAttempted, setNextAttempted] = useState(false);
  const [errors, setErrors] = useState({});
  const personInputRef = useRef(null);
  
  // Get selected rep type info
  const selectedRepType = useMemo(() => {
    return repTypeId ? getRepType(repTypeId) : null;
  }, [repTypeId]);

  // Step validation - is current step complete?
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: return !!repTypeId;
      case 1: return person.trim().length > 0;
      case 2: return !!difficulty;
      case 3: {
        // Check required universal fields
        const requiredFields = Object.values(UNIVERSAL_REP_FIELDS).filter(f => f.required);
        return requiredFields.every(f => universalFields[f.id]?.trim());
      }
      default: return true;
    }
  }, [currentStep, repTypeId, person, difficulty, universalFields]);

  // Show validation for current step if it's been visited
  const showStepValidation = visitedSteps.has(currentStep);

  // Navigation handlers
  const handleNext = () => {
    // Mark that user attempted to proceed (for validation display)
    if (!isStepValid) {
      setNextAttempted(true);
      return;
    }
    
    if (currentStep < TOTAL_STEPS - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps(prev => new Set([...prev, nextStep]));
      setNextAttempted(false); // Reset for next step
      // Scroll modal to top on step change
      setTimeout(() => {
        const modalBody = document.querySelector('[data-modal-body="true"]');
        if (modalBody) modalBody.scrollTop = 0;
      }, 50);
    }
  };

  const handlePrevious = () => {
    // On step 0, handle internal picker navigation
    if (currentStep === 0) {
      if (selectedCategory) {
        // Go back from type list to category list (one click)
        setSelectedCategory(null);
        setRepTypeId(null);
        setDifficulty(null);
      }
      return;
    }
    // Otherwise go to previous step
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
  
  // Set default difficulty when rep type changes
  // Only auto-advance on FIRST selection (not when revisiting/editing)
  const handleRepTypeSelect = (id) => {
    const isFirstSelection = !repTypeId; // No previous value
    setRepTypeId(id);
    const repType = getRepType(id);
    if (repType) {
      setDifficulty(repType.defaultDifficulty);
      setRiskLevel(repType.defaultRisk);
    }
    // Clear validation feedback when selected
    setNextAttempted(false);
    if (errors.repType) {
      setErrors(prev => ({ ...prev, repType: null }));
    }
    
    // Auto-advance to Step 2 (Who) only if first time selecting
    if (isFirstSelection) {
      setCurrentStep(1);
      setVisitedSteps(prev => new Set([...prev, 1]));
      // Scroll modal to top
      setTimeout(() => {
        const modalBody = document.querySelector('[data-modal-body="true"]');
        if (modalBody) modalBody.scrollTop = 0;
      }, 50);
    }
  };
  
  // Update universal field
  const handleUniversalFieldChange = (fieldId, value) => {
    setUniversalFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear field error when user types
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };
  
  // Clear person error when typing
  const handlePersonChange = (value) => {
    setPerson(value);
    if (errors.person) {
      setErrors(prev => ({ ...prev, person: null }));
    }
  };
  
  // V1 UX: Validate form and return errors object
  const validateForm = () => {
    const newErrors = {};
    
    if (!repTypeId) {
      newErrors.repType = 'Please select a rep type';
    }
    if (!person.trim()) {
      newErrors.person = 'Please enter who this rep is with';
    }
    if (!difficulty) {
      newErrors.difficulty = 'Please select a difficulty level';
    }
    
    // Check required universal fields
    const requiredFields = Object.values(UNIVERSAL_REP_FIELDS).filter(f => f.required);
    for (const field of requiredFields) {
      if (!universalFields[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    }
    
    return newErrors;
  };
  
  // Handle submit
  const handleSubmit = () => {
    setSubmitAttempted(true);
    
    // Validate and show errors
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      // Validation errors exist - step navigation handles this
      return;
    }
    
    if (isLoading) return;
    
    let deadline = null;
    if (useCustomDeadline && customDeadline) {
      // Parse as local date (not UTC) — new Date('YYYY-MM-DD') creates UTC midnight
      // which becomes previous evening in local time zones behind UTC
      const parts = customDeadline.split('-');
      const deadlineDate = new Date(
        parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]),
        23, 59, 59, 999
      );
      deadline = Timestamp.fromDate(deadlineDate);
    }
    
    onSubmit({
      person: person.trim(),
      repType: repTypeId,
      riskLevel,
      difficulty,
      context: {
        trigger: universalFields.trigger.trim(),
        intended_outcome: universalFields.intended_outcome.trim(),
        standard: universalFields.standard.trim(),
        hard_move: universalFields.hard_move.trim(),
        close_next: universalFields.close_next.trim()
      },
      notes: notes.trim() || null,
      deadline,
      // Prep required if: 1) forced by risk/type, or 2) user opted in
      prepRequired: isPrepRequired(repTypeId, riskLevel) || wantsPrep === true
    });
  };
  
  // Date constraints
  const { weekEnd } = getWeekBoundaries();
  const maxDeadline = weekEnd.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  // Render step content - one step at a time like Debrief modal
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            {/* V1 UX: Soft warning when active rep exists */}
            {activeRepsCount > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    You have {activeRepsCount} active rep{activeRepsCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Consider completing your current rep before starting another.
                  </p>
                </div>
              </div>
            )}
            <RepTypePicker
              selectedRepTypeId={repTypeId}
              onSelect={handleRepTypeSelect}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              pendingCategory={pendingCategory}
              onPendingCategoryChange={setPendingCategory}
              showDetails={true}
            />
            {nextAttempted && !repTypeId && (
              <p className="text-sm text-red-600 mt-2">Please select a rep type to continue</p>
            )}
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-corporate-navy dark:text-slate-200 mb-1">
              Who is this rep with? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
              Be specific - name, not "someone on my team"
            </p>
            <input
              ref={personInputRef}
              type="text"
              value={person}
              onChange={(e) => handlePersonChange(e.target.value)}
              placeholder="e.g., Maya, Jordan, Chris"
              className="w-full p-3 border rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal transition-all dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              required
            />
            {showStepValidation && !person.trim() && (
              <p className="text-sm text-red-600 mt-1">Please enter who this rep is with</p>
            )}
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <RiskSelector 
              value={riskLevel} 
              onChange={setRiskLevel}
              repType={selectedRepType}
            />
            <DifficultySelector 
              value={difficulty} 
              onChange={setDifficulty}
              repType={selectedRepType}
            />
            {showStepValidation && !difficulty && (
              <p className="text-sm text-red-600 mt-2">Please select a difficulty level</p>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            {/* Universal Structure Fields */}
            {Object.values(UNIVERSAL_REP_FIELDS).map((field, index) => (
              <div key={field.id}>
                <FieldInput
                  field={field}
                  value={universalFields[field.id]}
                  onChange={(value) => handleUniversalFieldChange(field.id, value)}
                  error={errors[field.id]}
                  showError={submitAttempted}
                  autoFocus={index === 0}
                />
              </div>
            ))}
            
            {/* Optional Settings - inline on final step */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <VoiceTextarea
                label="Additional notes (optional)"
                value={notes}
                onChange={setNotes}
                placeholder="Any other context..."
                rows={3}
              />
              
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomDeadline}
                    onChange={(e) => setUseCustomDeadline(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">
                    Set custom deadline (default: end of week)
                  </span>
                </label>
                
                {useCustomDeadline && (
                  <input
                    type="date"
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(e.target.value)}
                    min={today}
                    max={maxDeadline}
                    className="mt-2 w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
                  />
                )}
              </div>
            </div>
            
            {/* Prep Checkbox */}
            {(() => {
              const prepIsRequired = isPrepRequired(repTypeId, riskLevel);
              const prepEnabled = wantsPrep !== null ? wantsPrep : prepIsRequired;
              
              return (
                <div className={`p-3 rounded-xl border ${
                  prepIsRequired 
                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700'
                    : prepEnabled
                    ? 'bg-corporate-teal/5 dark:bg-corporate-teal/10 border-corporate-teal/30'
                    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600'
                }`}>
                  <label className={`flex items-start gap-3 ${prepIsRequired ? '' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={prepEnabled}
                      onChange={(e) => !prepIsRequired && setWantsPrep(e.target.checked)}
                      disabled={prepIsRequired}
                      className={`mt-0.5 rounded ${
                        prepIsRequired 
                          ? 'text-amber-600 cursor-not-allowed' 
                          : 'text-corporate-teal cursor-pointer'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {prepIsRequired ? (
                          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ) : prepEnabled ? (
                          <CheckCircle className="w-4 h-4 text-corporate-teal" />
                        ) : null}
                        <span className={`text-sm font-medium ${
                          prepIsRequired 
                            ? 'text-amber-800 dark:text-amber-300'
                            : prepEnabled
                            ? 'text-corporate-teal'
                            : 'text-gray-700 dark:text-slate-300'
                        }`}>
                          {prepIsRequired ? 'Prep required before execution' : 'Prep before execution'}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 ${
                        prepIsRequired 
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-500 dark:text-slate-400'
                      }">
                        {prepIsRequired 
                          ? 'High-risk reps require preparation to unlock execution.'
                          : 'Think through risks and recovery before the conversation.'}
                      </p>
                    </div>
                  </label>
                </div>
              );
            })()}
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
      title="Commit to a Rep"
      subtitle={selectedRepType ? `${selectedRepType.label}` : 'Select a rep type to begin'}
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      stepLabels={STEP_LABELS}
      footer={
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0 && !selectedCategory && !repTypeId && !pendingCategory}
            variant="outline"
          >
            Previous
          </Button>
          
          {currentStep < TOTAL_STEPS - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid}
              className="bg-corporate-navy hover:bg-corporate-navy/90 text-white"
            >
              Next →
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid || isLoading}
              className="bg-corporate-teal hover:bg-corporate-teal-dark text-white"
            >
              {isLoading ? 'Committing...' : 'Commit to This Rep'}
            </Button>
          )}
        </div>
      }
    >
      {renderStepContent()}
    </ConditioningModal>
  );
};

export default CommitRepForm;
