// src/components/conditioning/HighRiskPrepModal.jsx
// Prep modal for high-risk reps requiring mandatory preparation
// Sprint 2: Risk-Based Prep Enforcement (020726)
// UX v3: Multi-step wizard matching Create Rep and Debrief modals

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../ui';
import { getRepType, getRubric } from '../../services/repTaxonomy.js';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';

// ============================================
// HIGH RISK PREP QUESTIONS
// ============================================
const HIGH_RISK_PREP_QUESTIONS = [
  { 
    id: 'worst_case', 
    prompt: "What's the worst-case response you might encounter?",
    placeholder: "e.g., They become defensive and shut down completely...",
    shortLabel: "Worst Case"
  },
  { 
    id: 'recovery', 
    prompt: "How will you recover if it goes sideways?",
    placeholder: "e.g., I'll pause, acknowledge their reaction, and ask what I'm missing...",
    shortLabel: "Recovery"
  },
  { 
    id: 'support', 
    prompt: "What support do you need before this conversation?",
    placeholder: "e.g., Clear thinking time, a practice run with my coach, backup documentation...",
    shortLabel: "Support"
  },
  { 
    id: 'timing', 
    prompt: "Is this the right moment? Why now?",
    placeholder: "e.g., Yes - the pattern has happened 3 times and waiting will make it harder...",
    shortLabel: "Timing"
  }
];

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const HighRiskPrepModal = ({ 
  isOpen, 
  onClose, 
  rep, 
  onSubmit, 
  isLoading = false 
}) => {
  const [riskResponses, setRiskResponses] = useState({});
  const [rubricResponses, setRubricResponses] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  
  const repTypeConfig = useMemo(() => {
    return getRepType(rep?.repType);
  }, [rep?.repType]);
  
  const riskLevel = rep?.riskLevel || 'medium';
  const isHighRisk = riskLevel === 'high';
  
  // Get rubric questions for this rep type
  const rubric = useMemo(() => getRubric(rep?.repType) || [], [rep?.repType]);
  
  // Build step structure dynamically
  // For high-risk: rubric questions + high-risk questions + ready
  // For medium/low: rubric questions + ready (or just ready if no rubric)
  const steps = useMemo(() => {
    const stepList = [];
    
    // Add rubric questions as steps
    rubric.forEach((item, index) => {
      stepList.push({
        type: 'rubric',
        id: item.id,
        prompt: item.prompt,
        placeholder: 'Your response...',
        shortLabel: `Q${index + 1}`,
        required: true
      });
    });
    
    // Add high-risk questions for high-risk reps
    if (isHighRisk) {
      HIGH_RISK_PREP_QUESTIONS.forEach(q => {
        stepList.push({
          type: 'risk',
          ...q,
          required: true
        });
      });
    }
    
    // Add final "Ready" step
    stepList.push({
      type: 'ready',
      id: 'ready',
      shortLabel: 'Ready'
    });
    
    return stepList;
  }, [rubric, isHighRisk]);
  
  const TOTAL_STEPS = steps.length;
  const stepLabels = steps.map(s => s.shortLabel);
  const currentStepData = steps[currentStep];
  
  // Get value for current step
  const getCurrentValue = () => {
    if (!currentStepData) return '';
    if (currentStepData.type === 'rubric') {
      return rubricResponses[currentStepData.id] || '';
    }
    if (currentStepData.type === 'risk') {
      return riskResponses[currentStepData.id] || '';
    }
    return '';
  };
  
  // Set value for current step
  const setCurrentValue = (value) => {
    if (!currentStepData) return;
    if (currentStepData.type === 'rubric') {
      setRubricResponses(prev => ({ ...prev, [currentStepData.id]: value }));
    } else if (currentStepData.type === 'risk') {
      setRiskResponses(prev => ({ ...prev, [currentStepData.id]: value }));
    }
  };
  
  // Validate current step
  const isStepValid = useMemo(() => {
    if (!currentStepData) return true;
    if (currentStepData.type === 'ready') return true;
    if (!currentStepData.required) return true;
    
    const value = currentStepData.type === 'rubric' 
      ? rubricResponses[currentStepData.id] || ''
      : riskResponses[currentStepData.id] || '';
    return value.trim().length >= 10; // Minimum 10 chars for meaningful response
  }, [currentStepData, rubricResponses, riskResponses]);
  
  // Show validation for current step if visited
  const showStepValidation = visitedSteps.has(currentStep);
  
  // Check if all required steps are complete
  const allComplete = useMemo(() => {
    return steps.every((step) => {
      if (step.type === 'ready') return true;
      if (!step.required) return true;
      
      let value = '';
      if (step.type === 'rubric') {
        value = rubricResponses[step.id] || '';
      } else if (step.type === 'risk') {
        value = riskResponses[step.id] || '';
      }
      return value.trim().length >= 10;
    });
  }, [steps, rubricResponses, riskResponses]);
  
  // Navigation handlers
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1 && isStepValid) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps(prev => new Set([...prev, nextStep]));
      // Scroll modal to top
      setTimeout(() => {
        const modalBody = document.querySelector('[data-modal-body="true"]');
        if (modalBody) modalBody.scrollTop = 0;
      }, 50);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSubmit = () => {
    if (!allComplete) return;
    
    onSubmit({
      repId: rep.id,
      riskResponses,
      rubricResponses,
      inputMethod: 'high_risk_prep_modal',
      savedAt: new Date().toISOString()
    });
  };
  
  if (!rep) return null;
  
  // Get current value for validation display
  const currentValue = currentStepData?.type === 'rubric' 
    ? rubricResponses[currentStepData?.id] || ''
    : riskResponses[currentStepData?.id] || '';
  
  // Render step content
  const renderStepContent = () => {
    if (!currentStepData) return null;
    
    if (currentStepData.type === 'ready') {
      // Final ready screen
      const completedCount = steps.filter((s) => {
        if (s.type === 'ready') return false;
        let value = '';
        if (s.type === 'rubric') value = rubricResponses[s.id] || '';
        if (s.type === 'risk') value = riskResponses[s.id] || '';
        return value.trim().length >= 10;
      }).length;
      
      const totalRequired = steps.filter(s => s.type !== 'ready').length;
      
      return (
        <div className="text-center py-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            allComplete 
              ? 'bg-corporate-teal/10' 
              : 'bg-amber-100 dark:bg-amber-900/20'
          }`}>
            {allComplete ? (
              <CheckCircle className="w-8 h-8 text-corporate-teal" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <h3 className="font-bold text-lg text-corporate-navy dark:text-white mb-2">
            {allComplete ? 'Prep Complete!' : 'Almost There'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {allComplete 
              ? "You've thought through everything. You're ready to execute this rep."
              : `${completedCount} of ${totalRequired} questions answered. Complete all to unlock execution.`
            }
          </p>
          {allComplete && (
            <p className="text-sm text-corporate-teal font-medium">
              Click "Complete Prep" to unlock execution
            </p>
          )}
        </div>
      );
    }
    
    // Question step
    return (
      <div className="space-y-4">
        {/* High-risk indicator for risk questions */}
        {currentStepData.type === 'risk' && (
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>High-risk prep question — required for execution</span>
          </div>
        )}
        
        <VoiceTextarea
          id={`prep-${currentStepData.id}`}
          label={currentStepData.prompt}
          value={currentValue}
          onChange={setCurrentValue}
          placeholder={currentStepData.placeholder}
          rows={5}
          required={currentStepData.required}
          autoFocus
          error={showStepValidation && currentStepData.required && currentValue.trim().length < 10 
            ? 'Please provide a meaningful response (at least 10 characters)' 
            : null}
        />
      </div>
    );
  };
  
  return (
    <ConditioningModal
      isOpen={isOpen}
      onClose={onClose}
      title={isHighRisk ? 'High-Risk Rep Prep' : 'Rep Preparation'}
      icon={isHighRisk ? AlertTriangle : Lock}
      subtitle={`${rep?.person || ''} • ${repTypeConfig?.label || rep?.repType || ''}`}
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      stepLabels={stepLabels}
      contextBar={
        <div className="flex items-center justify-between">
          <span className="text-sm text-corporate-navy font-medium">{rep.person}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isHighRisk 
              ? 'bg-corporate-orange/10 text-corporate-orange' 
              : riskLevel === 'medium' 
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' 
              : 'bg-corporate-teal/10 text-corporate-teal'
          }`}>
            {riskLevel.toUpperCase()} RISK
          </span>
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
              disabled={!allComplete || isLoading}
              className="bg-corporate-teal hover:bg-corporate-teal-dark text-white"
            >
              {isLoading ? 'Saving...' : 'Complete Prep'}
            </Button>
          )}
        </div>
      }
    >
      {renderStepContent()}
    </ConditioningModal>
  );
};

export default HighRiskPrepModal;
