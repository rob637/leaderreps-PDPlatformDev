// src/components/conditioning/StructuredEvidenceModal.jsx
// Sprint 3: Structured Evidence Capture (replaces weak free-text)
// Per Ryan's 020726 notes: Concrete specifics that are hard to fake

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService, { EVIDENCE_LEVEL } from '../../services/conditioningService.js';
import { getRepType } from '../../services/repTaxonomy.js';
import { Card, Button } from '../ui';
import { 
  X, Clock, CheckCircle, AlertCircle, Plus, Trash2, Send,
  User, Calendar, MessageSquare, ArrowRight, Target
} from 'lucide-react';

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
// FORM STEP INDICATOR
// ============================================
const StepIndicator = ({ currentStep, totalSteps, completedSteps }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {Array.from({ length: totalSteps }, (_, idx) => (
        <div
          key={idx}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            idx === currentStep 
              ? 'bg-corporate-navy scale-125' 
              : completedSteps.includes(idx)
              ? 'bg-green-500'
              : 'bg-gray-300'
          }`}
        />
      ))}
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
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              value === option.id
                ? 'border-corporate-navy bg-corporate-navy/5'
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
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              value === option.id
                ? 'border-corporate-navy bg-corporate-navy/5'
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
// BULLET POINTS FIELD (What you said/did)
// ============================================
const BulletPointsField = ({ value = [], onChange, minItems = 2, maxItems = 5 }) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleAdd = () => {
    if (inputValue.trim() && value.length < maxItems) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };
  
  const handleRemove = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAdd();
    }
  };
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        <MessageSquare className="w-4 h-4 inline mr-2" />
        What did you say/do? (Be specific - {minItems}-{maxItems} bullet points)
      </label>
      
      {/* Existing bullets */}
      <div className="space-y-2">
        {value.map((bullet, idx) => (
          <div 
            key={idx}
            className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
          >
            <span className="text-corporate-navy font-bold mt-0.5">•</span>
            <span className="flex-1 text-sm">{bullet}</span>
            <button
              onClick={() => handleRemove(idx)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Add new bullet */}
      {value.length < maxItems && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., I said 'I noticed you've been...' then asked..."
            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-navy/20 focus:border-corporate-navy"
          />
          <Button
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="bg-corporate-navy hover:bg-corporate-navy/90 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Validation feedback */}
      <div className={`text-xs ${value.length >= minItems ? 'text-green-600' : 'text-gray-500'}`}>
        {value.length}/{minItems} minimum bullets added
        {value.length >= minItems && <CheckCircle className="w-3 h-3 inline ml-1" />}
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
            className={`p-2 rounded-lg border-2 text-left text-sm transition-all ${
              value === option.id
                ? option.sentiment === 'positive' 
                  ? 'border-green-500 bg-green-50'
                  : option.sentiment === 'negative'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-corporate-navy bg-corporate-navy/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {/* Brief note */}
      {value && (
        <div className="mt-2">
          <label className="block text-xs text-gray-600 mb-1">
            Brief note on their response (optional):
          </label>
          <textarea
            value={note || ''}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="e.g., They seemed relieved I brought it up..."
            className="w-full p-2 border border-gray-300 rounded-lg text-sm min-h-[60px] resize-none focus:ring-2 focus:ring-corporate-navy/20 focus:border-corporate-navy"
          />
        </div>
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
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g., They agreed to notify me before missing meetings going forward..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-corporate-navy/20 focus:border-corporate-navy"
          />
          <button
            onClick={() => onHasNoneChange(true)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            No explicit commitment was made
          </button>
        </>
      ) : (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Marking as "no explicit commitment" – why not?
          </p>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g., This was an exploratory conversation, I wanted to understand first..."
            className="w-full p-2 border border-gray-300 rounded text-sm min-h-[60px] resize-none focus:ring-2 focus:ring-corporate-navy/20 focus:border-corporate-navy"
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
// OPTIONAL REFLECTION FIELD
// ============================================
const ReflectionField = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        Quick Reflection (Optional)
      </label>
      <p className="text-xs text-gray-500">
        What would you do differently next time? What surprised you?
      </p>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional - any insights or lessons from this rep..."
        className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[60px] resize-none focus:ring-2 focus:ring-corporate-navy/20 focus:border-corporate-navy"
      />
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
  const [whatSaid, setWhatSaid] = useState([]);
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
      case 2: return whatSaid.length >= 2;
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
    if (whatSaid.length >= 2) completed.push(2);
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
        
        // WHAT WAS SAID/DONE
        what_said: whatSaid,
        
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
        return <BulletPointsField value={whatSaid} onChange={setWhatSaid} />;
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
              <ReflectionField value={reflection} onChange={setReflection} />
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  const stepLabels = ['When', 'Context', 'What You Said', 'Their Response', 'Commitment'];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-corporate-navy">Debrief Your Rep</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Rep Context */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <User className="w-4 h-4" />
            <span className="font-medium">{rep?.person}</span>
            <span>•</span>
            <span>{repTypeInfo?.shortLabel || rep?.repType}</span>
          </div>
          
          {/* Evidence Level Badge */}
          <EvidenceLevelBadge level={evidenceLevel} />
          
          {/* Step Indicator */}
          <div className="mt-3">
            <StepIndicator 
              currentStep={currentStep} 
              totalSteps={TOTAL_STEPS}
              completedSteps={completedSteps}
            />
            <div className="text-center text-xs text-gray-500">
              Step {currentStep + 1}: {stepLabels[currentStep]}
            </div>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderStepContent()}
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        {/* Footer - Navigation & Submit */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
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
                className="bg-green-600 hover:bg-green-700 text-white"
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
        </div>
      </Card>
    </div>
  );
};

// Export constants for use elsewhere
export { WHEN_OPTIONS, CONTEXT_OPTIONS, RESPONSE_OPTIONS };
export default StructuredEvidenceModal;
