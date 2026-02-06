// src/components/conditioning/QualityAssessmentCard.jsx
// Phase 2: Displays quality assessment results after evidence submission

import React from 'react';
import { 
  QUALITY_DIMENSIONS 
} from '../../services/conditioningService.js';
import { Card } from '../ui';
import { 
  CheckCircle, XCircle, AlertTriangle, 
  MessageSquare, Target, Handshake, Lightbulb
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

// ============================================
// DIMENSION ROW
// ============================================
const DimensionRow = ({ dimension, assessment, onPractice }) => {
  const config = DIMENSION_CONFIG[dimension];
  if (!config || !assessment) return null;
  
  const Icon = config.icon;
  const { passed, feedback } = assessment;
  
  return (
    <div className={`p-3 rounded-lg border ${
      passed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          passed ? 'bg-green-100' : 'bg-amber-100'
        }`}>
          <Icon className={`w-4 h-4 ${
            passed ? 'text-green-600' : 'text-amber-600'
          }`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-corporate-navy">{config.label}</span>
            {passed ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{feedback}</p>
          
          {/* Practice button for failed dimensions */}
          {!passed && onPractice && (
            <button
              onClick={() => onPractice(dimension)}
              className="mt-2 text-xs font-medium text-corporate-navy hover:underline"
            >
              Practice this →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN QUALITY CARD
// ============================================
const QualityAssessmentCard = ({ qualityAssessment, onPractice, compact = false }) => {
  if (!qualityAssessment) return null;
  
  const { dimensions, passedCount, totalDimensions, meetsStandard, summary } = qualityAssessment;
  
  if (compact) {
    // Compact view for rep cards
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
        meetsStandard 
          ? 'bg-green-100 text-green-700' 
          : 'bg-amber-100 text-amber-700'
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-corporate-navy">Quality Assessment</h4>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            meetsStandard 
              ? 'bg-green-100 text-green-700' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {meetsStandard ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Meets Standard</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Needs Improvement</span>
              </>
            )}
          </div>
        </div>
        
        {/* Score Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Score</span>
            <span className="font-medium">{passedCount}/{totalDimensions}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                meetsStandard ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${(passedCount / totalDimensions) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Dimension Breakdown */}
        <div className="space-y-3">
          {Object.entries(dimensions || {}).map(([dimension, assessment]) => (
            <DimensionRow
              key={dimension}
              dimension={dimension}
              assessment={assessment}
              onPractice={onPractice}
            />
          ))}
        </div>
        
        {/* Summary */}
        <p className="mt-4 text-sm text-gray-600 italic">{summary}</p>
      </div>
    </Card>
  );
};

export default QualityAssessmentCard;
