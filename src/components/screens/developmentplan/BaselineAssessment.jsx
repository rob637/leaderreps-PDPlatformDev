// src/components/developmentplan/BaselineAssessment.jsx
// REFACTORED: Converted to a single-page, modern form. (Req #14)
// Uses new 1-3 goal input fields. (Req #15)
// UPDATED (10/30/25): Added dividers to make questionnaire sleeker (Req #3)

import React, { useState } from 'react';
import { ArrowRight, Loader, Plus, X } from 'lucide-react'; // Added Plus and X
import { 
  Button, 
  Card, 
  ProgressBar, 
  LikertScaleInput // Import our new component
} from './DevPlanComponents';
import { 
  ASSESSMENT_QUESTIONS, 
  OPEN_ENDED_QUESTION, // We'll still use its title
  LIKERT_SCALE, 
  COLORS 
} from './devPlanUtils';

const BaselineAssessment = ({ onComplete, isLoading = false }) => {
  // One state object for all answers
  const [responses, setResponses] = useState({});
  
  // REQ #15: State for 1-3 goals
  const [goals, setGoals] = useState(['']);

  const completedQuestions = Object.keys(responses).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const progress = (completedQuestions / totalQuestions) * 100;
  
  // Check if all Likert questions are answered
  const allLikertAnswered = completedQuestions === totalQuestions;
  // Check if at least one goal is entered
  const atLeastOneGoal = goals.some(g => g.trim() !== '');
  
  const isComplete = allLikertAnswered && atLeastOneGoal;

  // Handler for the new component
  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };
  
  // --- REQ #15: Goal Handlers ---
  const handleGoalChange = (index, value) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };
  
  const addGoal = () => {
    if (goals.length < 3) {
      setGoals([...goals, '']);
    }
  };
  
  const removeGoal = (index) => {
    if (goals.length > 1) {
      const newGoals = goals.filter((_, i) => i !== index);
      setGoals(newGoals);
    } else {
      // Don't remove the last one, just clear it
      setGoals(['']);
    }
  };

  const handleComplete = () => {
    if (!allLikertAnswered) {
      alert("Please answer all assessment questions.");
      return;
    }
    if (!atLeastOneGoal) {
      alert("Please enter at least one leadership goal.");
      return;
    }

    const assessment = {
      date: new Date().toISOString(),
      answers: responses,
      // REQ #15: Send goals as a filtered array
      openEnded: goals.map(g => g.trim()).filter(g => g),
      cycle: 1,
    };
    
    console.log('[BaselineAssessment] Submitting single-page assessment:', assessment);
    onComplete(assessment);
  };

  // --- REQ #14: Sleeker Layout ---
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: COLORS.BG }}>
      
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-10 py-4 max-w-4xl mx-auto" style={{ background: `${COLORS.BG}F0`, backdropFilter: 'blur(8px)' }}>
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

      {/* Main Content Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-4">
        
        {/* Header Area */}
        <div className="p-6 sm:p-8 border-b" style={{ borderColor: COLORS.SUBTLE }}>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
            Baseline Assessment
          </h1>
          <p className="text-lg" style={{ color: COLORS.MUTED }}>
            Answer these {totalQuestions} questions to create your personalized leadership plan.
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          
          {/* REQ #3: Render Likert questions with dividers */}
          <div className="divide-y" style={{ borderColor: COLORS.SUBTLE }}>
            {ASSESSMENT_QUESTIONS.map((question) => (
              <div key={question.id} className="py-6">
                <LikertScaleInput
                  question={question}
                  options={LIKERT_SCALE}
                  value={responses[question.id]}
                  onChange={handleResponse}
                />
              </div>
            ))}
          </div>

          {/* REQ #15: Open-ended goals section */}
          <div className="mt-6 p-6 rounded-lg" style={{ background: `${COLORS.ORANGE}10` }}>
            <label className="block text-lg font-semibold mb-2" style={{ color: COLORS.NAVY }}>
              {OPEN_ENDED_QUESTION.text}
            </label>
            <p className="text-sm mb-4" style={{ color: COLORS.MUTED }}>
              {OPEN_ENDED_QUESTION.placeholder} (Add up to 3)
            </p>
            
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: COLORS.SUBTLE, ringColor: COLORS.ORANGE }}
                    value={goal}
                    onChange={(e) => handleGoalChange(index, e.target.value)}
                    placeholder={`Leadership goal #${index + 1}`}
                  />
                  <button
                    onClick={() => removeGoal(index)}
                    className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Remove goal"
                    disabled={goals.length === 1}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            
            {goals.length < 3 && (
              <Button
                onClick={addGoal}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Goal
              </Button>
            )}
          </div>

          {/* The "One Banana" - Complete Button */}
          <div className="pt-8">
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
                Please answer all {totalQuestions} questions and add at least one goal to complete the assessment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaselineAssessment;