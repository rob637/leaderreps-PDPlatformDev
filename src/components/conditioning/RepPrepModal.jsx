// src/components/conditioning/RepPrepModal.jsx
// Phase 2: Optional Rep Prep - Think through the rep before execution
// Structured prompts: Opening language, Behavior to address, Commitment to request
// UX v2: Uses ConditioningModal + VoiceTextarea for consistent styling

import React, { useState } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService from '../../services/conditioningService.js';
import { Button } from '../ui';
import { 
  ChevronRight, ChevronLeft, Save, AlertCircle, 
  MessageSquare, Target, Handshake, Lightbulb, FileText
} from 'lucide-react';
import ConditioningModal, { StepIndicator } from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';

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

const STEP_LABELS = PREP_PROMPTS.map(p => p.label);

// ============================================
// SINGLE PROMPT STEP
// ============================================
const PrepPromptStep = ({ prompt, value, onChange }) => {
  const Icon = prompt.icon;
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-corporate-teal/10 rounded-full">
          <Icon className="w-5 h-5 text-corporate-teal" />
        </div>
        <div>
          <h4 className="font-semibold text-corporate-navy dark:text-white">{prompt.label}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{prompt.prompt}</p>
        </div>
      </div>
      
      {/* Input Area with Voice */}
      <VoiceTextarea
        id={`prep-${prompt.id}`}
        value={value || ''}
        onChange={onChange}
        placeholder={prompt.placeholder}
        rows={4}
        autoFocus
      />
      
      {/* Tip */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <span className="text-xs text-blue-700 dark:text-blue-300 italic">{prompt.tip}</span>
      </div>
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
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Calculate completion progress
  const completedPrompts = Object.values(responses).filter(r => r && r.length >= 5).length;
  const hasAnyContent = completedPrompts > 0;
  
  const handleResponseChange = (promptId, value) => {
    setResponses(prev => ({
      ...prev,
      [promptId]: value
    }));
  };
  
  const handleNext = () => {
    if (currentStep < PREP_PROMPTS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
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
  
  const currentPrompt = PREP_PROMPTS[currentStep];
  const isLastStep = currentStep === PREP_PROMPTS.length - 1;
  
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Prep Your Rep"
      icon={FileText}
      subtitle={`${rep?.person || 'Rep'} • ${rep?.repType || ''}`}
      currentStep={currentStep}
      totalSteps={PREP_PROMPTS.length}
      stepLabels={STEP_LABELS}
    >
      {/* Info Banner */}
      <div className="px-4 pt-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Optional prep:</strong> Think through your rep before executing. 
            Your notes won't be rewritten — this is for your thinking.
          </p>
        </div>
      </div>
      
      {/* Current Prompt */}
      <PrepPromptStep
        prompt={currentPrompt}
        value={responses[currentPrompt.id]}
        onChange={(value) => handleResponseChange(currentPrompt.id, value)}
      />
      
      {/* Error Message */}
      {error && (
        <div className="mx-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Footer - Navigation & Save */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 space-y-3">
        <div className="flex items-center gap-3">
          {/* Previous Button */}
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          
          {/* Next or Save */}
          {!isLastStep ? (
            <Button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!hasAnyContent || isSubmitting || isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
            >
              {isSubmitting ? (
                'Saving...'
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
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Skip prep — I'm ready to execute
          </button>
        </div>
      </div>
    </ConditioningModal>
  );
};

export default RepPrepModal;
