// src/components/conditioning/EvidenceCaptureModal.jsx
// Phase 2: Evidence capture and debrief form for completed reps
// Supports written and voice input with Level 1/2 distinction

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  conditioningService, 
  EVIDENCE_LEVEL,
  LEVEL_1_PROMPTS,
  LEVEL_2_PROMPTS
} from '../../services/conditioningService.js';
import { Card, Button } from '../ui';
import { 
  X, Mic, MicOff, Clock, CheckCircle, 
  AlertCircle, ChevronRight, ChevronLeft, Send
} from 'lucide-react';

// ============================================
// VOICE INPUT COMPONENT (Placeholder for Phase 2+)
// ============================================
const VoiceInput = ({ onTranscription, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  
  // Note: Full voice recording implementation would require:
  // - MediaRecorder API
  // - Firebase Storage upload
  // - Speech-to-text transcription (e.g., Google Cloud Speech)
  // For now, this is a placeholder that shows the UI
  
  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate transcription for demo
      onTranscription?.("I said to them directly: 'I noticed you've been late to the last three meetings. Can we talk about what's going on?'");
    } else {
      setIsRecording(true);
    }
  };
  
  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      disabled={disabled}
      className={`p-3 rounded-full transition-all ${
        isRecording 
          ? 'bg-red-500 text-white animate-pulse' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};

// ============================================
// SINGLE PROMPT CARD
// ============================================
const PromptCard = ({ prompt, value, onChange, isActive }) => {
  return (
    <div className={`transition-all ${isActive ? 'opacity-100' : 'opacity-50'}`}>
      <label className="block text-sm font-medium text-corporate-navy mb-2">
        {prompt.label}
      </label>
      <p className="text-sm text-gray-600 mb-3">{prompt.prompt}</p>
      
      <div className="relative">
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your response..."
          className="w-full p-3 pr-12 border border-gray-300 rounded-lg text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-corporate-navy focus:border-transparent"
          disabled={!isActive}
        />
        <div className="absolute right-2 bottom-2">
          <VoiceInput 
            onTranscription={(text) => onChange(value ? `${value} ${text}` : text)}
            disabled={!isActive}
          />
        </div>
      </div>
      
      {value && value.length > 0 && (
        <div className="mt-1 text-xs text-gray-400 text-right">
          {value.length} characters
        </div>
      )}
    </div>
  );
};

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
// MAIN EVIDENCE CAPTURE MODAL
// ============================================
const EvidenceCaptureModal = ({ rep, onClose, onSubmit, isLoading }) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  // Determine evidence level
  const evidenceLevel = useMemo(() => {
    return conditioningService.getEvidenceLevel(rep?.completedAt);
  }, [rep?.completedAt]);
  
  // Get appropriate prompts
  const prompts = useMemo(() => {
    return evidenceLevel === EVIDENCE_LEVEL.LEVEL_1 ? LEVEL_1_PROMPTS : LEVEL_2_PROMPTS;
  }, [evidenceLevel]);
  
  // Form state - responses for each prompt
  const [responses, setResponses] = useState({});
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Calculate completion progress
  const completedPrompts = Object.values(responses).filter(r => r && r.length >= 10).length;
  const progress = Math.round((completedPrompts / prompts.length) * 100);
  const isComplete = completedPrompts === prompts.length;
  
  const handleResponseChange = (promptId, value) => {
    setResponses(prev => ({
      ...prev,
      [promptId]: value
    }));
  };
  
  const handleNext = () => {
    if (currentPromptIndex < prompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(prev => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!isComplete) {
      setError('Please complete all prompts before submitting');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await conditioningService.submitEvidence(db, userId, rep.id, {
        responses,
        inputMethod: 'written'
      });
      
      onSubmit?.(result);
      onClose?.();
    } catch (err) {
      console.error('Error submitting evidence:', err);
      setError('Failed to submit evidence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const currentPrompt = prompts[currentPromptIndex];
  
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
            <span className="font-medium">{rep?.person}</span>
            <span>•</span>
            <span>{rep?.repType}</span>
          </div>
          
          {/* Evidence Level Badge */}
          <EvidenceLevelBadge level={evidenceLevel} />
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{completedPrompts}/{prompts.length} complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-corporate-navy transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Prompt Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {prompts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPromptIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentPromptIndex 
                    ? 'bg-corporate-navy scale-125' 
                    : responses[prompts[idx].id]?.length >= 10
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                aria-label={`Go to prompt ${idx + 1}`}
              />
            ))}
          </div>
          
          {/* Current Prompt */}
          <PromptCard
            prompt={currentPrompt}
            value={responses[currentPrompt.id]}
            onChange={(value) => handleResponseChange(currentPrompt.id, value)}
            isActive={true}
          />
          
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
            {/* Previous Button */}
            <Button
              onClick={handlePrevious}
              disabled={currentPromptIndex === 0}
              variant="outline"
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            {/* Next or Submit */}
            {currentPromptIndex < prompts.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-1 bg-corporate-navy hover:bg-corporate-navy/90 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isComplete || isSubmitting || isLoading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Debrief
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Completion Hint */}
          {!isComplete && currentPromptIndex === prompts.length - 1 && (
            <p className="mt-2 text-xs text-center text-amber-600">
              Complete all prompts to submit (min 10 characters each)
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EvidenceCaptureModal;
