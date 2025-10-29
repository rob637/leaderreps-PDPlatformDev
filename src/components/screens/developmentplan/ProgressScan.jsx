// src/components/developmentplan/ProgressScan.jsx
// Progress scan for reassessing leadership effectiveness after completing a cycle
// FIXED: Updated field names to match Firebase (answers, openEnded) and added adapter support

import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { Button, Card, ProgressBar, Badge } from './DevPlanComponents';
import { ASSESSMENT_QUESTIONS, OPEN_ENDED_QUESTION, LIKERT_SCALE, COLORS, generatePlanFromAssessment } from './devPlanUtils';
import { adaptFirebaseAssessmentToComponents } from '../../../utils/devPlanAdapter';

const ProgressScan = ({ 
  developmentPlanData, 
  globalMetadata, 
  skillCatalog = [],
  onCompleteScan, 
  onBack,
  isLoading = false 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [openEndedResponse, setOpenEndedResponse] = useState('');
  const [showOpenEnded, setShowOpenEnded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // FIXED: Adapt previous assessment to get correct field names
  const previousAssessment = useMemo(() => {
    const lastAssessment = developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1];
    if (!lastAssessment) return null;
    
    console.log('[ProgressScan] Adapting previous assessment');
    return adaptFirebaseAssessmentToComponents(lastAssessment);
  }, [developmentPlanData?.assessmentHistory]);

  const progress = ((currentQuestion / ASSESSMENT_QUESTIONS.length) * 100);
  const isComplete = Object.keys(responses).length === ASSESSMENT_QUESTIONS.length;

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    
    if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      setTimeout(() => setShowOpenEnded(true), 300);
    }
  };

  const handleComplete = () => {
    // FIXED: Use Firebase field names (answers, openEnded)
    const newAssessment = {
      date: new Date().toISOString(),
      answers: responses,                    // CHANGED: 'answers' not 'responses'
      openEnded: openEndedResponse.trim(),   // CHANGED: 'openEnded' not 'openEndedResponse'
      cycle: (developmentPlanData?.currentCycle || 1) + 1,
    };

    console.log('[ProgressScan] Generating plan with skill catalog size:', skillCatalog.length);
    const newPlan = generatePlanFromAssessment(newAssessment, skillCatalog);
    
    onCompleteScan(newPlan, newAssessment);
  };

  if (showComparison && previousAssessment) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card accent="GREEN">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Your Progress
            </h2>
            <p className="text-gray-600">
              Compare your current assessment with your previous baseline.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {ASSESSMENT_QUESTIONS.map(question => {
              // FIXED: Use adapted field name (responses instead of answers)
              const prevScore = previousAssessment.responses?.[question.id] || 3;
              const newScore = responses[question.id] || 3;
              const improvement = newScore - prevScore;

              return (
                <div
                  key={question.id}
                  className="p-4 rounded-xl border-2"
                  style={{ borderColor: COLORS.SUBTLE, background: 'white' }}
                >
                  <p className="text-sm font-semibold mb-3" style={{ color: COLORS.NAVY }}>
                    {question.question}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Previous: {prevScore}</span>
                        <span className="text-xs text-gray-600">Current: {newScore}</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(val => (
                          <div
                            key={val}
                            className="h-8 flex-1 rounded"
                            style={{
                              background: val <= prevScore ? COLORS.SUBTLE : '#E5E7EB',
                              opacity: val <= newScore ? 1 : 0.3,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {improvement !== 0 && (
                      <Badge variant={improvement > 0 ? 'success' : 'warning'}>
                        {improvement > 0 ? '+' : ''}{improvement}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowComparison(false)}
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
              {isLoading ? 'Creating Plan...' : 'Generate New Plan'}
              <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showOpenEnded) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card accent="GREEN">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Looking Ahead
            </h2>
            <p className="text-gray-600">
              What's your top priority for the next development cycle?
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.NAVY }}>
              {OPEN_ENDED_QUESTION}
            </label>
            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={6}
              value={openEndedResponse}
              onChange={(e) => setOpenEndedResponse(e.target.value)}
              placeholder="Share your focus for the next 90 days..."
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
              onClick={() => setShowComparison(true)}
              variant="primary"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              Review Progress
              <TrendingUp size={16} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = ASSESSMENT_QUESTIONS[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
          Progress Scan
        </h1>
        <p className="text-gray-600">
          Let's reassess your leadership effectiveness to see how you've grown.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}
          </span>
          <span className="font-medium" style={{ color: COLORS.GREEN }}>
            {Math.round(progress)}% complete
          </span>
        </div>
        <ProgressBar progress={progress} color={COLORS.GREEN} />
      </div>

      <Card accent="GREEN">
        <div className="mb-8">
          <p className="text-sm font-medium mb-2" style={{ color: COLORS.GREEN }}>
            {currentQ.dimension}
          </p>
          <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
            {currentQ.question}
          </h2>
          
          {previousAssessment?.responses?.[currentQ.id] && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Your previous score: <span className="font-medium">{previousAssessment.responses[currentQ.id]}/5</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {LIKERT_SCALE.map((option) => (
            <button
              key={option.value}
              onClick={() => handleResponse(currentQ.id, option.value)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                responses[currentQ.id] === option.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 bg-white'
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
                  <CheckCircle size={24} style={{ color: COLORS.GREEN }} />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          {currentQuestion > 0 && (
            <Button
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              variant="secondary"
              disabled={isLoading}
            >
              Previous
            </Button>
          )}
          {onBack && (
            <Button
              onClick={onBack}
              variant="secondary"
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          {responses[currentQ.id] && currentQuestion < ASSESSMENT_QUESTIONS.length - 1 && (
            <Button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              variant="primary"
              className="ml-auto"
              disabled={isLoading}
            >
              Next Question
            </Button>
          )}
          {responses[currentQ.id] && currentQuestion === ASSESSMENT_QUESTIONS.length - 1 && (
            <Button
              onClick={() => setShowOpenEnded(true)}
              variant="primary"
              className="ml-auto"
              disabled={isLoading}
            >
              Continue
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProgressScan;
