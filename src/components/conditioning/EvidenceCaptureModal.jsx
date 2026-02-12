// src/components/conditioning/EvidenceCaptureModal.jsx
// V1 UX: Simplified single-input debrief modal
// Uses ConditioningModal wrapper + VoiceTextarea for consistency

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  conditioningService, 
  EVIDENCE_LEVEL
} from '../../services/conditioningService.js';
import { Button } from '../ui';
import { Clock, AlertCircle, Send, MessageSquare } from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';

// ============================================
// EVIDENCE LEVEL INDICATOR
// ============================================
const EvidenceLevelBadge = ({ level }) => {
  const isLevel1 = level === EVIDENCE_LEVEL.LEVEL_1;
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      isLevel1 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
    }`}>
      <Clock className="w-4 h-4" />
      <span className="font-medium">
        {isLevel1 ? 'Quick Debrief' : 'Later Debrief'}
      </span>
    </div>
  );
};

// ============================================
// MAIN EVIDENCE CAPTURE MODAL - V1 SIMPLIFIED
// ============================================
const EvidenceCaptureModal = ({ rep, onClose, onSubmit, isLoading }) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  // Determine evidence level (for future structured prompts)
  const evidenceLevel = useMemo(() => {
    return conditioningService.getEvidenceLevel(rep?.completedAt);
  }, [rep?.completedAt]);
  
  // V1: Single debrief text input
  const [debriefText, setDebriefText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // V1: Require at least 20 characters for a meaningful debrief
  const isValid = debriefText.trim().length >= 20;
  
  const handleSubmit = async () => {
    if (!isValid) {
      setError('Please add a bit more detail (at least 20 characters)');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // V1: Store as simple single response
      const result = await conditioningService.submitEvidence(db, userId, rep.id, {
        responses: {
          quick_debrief: debriefText.trim()
        },
        inputMethod: 'written'
      });
      
      onSubmit?.(result);
      onClose?.();
    } catch (err) {
      console.error('Error submitting evidence:', err);
      setError('Failed to submit debrief. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Debrief Your Rep"
      icon={MessageSquare}
      subtitle={`${rep?.person || ''} • ${rep?.repType || ''}`}
      contextBar={
        <div className="flex justify-center">
          <EvidenceLevelBadge level={evidenceLevel} />
        </div>
      }
      footer={
        <div className="flex items-center gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting || isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-corporate-teal hover:bg-corporate-teal-dark text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <>Saving...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Complete Debrief
              </>
            )}
          </Button>
        </div>
      }
    >
      {/* V1: Single debrief prompt */}
      <VoiceTextarea
        label="What happened?"
        helpText="Quick capture: How did the conversation go? What did you actually say or do?"
        value={debriefText}
        onChange={setDebriefText}
        placeholder="I said... They responded... The outcome was..."
        minLength={20}
        rows={6}
      />
      
      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </ConditioningModal>
  );
};

export default EvidenceCaptureModal;
