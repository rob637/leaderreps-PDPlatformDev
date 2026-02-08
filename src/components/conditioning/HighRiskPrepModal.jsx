// src/components/conditioning/HighRiskPrepModal.jsx
// Prep modal for high-risk reps requiring mandatory preparation
// Sprint 2: Risk-Based Prep Enforcement (020726)

import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, Lock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Button } from '../ui';
import { getRepType, getRubric } from '../../services/repTaxonomy.js';

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
// QUESTION INPUT COMPONENT
// ============================================
const PrepQuestion = ({ question, value, onChange, showValidation }) => {
  const isEmpty = !value?.trim();
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-corporate-navy mb-1">
        {question.prompt}
      </label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className={`w-full p-3 border rounded-lg text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-corporate-navy/20 focus:border-corporate-navy transition-colors ${
          showValidation && isEmpty ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
      />
      {showValidation && isEmpty && (
        <p className="text-xs text-red-600 mt-1">This field is required for high-risk reps</p>
      )}
    </div>
  );
};

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
        className="flex items-center justify-between w-full text-left py-2 px-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <span className="text-sm font-medium text-indigo-700">
          Rep-Specific Prep Questions ({rubric.length})
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-indigo-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-indigo-600" />
        )}
      </button>
      
      {expanded && (
        <div className="mt-3 pl-3 border-l-2 border-indigo-200">
          {rubric.map((item) => (
            <div key={item.id} className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {item.prompt}
              </label>
              <textarea
                value={responses?.[item.id] || ''}
                onChange={(e) => onResponseChange(item.id, e.target.value)}
                placeholder="Your response..."
                className="w-full p-2 border border-gray-200 rounded text-sm min-h-[60px] resize-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
              />
            </div>
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
  
  if (!isOpen || !rep) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {isHighRisk ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <Lock className="w-5 h-5 text-indigo-600" />
            )}
            <h3 className="text-lg font-bold text-corporate-navy">
              {isHighRisk ? 'High-Risk Rep Prep' : 'Rep Preparation'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Rep Summary */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-corporate-navy">{rep.person}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                isHighRisk 
                  ? 'bg-red-100 text-red-700' 
                  : riskLevel === 'medium' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {riskLevel.toUpperCase()} RISK
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {repTypeConfig?.label || rep.repType}
            </p>
          </div>
          
          {/* High Risk Explanation */}
          {isHighRisk && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
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
                <PrepQuestion
                  key={question.id}
                  question={question}
                  value={riskResponses[question.id]}
                  onChange={(value) => handleRiskResponseChange(question.id, value)}
                  showValidation={showValidation}
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
                <PrepQuestion
                  key={question.id}
                  question={question}
                  value={riskResponses[question.id]}
                  onChange={(value) => handleRiskResponseChange(question.id, value)}
                  showValidation={false}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 bg-gray-50">
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Complete Prep'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HighRiskPrepModal;
