// src/components/conditioning/CloseRRModal.jsx
// V2 Close RR - Quick reflection to close the loop on a rep
// SEPARATE from Evidence Capture (which captures detailed evidence/takeaways)
// This is the "debrief" step renamed to "Close RR"

import React, { useState } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService from '../../services/conditioningService.js';
import { Button } from '../ui';
import { 
  CheckSquare, Send, AlertCircle, MessageSquare
} from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';

// ============================================
// OUTCOME OPTIONS
// ============================================
const OUTCOME_OPTIONS = [
  { id: 'did_it', label: 'Did it', icon: '✅', description: 'Executed the rep as planned' },
  { id: 'partial', label: 'Partially', icon: '⚠️', description: 'Some of it happened' },
  { id: 'missed', label: 'Missed it', icon: '❌', description: 'Didn\'t get to it' },
  { id: 'pivoted', label: 'Pivoted', icon: '🔄', description: 'Did something different' }
];

// ============================================
// OUTCOME SELECTOR
// ============================================
const OutcomeSelector = ({ selectedOutcome, onSelect }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-corporate-navy dark:text-white">
        What happened?
      </label>
      <div className="grid grid-cols-2 gap-2">
        {OUTCOME_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedOutcome === option.id
                ? 'border-corporate-teal bg-corporate-teal/10 dark:bg-corporate-teal/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{option.icon}</span>
              <span className={`font-medium ${
                selectedOutcome === option.id 
                  ? 'text-corporate-teal' 
                  : 'text-corporate-navy dark:text-white'
              }`}>
                {option.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MAIN CLOSE RR MODAL
// ============================================
const CloseRRModal = ({ 
  rep, 
  onClose, 
  onSubmit
}) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  // State
  const [outcome, setOutcome] = useState(null);
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  
  // Validation
  const isValid = outcome && reflection.trim().length >= 15;
  
  // Get dynamic reflection prompt based on outcome
  const getReflectionPrompt = () => {
    switch (outcome) {
      case 'did_it':
        return 'What went well? What would you do differently?';
      case 'partial':
        return 'What happened? What got in the way?';
      case 'missed':
        return 'What prevented you from doing it?';
      case 'pivoted':
        return 'What did you do instead and why?';
      default:
        return 'Brief reflection on this rep...';
    }
  };
  
  const handleSubmit = async () => {
    setShowValidation(true);
    
    if (!isValid) {
      if (!outcome) {
        setError('Please select what happened');
      } else {
        setError('Please add a brief reflection (at least 15 characters)');
      }
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const closeData = {
        outcome,
        outcomeLabelLabel: OUTCOME_OPTIONS.find(o => o.id === outcome)?.label,
        reflection: reflection.trim(),
        closedAt: new Date().toISOString()
      };
      
      await conditioningService.closeRepV2(db, userId, rep.id, closeData);
      
      onSubmit?.(closeData);
      onClose?.();
    } catch (err) {
      console.error('Error closing rep:', err);
      setError('Failed to close rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Close RR"
      icon={CheckSquare}
      subtitle={`${rep?.person || 'Your Rep'} • ${rep?.repType || ''}`}
    >
      <div className="p-4 space-y-5">
        {/* Rep Context Reminder */}
        {rep?.context && (
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Your commitment:</div>
                <div className="text-sm text-corporate-navy dark:text-white">
                  {rep.context}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Outcome Selection */}
        <OutcomeSelector 
          selectedOutcome={outcome} 
          onSelect={setOutcome} 
        />
        
        {/* Reflection (appears after outcome selected) */}
        {outcome && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <VoiceTextarea
              id="close-reflection"
              label={getReflectionPrompt()}
              value={reflection}
              onChange={setReflection}
              placeholder="Quick reflection..."
              rows={3}
              minLength={15}
              error={showValidation && reflection.trim().length < 15 ? 'Add a brief reflection' : null}
              autoFocus
            />
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!outcome || isSubmitting}
          loading={isSubmitting}
          className="w-full bg-corporate-teal text-white flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          Close Rep
        </Button>
        
        {/* Note about Evidence Capture */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          You can add detailed evidence & takeaways separately after closing.
        </p>
      </div>
    </ConditioningModal>
  );
};

export default CloseRRModal;
