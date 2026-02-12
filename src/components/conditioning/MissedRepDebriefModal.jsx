// src/components/conditioning/MissedRepDebriefModal.jsx
// Sprint 4: Structured accountability for missed reps (not punishment)
// Per Ryan's 020726 notes: Debrief without guilt, learn for next time
// UX v2: Uses ConditioningModal + VoiceTextarea, consistent look

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService from '../../services/conditioningService.js';
import { getRepType } from '../../services/repTaxonomy.js';
import { Button } from '../ui';
import { 
  AlertTriangle, RefreshCw, ChevronRight, 
  Clock, Shield, Lightbulb, ArrowRight, Check, X
} from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';

// ============================================
// BLOCKER OPTIONS
// ============================================
const BLOCKER_OPTIONS = [
  { id: 'ran_out_of_time', label: 'Ran out of time', icon: Clock, category: 'tactical' },
  { id: 'opportunity_didnt_arise', label: "Opportunity didn't arise", icon: Clock, category: 'tactical' },
  { id: 'avoided_courage', label: 'Avoided it (needed courage)', icon: Shield, category: 'internal' },
  { id: 'avoided_clarity', label: 'Avoided it (needed clarity)', icon: Lightbulb, category: 'internal' },
  { id: 'person_unavailable', label: 'Person was unavailable', icon: Clock, category: 'external' },
  { id: 'priorities_shifted', label: 'Priorities shifted', icon: RefreshCw, category: 'tactical' },
  { id: 'other', label: 'Other', icon: ArrowRight, category: 'other' }
];

// ============================================
// STANDARD BREAKDOWN OPTIONS
// ============================================
const STANDARD_OPTIONS = [
  { id: 'time_management', label: 'Time management', description: 'Didn\'t protect time for the rep' },
  { id: 'courage', label: 'Courage', description: 'Avoided discomfort or conflict' },
  { id: 'clarity', label: 'Clarity', description: 'Wasn\'t sure how to approach it' },
  { id: 'support_needed', label: 'Support needed', description: 'Needed coaching/help beforehand' },
  { id: 'external_factors', label: 'External factors', description: 'Genuinely outside my control' }
];

// ============================================
// BLOCKER SELECTOR
// ============================================
const BlockerSelector = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        What got in the way?
      </label>
      <p className="text-xs text-gray-500 mb-2">
        No judgment — understanding blockers helps you improve next time.
      </p>
      <div className="space-y-2">
        {BLOCKER_OPTIONS.map(option => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                value === option.id
                  ? 'border-corporate-teal bg-corporate-teal/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${value === option.id ? 'text-corporate-teal' : 'text-gray-400'}`} />
              <span className="text-sm">{option.label}</span>
              {value === option.id && <Check className="w-4 h-4 text-corporate-teal ml-auto" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// STANDARD BREAKDOWN SELECTOR
// ============================================
const StandardSelector = ({ value, onChange, blocker }) => {
  // Pre-select based on blocker if possible
  const suggestedStandard = useMemo(() => {
    const blockerConfig = BLOCKER_OPTIONS.find(b => b.id === blocker);
    if (blockerConfig?.category === 'internal') {
      return blocker.includes('courage') ? 'courage' : 'clarity';
    }
    if (blockerConfig?.category === 'tactical') {
      return 'time_management';
    }
    return null;
  }, [blocker]);
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        Which standard broke down?
      </label>
      <p className="text-xs text-gray-500 mb-2">
        This helps identify patterns over time — not for blame.
      </p>
      <div className="space-y-2">
        {STANDARD_OPTIONS.map(option => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`w-full flex flex-col p-3 rounded-xl border-2 text-left transition-all ${
              value === option.id
                ? 'border-corporate-teal bg-corporate-teal/5'
                : suggestedStandard === option.id
                ? 'border-amber-300 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-gray-500">{option.description}</span>
            {suggestedStandard === option.id && value !== option.id && (
              <span className="text-xs text-amber-600 mt-1">← Suggested based on blocker</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// NEXT WEEK PLAN
// ============================================
const NextWeekPlan = ({ value, onChange, blocker, standard }) => {
  // Generate contextual prompts based on blocker and standard
  const prompts = useMemo(() => {
    const basePrompts = [];
    
    if (standard === 'time_management') {
      basePrompts.push('When will you schedule time for this rep next week?');
    }
    if (standard === 'courage') {
      basePrompts.push('What support or prep would help you feel ready?');
    }
    if (standard === 'clarity') {
      basePrompts.push('Who could you talk to first to get clear?');
    }
    if (blocker === 'person_unavailable') {
      basePrompts.push('When is the person available next week?');
    }
    if (blocker === 'opportunity_didnt_arise') {
      basePrompts.push('Can you create the opportunity instead of waiting?');
    }
    
    return basePrompts.length > 0 
      ? basePrompts 
      : ['What concrete step will you take to complete this rep?'];
  }, [blocker, standard]);
  
  return (
    <div className="space-y-3">
      {/* Contextual prompts */}
      <div className="bg-corporate-navy/5 border border-corporate-navy/10 rounded-xl p-3">
        <p className="text-xs text-corporate-navy font-medium mb-1">Consider:</p>
        <ul className="text-xs text-corporate-navy/70 space-y-1">
          {prompts.map((prompt, idx) => (
            <li key={idx}>• {prompt}</li>
          ))}
        </ul>
      </div>
      
      <VoiceTextarea
        label="What will you do differently next week?"
        value={value || ''}
        onChange={onChange}
        placeholder="Be specific — vague intentions rarely work..."
        minLength={20}
        rows={4}
      />
    </div>
  );
};

// ============================================
// RECOMMIT OPTIONS
// ============================================
const RecommitOptions = ({ rep, selectedOption, onChange, cancelReason, onCancelReasonChange }) => {
  const repType = useMemo(() => getRepType(rep?.repType), [rep?.repType]);
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        What do you want to do with this rep?
      </label>
      
      <div className="space-y-2">
        <button
          onClick={() => onChange('recommit')}
          className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
            selectedOption === 'recommit'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <RefreshCw className={`w-5 h-5 mt-0.5 ${selectedOption === 'recommit' ? 'text-green-600' : 'text-gray-400'}`} />
          <div>
            <span className="text-sm font-medium">Recommit for this week</span>
            <p className="text-xs text-gray-500">
              Try again with {rep?.person} — same rep type ({repType?.shortLabel || rep?.repType})
            </p>
          </div>
        </button>
        
        <button
          onClick={() => onChange('modify')}
          className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
            selectedOption === 'modify'
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <ArrowRight className={`w-5 h-5 mt-0.5 ${selectedOption === 'modify' ? 'text-amber-600' : 'text-gray-400'}`} />
          <div>
            <span className="text-sm font-medium">Modify and recommit</span>
            <p className="text-xs text-gray-500">
              Adjust the person, rep type, or difficulty level
            </p>
          </div>
        </button>
        
        <button
          onClick={() => onChange('cancel')}
          className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
            selectedOption === 'cancel'
              ? 'border-gray-500 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <X className={`w-5 h-5 mt-0.5 ${selectedOption === 'cancel' ? 'text-gray-600' : 'text-gray-400'}`} />
          <div>
            <span className="text-sm font-medium">Cancel this rep</span>
            <p className="text-xs text-gray-500">
              The situation has changed — this rep is no longer relevant
            </p>
          </div>
        </button>
      </div>
      
      {selectedOption === 'cancel' && (
        <VoiceTextarea
          label="Why is this no longer relevant?"
          value={cancelReason || ''}
          onChange={onCancelReasonChange}
          placeholder="e.g., Person left the team, situation resolved itself..."
          rows={3}
          className="mt-4"
        />
      )}
    </div>
  );
};

// ============================================
// MAIN MODAL
// ============================================
const MissedRepDebriefModal = ({ 
  isOpen, 
  onClose, 
  rep, 
  onRecommit, 
  onModify, 
  onCancel,
  isLoading = false 
}) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [blocker, setBlocker] = useState('');
  const [standard, setStandard] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState('');
  const [recommitOption, setRecommitOption] = useState('recommit');
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const repType = useMemo(() => getRepType(rep?.repType), [rep?.repType]);
  
  // Validation
  const isStep1Valid = !!blocker;
  const isStep2Valid = !!standard;
  const isStep3Valid = nextWeekPlan.length >= 20;
  const isStep4Valid = recommitOption === 'cancel' ? cancelReason.length >= 10 : true;
  
  const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid;
  
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Please complete all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Save the missed rep debrief
      const debriefData = {
        what_blocked: blocker,
        standard_breakdown: standard,
        next_week_different: nextWeekPlan,
        recommit_decision: recommitOption,
        cancelReason: recommitOption === 'cancel' ? cancelReason : null,
        submittedAt: new Date().toISOString()
      };
      
      // Save debrief to the rep
      await conditioningService.saveMissedRepDebrief(db, userId, rep.id, debriefData);
      
      // Handle the recommit decision
      switch (recommitOption) {
        case 'recommit':
          onRecommit?.(rep.id);
          break;
        case 'modify':
          onModify?.(rep);
          break;
        case 'cancel':
          onCancel?.(rep.id, cancelReason);
          break;
      }
      
      onClose?.();
    } catch (err) {
      console.error('Error saving missed rep debrief:', err);
      setError('Failed to save debrief. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!rep) return null;
  
  const stepLabels = ['What Blocked', 'Standard', "Next Week's Plan", 'Next Action'];
  
  return (
    <ConditioningModal
      isOpen={isOpen}
      onClose={onClose}
      title="Missed Rep Debrief"
      icon={AlertTriangle}
      subtitle={`${rep?.person || ''} • ${repType?.shortLabel || rep?.repType || ''}`}
      currentStep={currentStep}
      totalSteps={4}
      stepLabels={stepLabels}
      contextBar={
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-600">
            This rep was not completed by the deadline. Let's understand why and set up for success next time.
          </p>
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
          
          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !isStep1Valid) ||
                (currentStep === 1 && !isStep2Valid) ||
                (currentStep === 2 && !isStep3Valid)
              }
              className="bg-corporate-navy hover:bg-corporate-navy/90 text-white"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting || isLoading}
              className="bg-corporate-teal hover:bg-corporate-teal-dark text-white"
            >
              {isSubmitting ? 'Saving...' : (
                recommitOption === 'recommit' ? 'Recommit Rep' :
                recommitOption === 'cancel' ? 'Cancel Rep' : 'Modify & Recommit'
              )}
            </Button>
          )}
        </div>
      }
    >
      {currentStep === 0 && (
        <BlockerSelector value={blocker} onChange={setBlocker} />
      )}
      
      {currentStep === 1 && (
        <StandardSelector value={standard} onChange={setStandard} blocker={blocker} />
      )}
      
      {currentStep === 2 && (
        <NextWeekPlan 
          value={nextWeekPlan} 
          onChange={setNextWeekPlan}
          blocker={blocker}
          standard={standard}
        />
      )}
      
      {currentStep === 3 && (
        <RecommitOptions 
          rep={rep}
          selectedOption={recommitOption}
          onChange={setRecommitOption}
          cancelReason={cancelReason}
          onCancelReasonChange={setCancelReason}
        />
      )}
      
      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}
    </ConditioningModal>
  );
};

export default MissedRepDebriefModal;
