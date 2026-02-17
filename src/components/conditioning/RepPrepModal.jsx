// src/components/conditioning/RepPrepModal.jsx
// Phase 2: Optional Rep Prep - Think through the rep before execution
// Structured prompts: Opening language, Behavior to address, Commitment to request

import React, { useState } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService from '../../services/conditioningService.js';
import { Card, Button } from '../ui';
import { 
  X, Mic, MicOff, ChevronRight, ChevronLeft, 
  CheckCircle, Save, AlertCircle, MessageSquare,
  Target, Handshake, Lightbulb
} from 'lucide-react';

// ============================================
// PREP PROMPTS - Structured thinking before rep
// ============================================
const PREP_PROMPTS = [
  {
    id: 'opening_language',
    icon: MessageSquare,
    label: 'Opening Language',
    prompt: 'What will you say to open this conversation?',
    placeholder: 'I want to talk with you about...',
    tip: 'Be direct but respectful. Name the topic clearly.'
  },
  {
    id: 'behavior_to_address',
    icon: Target,
    label: 'Behavior to Address',
    prompt: 'What specific behavior or situation will you address?',
    placeholder: 'The specific behavior I need to address is...',
    tip: 'Be specific about what you observed, not interpretations.'
  },
  {
    id: 'commitment_to_request',
    icon: Handshake,
    label: 'Commitment to Request',
    prompt: 'What commitment will you ask them to make?',
    placeholder: 'I will ask them to commit to...',
    tip: 'Make it specific, measurable, and time-bound if possible.'
  }
];

// ============================================
// VOICE INPUT COMPONENT (Placeholder)
// ============================================
const VoiceInput = ({ onTranscription, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  
  // Note: Full voice recording would require MediaRecorder + Speech-to-Text
  // This is a placeholder that shows the UI
  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate transcription for demo
      onTranscription?.('(Voice input would appear here after transcription)');
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
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
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
const PrepPromptCard = ({ prompt, value, onChange, isActive }) => {
  const Icon = prompt.icon;
  
  return (
    <div className={`transition-all ${isActive ? 'opacity-100' : 'opacity-50'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-corporate-navy/10 rounded-full">
          <Icon className="w-5 h-5 text-corporate-navy" />
        </div>
        <h4 className="font-semibold text-corporate-navy">{prompt.label}</h4>
      </div>
      
      {/* Prompt Question */}
      <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">{prompt.prompt}</p>
      
      {/* Input Area */}
      <div className="relative">
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={prompt.placeholder}
          className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-corporate-navy focus:border-transparent"
          disabled={!isActive}
        />
        <div className="absolute right-2 bottom-2">
          <VoiceInput 
            onTranscription={(text) => onChange(value ? `${value} ${text}` : text)}
            disabled={!isActive}
          />
        </div>
      </div>
      
      {/* Tip */}
      <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span className="italic">{prompt.tip}</span>
      </div>
      
      {/* Character count */}
      {value && value.length > 0 && (
        <div className="mt-1 text-xs text-gray-400 text-right">
          {value.length} characters
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN REP PREP MODAL
// ============================================
const RepPrepModal = ({ rep, existingPrep, onClose, onSave, isLoading }) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  // Form state - responses for each prompt
  const [responses, setResponses] = useState(() => {
    // Initialize from existing prep if available
    if (existingPrep) {
      return {
        opening_language: existingPrep.opening_language || '',
        behavior_to_address: existingPrep.behavior_to_address || '',
        commitment_to_request: existingPrep.commitment_to_request || ''
      };
    }
    return {
      opening_language: '',
      behavior_to_address: '',
      commitment_to_request: ''
    };
  });
  
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Calculate completion progress
  const completedPrompts = Object.values(responses).filter(r => r && r.length >= 5).length;
  const progress = Math.round((completedPrompts / PREP_PROMPTS.length) * 100);
  const hasAnyContent = completedPrompts > 0;
  
  const handleResponseChange = (promptId, value) => {
    setResponses(prev => ({
      ...prev,
      [promptId]: value
    }));
  };
  
  const handleNext = () => {
    if (currentPromptIndex < PREP_PROMPTS.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(prev => prev - 1);
    }
  };
  
  const handleSave = async () => {
    if (!hasAnyContent) {
      setError('Add at least some prep notes before saving');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await conditioningService.saveRepPrep(db, userId, rep.id, {
        opening_language: responses.opening_language?.trim() || null,
        behavior_to_address: responses.behavior_to_address?.trim() || null,
        commitment_to_request: responses.commitment_to_request?.trim() || null,
        inputMethod: 'written'
      });
      
      onSave?.();
      onClose?.();
    } catch (err) {
      console.error('Error saving prep:', err);
      setError('Failed to save prep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const currentPrompt = PREP_PROMPTS[currentPromptIndex];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4 pb-20 md:pb-4">
      <Card 
        className="w-full max-w-lg max-h-[calc(100vh-6rem)] md:max-h-[90vh] overflow-hidden flex flex-col"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-corporate-navy to-corporate-navy/90">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Prep Your Rep</h3>
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
        
        {/* Info Banner */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800">
            <strong>Optional prep:</strong> Think through your rep before executing. 
            Your notes won't be rewritten or validated — this is for your thinking.
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{completedPrompts}/{PREP_PROMPTS.length} prompts</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-corporate-navy transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Prompt Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {PREP_PROMPTS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPromptIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentPromptIndex 
                    ? 'bg-corporate-navy scale-125' 
                    : responses[PREP_PROMPTS[idx].id]?.length >= 5
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                aria-label={`Go to prompt ${idx + 1}`}
              />
            ))}
          </div>
          
          {/* Current Prompt */}
          <PrepPromptCard
            prompt={currentPrompt}
            value={responses[currentPrompt.id]}
            onChange={(value) => handleResponseChange(currentPrompt.id, value)}
            isActive={true}
          />
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        {/* Footer - Navigation & Save - Mobile-safe padding */}
        <div 
          className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
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
            
            {/* Next or Save */}
            {currentPromptIndex < PREP_PROMPTS.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-1 bg-corporate-navy hover:bg-corporate-navy/90 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!hasAnyContent || isSubmitting || isLoading}
                className="flex items-center gap-2 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Prep
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Skip option */}
          <div className="mt-3 text-center">
            <button
              onClick={onClose}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 underline"
            >
              Skip prep — I'm ready to execute
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RepPrepModal;
