// src/components/conditioning/RepDraftResumeCard.jsx
// Card component to prompt users to resume an in-progress rep commitment
// Shown on dashboard/conditioning screen when a draft exists

import React, { useMemo } from 'react';
import { Calendar, Clock, PlayCircle, X, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, Button } from '../ui';
import { getRepTypeV2 } from '../../services/repTaxonomy';
import { getDraftSummary, DRAFT_FLOW_TYPES } from '../../services/draftRepService';

// ============================================
// STEP INDICATOR
// ============================================
const StepIndicator = ({ currentStep, totalSteps, stepLabels }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        
        return (
          <div key={idx} className="flex items-center">
            <div 
              className={`w-2 h-2 rounded-full transition-colors ${
                isCompleted 
                  ? 'bg-corporate-teal' 
                  : isCurrent 
                    ? 'bg-corporate-orange' 
                    : 'bg-gray-200 dark:bg-slate-600'
              }`}
              title={stepLabels?.[idx] || `Step ${idx + 1}`}
            />
            {idx < totalSteps - 1 && (
              <div className={`w-3 h-0.5 ${
                isCompleted ? 'bg-corporate-teal' : 'bg-gray-200 dark:bg-slate-600'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const RepDraftResumeCard = ({ 
  draft, 
  onResume, 
  onDiscard,
  compact = false,
  className = ''
}) => {
  // Parse draft info
  const summary = useMemo(() => getDraftSummary(draft), [draft]);
  
  // Get rep type info if selected
  const repTypeInfo = useMemo(() => {
    if (!draft?.formData?.repTypeId) return null;
    return getRepTypeV2(draft.formData.repTypeId);
  }, [draft?.formData?.repTypeId]);
  
  // Flow icon
  const FlowIcon = summary?.flowType === DRAFT_FLOW_TYPES.PLANNED ? Calendar : Clock;
  
  // Step labels for indicator
  const stepLabels = summary?.flowType === DRAFT_FLOW_TYPES.PLANNED 
    ? ['Type', 'Who', 'Situation', 'When', 'Commit']
    : ['Type', 'Who', 'Situation', 'When'];

  if (!draft || !summary?.hasMeaningfulProgress) {
    return null;
  }

  // Compact card (for inline placement)
  if (compact) {
    return (
      <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-800/30 rounded-lg shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 truncate">
                Resume in-progress rep
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
                {repTypeInfo?.label || summary.flowLabel} • Step {summary.currentStep + 1} of {summary.totalSteps}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDiscard}
              className="p-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors"
              title="Discard draft"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onResume}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full card (for standalone placement)
  return (
    <Card className={`border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-800/30 rounded-xl">
              <FlowIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-corporate-navy dark:text-white">
                Continue Your Rep
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {summary.flowLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDiscard}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Discard draft"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3 border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Step {summary.currentStep + 1}: {summary.currentStepLabel}
            </span>
          </div>
          <StepIndicator 
            currentStep={summary.currentStep} 
            totalSteps={summary.totalSteps}
            stepLabels={stepLabels}
          />
        </div>

        {/* Rep type preview (if selected) */}
        {repTypeInfo && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3 border border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Rep Type</p>
            <p className="font-medium text-corporate-navy dark:text-white">{repTypeInfo.label}</p>
            {draft.formData.person && (
              <>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 mb-1">With</p>
                <p className="text-sm text-gray-700 dark:text-slate-300">{draft.formData.person}</p>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDiscard}
            className="flex-1"
          >
            Start Over
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onResume}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            Resume
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RepDraftResumeCard;
