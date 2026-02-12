// src/components/conditioning/HighRiskPrepModal.jsx
// Prep modal for high-risk reps requiring mandatory preparation
// Sprint 2: Risk-Based Prep Enforcement (020726)
// UX v2: Uses ConditioningModal + VoiceTextarea, corporate palette only

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Lock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
    placeholder: "e.g., They become defensive and shut down completely..."
  },
  { 
    id: 'recovery', 
    prompt: "How will you recover if it goes sideways?",
    placeholder: "e.g., I'll pause, acknowledge their reaction, and ask what I'm missing..."
  },
  { 
    id: 'support', 
    prompt: "What support do you need before this conversation?",
    placeholder: "e.g., Clear thinking time, a practice run with my coach, backup documentation..."
  },
  { 
    id: 'timing', 
    prompt: "Is this the right moment? Why now?",
    placeholder: "e.g., Yes - the pattern has happened 3 times and waiting will make it harder..."
  }
];

// ============================================
// REP TYPE RUBRIC SECTION
// ============================================
const RubricSection = ({ repType, responses, onResponseChange }) => {
  const [expanded, setExpanded] = useState(true);
  const rubric = useMemo(() => getRubric(repType), [repType]);
  
  if (!rubric || rubric.length === 0) return null;
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left py-2 px-3 bg-corporate-navy/5 rounded-xl hover:bg-corporate-navy/10 transition-colors"
      >
        <span className="text-sm font-medium text-corporate-navy">
          Rep-Specific Prep Questions ({rubric.length})
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-corporate-navy/60" />
        ) : (
          <ChevronDown className="w-4 h-4 text-corporate-navy/60" />
        )}
      </button>
      
      {expanded && (
        <div className="mt-3 pl-3 border-l-2 border-corporate-teal/30">
          {rubric.map((item) => (
            <VoiceTextarea
              key={item.id}
              label={item.prompt}
              value={responses?.[item.id] || ''}
              onChange={(val) => onResponseChange(item.id, val)}
              placeholder="Your response..."
              rows={3}
              className="mb-3"
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [showValidation, setShowValidation] = useState(false);
  
  const repTypeConfig = useMemo(() => {
    return getRepType(rep?.repType);
  }, [rep?.repType]);
  
  const riskLevel = rep?.riskLevel || 'medium';
  const isHighRisk = riskLevel === 'high';
  
  // Validate all required fields are filled
  const isValid = useMemo(() => {
    if (!isHighRisk) return true; // Low/medium risk can skip questions
    
    return HIGH_RISK_PREP_QUESTIONS.every(q => 
      riskResponses[q.id]?.trim()?.length > 0
    );
  }, [riskResponses, isHighRisk]);
  
  const handleRiskResponseChange = (questionId, value) => {
    setRiskResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleRubricResponseChange = (questionId, value) => {
    setRubricResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleSubmit = () => {
    if (isHighRisk && !isValid) {
      setShowValidation(true);
      return;
    }
    
    onSubmit({
      repId: rep.id,
      riskResponses,
      rubricResponses,
      inputMethod: 'high_risk_prep_modal',
      savedAt: new Date().toISOString()
    });
  };
  
  if (!rep) return null;
  
  return (
    <ConditioningModal
      isOpen={isOpen}
      onClose={onClose}
      title={isHighRisk ? 'High-Risk Rep Prep' : 'Rep Preparation'}
      icon={isHighRisk ? AlertTriangle : Lock}
      subtitle={`${rep?.person || ''} • ${repTypeConfig?.label || rep?.repType || ''}`}
      contextBar={
        <div className="flex items-center justify-between">
          <span className="text-sm text-corporate-navy font-medium">{rep.person}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isHighRisk 
              ? 'bg-red-100 text-red-700' 
              : riskLevel === 'medium' 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {riskLevel.toUpperCase()} RISK
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-2">
            {isValid && isHighRisk && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Ready to execute
              </span>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-corporate-teal hover:bg-corporate-teal-dark text-white"
            >
              {isLoading ? 'Saving...' : 'Complete Prep'}
            </Button>
          </div>
        </div>
      }
    >
      {/* High Risk Explanation */}
      {isHighRisk && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">This is a high-risk rep</p>
              <p className="text-amber-700">
                High-stakes conversations require preparation. Complete these questions 
                to unlock execution. This isn't busywork—it's how you avoid costly mistakes.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Rep-Type Specific Rubric */}
      <RubricSection
        repType={rep.repType}
        responses={rubricResponses}
        onResponseChange={handleRubricResponseChange}
      />
      
      {/* High Risk Questions (required for high-risk) */}
      {isHighRisk && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-corporate-navy mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            Required Risk Prep
          </h4>
          {HIGH_RISK_PREP_QUESTIONS.map(question => (
            <VoiceTextarea
              key={question.id}
              label={question.prompt}
              value={riskResponses[question.id] || ''}
              onChange={(val) => handleRiskResponseChange(question.id, val)}
              placeholder={question.placeholder}
              rows={3}
              required
              error={showValidation && !riskResponses[question.id]?.trim() ? 'This field is required for high-risk reps' : null}
              className="mb-4"
            />
          ))}
        </div>
      )}
      
      {/* Optional prep for non-high-risk */}
      {!isHighRisk && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-corporate-navy mb-3">
            Optional: Think Through Risks
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            These questions are optional but help you prepare mentally.
          </p>
          {HIGH_RISK_PREP_QUESTIONS.slice(0, 2).map(question => (
            <VoiceTextarea
              key={question.id}
              label={question.prompt}
              value={riskResponses[question.id] || ''}
              onChange={(val) => handleRiskResponseChange(question.id, val)}
              placeholder={question.placeholder}
              rows={3}
              className="mb-4"
            />
          ))}
        </div>
      )}
    </ConditioningModal>
  );
};

export default HighRiskPrepModal;
