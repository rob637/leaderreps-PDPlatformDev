// src/components/conditioning/StructuredEvidenceModal.jsx
// Sprint 3: Structured Evidence Capture (replaces weak free-text)
// Per Ryan's 020726 notes: Concrete specifics that are hard to fake
// UX v2: Uses ConditioningModal + VoiceTextarea, voice-first approach

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService, { EVIDENCE_LEVEL } from '../../services/conditioningService.js';
import { getRepType } from '../../services/repTaxonomy.js';
import { Button } from '../ui';
import { 
  Clock, CheckCircle, AlertCircle, Send,
  Calendar, ArrowRight, Target
} from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';

// ============================================
// EVIDENCE FIELD DEFINITIONS
// ============================================
const WHEN_OPTIONS = [
  { id: 'today', label: 'Today', description: 'Within the last few hours' },
  { id: 'yesterday', label: 'Yesterday', description: 'One day ago' },
  { id: 'this_week', label: 'Earlier this week', description: '2-5 days ago' }
];

const CONTEXT_OPTIONS = [
  { id: 'scheduled_1on1', label: 'Scheduled 1:1', icon: '📅' },
  { id: 'team_meeting', label: 'Team meeting', icon: '👥' },
  { id: 'hallway_slack', label: 'Hallway / Slack', icon: '💬' },
  { id: 'handoff_transition', label: 'Handoff / Transition', icon: '🔄' },
  { id: 'issue_incident', label: 'Issue / Incident response', icon: '🚨' },
  { id: 'other', label: 'Other', icon: '📋' }
];

const RESPONSE_OPTIONS = [
  { id: 'accepted_agreed', label: 'Accepted and agreed', sentiment: 'positive' },
  { id: 'clarifying_questions', label: 'Asked clarifying questions', sentiment: 'neutral' },
  { id: 'pushback_resisted', label: 'Pushed back / resisted', sentiment: 'negative' },
  { id: 'became_defensive', label: 'Became defensive', sentiment: 'negative' },
  { id: 'seemed_surprised', label: 'Seemed surprised', sentiment: 'neutral' },
  { id: 'neutral_hard_to_read', label: 'Was neutral / hard to read', sentiment: 'neutral' },
  { id: 'other', label: 'Other', sentiment: 'neutral' }
];

// ============================================
// EVIDENCE LEVEL INDICATOR
// ============================================
const EvidenceLevelBadge = ({ level }) => {
  const isLevel1 = level === EVIDENCE_LEVEL.LEVEL_1;
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      isLevel1 
        ? 'bg-green-100 text-green-700' 
        : 'bg-amber-100 text-amber-700'
    }`}>
      <Clock className="w-4 h-4" />
      <span className="font-medium">
        {isLevel1 ? 'Level 1 Evidence' : 'Level 2 Evidence'}
      </span>
      <span className="text-xs opacity-75">
        ({isLevel1 ? 'Same day' : '24+ hours later'})
      </span>
    </div>
  );
};

// ============================================
// WHEN FIELD
// ============================================
const WhenField = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        <Calendar className="w-4 h-4 inline mr-2" />
        When did this happen?
      </label>
      <div className="grid grid-cols-3 gap-2">
        {WHEN_OPTIONS.map(option => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              value === option.id
                ? 'border-corporate-teal bg-corporate-teal/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-gray-500">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// CONTEXT/MOMENT FIELD
// ============================================
const ContextField = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        <Target className="w-4 h-4 inline mr-2" />
        Which moment was this tied to?
      </label>
      <div className="grid grid-cols-2 gap-2">
        {CONTEXT_OPTIONS.map(option => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              value === option.id
                ? 'border-corporate-teal bg-corporate-teal/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{option.icon}</span>
            <span className="text-sm">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// RESPONSE FIELD (Their response)
// ============================================
const ResponseField = ({ value, note, onChange, onNoteChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        <ArrowRight className="w-4 h-4 inline mr-2" />
        How did they respond?
      </label>
      
      <div className="grid grid-cols-2 gap-2">
        {RESPONSE_OPTIONS.map(option => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`p-2 rounded-xl border-2 text-left text-sm transition-all ${
              value === option.id
                ? option.sentiment === 'positive' 
                  ? 'border-green-500 bg-green-50'
                  : option.sentiment === 'negative'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-corporate-teal bg-corporate-teal/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {/* Brief note via VoiceTextarea */}
      {value && (
        <VoiceTextarea
          label="Brief note on their response (optional)"
          value={note || ''}
          onChange={onNoteChange}
          placeholder="e.g., They seemed relieved I brought it up..."
          rows={3}
          className="mt-2"
        />
      )}
    </div>
  );
};

// ============================================
// COMMITMENT FIELD
// ============================================
const CommitmentField = ({ value, hasNone, onChange, onHasNoneChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        <CheckCircle className="w-4 h-4 inline mr-2" />
        What commitment was made?
      </label>
      
      {!hasNone ? (
        <>
          <VoiceTextarea
            value={value || ''}
            onChange={onChange}
            placeholder="e.g., They agreed to notify me before missing meetings going forward..."
            rows={3}
          />
          <button
            onClick={() => onHasNoneChange(true)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            No explicit commitment was made
          </button>
        </>
      ) : (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Marking as "no explicit commitment" – why not?
          </p>
          <VoiceTextarea
            value={value || ''}
            onChange={onChange}
            placeholder="e.g., This was an exploratory conversation, I wanted to understand first..."
            rows={3}
          />
          <button
            onClick={() => { onHasNoneChange(false); onChange(''); }}
            className="mt-2 text-xs text-corporate-navy hover:underline"
          >
            ← Actually, a commitment was made
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN STRUCTURED EVIDENCE MODAL
// ============================================
const StructuredEvidenceModal = ({ rep, onClose, onSubmit, isLoading }) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  // Form state
  const [when, setWhen] = useState('');
  const [context, setContext] = useState('');
  const [whatSaid, setWhatSaid] = useState('');
  const [theirResponse, setTheirResponse] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [commitment, setCommitment] = useState('');
  const [commitmentNone, setCommitmentNone] = useState(false);
  const [reflection, setReflection] = useState('');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Total steps
  const TOTAL_STEPS = 5;
  
  // Determine evidence level
  const evidenceLevel = useMemo(() => {
    return conditioningService.getEvidenceLevel?.(rep?.executedAt || rep?.completedAt) || EVIDENCE_LEVEL.LEVEL_2;
  }, [rep?.executedAt, rep?.completedAt]);
  
  // Rep type info
  const repTypeInfo = useMemo(() => {
    return getRepType(rep?.repType);
  }, [rep?.repType]);
  
  // Validation per step
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: return !!when;
      case 1: return !!context;
      case 2: return whatSaid.trim().length >= 20;
      case 3: return !!theirResponse;
      case 4: return commitment.length > 0 || commitmentNone;
      default: return true;
    }
  }, [currentStep, when, context, whatSaid, theirResponse, commitment, commitmentNone]);
  
  // Completed steps
  const completedSteps = useMemo(() => {
    const completed = [];
    if (when) completed.push(0);
    if (context) completed.push(1);
    if (whatSaid.trim().length >= 20) completed.push(2);
    if (theirResponse) completed.push(3);
    if (commitment.length > 0 || commitmentNone) completed.push(4);
    return completed;
  }, [when, context, whatSaid, theirResponse, commitment, commitmentNone]);
  
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1 && isStepValid) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (completedSteps.length < TOTAL_STEPS) {
      setError('Please complete all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const structuredEvidence = {
        // WHO (pre-filled from rep)
        person_name: rep?.person,
        
        // WHEN
        when_happened: when,
        
        // WHICH MOMENT
        context_moment: context,
        
        // WHAT WAS SAID/DONE (voice-first capture, single narrative)
        what_said: whatSaid.trim(),
        
        // RESPONSE
        their_response: theirResponse,
        response_note: responseNote,
        
        // COMMITMENT
        commitment: commitment,
        commitment_none: commitmentNone,
        
        // OPTIONAL
        reflection: reflection,
        
        // Metadata
        inputMethod: 'structured',
        evidenceLevel,
        submittedAt: new Date().toISOString()
      };
      
      // Submit via conditioningService
      await conditioningService.submitEvidence(db, userId, rep.id, {
        structured: structuredEvidence,
        inputMethod: 'structured_v2',
        level: evidenceLevel
      });
      
      onSubmit?.(structuredEvidence);
      onClose?.();
    } catch (err) {
      console.error('Error submitting evidence:', err);
      setError('Failed to submit evidence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WhenField value={when} onChange={setWhen} />;
      case 1:
        return <ContextField value={context} onChange={setContext} />;
      case 2:
        return (
          <VoiceTextarea
            label="What did you say/do? (Be specific — recite the feedback verbatim)"
            helpText="Describe exactly what you said and did. Use the mic to speak it out — voice capture is often more accurate than typing from memory."
            value={whatSaid}
            onChange={setWhatSaid}
            placeholder="I said... Then I asked... I pointed out that..."
            minLength={20}
            rows={6}
          />
        );
      case 3:
        return <ResponseField 
          value={theirResponse} 
          note={responseNote}
          onChange={setTheirResponse} 
          onNoteChange={setResponseNote}
        />;
      case 4:
        return (
          <>
            <CommitmentField 
              value={commitment} 
              hasNone={commitmentNone}
              onChange={setCommitment} 
              onHasNoneChange={setCommitmentNone}
            />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <VoiceTextarea
                label="Quick Reflection (Optional)"
                helpText="What would you do differently next time? What surprised you?"
                value={reflection}
                onChange={setReflection}
                placeholder="Optional — any insights or lessons from this rep..."
                rows={3}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  const stepLabels = ['When', 'Context', 'What You Said', 'Their Response', 'Commitment'];
  
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Debrief Your Rep"
      icon={Send}
      subtitle={`${rep?.person || ''} • ${repTypeInfo?.shortLabel || rep?.repType || ''}`}
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      stepLabels={stepLabels}
      contextBar={
        <div className="flex justify-center">
          <EvidenceLevelBadge level={evidenceLevel} />
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
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
              disabled={completedSteps.length < TOTAL_STEPS || isSubmitting || isLoading}
              className="bg-corporate-teal hover:bg-corporate-teal-dark text-white"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Debrief
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      {renderStepContent()}
      
      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </ConditioningModal>
  );
};

// Export constants for use elsewhere
export { WHEN_OPTIONS, CONTEXT_OPTIONS, RESPONSE_OPTIONS };
export default StructuredEvidenceModal;
