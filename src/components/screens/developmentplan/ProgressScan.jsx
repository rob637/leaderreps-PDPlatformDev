// src/components/developmentplan/ProgressScan.jsx
// REFACTORED: Converted to a single-page form (Screen 1).
// Kept the "Comparison" screen (Screen 2) as a good UX step.
// UPDATED (10/30/25): Added simulated 8s loading state for generation.
// UPDATED (10/30/25): Replaced LikertScaleInput with RadioButtonInput for consistency.

import React, { useState, useMemo } from 'react';
// REQ #3: Added ArrowLeft
import { TrendingUp, ArrowRight, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import { 
  Button, 
  Card, 
  ProgressBar, 
  Badge,
  PlanGenerationLoader // NEW: Import the cool loader
  // LikertScaleInput REMOVED
} from './DevPlanComponents';
import { 
  ASSESSMENT_QUESTIONS, 
  SCORED_QUESTION_IDS,
  OPEN_ENDED_QUESTION, 
  FREQUENCY_SCALE,
  AGREEMENT_SCALE,
  LIKERT_SCALE, 
  generatePlanFromAssessment 
} from './devPlanUtils';

// Only scored questions (q1-q13) for radio-button rendering
const SCORED_QUESTIONS = ASSESSMENT_QUESTIONS.filter(q => SCORED_QUESTION_IDS.includes(q.id));
const getScaleForQuestion = (q) => q.type === 'agreement' ? AGREEMENT_SCALE : FREQUENCY_SCALE;
const SCALE_MAX = 4;
import { adaptFirebaseAssessmentToComponents } from '../../../utils/devPlanAdapter';

// REQ: New Radio Button Input Component (Copied from BaselineAssessment for visual consistency)
const RadioButtonInput = ({ question, options, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div 
      className="p-3 sm:p-4 lg:p-6 rounded-lg transition-all"
      style={{ 
        background: isFocused ? 'white' : 'var(--corporate-light-gray)',
        border: `2px solid ${isFocused ? 'var(--corporate-teal)' : 'transparent'}`
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <label className="block text-base font-semibold mb-1" style={{ color: 'var(--corporate-navy)' }}>
        {question.text}
      </label>
      <p className="text-sm mb-4" style={{ color: 'var(--corporate-teal)' }}>
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
                className="h-5 w-5 border-gray-300 dark:border-gray-600"
                style={{ color: 'var(--corporate-teal)', accentColor: 'var(--corporate-teal)' }}
              />
              <label 
                htmlFor={`${question.id}-${option.value}`} 
                className="ml-2 block text-sm font-medium"
                style={{ color: 'var(--corporate-navy)' }}
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


const ProgressScan = ({ 
  developmentPlanData, 
  skillCatalog = [],
  onCompleteScan, 
  onBack,
  isLoading = false 
}) => {
  // We now have two main "views" in this component
  // 1. 'assessment': The new single-page form
  // 2. 'comparison': The old "showComparison" screen
  const [view, setView] = useState('assessment');
  
  // State for the assessment form
  const [responses, setResponses] = useState({});
  const [openEndedResponse, setOpenEndedResponse] = useState('');
  
  // NEW: State for simulated loading delay
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Width debugging
  React.useEffect(() => {
    setTimeout(() => {
      const container = document.querySelector('.w-full.max-w-4xl');
      if (container) {
        const rect = container.getBoundingClientRect();
        const computed = window.getComputedStyle(container);
        console.log('📐 [PROGRESS SCAN] Width Measurements:', {
          component: 'ProgressScan',
          actualWidth: `${rect.width}px`,
          maxWidth: computed.maxWidth,
          padding: computed.padding,
          margin: computed.margin,
          classList: container.className
        });
      }
    }, 100);
  }, [view]);

  // Adapt previous assessment to get correct field names
  const previousAssessment = useMemo(() => {
    const lastAssessment = developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1];
    if (!lastAssessment) return null;
    
    // Ensure the answers keys are correctly mapped
    return adaptFirebaseAssessmentToComponents(lastAssessment);
  }, [developmentPlanData?.assessmentHistory]);

  const completedQuestions = Object.keys(responses).length;
  const totalQuestions = SCORED_QUESTIONS.length;
  const progress = (completedQuestions / totalQuestions) * 100;
  const isComplete = completedQuestions === totalQuestions;

  // Handler for the new component
  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  // This just moves from the form to the comparison view
  const handleReviewProgress = () => {
    if (!isComplete) {
      return;
    }
    setView('comparison');
  };

  // This is the final "submit" from the comparison screen
  const handleComplete = () => {
    // START SIMULATED GENERATION
    setIsGenerating(true);
    
    // Simulate 8-second generation time (UX requirement)
    setTimeout(() => {
        const newAssessment = {
            date: new Date().toISOString(),
            answers: responses,
            openEnded: [openEndedResponse.trim()].filter(g => g), // Wrap in array to match Baseline format
            cycle: (developmentPlanData?.currentCycle || 0) + 1, // Cycle starts at 1, so if currentCycle is 0 (initial state), new is 1. If current is 1, new is 2.
        };

        const newPlan = generatePlanFromAssessment(newAssessment, skillCatalog);
        
        onCompleteScan(newPlan, newAssessment);
        setIsGenerating(false);
    }, 8000); // 8-second delay
  };

  // --- RENDER ---

  // SCREEN 2: COMPARISON VIEW
  if (view === 'comparison' && previousAssessment) {
    // Use combined loading state
    const isTotalLoading = isLoading || isGenerating;
    
    return (
      <>
        {/* Show cool loading overlay when generating */}
        {isGenerating && <PlanGenerationLoader message="Generating Your Next Plan" />}
        
        <div className="p-4 sm:p-3 sm:p-4 lg:p-6">
        <Card accent="GREEN">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: 'var(--corporate-navy)' }}>
              Your Progress
            </h2>
            <p className="text-lg" style={{ color: 'var(--corporate-teal)' }}>
              Compare your current assessment with your previous baseline.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {SCORED_QUESTIONS.map(question => {
              // We need to use .answers for previous assessment if it was a Baseline, or .responses if it was a Progress Scan.
              const prevScore = previousAssessment.responses?.[question.id] || previousAssessment.answers?.[question.id] || 0;
              const newScore = responses[question.id] || 0;
              const improvement = newScore - prevScore;

              return (
                <div
                  key={question.id}
                  className="p-4 rounded-xl border-2 border-corporate-teal bg-white dark:bg-slate-800"
                >
                  <p className="text-base font-semibold mb-3 text-corporate-navy dark:text-white">
                    {question.text}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'var(--corporate-teal)' }}>Previous: {prevScore}/{SCALE_MAX}</span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--corporate-teal)' }}>Current: {newScore}/{SCALE_MAX}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-teal-500 h-2.5 rounded-full" 
                          style={{ width: `${(newScore / SCALE_MAX) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    {improvement !== 0 && (
                      <Badge variant={improvement > 0 ? 'success' : 'warning'}>
                        {improvement > 0 ? `+${improvement}` : improvement}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setView('assessment')}
              variant="outline"
              size="lg"
              disabled={isTotalLoading}
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleComplete}
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={isTotalLoading}
            >
              {isTotalLoading ? <Loader className="animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {isTotalLoading ? 'Generating Plan...' : 'Generate New Plan'}
            </Button>
          </div>
        </Card>
      </div>
      </>
    );
  }

  // SCREEN 1: ASSESSMENT FORM (Default View)
  // Use combined loading state
  const isTotalLoading = isLoading || isGenerating;
  
  return (
    <div className="p-4 sm:p-3 sm:p-4 lg:p-6 bg-corporate-light-gray">
      
      {/* REQ #3: Added Back Button */}
      <div className="mb-4">
        <Button onClick={onBack} variant="nav-back" size="sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Tracker
        </Button>
      </div>

      {/* Header Card */}
      <Card accent="GREEN">
        <h1 className="text-xl sm:text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: 'var(--corporate-navy)' }}>
          Progress Scan
        </h1>
        <p className="text-lg" style={{ color: 'var(--corporate-teal)' }}>
          Let's reassess your leadership effectiveness to see how you've grown.
        </p>
      </Card>

      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-10 py-4 bg-corporate-light-gray/95">
        <div>
          <div className="flex justify-between text-sm mb-2 px-1">
            <span className="font-semibold" style={{ color: 'var(--corporate-teal)' }}>
              {completedQuestions} of {totalQuestions} Questions Answered
            </span>
            <span className="font-semibold" style={{ color: 'var(--corporate-teal)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <ProgressBar progress={progress} color={'var(--corporate-teal)'} height={12} />
        </div>
      </div>

      {/* Form Container */}
      <div className="space-y-4 mt-4">
        
        {/* Render scored questions (Q1-Q13) using radio buttons */}
        {SCORED_QUESTIONS.map((question) => {
          const prevScore = previousAssessment?.responses?.[question.id] || previousAssessment?.answers?.[question.id];
          
          return (
            <div key={question.id}>
              <RadioButtonInput
                question={question}
                options={getScaleForQuestion(question)}
                value={responses[question.id]}
                onChange={handleResponse}
              />
              {prevScore && (
                <div className="px-6 py-2 rounded-b-xl" style={{ backgroundColor: 'var(--corporate-teal-10)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--corporate-teal)' }}>
                    Your previous score was: **{prevScore}/{SCALE_MAX}**
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Open-ended question */}
        <Card accent="ORANGE">
          <label className="block text-lg font-semibold mb-3" style={{ color: 'var(--corporate-navy)' }}>
            {OPEN_ENDED_QUESTION.text}
          </label>
           <p className="text-sm mb-3" style={{ color: 'var(--corporate-teal)' }}>
            {OPEN_ENDED_QUESTION.placeholder}
          </p>
          <textarea
            className="w-full p-4 border rounded-lg focus:ring-2 transition-all border-corporate-teal focus:ring-corporate-orange"
            rows={4}
            value={openEndedResponse}
            onChange={(e) => setOpenEndedResponse(e.target.value)}
            placeholder="Share your focus for the next 90 days..."
            disabled={isTotalLoading}
          />
        </Card>

        {/* The "One Banana" - Complete Button */}
        <div className="pt-6 pb-12">
          <Button
            onClick={handleReviewProgress}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isTotalLoading || !isComplete}
          >
            {isTotalLoading ? (
              <Loader className="animate-spin" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
            {isTotalLoading ? 'Generating Plan...' : 'Review My Progress'}
          </Button>
          {!isComplete && (
            <p className="text-center text-sm mt-3" style={{ color: 'var(--corporate-teal)' }}>
              Please answer all {totalQuestions} questions to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressScan;