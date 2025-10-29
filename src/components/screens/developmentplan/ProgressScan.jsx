// src/components/developmentplan/ProgressScan.jsx
// Progress scan for reassessing leadership effectiveness after completing a cycle

import React, { useState } from 'react';
import { TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { Button, Card, ProgressBar, Badge } from './DevPlanComponents';
import { ASSESSMENT_QUESTIONS, OPEN_ENDED_QUESTION, LIKERT_SCALE, COLORS, generatePlanFromAssessment } from './devPlanUtils';

const ProgressScan = ({ developmentPlanData, globalMetadata, onCompleteScan }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [openEndedResponse, setOpenEndedResponse] = useState('');
  const [showOpenEnded, setShowOpenEnded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const previousAssessment = developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1];
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
    const newAssessment = {
      date: new Date().toISOString(),
      responses,
      openEndedResponse: openEndedResponse.trim(),
      cycle: (developmentPlanData?.currentCycle || 1) + 1,
    };

    const skillCatalog = globalMetadata?.config?.catalog?.SKILL_CATALOG || [];
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
              const prevScore = previousAssessment.responses[question.id] || 3;
              const newScore = responses[question.id] || 3;
              const improvement = newScore - prevScore;

              return (
                <div
                  key={question.id}
                  className="p-4 rounded-xl border-2"
                  style={{ borderColor: COLORS.SUBTLE, background: 'white' }}
                >
                  <p className="text-sm font-semibold mb-3" style={{ color: COLORS.NAVY }}>
                    {question.text}
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
                            className="flex-1 h-2 rounded-sm"
                            style={{
                              background: val <= prevScore ? `${COLORS.BLUE}40` : COLORS.SUBTLE,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(val => (
                          <div
                            key={val}
                            className="flex-1 h-2 rounded-sm"
                            style={{
                              background: val <= newScore ? COLORS.GREEN : COLORS.SUBTLE,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      {improvement > 0 && (
                        <Badge variant="success">+{improvement}</Badge>
                      )}
                      {improvement < 0 && (
                        <Badge variant="warning">{improvement}</Badge>
                      )}
                      {improvement === 0 && (
                        <Badge variant="default">—</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="primary" onClick={handleComplete} className="w-full">
            <CheckCircle size={20} />
            Complete Scan & Generate New Plan
          </Button>
        </Card>
      </div>
    );
  }

  if (showOpenEnded) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card accent="TEAL">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Looking Forward
            </h2>
            <p className="text-gray-600">
              What's your focus for the next 90 days?
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
            <Button variant="outline" onClick={() => setShowOpenEnded(false)}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => previousAssessment ? setShowComparison(true) : handleComplete()}
              disabled={!openEndedResponse.trim()}
            >
              {previousAssessment ? 'View Progress' : 'Complete'}
              <ArrowRight size={20} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const question = ASSESSMENT_QUESTIONS[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card accent="PURPLE">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: `${COLORS.PURPLE}20` }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: COLORS.PURPLE }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                Progress Scan
              </h2>
              <p className="text-sm text-gray-600">
                Cycle {(developmentPlanData?.currentCycle || 1) + 1} Assessment
              </p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Reassess your leadership effectiveness to track growth and generate your next development plan.
          </p>
          <ProgressBar progress={progress} height={8} showLabel />
        </div>

        <div className="mb-4">
          <span className="text-sm font-semibold text-gray-600">
            Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}
          </span>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.NAVY }}>
            {question.text}
          </h3>

          <div className="space-y-3">
            {LIKERT_SCALE.map((option) => {
              const isSelected = responses[question.id] === option.value;
              const previousScore = previousAssessment?.responses[question.id];
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleResponse(question.id, option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    borderColor: isSelected ? COLORS.PURPLE : COLORS.SUBTLE,
                    background: isSelected ? `${COLORS.PURPLE}10` : 'white',
                    ringColor: isSelected ? COLORS.PURPLE : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isSelected ? 'text-white' : 'text-gray-600'
                        }`}
                        style={{
                          background: isSelected ? COLORS.PURPLE : COLORS.SUBTLE,
                        }}
                      >
                        {option.value}
                      </div>
                      <div>
                        <span className={`font-semibold ${isSelected ? '' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                        {previousScore === option.value && (
                          <p className="text-xs text-gray-500 mt-1">
                            (Previous response)
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6" style={{ color: COLORS.PURPLE }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
                    ? COLORS.PURPLE 
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

export default ProgressScan;
