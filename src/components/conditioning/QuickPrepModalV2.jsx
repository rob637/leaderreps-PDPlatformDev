// src/components/conditioning/QuickPrepModalV2.jsx
// V2 Quick Prep - 60-120 second alignment check before rep execution
// Max 2 prompts per rep type with hard character limits to prevent over-thinking

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService from '../../services/conditioningService.js';
import { getPrepPromptsV2 } from '../../services/repTaxonomy.js';
import { Button } from '../ui';
import { 
  Lightbulb, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  Clock
} from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';

// ============================================
// CHARACTER LIMIT INDICATOR
// ============================================
const CharLimitIndicator = ({ current, max }) => {
  const remaining = max - current;
  const isNearLimit = remaining <= 20;
  const isOverLimit = remaining < 0;
  
  return (
    <div className={`text-xs font-medium ${
      isOverLimit ? 'text-red-500' :
      isNearLimit ? 'text-amber-500' :
      'text-gray-400'
    }`}>
      {remaining} characters left
    </div>
  );
};

// ============================================
// SINGLE PROMPT INPUT
// ============================================
const PrepPromptInput = ({ 
  prompt, 
  promptIndex, 
  value, 
  onChange, 
  isActive
}) => {
  return (
    <div className={`space-y-3 transition-all ${isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
      {/* Question */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-corporate-teal/20 text-corporate-teal flex items-center justify-center text-sm font-bold">
          {promptIndex + 1}
        </div>
        <p className="text-base font-medium text-corporate-navy dark:text-white">
          {prompt.prompt}
        </p>
      </div>
      
      {/* Input with voice */}
      <VoiceTextarea
        id={`prep-${promptIndex}`}
        value={value}
        onChange={(val) => onChange(val.slice(0, prompt.maxChars || 100))}
        placeholder="Quick answer..."
        rows={2}
        required
        minLength={10}
        error={value.length > 0 && value.trim().length < 10 ? 'Minimum 10 characters' : null}
        autoFocus={isActive && promptIndex === 0}
        className="w-full"
      />
      
      {/* Character limit */}
      <div className="flex justify-end">
        <CharLimitIndicator current={value.length} max={prompt.maxChars || 100} />
      </div>
    </div>
  );
};

// ============================================
// MAIN QUICK PREP MODAL V2
// ============================================
const QuickPrepModalV2 = ({ 
  rep, 
  existingPrep,
  onClose, 
  onSave
}) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  // Get prompts for this rep type
  const prompts = useMemo(() => {
    return getPrepPromptsV2(rep?.repTypeId || rep?.repType);
  }, [rep?.repTypeId, rep?.repType]);
  
  // Current step (0 or 1)
  const [currentStep, setCurrentStep] = useState(0);
  
  // Responses for each prompt
  const [responses, setResponses] = useState(() => {
    // Initialize from existing prep if available
    if (existingPrep?.responses) {
      return existingPrep.responses;
    }
    return prompts.map(() => '');
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if current step is complete
  const isCurrentStepComplete = responses[currentStep]?.trim().length >= 10;
  
  // Check if all steps are complete (at least 10 chars each)
  const isAllComplete = responses.every(r => r.trim().length >= 10);
  
  const handleResponseChange = (index, value) => {
    const newResponses = [...responses];
    newResponses[index] = value;
    setResponses(newResponses);
  };
  
  const handleNext = () => {
    if (currentStep < prompts.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSave = async () => {
    if (!isAllComplete) {
      setError('Please answer both questions briefly');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Build prep data
      const prepData = {
        responses: prompts.map((p, i) => ({
          promptId: `prompt_${i}`,
          prompt: p.prompt,
          response: responses[i].trim()
        })),
        completedAt: new Date().toISOString(),
        version: 'v2'
      };
      
      await conditioningService.savePrepV2(db, userId, rep.id, prepData);
      
      onSave?.(prepData);
      onClose?.();
    } catch (err) {
      console.error('Error saving prep:', err);
      setError('Failed to save prep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle skip (save partial or empty)
  const handleSkip = async () => {
    try {
      setIsSubmitting(true);
      
      const prepData = {
        responses: prompts.map((p, i) => ({
          promptId: `prompt_${i}`,
          prompt: p.prompt,
          response: responses[i]?.trim() || ''
        })),
        skipped: true,
        completedAt: new Date().toISOString(),
        version: 'v2'
      };
      
      await conditioningService.savePrepV2(db, userId, rep.id, prepData);
      
      onSave?.(prepData);
      onClose?.();
    } catch (err) {
      console.error('Error skipping prep:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If no prompts for this rep type, show a simple confirmation
  if (prompts.length === 0) {
    return (
      <ConditioningModal
        isOpen={true}
        onClose={onClose}
        title="Ready to Execute"
        icon={Lightbulb}
        subtitle={`${rep?.person || 'Your Rep'} • ${rep?.repType || ''}`}
      >
        <div className="p-4 text-center">
          <div className="mb-4 p-4 bg-corporate-teal/10 dark:bg-corporate-teal/20 rounded-xl">
            <CheckCircle className="w-12 h-12 text-corporate-teal mx-auto mb-2" />
            <p className="text-corporate-navy dark:text-white font-medium">
              No prep needed for this rep type.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Go make it happen!
            </p>
          </div>
          
          <Button 
            onClick={onClose}
            className="w-full bg-corporate-teal text-white"
          >
            Got it
          </Button>
        </div>
      </ConditioningModal>
    );
  }
  
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Quick Prep"
      icon={Lightbulb}
      subtitle={`${rep?.person || 'Your Rep'} • ${rep?.repType || ''}`}
      contextBar={
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>60-120 seconds</span>
        </div>
      }
    >
      <div className="p-4 space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          {prompts.map((_, i) => (
            <div 
              key={i}
              className={`w-8 h-1 rounded-full transition-colors ${
                i === currentStep 
                  ? 'bg-corporate-teal' 
                  : i < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        {/* Current prompt */}
        {prompts.map((prompt, index) => (
          <div key={index} className={currentStep === index ? 'block' : 'hidden'}>
            <PrepPromptInput
              prompt={prompt}
              promptIndex={index}
              value={responses[index] || ''}
              onChange={(val) => handleResponseChange(index, val)}
              isActive={currentStep === index}
              repTypeName={rep?.repType}
            />
          </div>
        ))}
        
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex justify-between gap-3 pt-2">
          {currentStep > 0 ? (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-gray-500"
            >
              Skip prep
            </Button>
          )}
          
          {currentStep < prompts.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isCurrentStepComplete}
              className="flex items-center gap-1 bg-corporate-teal text-white"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!isAllComplete || isSubmitting}
              loading={isSubmitting}
              className="flex items-center gap-1 bg-corporate-teal text-white"
            >
              <CheckCircle className="w-4 h-4" />
              I'm Ready
            </Button>
          )}
        </div>
      </div>
    </ConditioningModal>
  );
};

export default QuickPrepModalV2;
