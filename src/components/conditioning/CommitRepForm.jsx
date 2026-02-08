// src/components/conditioning/CommitRepForm.jsx
// New commitment form with 16 rep types and universal structure fields
// Based on Ryan's Conditioning Layer specs (020726)

import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';
import { Card, Button } from '../ui';
import RepTypePicker from './RepTypePicker';
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
// FIELD INPUT COMPONENT
// ============================================
const FieldInput = ({ field, value, onChange, disabled = false }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      <p className="text-xs text-gray-500 mb-2">{field.prompt}</p>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-corporate-navy focus:border-transparent"
        disabled={disabled}
      />
    </div>
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
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Prep Required</p>
            <p className="text-xs text-amber-600 mt-0.5">
              This rep type requires preparation before execution.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        How risky is this conversation?
      </label>
      <div className="grid grid-cols-3 gap-2">
        {riskLevels.map((risk) => (
          <button
            key={risk.id}
            type="button"
            onClick={() => onChange(risk.id)}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              value === risk.id
                ? risk.id === 'high' 
                  ? 'bg-red-50 border-red-300 text-red-700 ring-2 ring-red-500'
                  : risk.id === 'medium'
                  ? 'bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-500'
                  : 'bg-green-50 border-green-300 text-green-700 ring-2 ring-green-500'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {risk.label}
          </button>
        ))}
      </div>
      {value === 'high' && (
        <p className="text-xs text-amber-600 mt-2">
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                value === level.id
                  ? 'bg-corporate-navy/5 border-corporate-navy ring-2 ring-corporate-navy'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`font-medium text-sm ${
                    value === level.id ? 'text-corporate-navy' : 'text-gray-700'
                  }`}>
                    {level.label}
                  </div>
                  {progressionDesc && (
                    <div className="text-xs text-gray-500 mt-0.5">{progressionDesc}</div>
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
const CollapsibleSection = ({ title, children, defaultOpen = false, helpText }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-corporate-navy">{title}</span>
          {helpText && (
            <span className="text-xs text-gray-400">({helpText})</span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN FORM COMPONENT
// ============================================
const CommitRepForm = ({ onSubmit, onClose, isLoading }) => {
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
  };
  
  // Update universal field
  const handleUniversalFieldChange = (fieldId, value) => {
    setUniversalFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // Form validation
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
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <Card className="w-full sm:max-w-lg sm:mx-4 rounded-b-none sm:rounded-b-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-corporate-navy">Commit to a Rep</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Form Body */}
          <div className="p-4 space-y-5">
            {/* Step 1: Rep Type */}
            <div>
              <RepTypePicker
                selectedRepTypeId={repTypeId}
                onSelect={handleRepTypeSelect}
                showDetails={true}
              />
            </div>
            
            {/* Only show rest of form once rep type is selected */}
            {selectedRepType && (
              <>
                {/* Step 2: Who */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Who is this rep with? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Be specific - name, not "someone on my team"
                  </p>
                  <input
                    type="text"
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    placeholder="e.g., Maya, Jordan, Chris"
                    className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-corporate-navy focus:border-transparent"
                    required
                  />
                </div>
                
                {/* Step 3: Risk & Difficulty */}
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
                </div>
                
                {/* Step 4: Universal Structure Fields */}
                <CollapsibleSection 
                  title="Define Your Rep" 
                  defaultOpen={true}
                  helpText="What makes this a real rep"
                >
                  {Object.values(UNIVERSAL_REP_FIELDS).map((field) => (
                    <FieldInput
                      key={field.id}
                      field={field}
                      value={universalFields[field.id]}
                      onChange={(value) => handleUniversalFieldChange(field.id, value)}
                    />
                  ))}
                </CollapsibleSection>
                
                {/* Step 5: Optional Settings */}
                <CollapsibleSection title="Additional Options" defaultOpen={false}>
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any other context..."
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[60px] resize-none"
                    />
                  </div>
                  
                  {/* Custom Deadline */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomDeadline}
                        onChange={(e) => setUseCustomDeadline(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">
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
                        className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-base"
                      />
                    )}
                  </div>
                </CollapsibleSection>
                
                {/* Prep Required Warning */}
                {isPrepRequired(repTypeId, riskLevel) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Prep Required</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          You'll need to complete prep before marking this rep as executed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full bg-corporate-navy hover:bg-corporate-navy/90 text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Committing...' : 'Commit to This Rep'}
            </Button>
            {!isValid && repTypeId && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Fill in all required fields to continue
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CommitRepForm;
