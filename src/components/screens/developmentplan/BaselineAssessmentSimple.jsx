// src/components/screens/developmentplan/BaselineAssessmentSimple.jsx
// Simplified assessment UI - uses shared questions from devPlanUtils for consistency

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader, ClipboardCheck, X } from 'lucide-react';
import { Button } from '../../ui';
import { ASSESSMENT_QUESTIONS, LIKERT_SCALE } from './devPlanUtils';

// Map questions to categories for display
const QUESTION_CATEGORIES = {
  q1: 'Communication',
  q2: 'Coaching',
  q3: 'Development',
  q4: 'Inclusion',
  q5: 'Self-Management',
  q6: 'Influence',
  q7: 'Execution',
  q8: 'Trust',
  q9: 'Conflict',
  q10: 'Recognition'
};

const RATING_OPTIONS = LIKERT_SCALE.map((item, idx) => {
  const colors = [
    'bg-red-100 border-red-300 text-red-700 hover:bg-red-200',
    'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200',
    'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200',
    'bg-teal-100 border-teal-300 text-teal-700 hover:bg-teal-200',
    'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
  ];
  const shortLabels = ['SD', 'D', 'N', 'A', 'SA'];
  return {
    ...item,
    shortLabel: shortLabels[idx],
    color: colors[idx]
  };
});

const BaselineAssessmentSimple = ({ onComplete, onClose, isLoading = false, initialData = null }) => {
  // Only keep answers for questions that exist in current assessment
  const validQuestionIds = ASSESSMENT_QUESTIONS.map(q => q.id);
  const initialResponses = initialData?.answers 
    ? Object.fromEntries(
        Object.entries(initialData.answers).filter(([key]) => validQuestionIds.includes(key))
      )
    : {};
  
  const [responses, setResponses] = useState(initialResponses);
  const [isGenerating, setIsGenerating] = useState(false);
  const formRef = useRef(null);

  // Scroll to top when component mounts
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  // Count only responses for current questions
  const completedCount = ASSESSMENT_QUESTIONS.filter(q => responses[q.id] !== undefined).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const isComplete = completedCount === totalQuestions;
  const progress = (completedCount / totalQuestions) * 100;

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleComplete = () => {
    if (!isComplete) return;

    setIsGenerating(true);
    
    // Brief delay for UX
    setTimeout(() => {
      // Only include answers for current questions
      const validAnswers = Object.fromEntries(
        validQuestionIds.map(id => [id, responses[id]]).filter(([, val]) => val !== undefined)
      );
      
      const assessment = {
        date: new Date().toISOString(),
        answers: validAnswers,
        openEnded: [],
        cycle: initialData?.cycle ? initialData.cycle + 1 : 1,
      };
      
      onComplete(assessment);
      setIsGenerating(false);
    }, 2000);
  };

  const isTotalLoading = isLoading || isGenerating;

  // Generating state
  if (isGenerating) {
    return (
      <div className="bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 bg-corporate-teal/10 rounded-full flex items-center justify-center mb-4">
            <Loader className="w-8 h-8 text-corporate-teal animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-corporate-navy mb-2">Creating Your Plan...</h3>
          <p className="text-slate-600">Analyzing your responses to personalize your journey.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white p-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Baseline Assessment</h2>
              <p className="text-white/80 text-sm">Rate yourself honestly - there are no wrong answers</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Progress */}
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>{completedCount} of {totalQuestions} answered</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-corporate-teal transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Rating Scale Legend - Fixed */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {RATING_OPTIONS.map(option => (
            <span key={option.value} className={`px-2 py-1 rounded border ${option.color.split(' hover:')[0]}`}>
              {option.label}
            </span>
          ))}
        </div>
      </div>

      {/* Questions - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {ASSESSMENT_QUESTIONS.map((question, idx) => (
          <div 
            key={question.id}
            className={`p-4 rounded-xl transition-all ${
              responses[question.id] 
                ? 'bg-slate-50 border border-slate-200' 
                : 'bg-white border-2 border-slate-100 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                responses[question.id] 
                  ? 'bg-green-500 text-white' 
                  : 'bg-corporate-navy text-white'
              }`}>
                {responses[question.id] ? <CheckCircle className="w-4 h-4" /> : idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-slate-700 font-medium leading-relaxed text-sm">{question.text}</p>
                <span className="text-xs text-slate-400 mt-1 inline-block">{QUESTION_CATEGORIES[question.id] || ''}</span>
              </div>
            </div>
            
            {/* Rating Options - Compact buttons */}
            <div className="flex flex-wrap gap-2 ml-10">
              {RATING_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(question.id, option.value)}
                  title={option.label}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all
                    ${responses[question.id] === option.value
                      ? `${option.color.split(' hover:')[0]} ring-2 ring-offset-1 ring-corporate-teal/40 scale-105`
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Fixed */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
            >
              Cancel
            </button>
          )}
          <div className="flex-1 text-center">
            {!isComplete && (
              <p className="text-xs text-slate-500">
                {totalQuestions - completedCount} more to go
              </p>
            )}
          </div>
          <Button
            onClick={handleComplete}
            disabled={!isComplete || isTotalLoading}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 ${
              isComplete 
                ? 'bg-corporate-teal hover:bg-corporate-teal/90' 
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isTotalLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {isTotalLoading ? 'Saving...' : (initialData ? 'Update' : 'Complete')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BaselineAssessmentSimple;
