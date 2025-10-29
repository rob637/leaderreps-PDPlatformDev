// src/components/developmentplan/BaselineAssessment.jsx
// Initial leadership assessment to generate personalized development plan
// FIXED: Changed field names to match Firebase structure (answers, openEnded)

import React, { useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Card, ProgressBar } from './DevPlanComponents';
import { ASSESSMENT_QUESTIONS, OPEN_ENDED_QUESTION, LIKERT_SCALE, COLORS } from './devPlanUtils';

const BaselineAssessment = ({ onComplete, isLoading = false }) => {
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
    // FIXED: Use Firebase field names (answers, openEnded)
    const assessment = {
      date: new Date().toISOString(),
      answers: responses,              // CHANGED: 'answers' not 'responses'
      openEnded: openEndedResponse.trim(), // CHANGED: 'openEnded' not 'openEndedResponse'
      cycle: 1,
    };
    
    console.log('[BaselineAssessment] Submitting assessment:', {
      hasAnswers: !!assessment.answers,
      answerCount: Object.keys(assessment.answers).length,
      hasOpenEnded: !!assessment.openEnded
    });
    
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
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.NAVY }}>
              {OPEN_ENDED_QUESTION}
            </label>
            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={6}
              value={openEndedResponse}
              onChange={(e) => setOpenEndedResponse(e.target.value)}
              placeholder="Share your top goal or priority..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowOpenEnded(false)}
              variant="secondary"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              variant="primary"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Your Plan...' : 'Complete Assessment'}
              <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = ASSESSMENT_QUESTIONS[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
          Baseline Assessment
        </h1>
        <p className="text-gray-600">
          Answer {ASSESSMENT_QUESTIONS.length} quick questions to create your personalized leadership development plan.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}
          </span>
          <span className="font-medium" style={{ color: COLORS.TEAL }}>
            {Math.round(progress)}% complete
          </span>
        </div>
        <ProgressBar progress={progress} color={COLORS.TEAL} />
      </div>

      {/* Question Card */}
      <Card accent="TEAL">
        <div className="mb-8">
          <p className="text-sm font-medium mb-2" style={{ color: COLORS.TEAL }}>
            {currentQ.dimension}
          </p>
          <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
            {currentQ.question}
          </h2>
        </div>

        {/* Likert Scale */}
        <div className="space-y-3">
          {LIKERT_SCALE.map((option) => (
            <button
              key={option.value}
              onClick={() => handleResponse(currentQ.id, option.value)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                responses[currentQ.id] === option.value
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium mb-1" style={{ color: COLORS.NAVY }}>
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {option.description}
                  </div>
                </div>
                {responses[currentQ.id] === option.value && (
                  <CheckCircle size={24} style={{ color: COLORS.TEAL }} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentQuestion > 0 && (
            <Button
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              variant="secondary"
            >
              Previous
            </Button>
          )}
          {responses[currentQ.id] && currentQuestion < ASSESSMENT_QUESTIONS.length - 1 && (
            <Button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              variant="primary"
              className="ml-auto"
            >
              Next Question
            </Button>
          )}
          {responses[currentQ.id] && currentQuestion === ASSESSMENT_QUESTIONS.length - 1 && (
            <Button
              onClick={() => setShowOpenEnded(true)}
              variant="primary"
              className="ml-auto"
            >
              Continue
            </Button>
          )}
        </div>
      </Card>

      {/* Previously Answered Questions */}
      {currentQuestion > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3" style={{ color: COLORS.NAVY }}>
            Your Responses
          </h3>
          <div className="grid gap-2">
            {ASSESSMENT_QUESTIONS.slice(0, currentQuestion).map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className="p-3 bg-white rounded-lg border border-gray-200 hover:border-teal-300 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">{q.dimension}</div>
                    <div className="text-sm font-medium" style={{ color: COLORS.NAVY }}>
                      {q.question}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: COLORS.TEAL }}>
                      {responses[q.id]}/5
                    </span>
                    <CheckCircle size={16} style={{ color: COLORS.TEAL }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BaselineAssessment;
