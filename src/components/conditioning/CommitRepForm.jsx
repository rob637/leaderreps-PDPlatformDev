// src/components/conditioning/CommitRepForm.jsx
// New commitment form with 16 rep types and universal structure fields
// Based on Ryan's Conditioning Layer specs (020726)
// UX v2: Uses ConditioningModal + VoiceTextarea for consistency

import React, { useState, useMemo, useRef } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
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
const FieldInput = ({ field, value, onChange, disabled = false, error = null, showError = false }) => {
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
// COLLAPSIBLE SECTION
// ============================================
const CollapsibleSection = ({ title, children, defaultOpen = false, helpText, forceOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const effectiveOpen = forceOpen || isOpen;
  
  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!effectiveOpen)}
        className="w-full p-3 bg-gray-50 dark:bg-slate-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-corporate-navy dark:text-white">{title}</span>
          {helpText && (
            <span className="text-xs text-gray-400 dark:text-slate-500">({helpText})</span>
          )}
        </div>
        {effectiveOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-400" />
        )}
      </button>
      {effectiveOpen && (
        <div className="p-4 space-y-4 bg-white dark:bg-slate-800">
          {children}
        </div>
      )}
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
  
  // Deadline
  const [useCustomDeadline, setUseCustomDeadline] = useState(false);
  const [customDeadline, setCustomDeadline] = useState('');
  
  // V1 UX: Validation feedback state
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errors, setErrors] = useState({});
  const [defineRepForceOpen, setDefineRepForceOpen] = useState(false);
  const personInputRef = useRef(null);
  
  // Get selected rep type info
  const selectedRepType = useMemo(() => {
    return repTypeId ? getRepType(repTypeId) : null;
  }, [repTypeId]);
  
  // Set default difficulty when rep type changes
  const handleRepTypeSelect = (id) => {
    setRepTypeId(id);
    const repType = getRepType(id);
    if (repType) {
      setDifficulty(repType.defaultDifficulty);
      setRiskLevel(repType.defaultRisk);
    }
    // Clear rep type error when selected
    if (errors.repType) {
      setErrors(prev => ({ ...prev, repType: null }));
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
  
  // Form validation (for button state)
  const isValid = useMemo(() => {
    if (!repTypeId) return false;
    if (!person.trim()) return false;
    if (!difficulty) return false;
    
    // Check required universal fields
    const requiredFields = Object.values(UNIVERSAL_REP_FIELDS).filter(f => f.required);
    for (const field of requiredFields) {
      if (!universalFields[field.id]?.trim()) return false;
    }
    
    return true;
  }, [repTypeId, person, difficulty, universalFields]);
  
  // Handle submit
  const handleSubmit = () => {
    setSubmitAttempted(true);
    
    // Validate and show errors
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      // Build ordered list of fields for focus priority
      const universalFieldIds = Object.values(UNIVERSAL_REP_FIELDS).map(f => f.id);
      const fieldOrder = ['repType', 'person', 'difficulty', ...universalFieldIds];
      const firstErrorField = fieldOrder.find(id => validationErrors[id]);
      
      // Force open "Define Your Rep" section if it has errors
      if (universalFieldIds.some(id => validationErrors[id])) {
        setDefineRepForceOpen(true);
      }
      
      // Scroll to first error and focus its input
      setTimeout(() => {
        if (firstErrorField) {
          const fieldEl = document.querySelector(`[data-field="${firstErrorField}"]`);
          if (fieldEl) {
            fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus the input/textarea inside after scroll animation
            setTimeout(() => {
              const focusable = fieldEl.querySelector('input, textarea');
              if (focusable) {
                focusable.focus();
              }
            }, 400);
          }
        }
      }, 100);
      return;
    }
    
    if (isLoading) return;
    
    let deadline = null;
    if (useCustomDeadline && customDeadline) {
      const deadlineDate = new Date(customDeadline);
      deadlineDate.setHours(23, 59, 59, 999);
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
      prepRequired: isPrepRequired(repTypeId, riskLevel)
    });
  };
  
  // Date constraints
  const { weekEnd } = getWeekBoundaries();
  const maxDeadline = weekEnd.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Commit to a Rep"
      subtitle={selectedRepType ? `${selectedRepType.label}` : 'Select a rep type to begin'}
      footer={
        <div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-corporate-teal hover:bg-corporate-teal-dark text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Committing...' : 'Commit to This Rep'}
          </Button>
          {submitAttempted && Object.keys(errors).length > 0 && (
            <p className="text-xs text-red-600 text-center mt-2">
              Please fill in all required fields above
            </p>
          )}
          {!submitAttempted && !isValid && repTypeId && (
            <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-2">
              Fill in all required fields to continue
            </p>
          )}
        </div>
      }
    >
          {/* Form Body */}
          <div className="space-y-5">
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
            
            {/* Step 1: Rep Type */}
            <div data-field="repType" className={errors.repType ? 'field-error' : ''}>
              <RepTypePicker
                selectedRepTypeId={repTypeId}
                onSelect={handleRepTypeSelect}
                showDetails={true}
              />
              {errors.repType && submitAttempted && (
                <p className="text-sm text-red-600 mt-2">{errors.repType}</p>
              )}
            </div>
            
            {/* Only show rest of form once rep type is selected */}
            {selectedRepType && (
              <>
                {/* Step 2: Who */}
                <div data-field="person" className={errors.person ? 'field-error' : ''}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
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
                  {errors.person && submitAttempted && (
                    <p className="text-sm text-red-600 mt-1">{errors.person}</p>
                  )}
                </div>
                
                {/* Step 3: Risk & Difficulty */}
                <div className="space-y-4">
                  <RiskSelector 
                    value={riskLevel} 
                    onChange={setRiskLevel}
                    repType={selectedRepType}
                  />
                  <div data-field="difficulty">
                    <DifficultySelector 
                      value={difficulty} 
                      onChange={setDifficulty}
                      repType={selectedRepType}
                    />
                  </div>
                </div>
                
                {/* Step 4: Universal Structure Fields */}
                <CollapsibleSection 
                  title="Define Your Rep" 
                  defaultOpen={true}
                  helpText="What makes this a real rep"
                  forceOpen={defineRepForceOpen}
                >
                  {Object.values(UNIVERSAL_REP_FIELDS).map((field) => (
                    <div key={field.id} data-field={field.id}>
                      <FieldInput
                        field={field}
                        value={universalFields[field.id]}
                        onChange={(value) => handleUniversalFieldChange(field.id, value)}
                        error={errors[field.id]}
                        showError={submitAttempted}
                      />
                    </div>
                  ))}
                </CollapsibleSection>
                
                {/* Step 5: Optional Settings */}
                <CollapsibleSection title="Additional Options" defaultOpen={false}>
                  {/* Notes */}
                  <VoiceTextarea
                    label="Additional notes (optional)"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Any other context..."
                    rows={3}
                  />
                  
                  {/* Custom Deadline */}
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
                        className="mt-2 w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:text-white"
                      />
                    )}
                  </div>
                </CollapsibleSection>
                
                {/* Prep Required Warning */}
                {isPrepRequired(repTypeId, riskLevel) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Prep Required</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          You'll need to complete prep before marking this rep as executed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
    </ConditioningModal>
  );
};

export default CommitRepForm;
