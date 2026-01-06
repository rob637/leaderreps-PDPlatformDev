// src/components/screens/developmentplan/BaselineAssessmentSimple.jsx
// Simplified single-page assessment with 5 core questions

import React, { useState } from 'react';
import { CheckCircle, Loader, ClipboardCheck } from 'lucide-react';
import { Button } from '../../ui';

// Simplified 5-question assessment covering key leadership areas
const ASSESSMENT_QUESTIONS = [
  { 
    id: 'q1', 
    text: 'I communicate clear priorities and help my team see how their work matters.',
    category: 'Communication'
  },
  { 
    id: 'q2', 
    text: 'I provide regular, actionable feedback to help my team grow.',
    category: 'Coaching'
  },
  { 
    id: 'q3', 
    text: 'I manage my time well, balancing strategic thinking with daily execution.',
    category: 'Self-Management'
  },
  { 
    id: 'q4', 
    text: 'I build trust by being open and encouraging honest dialogue.',
    category: 'Trust'
  },
  { 
    id: 'q5', 
    text: 'I make decisions efficiently with the right people involved.',
    category: 'Execution'
  }
];

const RATING_OPTIONS = [
  { value: 1, label: 'Rarely', color: 'bg-red-100 border-red-300 text-red-700' },
  { value: 2, label: 'Sometimes', color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { value: 3, label: 'Often', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { value: 4, label: 'Usually', color: 'bg-teal-100 border-teal-300 text-teal-700' },
  { value: 5, label: 'Always', color: 'bg-green-100 border-green-300 text-green-700' }
];

const BaselineAssessmentSimple = ({ onComplete, isLoading = false, initialData = null }) => {
  const [responses, setResponses] = useState(initialData?.answers || {});
  const [isGenerating, setIsGenerating] = useState(false);

  const completedCount = Object.keys(responses).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const isComplete = completedCount === totalQuestions;
  const progress = (completedCount / totalQuestions) * 100;

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleComplete = () => {
    if (!isComplete) return;

    setIsGenerating(true);
    
    // Brief delay for UX (reduced from 8s to 2s for simplified version)
    setTimeout(() => {
      const assessment = {
        date: new Date().toISOString(),
        answers: responses,
        openEnded: [],
        cycle: 1,
      };
      
      onComplete(assessment);
      setIsGenerating(false);
    }, 2000);
  };

  const isTotalLoading = isLoading || isGenerating;

  // Generating state
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-16 h-16 bg-corporate-teal/10 rounded-full flex items-center justify-center mb-4">
          <Loader className="w-8 h-8 text-corporate-teal animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-corporate-navy mb-2">Creating Your Plan...</h3>
        <p className="text-slate-600">Analyzing your responses to personalize your journey.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Baseline Assessment</h2>
            <p className="text-white/80 text-sm">Rate yourself honestly - there are no wrong answers</p>
          </div>
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

      {/* Questions */}
      <div className="p-6 space-y-6">
        {ASSESSMENT_QUESTIONS.map((question, idx) => (
          <div 
            key={question.id}
            className={`p-4 rounded-xl transition-all ${
              responses[question.id] 
                ? 'bg-slate-50 border border-slate-200' 
                : 'bg-white border-2 border-slate-100'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="flex-shrink-0 w-6 h-6 bg-corporate-navy text-white rounded-full flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </span>
              <p className="text-slate-700 font-medium leading-relaxed">{question.text}</p>
            </div>
            
            {/* Rating Options */}
            <div className="flex flex-wrap gap-2 ml-9">
              {RATING_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(question.id, option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all
                    ${responses[question.id] === option.value
                      ? `${option.color} ring-2 ring-offset-1 ring-corporate-teal/30`
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        {!isComplete && (
          <p className="text-center text-sm text-slate-500 mb-3">
            Answer all {totalQuestions} questions to continue
          </p>
        )}
        <Button
          onClick={handleComplete}
          disabled={!isComplete || isTotalLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 ${
            isComplete 
              ? 'bg-corporate-teal hover:bg-corporate-teal/90' 
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          {isTotalLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {isTotalLoading ? 'Creating Your Plan...' : (initialData ? 'Update Assessment' : 'Complete Assessment')}
        </Button>
      </div>
    </div>
  );
};

export default BaselineAssessmentSimple;
