// src/components/developmentplan/BaselineAssessment.jsx
// REFACTORED: Converted to a single-page, modern form.
// Removed all "currentQuestion" and "showOpenEnded" state logic.
// Uses new <LikertScaleInput> component.

import React, { useState } from 'react';
import { ArrowRight, Loader } from 'lucide-react';
import { 
  Button, 
  Card, 
  ProgressBar, 
  LikertScaleInput // Import our new component
} from './DevPlanComponents';
import { 
  ASSESSMENT_QUESTIONS, 
  OPEN_ENDED_QUESTION, 
  LIKERT_SCALE, 
  COLORS 
} from './devPlanUtils';

const BaselineAssessment = ({ onComplete, isLoading = false }) => {
  // One state object for all answers
  const [responses, setResponses] = useState({});
  const [openEndedResponse, setOpenEndedResponse] = useState('');

  const completedQuestions = Object.keys(responses).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const progress = (completedQuestions / totalQuestions) * 100;
  
  // Check if all Likert questions are answered
  const isComplete = completedQuestions === totalQuestions;

  // Handler for the new component
  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleComplete = () => {
    // We already checked if the likert scale is complete
    // We can also add a check for the open-ended response if required
    if (!isComplete) {
      alert("Please answer all assessment questions.");
      return;
    }

    const assessment = {
      date: new Date().toISOString(),
      answers: responses,
      openEnded: openEndedResponse.trim(),
      cycle: 1,
    };
    
    console.log('[BaselineAssessment] Submitting single-page assessment:', assessment);
    onComplete(assessment);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" style={{ background: COLORS.BG }}>
      
      {/* Header Card */}
      <Card accent="TEAL">
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
          Baseline Assessment
        </h1>
        <p className="text-lg" style={{ color: COLORS.MUTED }}>
          Answer these {totalQuestions} questions to create your personalized leadership plan.
        </p>
      </Card>

      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-10 py-4" style={{ background: `${COLORS.BG}F0` }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between text-sm mb-2 px-1">
            <span className="font-semibold" style={{ color: COLORS.TEAL }}>
              {completedQuestions} of {totalQuestions} Questions Answered
            </span>
            <span className="font-semibold" style={{ color: COLORS.TEAL }}>
              {Math.round(progress)}%
            </span>
          </div>
          <ProgressBar progress={progress} color={COLORS.TEAL} height={12} />
        </div>
      </div>

      {/* Form Container */}
      <div className="space-y-4 mt-4">
        
        {/* Render all Likert questions */}
        {ASSESSMENT_QUESTIONS.map((question) => (
          <LikertScaleInput
            key={question.id}
            question={question}
            options={LIKERT_SCALE}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        ))}

        {/* Open-ended question - just part of the same form now */}
        <Card accent="ORANGE">
          <label className="block text-lg font-semibold mb-3" style={{ color: COLORS.NAVY }}>
            {OPEN_ENDED_QUESTION.text}
          </label>
          <p className="text-sm mb-3" style={{ color: COLORS.MUTED }}>
            {OPEN_ENDED_QUESTION.placeholder}
          </p>
          <textarea
            className="w-full p-4 border rounded-lg focus:ring-2 transition-all"
            style={{ borderColor: COLORS.SUBTLE, ringColor: COLORS.ORANGE }}
            rows={4}
            value={openEndedResponse}
            onChange={(e) => setOpenEndedResponse(e.target.value)}
            placeholder="Share your top goal or priority..."
          />
        </Card>

        {/* The "One Banana" - Complete Button */}
        <div className="pt-6 pb-12">
          <Button
            onClick={handleComplete}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading || !isComplete}
          >
            {isLoading ? (
              <Loader className="animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
            {isLoading ? 'Creating Your Plan...' : 'Complete & Generate My Plan'}
          </Button>
          {!isComplete && (
            <p className="text-center text-sm mt-3" style={{ color: COLORS.MUTED }}>
              Please answer all {totalQuestions} questions to complete the assessment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaselineAssessment;