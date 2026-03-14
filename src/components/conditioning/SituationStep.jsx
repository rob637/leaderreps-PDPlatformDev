// src/components/conditioning/SituationStep.jsx
// Situation picker for V2 commitment flows
// Shows 4 suggested situations + "Something else" option per rep type
// Updated March 2026 to match Conditioning Layer specifications

import React from 'react';
import { Check, Edit3 } from 'lucide-react';
import { getSuggestedSituations } from '../../services/repTaxonomy';
import VoiceTextarea from './VoiceTextarea';

// ============================================
// SITUATION OPTION CARD
// ============================================
const SituationOption = ({ label, isSelected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        isSelected 
          ? 'bg-corporate-teal/5 dark:bg-corporate-teal/10 border-corporate-teal ring-2 ring-corporate-teal' 
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-corporate-teal hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm ${
          isSelected ? 'text-corporate-teal font-medium' : 'text-gray-700 dark:text-slate-300'
        }`}>
          {label}
        </span>
        {isSelected && (
          <div className="p-1 rounded-full bg-corporate-teal/10 flex-shrink-0">
            <Check className="w-4 h-4 text-corporate-teal" />
          </div>
        )}
      </div>
    </button>
  );
};

// ============================================
// SOMETHING ELSE OPTION
// ============================================
const SomethingElseOption = ({ isSelected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        isSelected 
          ? 'bg-gray-50 dark:bg-slate-700 border-gray-400 dark:border-slate-500' 
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-gray-400 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <Edit3 className={`w-4 h-4 ${isSelected ? 'text-gray-700 dark:text-slate-300' : 'text-gray-500 dark:text-slate-400'}`} />
        <span className={`text-sm ${
          isSelected ? 'text-gray-700 dark:text-slate-300 font-medium' : 'text-gray-600 dark:text-slate-400'
        }`}>
          Something else
        </span>
      </div>
    </button>
  );
};

// ============================================
// MAIN SITUATION STEP COMPONENT
// ============================================
const SituationStep = ({
  repTypeId,
  selectedSituation,
  customContext,
  onSituationChange,
  onCustomContextChange,
  // Prompt text customization
  promptText = 'Which best describes this situation?',
  // For In-the-Moment flow, change prompt
  isInMoment = false,
  // Validation error message
  error = null
}) => {
  // Get suggested situations for this rep type
  const suggestions = getSuggestedSituations(repTypeId);
  
  // Track if "Something else" is selected
  const isSomethingElse = selectedSituation === 'something_else';
  
  // Whether custom context is required (only if "Something else" selected)
  const isContextRequired = isSomethingElse;
  
  // Check if a suggested option is selected
  const isSuggestedSelected = suggestions.includes(selectedSituation);
  
  // Dynamic prompt based on flow type
  const displayPrompt = isInMoment 
    ? 'Which best describes what was happening?'
    : promptText;
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
        {displayPrompt}
      </label>
      
      {/* Suggested situations */}
      <div className="space-y-2">
        {suggestions.map((situation, index) => (
          <SituationOption
            key={index}
            label={situation}
            isSelected={selectedSituation === situation}
            onClick={() => onSituationChange(situation)}
          />
        ))}
        
        {/* Something else option */}
        {repTypeId !== 'set_clear_expectations' && (
          <SomethingElseOption
            isSelected={isSomethingElse}
            onClick={() => onSituationChange('something_else')}
          />
        )}
      </div>
      
      {/* Context input field */}
      {(isSuggestedSelected || isSomethingElse) && (
        <div className="pt-2">
          <VoiceTextarea
            id="situation-context"
            label={isContextRequired 
              ? 'One sentence of context' 
              : 'One sentence of context (optional but encouraged)'
            }
            value={customContext}
            onChange={onCustomContextChange}
            placeholder="e.g., In our 1:1 on Thursday when we discuss the missed deadline..."
            rows={2}
            required={isContextRequired}
            minLength={isContextRequired ? 10 : null}
            maxLength={200}
            error={isContextRequired && customContext.trim().length > 0 && customContext.trim().length < 10 ? 'Please describe the situation (min 10 chars)' : null}
          />
        </div>
      )}
      
      {error && (
        <p className="text-sm text-corporate-orange">{error}</p>
      )}
    </div>
  );
};

export default SituationStep;
