// src/components/conditioning/QualityAssessmentCard.jsx
// Phase 2: Displays quality assessment results after evidence submission

import React, { useState } from 'react';
import { 
  QUALITY_DIMENSIONS 
} from '../../services/conditioningService.js';
import { Card } from '../ui';
import { 
  CheckCircle, XCircle, AlertTriangle, Send,
  MessageSquare, Target, Handshake, Lightbulb, ChevronDown
} from 'lucide-react';

// Dimension icons and labels
const DIMENSION_CONFIG = {
  [QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE]: {
    icon: MessageSquare,
    label: 'Specific Language',
    description: 'Used actual words or close paraphrase'
  },
  [QUALITY_DIMENSIONS.CLEAR_REQUEST]: {
    icon: Target,
    label: 'Clear Request',
    description: 'Made a clear ask or request'
  },
  [QUALITY_DIMENSIONS.NAMED_COMMITMENT]: {
    icon: Handshake,
    label: 'Named Commitment',
    description: 'Got or noted a specific commitment'
  },
  [QUALITY_DIMENSIONS.REFLECTION]: {
    icon: Lightbulb,
    label: 'Reflection',
    description: 'Reflected on lessons learned'
  }
};

// Practice prompts for each dimension
const PRACTICE_PROMPTS = {
  [QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE]: 
    'Rewrite what you said using the exact words you used or would use. Put your language in quotes.',
  [QUALITY_DIMENSIONS.CLEAR_REQUEST]: 
    'Write out a clear request or ask that you could make in this situation. Be specific about what you want the other person to do.',
  [QUALITY_DIMENSIONS.NAMED_COMMITMENT]: 
    'What specific commitment would you ask for? Write it as: "I\'d like you to commit to [specific action] by [specific time]."',
  [QUALITY_DIMENSIONS.REFLECTION]: 
    'What did you learn from this rep that you can apply next time? Be specific about what you would do differently.'
};

// ============================================
// DIMENSION ROW
// ============================================
const DimensionRow = ({ dimension, assessment, onPractice }) => {
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceResponse, setPracticeResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const config = DIMENSION_CONFIG[dimension];
  if (!config || !assessment) return null;
  
  const Icon = config.icon;
  const { passed, feedback } = assessment;
  
  const handlePracticeClick = (e) => {
    e.stopPropagation();
    setIsPracticing(true);
  };
  
  const handleSubmitPractice = async (e) => {
    e.stopPropagation();
    if (!practiceResponse.trim() || !onPractice) return;
    
    setIsSubmitting(true);
    try {
      await onPractice(dimension, practiceResponse.trim());
      setSubmitted(true);
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
          
          {/* Practice button or submitted confirmation for failed dimensions */}
          {!passed && onPractice && !isPracticing && !submitted && (
            <button
              onClick={handlePracticeClick}
              className="mt-2 text-xs font-medium text-corporate-teal hover:underline"
            >
              Practice this →
            </button>
          )}
          
          {/* Submitted confirmation */}
          {submitted && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="font-medium">Practice saved!</span>
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
                  {isSubmitting ? 'Saving...' : 'Submit'}
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
  
  const { dimensions, passedCount, totalDimensions, meetsStandard, summary } = qualityAssessment;
  
  if (compact) {
    // Compact view for rep cards
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
        meetsStandard 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
      }`}>
        {meetsStandard ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span>{passedCount}/{totalDimensions} dimensions</span>
      </div>
    );
  }
  
  return (
    <Card className={`border-l-4 ${
      meetsStandard ? 'border-l-green-500' : 'border-l-amber-500'
    }`}>
      <div className="p-4">
        {/* Clickable Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-corporate-navy dark:text-white">AI Review</h4>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              meetsStandard 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
            }`}>
              {meetsStandard ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>{passedCount}/{totalDimensions}</span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`} />
        </button>
        
        {/* Score Bar - always visible */}
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
        
        {/* Expandable Detail */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {Object.entries(dimensions || {}).map(([dimension, assessment]) => (
              <DimensionRow
                key={dimension}
                dimension={dimension}
                assessment={assessment}
                onPractice={onPractice}
              />
            ))}
            
            {summary && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">{summary}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default QualityAssessmentCard;
