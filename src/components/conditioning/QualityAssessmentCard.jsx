// src/components/conditioning/QualityAssessmentCard.jsx
// Phase 2: Displays quality assessment results after evidence submission

import React, { useState } from 'react';
import conditioningService from '../../services/conditioningService.js';
import { Card } from '../ui';
import { 
  CheckCircle, XCircle, AlertTriangle, Send, RotateCcw,
  MessageSquare, Target, Handshake, Lightbulb, ChevronDown
} from 'lucide-react';

// Dimension icons and labels - use string keys to avoid module initialization order issues
const DIMENSION_CONFIG = {
  specific_language: {
    icon: MessageSquare,
    label: 'Specific Language',
    description: 'Used actual words or close paraphrase'
  },
  clear_request: {
    icon: Target,
    label: 'Clear Request',
    description: 'Made a clear ask or request'
  },
  named_commitment: {
    icon: Handshake,
    label: 'Named Commitment',
    description: 'Got or noted a specific commitment'
  },
  reflection: {
    icon: Lightbulb,
    label: 'Reflection',
    description: 'Reflected on lessons learned'
  }
};

// Practice prompts for each dimension - use string keys to avoid module initialization order issues
const PRACTICE_PROMPTS = {
  specific_language: 
    'Rewrite what you said using the exact words you used or would use. Put your language in quotes.',
  clear_request: 
    'Write out a clear request or ask that you could make in this situation. Be specific about what you want the other person to do.',
  named_commitment: 
    'What specific commitment would you ask for? Write it as: "I\'d like you to commit to [specific action] by [specific time]."',
  reflection: 
    'What did you learn from this rep that you can apply next time? Be specific about what you would do differently.'
};

// ============================================
// DIMENSION ROW
// ============================================
const DimensionRow = ({ dimension, assessment, onPractice }) => {
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceResponse, setPracticeResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState(null);
  
  const config = DIMENSION_CONFIG[dimension];
  if (!config || !assessment) return null;
  
  const Icon = config.icon;
  const { passed, feedback } = assessment;
  
  const handlePracticeClick = (e) => {
    e.stopPropagation();
    setIsPracticing(true);
    setPracticeFeedback(null);
    setPracticeResponse('');
  };
  
  const handleSubmitPractice = async (e) => {
    e.stopPropagation();
    if (!practiceResponse.trim() || !onPractice) return;
    
    setIsSubmitting(true);
    try {
      // Get instant assessment feedback
      const result = conditioningService.assessPracticeResponse(dimension, practiceResponse.trim());
      
      // Save to Firestore
      await onPractice(dimension, practiceResponse.trim(), result);
      
      // Show feedback inline
      setPracticeFeedback(result);
      setIsPracticing(false);
    } catch (err) {
      console.error('Error submitting practice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`p-3 rounded-lg border ${
      passed 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
        }`}>
          <Icon className={`w-4 h-4 ${
            passed ? 'text-green-600' : 'text-amber-600'
          }`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-corporate-navy dark:text-white">{config.label}</span>
            {passed ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{feedback}</p>
          
          {/* Show AI-extracted quote if available */}
          {assessment.quote && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-corporate-navy/5 dark:bg-corporate-navy/20 text-sm text-corporate-navy dark:text-slate-200 italic">
              "{assessment.quote}"
            </div>
          )}
          
          {/* Show example of what they SHOULD do for failed dimensions */}
          {!passed && assessment.example && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-corporate-teal/10 dark:bg-corporate-teal/20 border border-corporate-teal/20 dark:border-corporate-teal/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-corporate-teal dark:text-corporate-teal mb-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Try something like this:
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 italic">
                {assessment.example}
              </p>
            </div>
          )}
          
          {/* Practice button for failed dimensions - before any practice attempt */}
          {!passed && onPractice && !isPracticing && !practiceFeedback && (
            <button
              onClick={handlePracticeClick}
              className="mt-2 text-xs font-medium text-corporate-teal hover:underline"
            >
              Practice this →
            </button>
          )}
          
          {/* Practice feedback after submission */}
          {practiceFeedback && (
            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              {/* What they wrote */}
              <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 italic">
                "{practiceResponse}"
              </div>
              
              {/* AI Feedback */}
              <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                practiceFeedback.passed
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              }`}>
                {practiceFeedback.passed ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{practiceFeedback.feedback}</span>
              </div>
              
              {/* Try again if didn't pass */}
              {!practiceFeedback.passed && (
                <button
                  onClick={handlePracticeClick}
                  className="flex items-center gap-1.5 text-xs font-medium text-corporate-teal hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Try again
                </button>
              )}
            </div>
          )}
          
          {/* Inline practice prompt */}
          {isPracticing && (
            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {PRACTICE_PROMPTS[dimension]}
              </p>
              <textarea
                autoFocus
                value={practiceResponse}
                onChange={(e) => setPracticeResponse(e.target.value)}
                placeholder="Type your practice response..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                  focus:ring-2 focus:ring-corporate-teal focus:border-transparent resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmitPractice}
                  disabled={!practiceResponse.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                    bg-corporate-teal text-white hover:bg-corporate-teal/90 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3 h-3" />
                  {isSubmitting ? 'Assessing...' : 'Submit'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPracticing(false); setPracticeResponse(''); }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN QUALITY CARD
// ============================================
const QualityAssessmentCard = ({ qualityAssessment, onPractice, compact = false, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (!qualityAssessment) return null;
  
  const { 
    dimensions, 
    passedCount, 
    totalDimensions, 
    meetsStandard, 
    summary,
    isConstructive,
    constructiveFeedback,
    coachingTip,
    assessedBy
  } = qualityAssessment;
  
  // If not constructive, show warning state
  const showWarning = isConstructive === false;
  
  if (compact) {
    // Compact view for rep cards
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
        showWarning
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700'
          : meetsStandard 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
      }`}>
        {showWarning ? (
          <XCircle className="w-3 h-3" />
        ) : meetsStandard ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span>{showWarning ? 'Needs review' : `${passedCount}/${totalDimensions} dimensions`}</span>
      </div>
    );
  }
  
  return (
    <Card className={`border-l-4 ${
      showWarning 
        ? 'border-l-red-500'
        : meetsStandard ? 'border-l-green-500' : 'border-l-amber-500'
    }`}>
      <div className="p-4">
        {/* Clickable Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-corporate-navy dark:text-white">RepUp Review</h4>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              showWarning
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700'
                : meetsStandard 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
            }`}>
              {showWarning ? <XCircle className="w-3 h-3" /> : meetsStandard ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>{showWarning ? 'Needs review' : `${passedCount}/${totalDimensions}`}</span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`} />
        </button>
        
        {/* Score Bar - always visible (hide if not constructive) */}
        {!showWarning && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  meetsStandard ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${(passedCount / totalDimensions) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Expandable Detail */}
        {expanded && (
          <>
            {/* Non-constructive Warning Banner - only when expanded */}
            {showWarning && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">
                      This rep may not reflect constructive leadership
                    </p>
                    {constructiveFeedback && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                        {constructiveFeedback}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          <div className="mt-4 space-y-3">
            {Object.entries(dimensions || {}).map(([dimension, assessment]) => (
              <DimensionRow
                key={dimension}
                dimension={dimension}
                assessment={assessment}
                onPractice={onPractice}
              />
            ))}
            
            {/* Coaching Tip from AI */}
            {coachingTip && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-blue-700 dark:text-blue-400">Coaching Tip</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">{coachingTip}</p>
                  </div>
                </div>
              </div>
            )}
            
            {summary && !showWarning && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">{summary}</p>
            )}
            
            {/* Show assessment source */}
            {assessedBy && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-2">
                Assessed by {assessedBy === 'ai' ? 'RepUp' : 'system'}
              </p>
            )}
          </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default QualityAssessmentCard;
