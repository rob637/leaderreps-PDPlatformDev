// src/components/developmentplan/ProgressScan.jsx
// REFACTORED: Converted to a single-page form (Screen 1).
// Kept the "Comparison" screen (Screen 2) as a good UX step.
// Uses new <LikertScaleInput> component.

import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import { 
  Button, 
  Card, 
  ProgressBar, 
  Badge, 
  LikertScaleInput // Import our new component
} from './DevPlanComponents';
import { 
  ASSESSMENT_QUESTIONS, 
  OPEN_ENDED_QUESTION, 
  LIKERT_SCALE, 
  COLORS, 
  generatePlanFromAssessment 
} from './devPlanUtils';
import { adaptFirebaseAssessmentToComponents } from '../../../utils/devPlanAdapter';

const ProgressScan = ({ 
  developmentPlanData, 
  globalMetadata, 
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

  // Adapt previous assessment to get correct field names
  const previousAssessment = useMemo(() => {
    const lastAssessment = developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1];
    if (!lastAssessment) return null;
    
    console.log('[ProgressScan] Adapting previous assessment');
    return adaptFirebaseAssessmentToComponents(lastAssessment);
  }, [developmentPlanData?.assessmentHistory]);

  const completedQuestions = Object.keys(responses).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const progress = (completedQuestions / totalQuestions) * 100;
  const isComplete = completedQuestions === totalQuestions;

  // Handler for the new component
  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  // This just moves from the form to the comparison view
  const handleReviewProgress = () => {
    if (!isComplete) {
      alert("Please answer all assessment questions.");
      return;
    }
    setView('comparison');
  };

  // This is the final "submit" from the comparison screen
  const handleComplete = () => {
    const newAssessment = {
      date: new Date().toISOString(),
      answers: responses,
      openEnded: openEndedResponse.trim(),
      cycle: (developmentPlanData?.currentCycle || 1) + 1,
    };

    console.log('[ProgressScan] Generating plan with skill catalog size:', skillCatalog.length);
    const newPlan = generatePlanFromAssessment(newAssessment, skillCatalog);
    
    onCompleteScan(newPlan, newAssessment);
  };

  // --- RENDER ---

  // SCREEN 2: COMPARISON VIEW
  if (view === 'comparison' && previousAssessment) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card accent="GREEN">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
              Your Progress
            </h2>
            <p className="text-lg" style={{ color: COLORS.MUTED }}>
              Compare your current assessment with your previous baseline.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {ASSESSMENT_QUESTIONS.map(question => {
              const prevScore = previousAssessment.responses?.[question.id] || 0;
              const newScore = responses[question.id] || 0;
              const improvement = newScore - prevScore;

              return (
                <div
                  key={question.id}
                  className="p-4 rounded-xl border-2"
                  style={{ borderColor: COLORS.SUBTLE, background: 'white' }}
                >
                  <p className="text-base font-semibold mb-3" style={{ color: COLORS.NAVY }}>
                    {question.text}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: COLORS.MUTED }}>Previous: {prevScore}/5</span>
                        <span className="text-xs font-semibold" style={{ color: COLORS.TEAL }}>Current: {newScore}/5</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-teal-500 h-2.5 rounded-full" 
                          style={{ width: `${(newScore / 5) * 100}%` }}
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
              disabled={isLoading}
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleComplete}
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {isLoading ? 'Creating Plan...' : 'Generate New Plan'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // SCREEN 1: ASSESSMENT FORM (Default View)
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" style={{ background: COLORS.BG }}>
      {/* Header Card */}
      <Card accent="GREEN">
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
          Progress Scan
        </h1>
        <p className="text-lg" style={{ color: COLORS.MUTED }}>
          Let's reassess your leadership effectiveness to see how you've grown.
        </p>
      </Card>

      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-10 py-4" style={{ background: `${COLORS.BG}F0` }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between text-sm mb-2 px-1">
            <span className="font-semibold" style={{ color: COLORS.GREEN }}>
              {completedQuestions} of {totalQuestions} Questions Answered
            </span>
            <span className="font-semibold" style={{ color: COLORS.GREEN }}>
              {Math.round(progress)}%
            </span>
          </div>
          <ProgressBar progress={progress} color={COLORS.GREEN} height={12} />
        </div>
      </div>

      {/* Form Container */}
      <div className="space-y-4 mt-4">
        
        {/* Render all Likert questions */}
        {ASSESSMENT_QUESTIONS.map((question) => {
          const prevScore = previousAssessment?.responses?.[question.id];
          
          return (
            <div key={question.id}>
              <LikertScaleInput
                question={question}
                options={LIKERT_SCALE}
                value={responses[question.id]}
                onChange={handleResponse}
              />
              {prevScore && (
                <div className="px-6 py-2 rounded-b-xl" style={{ backgroundColor: `${COLORS.TEAL}10` }}>
                  <p className="text-xs font-medium" style={{ color: COLORS.TEAL }}>
                    Your previous score was: **{prevScore}/5**
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Open-ended question */}
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
            placeholder="Share your focus for the next 90 days..."
          />
        </Card>

        {/* The "One Banana" - Complete Button */}
        <div className="pt-6 pb-12">
          <Button
            onClick={handleReviewProgress}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading || !isComplete}
          >
            {isLoading ? (
              <Loader className="animate-spin" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
            {isLoading ? 'Saving...' : 'Review My Progress'}
          </Button>
          {!isComplete && (
            <p className="text-center text-sm mt-3" style={{ color: COLORS.MUTED }}>
              Please answer all {totalQuestions} questions to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressScan;