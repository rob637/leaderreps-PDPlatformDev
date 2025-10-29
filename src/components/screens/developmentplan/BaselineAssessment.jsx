// src/components/developmentplan/BaselineAssessment.jsx
// Initial leadership assessment to generate personalized development plan

import React, { useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Card, ProgressBar } from './DevPlanComponents';
import { ASSESSMENT_QUESTIONS, OPEN_ENDED_QUESTION, LIKERT_SCALE, COLORS } from './devPlanUtils';

const BaselineAssessment = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [openEndedResponse, setOpenEndedResponse] = useState('');
  const [showOpenEnded, setShowOpenEnded] = useState(false);

  const progress = ((currentQuestion / ASSESSMENT_QUESTIONS.length) * 100);
  const isComplete = Object.keys(responses).length === ASSESSMENT_QUESTIONS.length;

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question
    if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      setTimeout(() => setShowOpenEnded(true), 300);
    }
  };

  const handleComplete = () => {
    const assessment = {
      date: new Date().toISOString(),
      responses,
      openEndedResponse: openEndedResponse.trim(),
      cycle: 1,
    };
    onComplete(assessment);
  };

  if (showOpenEnded) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card accent="TEAL">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              One More Thing...
            </h2>
            <p className="text-gray-600">
              Let's capture your top priority for the next 90 days.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3" style={{ color: COLORS.NAVY }}>
              {OPEN_ENDED_QUESTION.text}
            </label>
            <textarea
              value={openEndedResponse}
              onChange={(e) => setOpenEndedResponse(e.target.value)}
              className="w-full p-4 border-2 rounded-xl min-h-[120px] resize-y"
              style={{ borderColor: COLORS.SUBTLE }}
              placeholder={OPEN_ENDED_QUESTION.placeholder || "Your response..."}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowOpenEnded(false)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={!openEndedResponse.trim()}
            >
              <CheckCircle size={20} />
              Complete Assessment
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const question = ASSESSMENT_QUESTIONS[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card accent="TEAL">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
            Leadership Baseline Assessment
          </h2>
          <p className="text-gray-600 mb-4">
            Rate your current leadership effectiveness to generate your personalized development plan.
          </p>
          <ProgressBar progress={progress} height={8} showLabel />
        </div>

        {/* Question Counter */}
        <div className="mb-4">
          <span className="text-sm font-semibold text-gray-600">
            Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}
          </span>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.NAVY }}>
            {question.text}
          </h3>

          {/* Likert Scale Options */}
          <div className="space-y-3">
            {LIKERT_SCALE.map((option) => {
              const isSelected = responses[question.id] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleResponse(question.id, option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    borderColor: isSelected ? COLORS.TEAL : COLORS.SUBTLE,
                    background: isSelected ? `${COLORS.TEAL}10` : 'white',
                    ringColor: isSelected ? COLORS.TEAL : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isSelected ? 'text-white' : 'text-gray-600'
                        }`}
                        style={{
                          background: isSelected ? COLORS.TEAL : COLORS.SUBTLE,
                        }}
                      >
                        {option.value}
                      </div>
                      <span className={`font-semibold ${isSelected ? '' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6" style={{ color: COLORS.TEAL }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {ASSESSMENT_QUESTIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: idx === currentQuestion 
                    ? COLORS.TEAL 
                    : responses[ASSESSMENT_QUESTIONS[idx].id] 
                    ? COLORS.GREEN 
                    : COLORS.SUBTLE,
                  scale: idx === currentQuestion ? 1.5 : 1,
                }}
                title={`Question ${idx + 1}`}
              />
            ))}
          </div>

          <Button
            variant="primary"
            onClick={() => {
              if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
                setCurrentQuestion(prev => prev + 1);
              } else if (isComplete) {
                setShowOpenEnded(true);
              }
            }}
            disabled={!responses[question.id]}
          >
            {currentQuestion === ASSESSMENT_QUESTIONS.length - 1 && isComplete ? 'Continue' : 'Next'}
            <ArrowRight size={20} />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BaselineAssessment;
