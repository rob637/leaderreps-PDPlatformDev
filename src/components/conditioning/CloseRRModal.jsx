// src/components/conditioning/CloseRRModal.jsx
// V2 Close RR - Combined evidence capture + reflection to close a rep
// Single modal flow: outcome → evidence (if applicable) → reflection → done

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService from '../../services/conditioningService.js';
import { Button } from '../ui';
import { 
  CheckSquare, Send, AlertCircle, MessageSquare
} from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';
import EvidenceCaptureWizard from "./EvidenceCaptureWizard";
import { REP_OUTCOME_OPTIONS as OUTCOME_OPTIONS } from './constants';

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
  const [whatYouSaid, setWhatYouSaid] = useState('');
  const [howTheyResponded, setHowTheyResponded] = useState('');
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  
  // Check if rep already has evidence (came from a different flow)
  const hasExistingEvidence = !!rep?.evidence;
  
  // Determine if evidence capture is needed based on outcome
  // Evidence required for: did_it, partial, pivoted (not for missed - nothing to capture)
  const needsEvidence = useMemo(() => {
    if (hasExistingEvidence) return false; // Already has evidence
    return outcome && outcome !== 'missed';
  }, [outcome, hasExistingEvidence]);
  
  // Validation
  const isValid = useMemo(() => {
    if (!outcome) return false;
    if (!reflection.trim() || reflection.trim().length < 15) return false;
    if (needsEvidence && whatYouSaid.trim().length < 10) return false;
    return true;
  }, [outcome, reflection, needsEvidence, whatYouSaid]);
  

  // Use the full Evidence Capture Wizard for Set Clear Expectations and Reinforcing Feedback reps
  if (rep?.repType === 'set_clear_expectations' || rep?.repType === 'deliver_reinforcing_feedback') {
    // If evidence already captured, go straight to Plan Follow-up (Complete the Loop)
    // to avoid looping back through evidence capture screens
    const mode = rep?.evidence ? 'plan' : 'evidence';
    return (
      <EvidenceCaptureWizard 
        rep={rep}
        initialMode={mode}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );
  }

  // Get dynamic evidence prompt based on outcome
  const getEvidencePrompt = () => {
    switch (outcome) {
      case 'did_it':
        return 'What did you say or do?';
      case 'partial':
        return 'What part did you do?';
      case 'pivoted':
        return 'What did you do instead?';
      default:
        return 'What happened?';
    }
  };
  
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
      } else if (needsEvidence && whatYouSaid.trim().length < 10) {
        setError('Please describe what you said or did (at least 10 characters)');
      } else {
        setError('Please add a brief reflection (at least 15 characters)');
      }
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Step 1: Submit evidence if needed (and not already present)
      if (needsEvidence && !hasExistingEvidence) {
        const evidenceData = {
          whatYouSaid: whatYouSaid.trim(),
          howTheyResponded: howTheyResponded.trim(),
          outcome,
          inputMethod: 'written'
        };
        await conditioningService.submitEvidenceV2(db, userId, rep.id, evidenceData);
      }
      
      // Step 2: Close the rep with reflection
      const closeData = {
        outcome,
        outcomeLabelLabel: OUTCOME_OPTIONS.find(o => o.id === outcome)?.label,
        reflection: reflection.trim(),
        // Map to what closeRepV2 expects
        whatWentWell: reflection.trim(),
        whatDifferent: '',
        closedAt: new Date().toISOString()
      };
      
      await conditioningService.closeRepV2(db, userId, rep.id, closeData);
      
      onSubmit?.(closeData);
      onClose?.();
    } catch (err) {
      console.error('Error closing rep:', err);
      setError(err.message || 'Failed to close rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Complete Real Rep"
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
        
        {/* Evidence Capture (appears after outcome selected, if needed) */}
        {needsEvidence && (
          <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
            <VoiceTextarea
              id="close-what-said"
              label={getEvidencePrompt()}
              value={whatYouSaid}
              onChange={setWhatYouSaid}
              placeholder="Briefly describe what you said or did..."
              rows={2}
              minLength={10}
              error={showValidation && whatYouSaid.trim().length < 10 ? 'Add a brief description' : null}
              autoFocus
            />
            
            <VoiceTextarea
              id="close-their-response"
              label="How did they respond?"
              value={howTheyResponded}
              onChange={setHowTheyResponded}
              placeholder="Their reaction or response (optional)..."
              rows={2}
            />
          </div>
        )}
        
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
      </div>
    </ConditioningModal>
  );
};

export default CloseRRModal;
