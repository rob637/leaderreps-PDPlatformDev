// src/components/conditioning/EvidenceCaptureModal.jsx
// V1 UX: Simplified single-input debrief modal
// Future: Voice input and structured prompts

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  conditioningService, 
  EVIDENCE_LEVEL
} from '../../services/conditioningService.js';
import { Card, Button } from '../ui';
import { 
  X, Mic, MicOff, Clock, 
  AlertCircle, Send, MessageSquare
} from 'lucide-react';

// ============================================
// VOICE INPUT COMPONENT (Placeholder for future)
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-corporate-navy to-corporate-navy/90">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Debrief Your Rep</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Rep Context */}
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span className="font-medium">{rep?.person}</span>
            <span>•</span>
            <span>{rep?.repType}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Evidence Level Badge */}
          <div className="flex justify-center mb-4">
            <EvidenceLevelBadge level={evidenceLevel} />
          </div>
          
          {/* V1: Single debrief prompt */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-corporate-navy">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              What happened?
            </label>
            <p className="text-sm text-gray-600">
              Quick capture: How did the conversation go? What did you actually say or do?
            </p>
            
            <div className="relative">
              <textarea
                value={debriefText}
                onChange={(e) => setDebriefText(e.target.value)}
                placeholder="I said... They responded... The outcome was..."
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg text-sm min-h-[150px] resize-none focus:ring-2 focus:ring-corporate-navy focus:border-transparent"
                autoFocus
              />
              <div className="absolute right-2 bottom-2">
                <VoiceInput 
                  onTranscription={(text) => setDebriefText(prev => prev ? `${prev} ${text}` : text)}
                />
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>{debriefText.length} characters</span>
              {debriefText.length < 20 && (
                <span className="text-amber-500">Min 20 characters</span>
              )}
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-3">
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
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
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
        </div>
      </Card>
    </div>
  );
};

export default EvidenceCaptureModal;
