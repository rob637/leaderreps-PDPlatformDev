// src/components/developmentplan/BaselineAssessment.jsx
// REFACTORED: Converted to a single-page, modern form. (Req #14)
// Uses new 1-3 goal input fields. (Req #15)
// UPDATED (10/30/25): Replaced Likert component with new styled radio buttons (Req #2)

import React, { useState } from 'react';
import { ArrowRight, Loader, Plus, X } from 'lucide-react'; // Added Plus and X
import { 
  Button, 
  Card, 
  ProgressBar,
  PlanGenerationLoader // NEW: Import the cool loader
  // LikertScaleInput // Removed this component
} from './DevPlanComponents';
import { 
  ASSESSMENT_QUESTIONS, 
  OPEN_ENDED_QUESTION, // We'll still use its title
  LIKERT_SCALE, 
  COLORS 
} from './devPlanUtils';

// REQ #2: New Radio Button Input Component
const RadioButtonInput = ({ question, options, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div 
      className="p-3 sm:p-4 lg:p-6 rounded-lg transition-all"
      style={{ 
        background: isFocused ? 'white' : COLORS.BG,
        border: `2px solid ${isFocused ? COLORS.TEAL : 'transparent'}`
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <label className="block text-base font-semibold mb-1" style={{ color: COLORS.NAVY }}>
        {question.text}
      </label>
      <p className="text-sm mb-4" style={{ color: COLORS.MUTED }}>
        {question.description}
      </p>
      
      <fieldset className="mt-4">
        <legend className="sr-only">Choose an option for {question.text}</legend>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-6 gap-y-3">
          {options.map((option) => (
            <div key={option.value} className="flex items-center">
              <input
                id={`${question.id}-${option.value}`}
                name={question.id}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(question.id, option.value)}
                className="h-5 w-5 border-gray-300"
                style={{ color: COLORS.TEAL, accentColor: COLORS.TEAL }}
              />
              <label 
                htmlFor={`${question.id}-${option.value}`} 
                className="ml-2 block text-sm font-medium"
                style={{ color: COLORS.TEXT }}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
};


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
  
  // NEW: State for simulated loading delay
  const [isGenerating, setIsGenerating] = useState(false);


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
    alert('🔴 Complete & Generate clicked!\nQuestions: ' + completedQuestions + '/' + totalQuestions + '\nGoals: ' + goals.filter(g => g.trim()).length);
    
    if (!allLikertAnswered) {
      alert("Please answer all assessment questions.");
      return;
    }
    if (!atLeastOneGoal) {
      alert("Please enter at least one leadership goal.");
      return;
    }

    alert('🔴 Starting 8-second generation timer...');
    // START SIMULATED GENERATION
    setIsGenerating(true);
    
    // Simulate 8-second generation time (UX requirement)
    setTimeout(() => {
        const assessment = {
            date: new Date().toISOString(),
            answers: responses,
            // REQ #15: Send goals as a filtered array
            openEnded: goals.map(g => g.trim()).filter(g => g),
            cycle: 1,
        };
        
        console.log('[BaselineAssessment] Submitting single-page assessment:', assessment);
        alert('🔴 8 seconds complete!\nCalling onComplete() to save plan...');
        onComplete(assessment);
        alert('🔴 onComplete() returned!\nWaiting for plan to save...');
        setIsGenerating(false);
    }, 8000); // 8-second delay
  };

  // Use combined loading state
  const isTotalLoading = isLoading || isGenerating;

  // --- REQ #14: Sleeker Layout ---
  return (
    <>
      {/* Show cool loading overlay when generating */}
      {isGenerating && <PlanGenerationLoader message="Creating Your Leadership Plan" />}
      
      <div className="min-h-screen p-4 sm:p-6 lg:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8" style={{ background: COLORS.BG }}>
      
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
        <div className="p-6 sm:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 border-b" style={{ borderColor: COLORS.SUBTLE }}>
          <h1 className="text-xl sm:text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
            Baseline Assessment
          </h1>
          <p className="text-lg" style={{ color: COLORS.MUTED }}>
            Answer these {totalQuestions} questions to create your personalized leadership plan.
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8">
          
          {/* REQ #2: Render new radio button inputs */}
          <div className="space-y-4">
            {ASSESSMENT_QUESTIONS.map((question) => (
              <RadioButtonInput
                key={question.id}
                question={question}
                options={LIKERT_SCALE}
                value={responses[question.id]}
                onChange={handleResponse}
              />
            ))}
          </div>

          {/* REQ #15: Open-ended goals section */}
          <div className="mt-8 p-3 sm:p-4 lg:p-6 rounded-lg" style={{ background: `${COLORS.ORANGE}10` }}>
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
                    disabled={isTotalLoading}
                  />
                  <button
                    onClick={() => removeGoal(index)}
                    className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Remove goal"
                    disabled={goals.length === 1 || isTotalLoading}
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
                disabled={isTotalLoading}
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
              disabled={isTotalLoading || !isComplete}
            >
              {isTotalLoading ? (
                <Loader className="animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              {isTotalLoading ? 'Creating Your Plan...' : 'Complete & Generate My Plan'}
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
    </>
  );
};

export default BaselineAssessment;