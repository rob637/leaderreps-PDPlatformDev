// src/components/conditioning/EvidenceCaptureWizard.jsx
// Multi-screen evidence capture flow for Real Reps
// Screens: 1) Overview, 2) What Happened, 3) Response & Dynamics, 4) Artifacts
// Supports draft persistence - user can exit and resume where they left off

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService from '../../services/conditioningService.js';
import { getRepTypeV2 } from '../../services/repTaxonomy.js';
import { formatDisplayDateTime } from '../../services/dateUtils.js';
import { saveEvidenceDraft, getEvidenceDraft, deleteEvidenceDraft, hasEvidenceProgress } from '../../services/draftRepService.js';
import { useDevPlan } from '../../hooks/useDevPlan.js';
import { doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Button } from '../ui';
import { 
  Check, User, Calendar, Target,
  MessageSquare, AlertCircle, Camera, FileText, Mic, Image,
  Link2, Plus, X, CheckCircle2, Award, RotateCw, // Added RotateCw icon
  Square, Trash2, Play, Pause, RotateCcw, Save // Added icons for media capture
} from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';
import QualityAssessmentCard from './QualityAssessmentCard';
import { 
  RESPONSE_OPTIONS,
  PUSHBACK_RESPONSE_OPTIONS,
  BEHAVIOR_CHANGE_OPTIONS,
  FEEDBACK_REP_TYPES,
  PUSHBACK_LOG_OPTIONS,
  CLOSE_LOOP_LOG_OPTIONS,
  CLOSE_LOOP_OPTIONS,
  getSCEEvidenceQuestions,
  getSCESituationBranch,
  getSCECompleteLoopQuestions,
  getSCEResponseOptions,
  // New imports for DRF and Self-Assessment
  DRF_EVIDENCE_QUESTIONS,
  DRF_COMPLETE_LOOP,
  DRF_SELF_ASSESSMENT,
  DRF_RESPONSE_OPTIONS, // Added
  getSCESelfAssessment,
  SCE_SELF_ASSESS_DELEGATING,        // Add if needed directly, or rely on helper
  SCE_SELF_ASSESS_ASSIGNING_TASK,
  SCE_SELF_ASSESS_BEHAVIORAL_STANDARDS,
  SCE_SELF_ASSESS_RESETTING,
  // FUW (Follow-Up on the Work) imports
  FUW_EVIDENCE_QUESTIONS,
  FUW_RESPONSE_OPTIONS,
  FUW_SELF_ASSESSMENT,
  FUW_REFLECTION_PROMPT,
  FUW_REFLECTION_EXAMPLES,
  getFUWSituationBranch,
  // LWV (Lead With Vulnerability) imports
  LWV_EVIDENCE_QUESTIONS,
  LWV_RESPONSE_OPTIONS,
  LWV_SELF_ASSESSMENT,
  LWV_REFLECTION_PROMPT,
  LWV_REFLECTION_EXAMPLES,
  getLWVSituationBranch,
  // RED (Deliver Redirecting Feedback) imports
  RED_EVIDENCE_QUESTIONS,
  RED_OPTIONAL_FIELDS,
  RED_RESPONSE_OPTIONS,
  RED_SELF_ASSESSMENT,
  RED_COMPLETE_LOOP,
  RED_REFLECTION_PROMPT,
  RED_REFLECTION_EXAMPLES,
  RED_DIFFICULTY_OPTIONS,
  getREDSituationBranch,
  // CTL (Close the Loop) imports
  CTL_DECISION_OPTIONS,
  CTL_OBSERVATION_QUESTIONS,
  CTL_NOT_OBSERVED_REASONS,
  CTL_REINFORCEMENT_QUESTION,
  CTL_CONTINUATION_OPTIONS,
  CTL_NEXT_ACTION_QUESTIONS,
  CTL_SCORING_CRITERIA,
  CTL_DEFAULT_SCHEDULE_DAYS,
  CTL_DEFER_DEFAULT_DAYS,
  CTL_SECONDHAND_RULES
} from './constants';
import { uploadMediaAsset } from '../../services/mediaService.js';

// ============================================
// SCREEN 1: EVIDENCE OVERVIEW
// ============================================
const ScreenOverview = ({ rep, onNext }) => {
  const repType = useMemo(() => getRepTypeV2(rep?.repType), [rep?.repType]);

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          Real Rep Overview
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Let's capture what happened
        </p>
      </div>

      <div className="space-y-3">
        {/* Rep Type */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <Target className="w-5 h-5 text-corporate-teal mt-0.5" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Real Rep Type</div>
            <div className="font-medium text-corporate-navy dark:text-white">
              {repType?.label || rep?.repType || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Who */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <User className="w-5 h-5 text-corporate-teal mt-0.5" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Who was involved</div>
            <div className="font-medium text-corporate-navy dark:text-white">
              {rep?.person || 'Not specified'}
            </div>
          </div>
        </div>

        {/* Situation */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <MessageSquare className="w-5 h-5 text-corporate-teal mt-0.5" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Situation</div>
            <div className="font-medium text-corporate-navy dark:text-white">
              {typeof rep?.situation === 'object' 
                ? (rep.situation.customContext || rep.situation.selected || 'Not specified')
                : (rep?.situation || rep?.context || 'Not specified')}
            </div>
          </div>
        </div>

        {/* When */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <Calendar className="w-5 h-5 text-corporate-teal mt-0.5" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">When it happened</div>
            <div className="font-medium text-corporate-navy dark:text-white">
              {formatDisplayDateTime(rep?.executedAt || rep?.scheduledFor || rep?.createdAt) || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={onNext}
        className="w-full mt-4"
      >
        Next
      </Button>
    </div>
  );
};

// ============================================
// SCREEN 2: WHAT HAPPENED
// ============================================
const ScreenWhatHappened = ({ value, onChange, onNext, onBack, showValidation }) => {
  const isValid = value.trim().length >= 20;

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          What Happened
        </h3>
      </div>

      <VoiceTextarea
        id="evidence-what-happened"
        label="What did you actually say or do?"
        value={value}
        onChange={onChange}
        placeholder="Describe the observable behavior..."
        rows={4}
        minLength={20}
        required
        error={showValidation && !isValid ? 'Please provide more detail (at least 20 characters)' : null}
        autoFocus
      />

      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Stick to observable behavior and make sure you pass the Camera Test.
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

// ============================================
// SCREEN 2-STRUCTURED: STRUCTURED EVIDENCE (SCE, DRF, FUW, LWV, RED)
// Situation-specific evidence capture for SCE, DRF, FUW, LWV, and RED rep types
// ============================================
const ScreenStructuredEvidence = ({ 
  rep, 
  responses, 
  setResponses, 
  showOwnershipWarning,
  setShowOwnershipWarning,
  onNext, 
  onBack, 
  showValidation
}) => {
  const isDRF = rep?.repType === 'deliver_reinforcing_feedback';
  const isFUW = rep?.repType === 'follow_up_work';
  const isLWV = rep?.repType === 'lead_with_vulnerability';
  const isRED = rep?.repType === 'deliver_redirecting_feedback';
  
  // Get situation from rep data
  const situationText = typeof rep?.situation === 'object' 
    ? (rep.situation.selected || '') 
    : (rep?.situation || '');
  
  // Get questions and context based on rep type
  const personName = rep?.person || '';
  const { questions, header, optionalFields } = useMemo(() => {
    if (isDRF) {
      const drfHeader = personName 
        ? `${personName} • Deliver Reinforcing Feedback`
        : 'Evidence: Reinforcing Feedback';
      return { 
        questions: DRF_EVIDENCE_QUESTIONS,
        header: drfHeader,
        optionalFields: null
      };
    }
    
    if (isFUW) {
      const fuwHeader = personName 
        ? `${personName} • Follow-Up on the Work`
        : 'Evidence: Follow-Up on the Work';
      return { 
        questions: FUW_EVIDENCE_QUESTIONS,
        header: fuwHeader,
        optionalFields: null
      };
    }
    
    if (isLWV) {
      const lwvHeader = personName 
        ? `${personName} • Lead with Vulnerability`
        : 'Evidence: Lead with Vulnerability';
      return { 
        questions: LWV_EVIDENCE_QUESTIONS,
        header: lwvHeader,
        optionalFields: null
      };
    }
    
    if (isRED) {
      const redHeader = personName 
        ? `${personName} • Deliver Redirecting Feedback`
        : 'Evidence: Redirecting Feedback';
      return { 
        questions: RED_EVIDENCE_QUESTIONS,
        header: redHeader,
        optionalFields: RED_OPTIONAL_FIELDS
      };
    }
    
    // SCE Logic
    const qs = getSCEEvidenceQuestions(situationText);
    const branch = getSCESituationBranch(situationText);
    
    let hdr = 'Evidence Capture';
    switch (branch) {
      case 'assigning_task': hdr = 'Evidence: Assigning a Task'; break;
      case 'delegating': hdr = 'Evidence: Delegating Responsibility'; break;
      case 'behavioral_standards': hdr = 'Evidence: Setting Standards'; break;
      case 'resetting': hdr = 'Evidence: Resetting Expectations'; break;
    }
    
    return { questions: qs, header: hdr, optionalFields: null };
  }, [rep, isDRF, isFUW, isLWV, isRED, situationText, personName]);
  
  // Validation - check all required fields are filled
  const isValid = useMemo(() => {
    return questions
      .filter(q => q.required)
      .every(q => {
        const val = responses[q.id];
        if (q.type === 'checkbox_group') {
           // If required: true, check length > 0.
           return val && val.length > 0;
        }
        if (q.type === 'yes_no_comment' || q.type === 'options' || q.type === 'ownership_check') {
          return val && val.selected;
        }
        return val && val.trim && val.trim().length >= 10;
      });
  }, [questions, responses]);

  // Handle text field change
  const handleTextChange = (id, value) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  };

  // Handle option selection (yes/no, single choice)
  const handleOptionSelect = (id, selected, question) => {
    setResponses(prev => ({ ...prev, [id]: { selected, comment: prev[id]?.comment || '' } }));
    
    // Check for ownership warning on resetting expectations
    if (id === 'ownership_same' && selected === 'No - Ownership changed' && question.warningOnNo) {
      setShowOwnershipWarning(true);
    }
  };
  
  // Handle multi-select checkbox group
  const handleMultiSelect = (id, optionId) => {
    setResponses(prev => {
      const current = prev[id] || [];
      const exists = current.includes(optionId);
      const updated = exists 
        ? current.filter(x => x !== optionId) 
        : [...current, optionId];
      return { ...prev, [id]: updated };
    });
  };

  // Handle comment for option-based questions
  const handleCommentChange = (id, comment) => {
    setResponses(prev => ({ ...prev, [id]: { ...prev[id], comment } }));
  };

  // Render individual question based on type
  const renderQuestion = (q, idx) => {
    const value = responses[q.id];
    const hasError = showValidation && q.required && (!value || (typeof value === 'string' && value.trim().length < 10));

    // Text-based question
    if (!q.type || q.type === 'text') {
      return (
        <div key={q.id} className="space-y-1">
          <VoiceTextarea
            id={`struct-${q.id}`}
            label={q.prompt}
            value={value || ''}
            onChange={(val) => handleTextChange(q.id, val)}
            placeholder={q.placeholder || ''}
            rows={3}
            minLength={q.required ? 10 : null}
            required={q.required}
            error={hasError ? 'This field is required (min 10 chars)' : null}
            autoFocus={idx === 0}
          />
          {q.hint && (
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">{q.hint}</p>
          )}
        </div>
      );
    }
    
    // Checkbox Group (Multi-select)
    if (q.type === 'checkbox_group') {
      const selected = value || [];
      return (
        <div key={q.id} className="space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            {q.prompt}
          </label>
          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMultiSelect(q.id, opt.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                  selected.includes(opt.id)
                    ? 'border-corporate-teal bg-corporate-teal/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
                }`}
              >
                <span className={selected.includes(opt.id) ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {opt.label}
                </span>
                {selected.includes(opt.id) && <Check className="w-4 h-4 text-corporate-teal" />}
              </button>
            ))}
          </div>
          {hasError && (
            <p className="text-xs text-corporate-orange">Please select at least one option</p>
          )}
        </div>
      );
    }

    // Yes/No with optional comment
    if (q.type === 'yes_no_comment') {
      return (
        <div key={q.id} className="space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            {q.prompt}
          </label>
          <div className="flex gap-2">
            {['Yes', 'No'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleOptionSelect(q.id, opt, q)}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  value?.selected === opt
                    ? 'border-corporate-teal bg-corporate-teal/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
                }`}
              >
                <span className={value?.selected === opt ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
          {value?.selected && (
            <VoiceTextarea
              id={`struct-${q.id}-comment`}
              label="What did they say?"
              value={value?.comment || ''}
              onChange={(val) => handleCommentChange(q.id, val)}
              placeholder="Describe as close to verbatim as possible..."
              rows={2}
            />
          )}
          {hasError && (
            <p className="text-xs text-corporate-orange">Please select an option</p>
          )}
        </div>
      );
    }

    // Single-select options
    if (q.type === 'options') {
      return (
        <div key={q.id} className="space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            {q.prompt}
          </label>
          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleOptionSelect(q.id, opt, q)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  value?.selected === opt
                    ? 'border-corporate-teal bg-corporate-teal/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
                }`}
              >
                <span className={value?.selected === opt ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
          {hasError && (
            <p className="text-xs text-corporate-orange">Please select an option</p>
          )}
        </div>
      );
    }

    // Ownership check (special handling for resetting expectations)
    if (q.type === 'ownership_check') {
      return (
        <div key={q.id} className="space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            {q.prompt}
          </label>
          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleOptionSelect(q.id, opt, q)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  value?.selected === opt
                    ? 'border-corporate-teal bg-corporate-teal/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
                }`}
              >
                <span className={value?.selected === opt ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
          {hasError && (
            <p className="text-xs text-corporate-orange">Please select an option</p>
          )}
        </div>
      );
    }

    return null;
  };

  if (questions.length === 0) {
    // Fallback to generic if no situation-specific questions
    return null;
  }

  return (
    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          {header}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Capture the specifics of what happened
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
        <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Use specific wording. Describe as close to verbatim as possible.
        </p>
      </div>

      <div className="space-y-5">
        {questions.map((q, idx) => renderQuestion(q, idx))}
      </div>

      {/* Ownership Warning Modal */}
      {showOwnershipWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-corporate-navy dark:text-white mb-2">
                  Ownership Changed
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  If ownership changed, this RR should be an "Assigning a task" or "Delegating ongoing ownership" RR. Consider going back and selecting the proper RR.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={() => setShowOwnershipWarning(false)}
                className="flex-1"
              >
                Continue Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-4 sticky bottom-0 bg-white dark:bg-slate-900 pt-2">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

// ============================================
// SCREEN 3: RESPONSE & DYNAMICS
// ============================================
const ScreenResponseDynamics = ({
  rep,
  response,
  setResponse,
  otherResponseText,
  setOtherResponseText,
  pushbackLogOption,
  setPushbackLogOption,
  pushbackResponses,
  setPushbackResponses,
  pushbackNote,
  setPushbackNote,
  closeLoopOption,
  setCloseLoopOption,
  closeLoopLogOption,
  setCloseLoopLogOption,
  behaviorChange,
  setBehaviorChange,
  behaviorChangeNote,
  setBehaviorChangeNote,
  onNext,
  onBack,
  isLevel3OrHigher = false // Default to false
}) => {
  const isFeedbackRep = FEEDBACK_REP_TYPES.includes(rep?.repType);
  const isReinforcingFeedback = rep?.repType === 'deliver_reinforcing_feedback';
  const isRedirectingFeedback = rep?.repType === 'deliver_redirecting_feedback';
  const isFollowUp = rep?.repType === 'follow_up_work';
  const isVulnerability = rep?.repType === 'lead_with_vulnerability';
  
  // Use rep-type-specific response options
  let responseOptions = RESPONSE_OPTIONS;
  if (isReinforcingFeedback) {
    responseOptions = DRF_RESPONSE_OPTIONS;
  } else if (isRedirectingFeedback) {
    responseOptions = RED_RESPONSE_OPTIONS;
  } else if (isFollowUp) {
    responseOptions = FUW_RESPONSE_OPTIONS;
  } else if (isVulnerability) {
    responseOptions = LWV_RESPONSE_OPTIONS;
  } else if (rep?.repType === 'set_clear_expectations') {
    responseOptions = getSCEResponseOptions(typeof rep?.situation === 'object' ? (rep?.situation?.selected || '') : (rep?.situation || ''));
  }
  const responseLabel = isReinforcingFeedback
    ? 'How did the other person react/respond?'
    : 'How did the other person respond?';
  
  // Determine if pushback prompts should show (not applicable for reinforcing feedback, follow-up, vulnerability, or SCE)
  // For redirecting feedback, pushback detection is handled differently via response options
  const showPushbackPrompt = isFeedbackRep && !isReinforcingFeedback && !isRedirectingFeedback && !isFollowUp && !isVulnerability && ['disengaged', 'some_resistance', 'strong_pushback'].includes(response);
  const showPushbackEvidence = pushbackLogOption === 'link';
  
  // Determine if close loop prompts should show (after pushback logic is resolved)
  const pushbackLogComplete = !showPushbackPrompt || pushbackLogOption;
  const showCloseLoopPrompt = isFeedbackRep && pushbackLogComplete && isLevel3OrHigher;
  const showCloseLoopEvidence = closeLoopLogOption === 'link';
  
  // Validation
  const isValid = useMemo(() => {
    if (!response) return false;
    if (response === 'other' && (isReinforcingFeedback || isRedirectingFeedback || isFollowUp || isVulnerability || rep?.repType === 'set_clear_expectations') && (!otherResponseText || otherResponseText.trim().length < 5)) return false;
    if (showPushbackPrompt && !pushbackLogOption) return false;
    if (showPushbackEvidence && pushbackResponses.length === 0) return false;
    if (showCloseLoopPrompt && !closeLoopOption) return false;
    if (closeLoopOption === 'yes' && !closeLoopLogOption) return false;
    if (showCloseLoopEvidence && !behaviorChange) return false;
    return true;
  }, [response, isReinforcingFeedback, isRedirectingFeedback, otherResponseText, showPushbackPrompt, pushbackLogOption, showPushbackEvidence, pushbackResponses, showCloseLoopPrompt, closeLoopOption, closeLoopLogOption, showCloseLoopEvidence, behaviorChange]);

  // Toggle pushback response checkbox
  const togglePushbackResponse = (id) => {
    setPushbackResponses(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Simple flow for non-feedback reps (and reinforcing feedback, redirecting feedback, follow-up, vulnerability)
  // Redirecting feedback uses its own response options and doesn't need the complex pushback flow
  if (!isFeedbackRep || isReinforcingFeedback || isRedirectingFeedback || isFollowUp || isVulnerability) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
            Response & Dynamics
          </h3>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            {responseLabel}
          </label>
          <div className="space-y-2">
            {responseOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setResponse(option.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  response === option.id
                    ? 'border-corporate-teal bg-corporate-teal/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
                }`}
              >
                <span className={response === option.id ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {/* Other text field for DRF, RED, SCE, FUW, LWV */}
          {(isReinforcingFeedback || isRedirectingFeedback || isFollowUp || isVulnerability || rep?.repType === 'set_clear_expectations') && response === 'other' && (
            <div className="mt-3 animate-in slide-in-from-top-2">
              <VoiceTextarea
                id="drf-other-response"
                label="Describe their response"
                value={otherResponseText}
                onChange={setOtherResponseText}
                placeholder="What did they say or do?"
                rows={3}
                minLength={5}
                required
                error={otherResponseText.trim().length > 0 && otherResponseText.trim().length < 5 ? 'Please provide more detail (min 5 chars)' : null}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Previous
          </Button>
          <Button
            onClick={onNext}
            disabled={!isValid}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  // Feedback rep flow with conditional logic
  return (
    <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          Response & Dynamics
        </h3>
      </div>

      {/* Conditional A: Pushback Detection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-corporate-navy dark:text-white">
          {responseLabel}
        </label>
        <div className="space-y-2">
          {responseOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setResponse(option.id)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                response === option.id
                  ? 'border-corporate-teal bg-corporate-teal/10'
                  : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
              }`}
            >
              <span className={response === option.id ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pushback Log Options */}
      {showPushbackPrompt && (
        <div className="animate-in slide-in-from-top-2 space-y-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <label className="block text-sm font-medium text-amber-800 dark:text-amber-200">
            It sounds like pushback may have occurred. How would you like to log this?
          </label>
          <div className="space-y-2">
            {PUSHBACK_LOG_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPushbackLogOption(option.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  pushbackLogOption === option.id
                    ? 'border-corporate-teal bg-white dark:bg-slate-800'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-corporate-teal/50'
                }`}
              >
                <div className={pushbackLogOption === option.id ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Linked Pushback Evidence */}
      {showPushbackEvidence && (
        <div className="animate-in slide-in-from-top-2 space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <label className="block text-sm font-medium text-blue-800 dark:text-blue-200">
            How did you respond to the pushback?
          </label>
          <p className="text-xs text-blue-600 dark:text-blue-300">
            Focus on how you responded and adapted to their reaction/response.
          </p>
          <div className="space-y-2">
            {PUSHBACK_RESPONSE_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  pushbackResponses.includes(option.id)
                    ? 'border-corporate-teal bg-white dark:bg-slate-800'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pushbackResponses.includes(option.id)}
                  onChange={() => togglePushbackResponse(option.id)}
                  className="w-4 h-4 text-corporate-teal rounded"
                />
                <span className="text-sm text-corporate-navy dark:text-white">{option.label}</span>
              </label>
            ))}
          </div>
          
          <VoiceTextarea
            id="pushback-note"
            label="One sentence on what you did in response (optional)"
            value={pushbackNote}
            onChange={setPushbackNote}
            placeholder="Brief description..."
            rows={2}
          />
        </div>
      )}

      {/* Conditional B: Close the Loop Detection */}
      {showCloseLoopPrompt && (
        <div className="animate-in slide-in-from-top-2 space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            Was this interaction also about checking whether prior feedback led to behavior change?
          </label>
          <div className="space-y-2">
            {CLOSE_LOOP_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCloseLoopOption(option.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  closeLoopOption === option.id
                    ? 'border-corporate-teal bg-corporate-teal/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
                }`}
              >
                <span className={closeLoopOption === option.id ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Close Loop Log Options */}
      {closeLoopOption === 'yes' && (
        <div className="animate-in slide-in-from-top-2 space-y-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200">
            How would you like to log this?
          </label>
          <div className="space-y-2">
            {CLOSE_LOOP_LOG_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCloseLoopLogOption(option.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  closeLoopLogOption === option.id
                    ? 'border-corporate-teal bg-white dark:bg-slate-800'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-corporate-teal/50'
                }`}
              >
                <div className={closeLoopLogOption === option.id ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Linked Close Loop Evidence */}
      {showCloseLoopEvidence && (
        <div className="animate-in slide-in-from-top-2 space-y-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200">
            What did you observe when you checked for follow-through?
          </label>
          <div className="space-y-2">
            {BEHAVIOR_CHANGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setBehaviorChange(option.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  behaviorChange === option.id
                    ? 'border-corporate-teal bg-white dark:bg-slate-800'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-corporate-teal/50'
                }`}
              >
                <span className={behaviorChange === option.id ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
          
          <VoiceTextarea
            id="behavior-change-note"
            label="One sentence on what you named or addressed (optional)"
            value={behaviorChangeNote}
            onChange={setBehaviorChangeNote}
            placeholder="Brief description..."
            rows={2}
          />
        </div>
      )}

      <div className="flex gap-3 mt-4 sticky bottom-0 bg-white dark:bg-slate-900 pt-2">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

// ============================================
// SCREEN 4: ARTIFACTS & NOTES
// ============================================
const ScreenArtifacts = ({ 
  db,
  storage,
  userId,
  repId,
  notes, 
  setNotes, 
  artifacts = [], 
  setArtifacts,
  onNext, 
  onBack
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Capture Modes: 'voice', 'transcript', null
  const [captureMode, setCaptureMode] = useState(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Transcript State
  const [transcriptText, setTranscriptText] = useState('');

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    try {
      setIsUploading(true);
      const folder = `users/${userId}/reps/${repId}/artifacts`;
      
      const asset = await uploadMediaAsset(
        { storage, db }, 
        file, 
        folder,
        {
          uploadedBy: userId,
          repId: repId,
          isUserArtifact: true
        }
      );
      
      setArtifacts(prev => [...prev, {
        id: asset.id,
        name: asset.title, 
        url: asset.url,
        type: asset.type,
        mimeType: asset.mimeType,
        size: asset.size,
        createdAt: new Date().toISOString()
      }]);
      
      // Reset capture mode after successful upload
      resetCaptureMode();

    } catch (err) {
      console.error('Error uploading artifact:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeArtifact = (id) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));
  };
  
  const triggerUpload = (acceptTypes) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptTypes;
      fileInputRef.current.click();
    }
  };

  // Voice Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveRecording = async () => {
    if (!audioBlob) return;
    const filename = `voice-memo-${new Date().getTime()}.webm`;
    const file = new File([audioBlob], filename, { type: 'audio/webm' });
    await uploadFile(file);
  };

  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlayingPreview) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlayingPreview(!isPlayingPreview);
    }
  };

  // Transcript Logic
  const saveTranscript = async () => {
    if (!transcriptText.trim()) return;
    const filename = `transcript-${new Date().getTime()}.txt`;
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const file = new File([blob], filename, { type: 'text/plain' });
    await uploadFile(file);
  };

  const resetCaptureMode = () => {
    setCaptureMode(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscriptText('');
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          Artifacts & Notes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add any supporting evidence (optional)
        </p>
      </div>

      <VoiceTextarea
        id="evidence-notes"
        label="Additional notes"
        value={notes}
        onChange={setNotes}
        placeholder="Any additional context or observations..."
        rows={3}
      />

      {/* Artifact List */}
      {artifacts.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            Attached Files
          </label>
          <div className="space-y-2">
            {artifacts.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg flex-shrink-0">
                    {file.type === 'IMAGE' ? <Image className="w-4 h-4 text-blue-500" /> : 
                     (file.mimeType?.includes('audio') || file.type === 'AUDIO') ? <Mic className="w-4 h-4 text-pink-500" /> :
                     <FileText className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-corporate-navy dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeArtifact(file.id)}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Active Capture Mode UI */}
      {captureMode === 'voice' && (
        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-corporate-teal/20 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-corporate-navy dark:text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-corporate-teal" />
              Voice Memo
            </h4>
            <button onClick={resetCaptureMode} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="text-3xl font-mono font-bold text-corporate-navy dark:text-white">
              {formatTime(recordingTime)}
            </div>
            
            {/* Visualizer placeholder */}
            {isRecording && (
              <div className="flex items-end gap-1 h-8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 bg-corporate-teal animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}

            {!audioBlob ? (
              <div className="flex gap-4">
                {!isRecording ? (
                  <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center">
                    <Mic className="w-6 h-6" />
                  </Button>
                ) : (
                  <Button onClick={stopRecording} className="bg-corporate-navy hover:bg-corporate-navy/90 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center">
                    <Square className="w-5 h-5 fill-current" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="w-full space-y-4">
                <audio 
                  ref={audioPlayerRef} 
                  src={audioUrl} 
                  onEnded={() => setIsPlayingPreview(false)}
                  className="hidden" 
                />
                
                <div className="flex items-center justify-between bg-white dark:bg-slate-700 p-3 rounded-lg">
                  <button onClick={togglePlayback} className="p-2 rounded-full bg-corporate-teal/10 text-corporate-teal hover:bg-corporate-teal/20">
                    {isPlayingPreview ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="flex-1 mx-3 h-1 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className="h-full bg-corporate-teal w-full" />
                  </div>
                  <span className="text-xs text-gray-500">{formatTime(recordingTime)}</span>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setAudioBlob(null)} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Discard
                  </Button>
                  <Button onClick={saveRecording} className="flex-1 bg-corporate-teal text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {captureMode === 'transcript' && (
        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-corporate-teal/20 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-corporate-navy dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-corporate-teal" />
              Transcript
            </h4>
            <button onClick={resetCaptureMode} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Paste or type conversation transcript here..."
              className="w-full h-40 p-3 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-corporate-teal focus:border-transparent resize-none"
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button onClick={resetCaptureMode} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={saveTranscript} 
                className="flex-1 bg-corporate-teal text-white disabled:opacity-50"
                disabled={!transcriptText.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Transcript
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selection Buttons (hidden when active mode) */}
      {!captureMode && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            Add Attachment
          </label>
          
          {isUploading ? (
            <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-corporate-teal border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => triggerUpload('image/*')}
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-corporate-teal hover:bg-corporate-teal/5 transition-all text-center text-gray-500 hover:text-corporate-teal"
              >
                <Image className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs font-medium">Screenshot</span>
              </button>
              
              <button
                type="button"
                onClick={() => setCaptureMode('voice')} // Open Voice Recorder
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-corporate-teal hover:bg-corporate-teal/5 transition-all text-center text-gray-500 hover:text-corporate-teal"
              >
                <Mic className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs font-medium">Voice memo</span>
              </button>
              
              <button
                type="button"
                onClick={() => setCaptureMode('transcript')} // Open Transcript Editor
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-corporate-teal hover:bg-corporate-teal/5 transition-all text-center text-gray-500 hover:text-corporate-teal"
              >
                <MessageSquare className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs font-medium">Transcript</span>
              </button>

              <button
                type="button"
                onClick={() => triggerUpload('.pdf,.doc,.docx,.txt')}
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-corporate-teal hover:bg-corporate-teal/5 transition-all text-center text-gray-500 hover:text-corporate-teal"
              >
                <FileText className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs font-medium">Document</span>
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center italic mt-2">
        Only add what helps capture what happened. More is not always better.
      </p>

      <div className="flex gap-3 mt-4">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={isUploading || isRecording}
          className="flex-1"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

// ============================================
// SCREEN 5: CLOSE RR (Reflection & Assessment)
// ============================================
const ScreenCloseRR = ({
  rep,
  outcome,
  setOutcome,
  selfAssessmentResponses = {},
  setSelfAssessmentResponses = () => {},
  nextTimeReflection = '',
  setNextTimeReflection = () => {},
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  // Automatically select 'did_it' if not already set, to hide "What happened?" but keep logic
  useEffect(() => {
    if (!outcome) {
      setOutcome('did_it');
    }
  }, [outcome, setOutcome]);

  // Determine relevant self-assessment questions
  const selfAssessQuestions = useMemo(() => {
    if (rep?.repType === 'deliver_reinforcing_feedback') {
      return DRF_SELF_ASSESSMENT;
    }
    if (rep?.repType === 'follow_up_work') {
      return FUW_SELF_ASSESSMENT;
    }
    if (rep?.repType === 'lead_with_vulnerability') {
      return LWV_SELF_ASSESSMENT;
    }
    if (rep?.repType === 'set_clear_expectations') {
      const situationText = typeof rep?.situation === 'object' 
        ? (rep.situation.selected || '') 
        : (rep?.situation || '');
      return getSCESelfAssessment(situationText);
    }
    return [];
  }, [rep]);

  // Validation
  const isAssessmentComplete = useMemo(() => {
    if (outcome === 'missed' || selfAssessQuestions.length === 0) return true;
    return selfAssessQuestions.every(q => {
      const val = selfAssessmentResponses[q.id];
      return val && val.length > 0;
    });
  }, [selfAssessQuestions, selfAssessmentResponses, outcome]);
  
  const handleAssessmentSelect = (qId, option) => {
    setSelfAssessmentResponses(prev => ({ ...prev, [qId]: option }));
  };

  return (
    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          Rep Evaluation
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          How did you do executing the rep?
        </p>
      </div>

      {/* "What Happened?" Section Removed - defaults to 'did_it' (Completed Rep) */}
      
      <div className="animate-in fade-in duration-200 space-y-4">
          
        {/* Self Assessment Section */}
        {selfAssessQuestions.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-corporate-navy dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-corporate-teal" />
              Self-Assessment
            </h4>
            <div className="space-y-6">
              {selfAssessQuestions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                    {q.prompt}
                  </label>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAssessmentSelect(q.id, opt)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          selfAssessmentResponses[q.id] === opt
                            ? 'border-corporate-teal bg-corporate-teal/10'
                            : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
                        }`}
                      >
                        <span className={selfAssessmentResponses[q.id] === opt ? 'text-corporate-teal font-medium' : 'text-corporate-navy dark:text-white'}>
                          {opt}
                        </span>
                      </button>
                    ))}
                  </div>
                  {!selfAssessmentResponses[q.id] && (
                    <p className="text-xs text-corporate-orange">Please select an option</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRF: Reflection */}
        {rep?.repType === 'deliver_reinforcing_feedback' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-corporate-navy dark:text-white">
              To make my reinforcing feedback even clearer next time, I will ______ .
            </label>
            <VoiceTextarea
              value={nextTimeReflection}
              onChange={setNextTimeReflection}
              placeholder=""
              rows={3}
            />
          </div>
        )}

        {/* SCE: "Next time I will clarify expectations earlier when..." reflection */}
        {rep?.repType === 'set_clear_expectations' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-corporate-navy dark:text-white">
              {(() => {
                const text = typeof rep?.situation === 'object' ? (rep.situation.selected || '') : (rep?.situation || '');
                const lower = text.toLowerCase();
                if (lower.includes('assigning a task')) return "Next time I will be more explicit about ______ .";
                if (lower.includes('delegating ongoing ownership')) return "Next time I delegate, I'll clarify ______ more/sooner.";
                if (lower.includes('behavioral standards')) return "Next time I establish a standard, I will be clearer about ______ .";
                return "Next time I will clarify expectations earlier when ______ .";
              })()}
            </label>
            <VoiceTextarea
              value={nextTimeReflection}
              onChange={setNextTimeReflection}
              placeholder=""
              rows={3}
            />
          </div>
        )}

        {/* FUW: "Next time you follow up I will ask..." reflection */}
        {rep?.repType === 'follow_up_work' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-corporate-navy dark:text-white">
              Next time you follow up I will ask ______ to make progress more visible.
            </label>
            <VoiceTextarea
              value={nextTimeReflection}
              onChange={setNextTimeReflection}
              placeholder={'Examples:\n• "What\'s left to finish?"\n• "Where are you in the process?"\n• "What\'s your next milestone?"'}
              rows={3}
            />
          </div>
        )}

        {/* LWV: "Next time I lead with vulnerability I will say..." reflection */}
        {rep?.repType === 'lead_with_vulnerability' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-corporate-navy dark:text-white">
              Next time I lead with vulnerability I will say ______ to strengthen ownership or learning.
            </label>
            <VoiceTextarea
              value={nextTimeReflection}
              onChange={setNextTimeReflection}
              placeholder={'Examples:\n• "I rushed that decision."\n• "I should have handled that differently."\n• "Here\'s how I\'m going to approach it next time."'}
              rows={3}
            />
          </div>
        )}

      </div>

      <div className="flex gap-3 mt-4 sticky bottom-0 bg-white dark:bg-slate-900 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Previous
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!isAssessmentComplete || isSubmitting}
          loading={isSubmitting}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          Submit Evidence
        </Button>
      </div>
    </div>
  );
};

// ============================================
// SCREEN 7: COMPLETE THE LOOP (Generic)
// ============================================
const ScreenCompleteLoop = ({
  rep,
  completeLoopResponses,
  setCompleteLoopResponses,
  onSubmit, // handleCompleteLoopSubmit
  isSubmitting
}) => {
  // Get situation-specific Complete the Loop questions
  const completeLoopQuestions = useMemo(() => {
    if (rep?.repType === 'deliver_reinforcing_feedback' || rep?.repType === 'reinforce_public') {
      return DRF_COMPLETE_LOOP;
    }
    const situationText = typeof rep?.situation === 'object' 
      ? (rep.situation.selected || '') 
      : (rep?.situation || '');
    return getSCECompleteLoopQuestions(situationText);
  }, [rep]);

  // Handle Complete the Loop field changes
  const handleCompleteLoopChange = (id, value) => {
    setCompleteLoopResponses(prev => ({ ...prev, [id]: value }));
  };

  const isValid = useMemo(() => {
    return completeLoopQuestions.every(q => {
      const val = completeLoopResponses[q.id];
      if (q.type === 'text') return val && val.trim().length > 0;
      if (q.type === 'date') return !!val;
      if (q.type === 'date_optional') return val === 'no' || (val && val !== 'yes_pending' && val.trim().length > 0);
      return true;
    });
  }, [completeLoopQuestions, completeLoopResponses]);

  return (
    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-corporate-teal/10 rounded-full mb-3">
          <RotateCw className="w-6 h-6 text-corporate-teal" />
        </div>
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          Plan Follow-up
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set yourself up for follow-through
        </p>
      </div>

      <div className="space-y-4">
        {completeLoopQuestions.map((q) => {
          if (q.type === 'text') {
            return (
              <VoiceTextarea
                key={q.id}
                id={`complete-loop-${q.id}`}
                label={q.prompt}
                value={completeLoopResponses[q.id] || ''}
                onChange={(val) => handleCompleteLoopChange(q.id, val)}
                placeholder="Your answer..."
                rows={2}
              />
            );
          }
          
          if (q.type === 'date') {
            return (
              <div key={q.id} className="space-y-2">
                <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                  {q.prompt}
                </label>
                <input
                  type="date"
                  value={completeLoopResponses[q.id] || ''}
                  onChange={(e) => handleCompleteLoopChange(q.id, e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-corporate-navy dark:text-white"
                />
              </div>
            );
          }

          if (q.type === 'date_optional') {
            const hasDraftValue = completeLoopResponses[q.id] !== undefined;
            const isNo = completeLoopResponses[q.id] === 'no';
            const isYes = hasDraftValue && !isNo;

            return (
              <div key={q.id} className="space-y-3">
                <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                  {q.prompt}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCompleteLoopChange(q.id, completeLoopResponses[q.id] === 'no' ? 'yes_pending' : (completeLoopResponses[q.id] || 'yes_pending'))}
                    className={`flex-1 p-2 border rounded-md text-sm font-medium transition-colors ${
                      isYes 
                        ? 'border-corporate-teal bg-corporate-teal/10 text-corporate-teal' 
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-corporate-teal/50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompleteLoopChange(q.id, 'no')}
                    className={`flex-1 p-2 border rounded-md text-sm font-medium transition-colors ${
                      isNo 
                        ? 'border-corporate-teal bg-corporate-teal/10 text-corporate-teal' 
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-corporate-teal/50'
                    }`}
                  >
                    No
                  </button>
                </div>
                
                {isYes && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Set date (required):
                    </label>
                    <input
                      type="date"
                      value={completeLoopResponses[q.id] === 'yes_pending' ? '' : (completeLoopResponses[q.id] || '')}
                      onChange={(e) => handleCompleteLoopChange(q.id, e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-corporate-navy dark:text-white"
                    />
                  </div>
                )}
              </div>
            );
          }
          
          if (q.type === 'auto_fill_person') {
            return (
              <div key={q.id} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <label className="block text-sm font-medium text-corporate-navy dark:text-white mb-1">
                  {q.prompt}
                </label>
                <span className="text-sm text-corporate-teal font-medium">
                  {rep?.person || 'Not specified'}
                </span>
              </div>
            );
          }
          
          return null;
        })}
      </div>

       <div className="flex gap-3 mt-4 sticky bottom-0 bg-white dark:bg-slate-900 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          className="w-full"
        >
          <Check className="w-4 h-4 mr-2" />
          Complete the Rep
        </Button>
      </div>
    </div>
  );
};

// ============================================
// SCREEN 6: REPUP REVIEW (AI Feedback)
// ============================================
const ScreenRepUpReview = ({ qualityAssessment, onDone }) => {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-corporate-teal/10 rounded-full mb-3">
          <Award className="w-6 h-6 text-corporate-teal" />
        </div>
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          RepUp Review
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          AI feedback on your Real Rep
        </p>
      </div>

      {qualityAssessment ? (
        <QualityAssessmentCard 
          qualityAssessment={qualityAssessment}
          compact={false}
        />
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-corporate-teal/20 border-t-corporate-teal rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Generating feedback...</p>
          </div>
        </div>
      )}

      <Button
        onClick={onDone}
        disabled={!qualityAssessment}
        className="w-full mt-4"
      >
        <Check className="w-4 h-4 mr-2" />
        Done
      </Button>
    </div>
  );
};

// ============================================
// CTL SCREEN 1: DECISION
// "Did the behavior change?"
// ============================================
const ScreenCTLDecision = ({
  linkedRep,
  ctlDecision,
  setCtlDecision,
  onNext,
  onBack
}) => {
  // Extract RED context to display
  const redContext = useMemo(() => {
    const evidence = linkedRep?.evidence?.redEvidence?.responses || {};
    return {
      person: linkedRep?.person || 'Someone',
      behavior: evidence.behavior_statement || 'the behavior discussed',
      request: evidence.request_statement || 'the requested change',
      watchFor: linkedRep?.evidence?.redEvidence?.completeLoopResponses?.watch_for || null
    };
  }, [linkedRep]);

  return (
    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-corporate-teal/10 rounded-full mb-3">
          <RotateCw className="w-6 h-6 text-corporate-teal" />
        </div>
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          Close the Loop
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Verify if your redirecting feedback led to behavior change
        </p>
      </div>

      {/* RED Context Summary */}
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-corporate-navy dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-corporate-teal" />
          Original Feedback to: {redContext.person}
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Behavior addressed:</span>
            <span className="italic">"{redContext.behavior}"</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">What you requested:</span>
            <span className="italic">"{redContext.request}"</span>
          </div>
          {redContext.watchFor && (
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Watching for:</span>
              <span className="italic">"{redContext.watchFor}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Decision Question */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-corporate-navy dark:text-white">
          Did the behavior change?
        </label>
        <div className="space-y-2">
          {CTL_DECISION_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setCtlDecision(option.id)}
              className={`w-full p-4 border rounded-lg text-left transition-all ${
                ctlDecision === option.id 
                  ? 'border-corporate-teal bg-corporate-teal/10' 
                  : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-corporate-teal/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{option.icon}</span>
                <div>
                  <div className={`font-medium ${
                    ctlDecision === option.id 
                      ? 'text-corporate-teal' 
                      : 'text-corporate-navy dark:text-white'
                  }`}>
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-4 sticky bottom-0 bg-white dark:bg-slate-900 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={onNext}
          disabled={!ctlDecision}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

// ============================================
// CTL SCREEN 2: OBSERVATION
// Capture evidence based on decision
// ============================================
const ScreenCTLObservation = ({
  linkedRep,
  ctlDecision,
  ctlObservation,
  setCtlObservation,
  ctlNotObservedReason,
  setCtlNotObservedReason,
  ctlGaveReinforcing,
  setCtlGaveReinforcing,
  ctlGaveFollowupFeedback,
  setCtlGaveFollowupFeedback,
  ctlNextAction,
  setCtlNextAction,
  ctlNextCheckDate,
  setCtlNextCheckDate,
  onNext,
  onBack,
  showValidation
}) => {
  const questions = CTL_OBSERVATION_QUESTIONS[ctlDecision] || [];

  // Validation based on decision path
  const isValid = useMemo(() => {
    if (ctlDecision === 'changed') {
      return ctlObservation.what_observed?.trim() && ctlObservation.observation_context?.trim();
    }
    if (ctlDecision === 'not_changed') {
      const hasObservation = ctlObservation.what_observed?.trim() && ctlObservation.observation_context?.trim();
      if (!hasObservation) return false;
      // If they didn't give feedback, need next action
      if (ctlGaveFollowupFeedback === false) {
        return ctlNextAction?.trim() && ctlNextCheckDate;
      }
      return ctlGaveFollowupFeedback !== null;
    }
    if (ctlDecision === 'not_observed') {
      return ctlNotObservedReason && ctlNextCheckDate;
    }
    return false;
  }, [ctlDecision, ctlObservation, ctlNotObservedReason, ctlGaveFollowupFeedback, ctlNextAction, ctlNextCheckDate]);

  return (
    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Header based on decision */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
          ctlDecision === 'changed' ? 'bg-green-100 dark:bg-green-900/30' :
          ctlDecision === 'not_changed' ? 'bg-amber-100 dark:bg-amber-900/30' :
          'bg-gray-100 dark:bg-slate-700'
        }`}>
          {ctlDecision === 'changed' && <Check className="w-6 h-6 text-green-600 dark:text-green-400" />}
          {ctlDecision === 'not_changed' && <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          {ctlDecision === 'not_observed' && <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
        </div>
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          {ctlDecision === 'changed' && 'Behavior Changed'}
          {ctlDecision === 'not_changed' && 'Behavior Did Not Change'}
          {ctlDecision === 'not_observed' && 'Not Observed Yet'}
        </h3>
      </div>

      {/* PATH A: Behavior Changed */}
      {ctlDecision === 'changed' && (
        <div className="space-y-4">
          {questions.map((q) => (
            <VoiceTextarea
              key={q.id}
              id={`ctl-${q.id}`}
              label={q.prompt}
              value={ctlObservation[q.id] || ''}
              onChange={(val) => setCtlObservation(prev => ({ ...prev, [q.id]: val }))}
              placeholder={q.placeholder}
              rows={2}
              required={q.required}
              showValidation={showValidation && !ctlObservation[q.id]?.trim()}
            />
          ))}

          {/* Secondhand observation note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> {CTL_SECONDHAND_RULES.prompt}
          </div>

          {/* Reinforcing feedback checkbox */}
          <div className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ctlGaveReinforcing}
                onChange={(e) => setCtlGaveReinforcing(e.target.checked)}
                className="mt-1 w-4 h-4 text-corporate-teal border-gray-300 rounded focus:ring-corporate-teal"
              />
              <div>
                <div className="font-medium text-corporate-navy dark:text-white">
                  {CTL_REINFORCEMENT_QUESTION.prompt}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {CTL_REINFORCEMENT_QUESTION.description}
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* PATH B: Behavior Did Not Change */}
      {ctlDecision === 'not_changed' && (
        <div className="space-y-4">
          {questions.map((q) => (
            <VoiceTextarea
              key={q.id}
              id={`ctl-${q.id}`}
              label={q.prompt}
              value={ctlObservation[q.id] || ''}
              onChange={(val) => setCtlObservation(prev => ({ ...prev, [q.id]: val }))}
              placeholder={q.placeholder}
              rows={2}
              required={q.required}
              showValidation={showValidation && !ctlObservation[q.id]?.trim()}
            />
          ))}

          {/* Did they give follow-up feedback? */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-corporate-navy dark:text-white">
              Did you give follow-up redirecting feedback?
            </label>
            <div className="space-y-2">
              {CTL_CONTINUATION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCtlGaveFollowupFeedback(option.id === 'gave_feedback')}
                  className={`w-full p-3 border rounded-lg text-left transition-all ${
                    (ctlGaveFollowupFeedback === true && option.id === 'gave_feedback') ||
                    (ctlGaveFollowupFeedback === false && option.id === 'no_feedback')
                      ? 'border-corporate-teal bg-corporate-teal/10' 
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-corporate-teal/50'
                  }`}
                >
                  <div className="font-medium text-sm text-corporate-navy dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* If they didn't give feedback, ask for next action */}
          {ctlGaveFollowupFeedback === false && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-slate-600">
              <VoiceTextarea
                id="ctl-next-action"
                label={CTL_NEXT_ACTION_QUESTIONS[0].prompt}
                value={ctlNextAction || ''}
                onChange={setCtlNextAction}
                placeholder={CTL_NEXT_ACTION_QUESTIONS[0].placeholder}
                rows={2}
                required={true}
                showValidation={showValidation && !ctlNextAction?.trim()}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                  {CTL_NEXT_ACTION_QUESTIONS[1].prompt}
                </label>
                <input
                  type="date"
                  value={ctlNextCheckDate || ''}
                  onChange={(e) => setCtlNextCheckDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-corporate-navy dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* PATH C: Not Observed Yet */}
      {ctlDecision === 'not_observed' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-corporate-navy dark:text-white">
              Why haven't you been able to observe yet?
            </label>
            <div className="space-y-2">
              {CTL_NOT_OBSERVED_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setCtlNotObservedReason(reason.id)}
                  className={`w-full p-3 border rounded-lg text-left transition-all ${
                    ctlNotObservedReason === reason.id 
                      ? 'border-corporate-teal bg-corporate-teal/10' 
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-corporate-teal/50'
                  }`}
                >
                  <span className="text-sm text-corporate-navy dark:text-white">
                    {reason.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Reschedule date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-corporate-navy dark:text-white">
              When will you check again?
            </label>
            <input
              type="date"
              value={ctlNextCheckDate || ''}
              onChange={(e) => setCtlNextCheckDate(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-corporate-navy dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Default: {CTL_DEFER_DEFAULT_DAYS} days from today
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-4 sticky bottom-0 bg-white dark:bg-slate-900 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1"
        >
          {ctlDecision === 'not_changed' && ctlGaveFollowupFeedback === true 
            ? 'Continue to New RED' 
            : 'Submit'}
        </Button>
      </div>
    </div>
  );
};

// ============================================
// CTL SCREEN 3: CREATE CONTINUATION RED
// Pre-filled RED for follow-up feedback
// ============================================
const ScreenCTLContinueRED = ({
  linkedRep,
  continuationResponses,
  setContinuationResponses,
  onSubmit,
  onBack,
  isSubmitting,
  showValidation
}) => {
  // Pre-fill from original RED
  const originalEvidence = linkedRep?.evidence?.redEvidence?.responses || {};

  return (
    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-corporate-orange/10 rounded-full mb-3">
          <MessageSquare className="w-6 h-6 text-corporate-orange" />
        </div>
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          Continue Redirecting Feedback
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This will create a linked follow-up to your original feedback
        </p>
      </div>

      {/* Original context (read-only) */}
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Original Feedback Context
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <div><strong>Person:</strong> {linkedRep?.person}</div>
          <div><strong>Original Behavior:</strong> {originalEvidence.behavior_statement}</div>
          <div><strong>Original Request:</strong> {originalEvidence.request_statement}</div>
        </div>
      </div>

      {/* New RED fields */}
      <div className="space-y-4">
        <VoiceTextarea
          id="continuation-behavior"
          label="What did you say to describe the behavior gap this time?"
          value={continuationResponses.behavior_statement || ''}
          onChange={(val) => setContinuationResponses(prev => ({ ...prev, behavior_statement: val }))}
          placeholder="Describe the specific, observable behavior you addressed"
          rows={2}
          required={true}
          showValidation={showValidation && !continuationResponses.behavior_statement?.trim()}
        />

        <VoiceTextarea
          id="continuation-impact"
          label="What did you say about why this matters?"
          value={continuationResponses.impact_statement || ''}
          onChange={(val) => setContinuationResponses(prev => ({ ...prev, impact_statement: val }))}
          placeholder="Explain the impact or standard that isn't being met"
          rows={2}
          required={true}
          showValidation={showValidation && !continuationResponses.impact_statement?.trim()}
        />

        <VoiceTextarea
          id="continuation-request"
          label="What did you ask them to do differently?"
          value={continuationResponses.request_statement || ''}
          onChange={(val) => setContinuationResponses(prev => ({ ...prev, request_statement: val }))}
          placeholder="State the specific request for change"
          rows={2}
          required={true}
          showValidation={showValidation && !continuationResponses.request_statement?.trim()}
        />

        <VoiceTextarea
          id="continuation-response"
          label="How did they respond this time?"
          value={continuationResponses.their_response_detail || ''}
          onChange={(val) => setContinuationResponses(prev => ({ ...prev, their_response_detail: val }))}
          placeholder="Describe their reaction"
          rows={2}
          required={true}
          showValidation={showValidation && !continuationResponses.their_response_detail?.trim()}
        />
      </div>

      <div className="flex gap-3 mt-4 sticky bottom-0 bg-white dark:bg-slate-900 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !continuationResponses.behavior_statement?.trim() || 
                   !continuationResponses.impact_statement?.trim() || 
                   !continuationResponses.request_statement?.trim() ||
                   !continuationResponses.their_response_detail?.trim()}
          loading={isSubmitting}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          Submit Feedback
        </Button>
      </div>
    </div>
  );
};

// ============================================
// CONFIRMATION POPUP
// ============================================
const ConfirmationPopup = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full shadow-xl">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-corporate-navy dark:text-white">{message}</p>
        </div>
      </div>
      <Button
        onClick={onClose}
        className="w-full mt-4"
      >
        Got it
      </Button>
    </div>
  </div>
);

// ============================================
// MAIN WIZARD COMPONENT
// ============================================
const EvidenceCaptureWizard = ({ rep, onClose, onSubmit, initialMode = 'evidence', skipOverview = false }) => {
  const { db, user, storage } = useAppServices();
  const userId = user?.uid;

  // Track freshly fetched reviewViewedAt from Firestore (in case prop is stale)
  const [freshReviewViewedAt, setFreshReviewViewedAt] = useState(null);
  const freshDataCheckedRef = useRef(false);

  // Fetch fresh data from Firestore to check if reviewViewedAt was set (handles stale prop data)
  useEffect(() => {
    if (freshDataCheckedRef.current) return;
    const isSCERep = rep?.repType === 'set_clear_expectations';
    const isDRFRep = rep?.repType === 'deliver_reinforcing_feedback' || rep?.repType === 'reinforce_public';
    const isFUWRep = rep?.repType === 'follow_up_work';
    const isLWVRepLocal = rep?.repType === 'lead_with_vulnerability';
    const isREDRep = rep?.repType === 'deliver_redirecting_feedback';
    
    // Only check fresh data for debriefed SCE/DRF/FUW/LWV/RED reps that don't have reviewViewedAt in prop
    if (rep?.status === 'debriefed' && !rep?.reviewViewedAt && (isSCERep || isDRFRep || isFUWRep || isLWVRepLocal || isREDRep) && db && user?.uid && rep?.id) {
      freshDataCheckedRef.current = true;
      const checkFreshData = async () => {
        try {
          const repRef = doc(db, 'users', user.uid, 'conditioning_reps', rep.id);
          const repSnap = await getDoc(repRef);
          if (repSnap.exists()) {
            const freshData = repSnap.data();
            if (freshData.reviewViewedAt) {
              setFreshReviewViewedAt(freshData.reviewViewedAt);
            }
          }
        } catch (err) {
          console.error('Error checking fresh rep data:', err);
        }
      };
      checkFreshData();
    }
  }, [rep?.status, rep?.reviewViewedAt, rep?.repType, rep?.id, db, user?.uid]);

  // Guard: route reps to the correct mode based on status
  // Flow: 1) Commit (committed) -> 2) Evidence (executed) -> 3) Debrief (debriefed) -> 4) Follow-up (loop_closed)
  // For RED: debriefed with reminder -> follow_up_pending (awaiting CTL) -> loop_closed
  const effectiveMode = useMemo(() => {
    const isSCERep = rep?.repType === 'set_clear_expectations';
    const isDRFRep = rep?.repType === 'deliver_reinforcing_feedback' || rep?.repType === 'reinforce_public';
    const isFUWRep = rep?.repType === 'follow_up_work';
    const isLWVRepLocal = rep?.repType === 'lead_with_vulnerability';
    const isREDRep = rep?.repType === 'deliver_redirecting_feedback';
    
    // CTL Mode: RED rep in follow_up_pending status awaiting close the loop
    if (isREDRep && rep?.status === 'follow_up_pending' && rep?.awaitingCTL) {
      return 'ctl';
    }
    
    // Explicitly opened in CTL mode (from UI "Close the Loop" button)
    if (initialMode === 'ctl' && isREDRep) {
      return 'ctl';
    }
    
    // Session 3: Debrief - rep has evidence but AI assessment not yet triggered
    // Status is 'executed' with evidence -> open in 'review' mode to trigger AI and show assessment
    if (rep?.status === 'executed' && rep?.evidence && (isSCERep || isDRFRep || isFUWRep || isLWVRepLocal || isREDRep)) {
      return 'review';
    }
    
    // Session 4: Follow-up - rep is debriefed (AI assessment done)
    if (rep?.status === 'debriefed') {
      // If explicitly opened in 'plan' mode, allow it
      if (initialMode === 'plan') return 'plan';
      // If review has already been seen (via reviewViewedAt flag or fresh data), go to plan follow-up
      if (rep?.reviewViewedAt || freshReviewViewedAt) return 'plan';
      // Otherwise show review first to display AI assessment
      return 'review';
    }
    
    return initialMode;
  }, [rep?.status, rep?.evidence, rep?.repType, rep?.reviewViewedAt, rep?.awaitingCTL, freshReviewViewedAt, initialMode]);
  
  // Get current week to check level/milestone
  const { currentWeek } = useDevPlan();
  
  // Calculate Level 3 status (Assuming Level 3 starts at level 300 or Week 9+)
  // This defaults to false for current users in weeks 1-8 (levels 100-200)
  const isLevel3OrHigher = useMemo(() => {
    const level = parseInt(currentWeek?.level || '0', 10);
    // Alternatively check weekNumber if level isn't reliable
    // const week = currentWeek?.weekNumber || 0;
    return level >= 300; 
  }, [currentWeek]);
  
  // Draft loading state
  const [draftLoaded, setDraftLoaded] = useState(false);
  const saveTimeoutRef = useRef(null);
  const latestDraftState = useRef({});
  
  // Rep type check for SCE, DRF, FUW, LWV, and RED
  const isSCERep = rep?.repType === 'set_clear_expectations';
  const isDRFRep = rep?.repType === 'deliver_reinforcing_feedback' || rep?.repType === 'reinforce_public';
  const isFUWRep = rep?.repType === 'follow_up_work';
  const isLWVRep = rep?.repType === 'lead_with_vulnerability';
  const isREDRep = rep?.repType === 'deliver_redirecting_feedback';

  // Screen state - determine initial screen based on mode
  const getInitialScreen = () => {
    switch(effectiveMode) {
      case 'review': return 6;
      case 'plan': return 7;
      default: return skipOverview ? 2 : 1; // Skip Overview (screen 1) and go to Evidence (screen 2) when skipOverview is true
    }
  };
  
  const [currentScreen, setCurrentScreen] = useState(getInitialScreen());
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  
  // Sync currentScreen when effectiveMode changes (e.g., when rep data loads)
  const prevEffectiveModeRefSync = useRef(effectiveMode);
  useEffect(() => {
    if (prevEffectiveModeRefSync.current !== effectiveMode) {
      // Mode changed - update screen to match
      const targetScreen = effectiveMode === 'review' ? 6 : effectiveMode === 'plan' ? 7 : 1;
      
      // If we are switching into a strict single-screen mode (review or plan), ALWAYS force it
      if (effectiveMode === 'plan' || effectiveMode === 'review') {
        setCurrentScreen(targetScreen);
      } else {
        // Otherwise, only update if we're predictably at a starting screen
        const currentStartScreen = prevEffectiveModeRefSync.current === 'review' ? 6 : prevEffectiveModeRefSync.current === 'plan' ? 7 : 1;
        if (currentScreen === currentStartScreen || currentScreen === 1) {
          setCurrentScreen(targetScreen);
        }
      }
      
      prevEffectiveModeRefSync.current = effectiveMode;
    }
  }, [effectiveMode, currentScreen]);

  // Update QA from rep if in review mode, or trigger AI assessment if needed
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);
  const assessmentTriggeredRef = useRef(false);
  
  useEffect(() => {
    // If rep already has qualityAssessment, just load it and return
    // No need to re-trigger AI - assessment already exists
    if (rep?.qualityAssessment) {
      setQualityAssessment(rep.qualityAssessment);
      return;
    }
    
    // If review was already viewed (from prop or fresh fetch), don't retrigger AI - user should be in plan mode
    if (rep?.reviewViewedAt || freshReviewViewedAt) {
      return;
    }
    
    // Session 3 (Debrief): rep is 'executed' with evidence but no AI assessment yet
    // We need to trigger closeRepV2 to get the AI assessment
    const isSCERep = rep?.repType === 'set_clear_expectations';
    const isDRFRepLocal = rep?.repType === 'deliver_reinforcing_feedback' || rep?.repType === 'reinforce_public';
    const isFUWRepLocal = rep?.repType === 'follow_up_work';
    const isLWVRepLocal = rep?.repType === 'lead_with_vulnerability';
    
    // Only trigger AI assessment if:
    // 1. effectiveMode is 'review'
    // 2. status is 'executed' (not yet debriefed)
    // 3. has evidence
    // 4. is SCE, DRF, FUW, or LWV rep
    // 5. no qualityAssessment already exists (checked above but double-check)
    if (effectiveMode === 'review' && rep?.status === 'executed' && rep?.evidence && (isSCERep || isDRFRepLocal || isFUWRepLocal || isLWVRepLocal) && !rep?.qualityAssessment) {
      // Only trigger once per wizard session
      if (assessmentTriggeredRef.current) return;
      assessmentTriggeredRef.current = true;
      
      const triggerAssessment = async () => {
        if (!db || !user?.uid || !rep?.id) return;
        
        setIsLoadingAssessment(true);
        try {
          // Get reflection data from evidence
          const closeData = {
            outcome: rep.outcome || rep.evidence?.outcome || 'executed',
            whatWentWell: rep.evidence?.whatWentWell || '',
            whatDifferent: rep.evidence?.whatDifferent || ''
          };
          
          // Trigger AI assessment - this sets status to 'debriefed'
          const { quality } = await conditioningService.closeRepV2(db, user.uid, rep.id, closeData);
          setQualityAssessment(quality);
        } catch (err) {
          console.error('Error triggering AI assessment:', err);
          setError('Failed to load AI assessment. Please try again.');
        } finally {
          setIsLoadingAssessment(false);
        }
      };
      
      triggerAssessment();
      return;
    }
    
    // FALLBACK: If status is 'debriefed' but we don't have qualityAssessment in the passed data
    // (stale data scenario), fetch fresh data from Firestore
    if (effectiveMode === 'review' && rep?.status === 'debriefed' && !rep?.qualityAssessment && (isSCERep || isDRFRepLocal || isFUWRepLocal)) {
      // Only trigger once per wizard session
      if (assessmentTriggeredRef.current) return;
      assessmentTriggeredRef.current = true;
      
      const fetchFreshAssessment = async () => {
        if (!db || !user?.uid || !rep?.id) return;
        
        setIsLoadingAssessment(true);
        try {
          // Fetch fresh rep data from Firestore
          const repRef = doc(db, 'users', user.uid, 'conditioning_reps', rep.id);
          const repSnap = await getDoc(repRef);
          
          if (repSnap.exists()) {
            const freshRep = repSnap.data();
            if (freshRep.qualityAssessment) {
              setQualityAssessment(freshRep.qualityAssessment);
            } else {
              // AI hasn't run yet for some reason - show error
              setError('Assessment not found. The AI may not have completed. Please try again.');
            }
          }
        } catch (err) {
          console.error('Error fetching fresh assessment:', err);
          setError('Failed to load assessment. Please try again.');
        } finally {
          setIsLoadingAssessment(false);
        }
      };
      
      fetchFreshAssessment();
      return;
    }
    
    // Load existing loop responses if in plan mode
    if (effectiveMode === 'plan') {
       const existingResponses = isDRFRep 
        ? rep?.evidence?.drfEvidence?.completeLoopResponses 
        : isREDRep
        ? rep?.evidence?.redEvidence?.completeLoopResponses
        : rep?.evidence?.sceEvidence?.completeLoopResponses;
       
       if (existingResponses) {
         setCompleteLoopResponses(existingResponses);
       }
    }
  }, [effectiveMode, rep, isDRFRep, isREDRep, db, user?.uid, freshReviewViewedAt]);

  // Screen 2: What Happened (generic)
  const [whatHappened, setWhatHappened] = useState('');
  
  // Screen 2-SCE: Set Clear Expectations responses (situation-specific)
  const [sceResponses, setSceResponses] = useState({});
  const [showOwnershipWarning, setShowOwnershipWarning] = useState(false);

  // Screen 2-DRF: Deliver Reinforcing Feedback responses
  const [drfResponses, setDrfResponses] = useState({});
  
  // Screen 5-Assessment: Self-assessment checkboxes
  const [selfAssessmentResponses, setSelfAssessmentResponses] = useState({});
  
  // Screen 3: Response & Dynamics
  const [response, setResponse] = useState(null);
  const [otherResponseText, setOtherResponseText] = useState(''); // Added for DRF "Other" option
  const [pushbackLogOption, setPushbackLogOption] = useState(null);
  const [pushbackResponses, setPushbackResponses] = useState([]);
  const [pushbackNote, setPushbackNote] = useState('');
  const [closeLoopOption, setCloseLoopOption] = useState(null);
  const [closeLoopLogOption, setCloseLoopLogOption] = useState(null);
  const [behaviorChange, setBehaviorChange] = useState(null);
  const [behaviorChangeNote, setBehaviorChangeNote] = useState('');
  
  // Screen 4: Artifacts
  const [notes, setNotes] = useState('');
  const [artifacts, setArtifacts] = useState([]);
  
  // Screen 5: Close RR (Reflection)
  const [outcome, setOutcome] = useState(null);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatDifferent, setWhatDifferent] = useState('');
  const [nextTimeReflection, setNextTimeReflection] = useState(''); // DRF/SCE: "Next time I will..." commitment
  const [completeLoopResponses, setCompleteLoopResponses] = useState({});
  
  // Screen 6: RepUp Review (AI feedback)
  const [qualityAssessment, setQualityAssessment] = useState(null);
  
  // CTL (Close the Loop) state - used when effectiveMode === 'ctl'
  const [ctlDecision, setCtlDecision] = useState(null); // 'changed' | 'not_changed' | 'not_observed'
  const [ctlObservation, setCtlObservation] = useState({}); // { what_observed, observation_context }
  const [ctlNotObservedReason, setCtlNotObservedReason] = useState(null);
  const [ctlGaveReinforcing, setCtlGaveReinforcing] = useState(false);
  const [ctlGaveFollowupFeedback, setCtlGaveFollowupFeedback] = useState(null); // true | false | null
  const [ctlNextAction, setCtlNextAction] = useState('');
  const [ctlNextCheckDate, setCtlNextCheckDate] = useState(() => {
    // Default to 10 days from now (CTL_DEFAULT_SCHEDULE_DAYS)
    const defaultDate = new Date(Date.now() + CTL_DEFAULT_SCHEDULE_DAYS * 24 * 60 * 60 * 1000);
    return defaultDate.toISOString().split('T')[0];
  });
  const [continuationResponses, setContinuationResponses] = useState({}); // For new RED
  const [ctlCurrentScreen, setCtlCurrentScreen] = useState(1); // 1=Decision, 2=Observation, 3=ContinueRED
  const [ctlAssessment, setCtlAssessment] = useState(null); // AI assessment result
  
  // Update default date when decision changes to 'not_observed' (use 7-day defer default)
  useEffect(() => {
    if (ctlDecision === 'not_observed') {
      const deferDate = new Date(Date.now() + CTL_DEFER_DEFAULT_DAYS * 24 * 60 * 60 * 1000);
      setCtlNextCheckDate(deferDate.toISOString().split('T')[0]);
    }
  }, [ctlDecision]);
  
  // Track created separate reps
  const [createdReps, setCreatedReps] = useState([]);
  
  // Separate rep evidence prompt
  const [showSeparateRepPrompt, setShowSeparateRepPrompt] = useState(false);

  // Keep a ref of the very latest effectiveMode so async draft load doesn't use stale closure
  const latestEffectiveModeRef = useRef(effectiveMode);
  useEffect(() => {
    latestEffectiveModeRef.current = effectiveMode;
  }, [effectiveMode]);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!db || !userId || !rep?.id) {
        setDraftLoaded(true);
        return;
      }
      
      try {
        const draft = await getEvidenceDraft(db, userId, rep.id);
        if (draft && hasEvidenceProgress(draft)) {
          // Restore state from draft
          const fd = draft.formData || {};
          
          // Determine correct screen to apply (respecting mode overrides)
          const currentMode = latestEffectiveModeRef.current;
          let targetScreen = draft.currentScreen || 1;
          if (currentMode === 'review') {
            targetScreen = 6;
          } else if (currentMode === 'plan') {
            targetScreen = 7;
          }
          
          setCurrentScreen(targetScreen);
          setWhatHappened(fd.whatHappened || '');
          setSceResponses(fd.sceResponses || {});
          setDrfResponses(fd.drfResponses || {});
          setSelfAssessmentResponses(fd.selfAssessmentResponses || {});
          setResponse(fd.response || null);
          setOtherResponseText(fd.otherResponseText || '');
          setPushbackLogOption(fd.pushbackLogOption || null);
          setPushbackResponses(fd.pushbackResponses || []);
          setPushbackNote(fd.pushbackNote || '');
          setCloseLoopOption(fd.closeLoopOption || null);
          setCloseLoopLogOption(fd.closeLoopLogOption || null);
          setBehaviorChange(fd.behaviorChange || null);
          setBehaviorChangeNote(fd.behaviorChangeNote || '');
          setNotes(fd.notes || '');
          setArtifacts(fd.artifacts || []);
          setOutcome(fd.outcome || null);
          setWhatWentWell(fd.whatWentWell || '');
          setWhatDifferent(fd.whatDifferent || '');
          setCompleteLoopResponses(fd.completeLoopResponses || {});
        }
      } catch (err) {
        console.warn('Failed to load evidence draft:', err);
      }
      setDraftLoaded(true);
    };
    
    loadDraft();
  }, [db, userId, rep?.id]);

  // Auto-save draft on state changes (debounced)
  useEffect(() => {
    if (!draftLoaded || !db || !userId || !rep?.id) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveEvidenceDraft(db, userId, rep.id, {
          currentScreen,
          whatHappened,
          sceResponses,
          drfResponses, // New
          selfAssessmentResponses, // New
          response,
          otherResponseText, // Added
          pushbackLogOption,
          pushbackResponses,
          pushbackNote,
          closeLoopOption,
          closeLoopLogOption,
          behaviorChange,
          behaviorChangeNote,
          notes,
          artifacts,
          outcome,
          whatWentWell,
          whatDifferent,
          completeLoopResponses
        });
      } catch (err) {
        console.warn('Failed to save evidence draft:', err);
      }
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    draftLoaded, db, userId, rep?.id,
    currentScreen, whatHappened, sceResponses, drfResponses, selfAssessmentResponses, response, otherResponseText, pushbackLogOption, pushbackResponses,
    pushbackNote, closeLoopOption, closeLoopLogOption, behaviorChange,
    behaviorChangeNote, notes, artifacts, outcome, whatWentWell, whatDifferent, completeLoopResponses
  ]);

  // Update ref with latest state for unmount save
  useEffect(() => {
    latestDraftState.current = {
      isSubmitting,
      draftLoaded,
      currentScreen,
      whatHappened,
      sceResponses,
      drfResponses,
      selfAssessmentResponses,
      response,
      otherResponseText, // Added
      pushbackLogOption,
      pushbackResponses,
      pushbackNote,
      closeLoopOption,
      closeLoopLogOption,
      behaviorChange,
      behaviorChangeNote,
      notes,
      artifacts,
      outcome,
      whatWentWell,
      whatDifferent,
      completeLoopResponses
    };
  }, [
    isSubmitting, draftLoaded,
    currentScreen, whatHappened, sceResponses, drfResponses, selfAssessmentResponses, response, otherResponseText, pushbackLogOption, pushbackResponses,
    pushbackNote, closeLoopOption, closeLoopLogOption, behaviorChange,
    behaviorChangeNote, notes, artifacts, outcome, whatWentWell, whatDifferent, completeLoopResponses
  ]);

  // Save draft on unmount (if not submitting)
  useEffect(() => {
    return () => {
      const state = latestDraftState.current;
      // Only save if we are not in the middle of submitting and draft was loaded
      if (state.draftLoaded && db && userId && rep?.id && !state.isSubmitting) {
        saveEvidenceDraft(db, userId, rep.id, {
          currentScreen: state.currentScreen,
          whatHappened: state.whatHappened,
          sceResponses: state.sceResponses,
          drfResponses: state.drfResponses,
          selfAssessmentResponses: state.selfAssessmentResponses,
          response: state.response,
          pushbackLogOption: state.pushbackLogOption,
          pushbackResponses: state.pushbackResponses,
          pushbackNote: state.pushbackNote,
          closeLoopOption: state.closeLoopOption,
          closeLoopLogOption: state.closeLoopLogOption,
          behaviorChange: state.behaviorChange,
          behaviorChangeNote: state.behaviorChangeNote,
          notes: state.notes,
          artifacts: state.artifacts,
          outcome: state.outcome,
          whatWentWell: state.whatWentWell,
          whatDifferent: state.whatDifferent,
          completeLoopResponses: state.completeLoopResponses
        }).catch(err => {
          console.warn('Failed to save draft on close:', err);
        });
      }
    };
  }, [db, userId, rep?.id]); // Run cleanup on unmount or rep change

  // Navigation
  const handleNext = useCallback(() => {
    setShowValidation(true);
    setCurrentScreen(prev => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentScreen(prev => Math.max(1, prev - 1));
  }, []);

  // Create separate Handle Pushback rep
  const createSeparatePushbackRep = async () => {
    try {
      const newRepData = {
        repType: 'handle_pushback',
        person: rep.person,
        situation: `${RESPONSE_OPTIONS.find(o => o.id === response)?.label || 'Pushback occurred'}`,
        context: `Linked from ${rep.repType} evidence capture`,
        linkedFromRepId: rep.id,
        commitmentType: 'in_moment',
        cohortId: rep.cohortId,
        weekId: rep.weekId
      };
      
      const newRepId = await conditioningService.commitRepV2(db, userId, newRepData);
      
      // Rep is already marked as 'executed' by commitRepV2 when type is 'in_moment'
      // No need to transition state manually
      
      setCreatedReps(prev => [...prev, { type: 'handle_pushback', id: newRepId }]);
      setConfirmationMessage('A new Real Rep (Handle Pushback) has been created and will be available once you\'ve completed capturing evidence.');
    } catch (err) {
      console.error('Error creating pushback rep:', err);
      setError('Failed to create Handle Pushback rep');
    }
  };

  // Create separate Close the Loop rep
  const createSeparateCloseLoopRep = async () => {
    try {
      const newRepData = {
        repType: 'close_the_loop',
        person: rep.person,
        situation: 'Verifying behavior change from previous feedback',
        context: `Linked from ${rep.repType} evidence capture`,
        linkedFromRepId: rep.id,
        commitmentType: 'in_moment',
        cohortId: rep.cohortId,
        weekId: rep.weekId
      };
      
      const newRepId = await conditioningService.commitRepV2(db, userId, newRepData);
      
      // Rep is already marked as 'executed' by commitRepV2 when type is 'in_moment'
      // No need to transition state manually
      
      setCreatedReps(prev => [...prev, { type: 'close_the_loop', id: newRepId }]);
      setConfirmationMessage('A new Real Rep (Close the Loop) has been created and will be available once you\'ve completed capturing evidence.');
    } catch (err) {
      console.error('Error creating close loop rep:', err);
      setError('Failed to create Close the Loop rep');
    }
  };

  // Handle screen 3 progression with separate rep creation
  const handleScreen3Next = async () => {
    // Create separate reps if selected
    if (pushbackLogOption === 'separate') {
      await createSeparatePushbackRep();
    }
    if (closeLoopLogOption === 'separate') {
      await createSeparateCloseLoopRep();
    }
    
    handleNext();
  };

  // Submit all evidence AND close the rep
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Handle "missed" outcome - route to missed flow, not evidence flow
      if (outcome === 'missed') {
        // For missed reps, transition to missed status with brief debrief
        await conditioningService.transitionRepState(db, userId, rep.id, 'missed', {
          missedDebrief: {
            what_blocked: whatWentWell, // Repurpose this field for "what got in the way"
            next_week_different: whatDifferent,
            submittedAt: new Date().toISOString()
          }
        });
        
        // Clear draft on successful submission
        await deleteEvidenceDraft(db, userId, rep.id).catch(() => {});
        
        onSubmit?.({ outcome: 'missed' });
        onClose?.();
        return;
      }
      
      // Build evidence data
      let responseLabel = "";
      if (isDRFRep) responseLabel = DRF_RESPONSE_OPTIONS.find(o => o.id === response)?.label || "";
      else if (isREDRep) responseLabel = RED_RESPONSE_OPTIONS.find(o => o.id === response)?.label || "";
      else if (isFUWRep) responseLabel = FUW_RESPONSE_OPTIONS.find(o => o.id === response)?.label || "";
      else if (isLWVRep) responseLabel = LWV_RESPONSE_OPTIONS.find(o => o.id === response)?.label || "";
      else if (isSCERep) responseLabel = getSCEResponseOptions(typeof rep?.situation === 'object' ? (rep?.situation?.selected || '') : (rep?.situation || '')).find(o => o.id === response)?.label || "";
      else responseLabel = RESPONSE_OPTIONS.find(o => o.id === response)?.label || "";
      const evidenceData = {
        whatYouSaid: (isSCERep || isDRFRep || isFUWRep || isLWVRep || isREDRep) ? null : whatHappened,
        howTheyResponded: response === 'other' && (isDRFRep || isSCERep || isFUWRep || isLWVRep || isREDRep) ? `Other: ${otherResponseText}` : responseLabel,
        responseType: response,
        otherResponseText: (response === 'other' && (isDRFRep || isSCERep || isFUWRep || isLWVRep || isREDRep)) ? otherResponseText : null,
        outcome,
        inputMethod: 'written',
        
        // Set Clear Expectations - situation-specific evidence
        sceEvidence: isSCERep ? {
          situationBranch: getSCESituationBranch(
            typeof rep?.situation === 'object' 
              ? (rep.situation.selected || '') 
              : (rep?.situation || '')
          ),
          responses: sceResponses,
          // completeLoopResponses moved to separate step
          completeLoopResponses: null
        } : null,

        // Deliver Reinforcing Feedback - specific evidence from requirements
        drfEvidence: isDRFRep ? {
          responses: drfResponses,
          // DRF Reflection
          nextTimeReflection: nextTimeReflection.trim() || null,
          // completeLoopResponses moved to separate step
          completeLoopResponses: null
        } : null,
        
        // Deliver Redirecting Feedback - specific evidence
        redEvidence: isREDRep ? {
          situationBranch: getREDSituationBranch(
            typeof rep?.situation === 'object' 
              ? (rep.situation.selected || '') 
              : (rep?.situation || '')
          ),
          responses: sceResponses, // Using sceResponses state for structured evidence
          nextTimeReflection: nextTimeReflection.trim() || null,
          // completeLoopResponses moved to separate step
          completeLoopResponses: null
        } : null,

        // Follow-Up on the Work - specific evidence
        fuwEvidence: isFUWRep ? {
          situationBranch: getFUWSituationBranch(
            typeof rep?.situation === 'object' 
              ? (rep.situation.selected || '') 
              : (rep?.situation || '')
          ),
          responses: sceResponses, // Using sceResponses state for structured evidence
          nextTimeReflection: nextTimeReflection.trim() || null
        } : null,
        
        // Lead With Vulnerability - specific evidence
        lwvEvidence: isLWVRep ? {
          situationBranch: getLWVSituationBranch(
            typeof rep?.situation === 'object' 
              ? (rep.situation.selected || '') 
              : (rep?.situation || '')
          ),
          responses: sceResponses, // Using sceResponses state for structured evidence
          nextTimeReflection: nextTimeReflection.trim() || null
        } : null,
        
        // Self Assessment (checkboxes) from Step 5
        selfAssessment: (isSCERep || isDRFRep || isFUWRep || isLWVRep || isREDRep) ? {
          responses: selfAssessmentResponses
        } : null,
        
        // Include linked evidence
        linkedPushback: pushbackLogOption === 'link' ? {
          responses: pushbackResponses,
          note: pushbackNote
        } : null,
        
        linkedCloseLoop: closeLoopLogOption === 'link' ? {
          behaviorChange,
          note: behaviorChangeNote
        } : null,
        
        // Artifacts
        notes: notes || null,
        artifacts: artifacts.length > 0 ? artifacts : null,
        
        // Track separate reps created
        separateRepsCreated: createdReps.length > 0 ? createdReps : null
      };
      
      // Submit evidence (rep stays open — it closes after Plan Follow-up)
      await conditioningService.submitEvidenceV2(db, userId, rep.id, evidenceData);
      
      // Clear draft on successful submission
      await deleteEvidenceDraft(db, userId, rep.id).catch(() => {});
      
      // Close the rep and trigger AI assessment for all rep types
      const closeData = {
        outcome,
        whatWentWell: (isSCERep || isDRFRep || isFUWRep || isLWVRep || isREDRep) ? (nextTimeReflection.trim() || '') : (whatWentWell.trim() || ''),
        whatDifferent: (isSCERep || isDRFRep || isFUWRep || isLWVRep || isREDRep) ? '' : (whatDifferent.trim() || '')
      };
      await conditioningService.closeRepV2(db, userId, rep.id, closeData);
      
      finishWizard();
    } catch (err) {
      console.error('Error submitting:', err);
      setError(err.message || 'Failed to complete rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Complete the Loop data AND close the rep
  const handleCompleteLoopSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (rep?.id && userId) {
        const repRef = doc(db, 'users', userId, 'conditioning_reps', rep.id);
        
        // Save complete loop responses and update status to 'loop_closed'
        const fieldPath = isDRFRep 
          ? 'evidence.drfEvidence.completeLoopResponses'
          : isREDRep
          ? 'evidence.redEvidence.completeLoopResponses'
          : 'evidence.sceEvidence.completeLoopResponses';
        
        // Extract reminder date from any date_optional or date field in completeLoopResponses
        // Field IDs vary by rep type: 'reminder', 'reinforce_reminder', 'alignment_reminder', 'review_date'
        const reminderFieldIds = ['reminder', 'reinforce_reminder', 'alignment_reminder', 'review_date'];
        let reminderDate = null;
        for (const fieldId of reminderFieldIds) {
          const val = completeLoopResponses[fieldId];
          // date_optional fields: 'no' means declined, 'yes_pending' means not set, date string means set
          if (val && val !== 'no' && val !== 'yes_pending' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
            reminderDate = val;
            break;
          }
        }
        
        // For RED: if reminder is set, status is 'follow_up_pending' (awaiting CTL)
        // For other rep types or RED without reminder: status is 'loop_closed'
        const isRedWithReminder = isREDRep && reminderDate;
        const newStatus = isRedWithReminder ? 'follow_up_pending' : 'loop_closed';
        
        // Generate threadId for RED (used to link CTL and continuation REDs)
        const threadId = isREDRep ? (rep.threadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`) : null;
        
        const updateData = {
          [fieldPath]: completeLoopResponses,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        
        // Add RED-specific fields for CTL tracking
        if (isREDRep) {
          updateData.threadId = threadId;
          if (isRedWithReminder) {
            updateData.ctlDueDate = reminderDate;
            updateData.awaitingCTL = true;
          } else {
            updateData.loopClosedAt = new Date().toISOString();
            updateData.awaitingCTL = false;
          }
        } else {
          // Non-RED reps close immediately
          updateData.loopClosedAt = new Date().toISOString();
        }
        
        await updateDoc(repRef, updateData);
        
        // If user requested a reminder, write to top-level follow_up_reminders collection
        if (reminderDate) {
          const repTypeLabel = rep?.repType === 'deliver_reinforcing_feedback' ? 'Reinforcing Feedback'
            : rep?.repType === 'deliver_redirecting_feedback' ? 'Redirecting Feedback'
            : rep?.repType === 'set_clear_expectations' ? 'Set Clear Expectations'
            : rep?.repType || 'Rep';
          
          await addDoc(collection(db, 'follow_up_reminders'), {
            userId,
            repId: rep.id,
            repType: rep.repType || '',
            repTypeLabel,
            person: rep.person || '',
            reminderDate,
            createdAt: new Date().toISOString(),
            sent: false,
            sentAt: null,
            // CTL-specific fields
            ...(isREDRep && {
              isCTLReminder: true,
              threadId
            })
          });
        }
      }
      
      finishWizard();
      
    } catch (err) {
      console.error('Error saving loop plan:', err);
      setError('Failed to save your follow-up plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // CTL (Close the Loop) Handlers
  // ============================================
  
  // Handle CTL navigation
  const handleCtlNext = () => {
    if (ctlCurrentScreen === 1) {
      // From Decision → Observation
      setCtlCurrentScreen(2);
    } else if (ctlCurrentScreen === 2) {
      // From Observation → either submit or continue to RED
      if (ctlDecision === 'not_changed' && ctlGaveFollowupFeedback === true) {
        setCtlCurrentScreen(3); // Go to continuation RED screen
      } else {
        handleCtlSubmit();
      }
    }
  };

  const handleCtlBack = () => {
    if (ctlCurrentScreen === 1) {
      onClose?.(); // Cancel CTL
    } else if (ctlCurrentScreen === 2) {
      setCtlCurrentScreen(1);
    } else if (ctlCurrentScreen === 3) {
      setCtlCurrentScreen(2);
    }
  };

  // Submit CTL (for changed, not_changed without feedback, and not_observed)
  const handleCtlSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!rep?.id || !userId) {
        throw new Error('Missing rep or user information');
      }

      const repRef = doc(db, 'users', userId, 'conditioning_reps', rep.id);
      
      // Build CTL data
      const ctlData = {
        decision: ctlDecision,
        observation: ctlObservation,
        submittedAt: new Date().toISOString()
      };

      // Handle each decision path
      if (ctlDecision === 'changed') {
        // Behavior changed → close the thread
        ctlData.gaveReinforcingFeedback = ctlGaveReinforcing;
        
        await updateDoc(repRef, {
          'ctlData': ctlData,
          status: 'loop_closed',
          awaitingCTL: false,
          loopClosedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // Call AI assessment for CTL
        try {
          const assessCTL = conditioningService.getCallableFunction('assessRepQuality');
          const result = await assessCTL({
            repType: 'close_the_loop',
            linkedRepId: rep.id,
            data: ctlData
          });
          setCtlAssessment(result?.data);
        } catch (assessErr) {
          console.warn('CTL assessment failed:', assessErr);
        }
        
      } else if (ctlDecision === 'not_changed' && ctlGaveFollowupFeedback === false) {
        // Behavior didn't change, no feedback given → keep thread open
        ctlData.nextAction = ctlNextAction;
        ctlData.nextCheckDate = ctlNextCheckDate;
        
        await updateDoc(repRef, {
          'ctlData': ctlData,
          ctlDueDate: ctlNextCheckDate,
          updatedAt: new Date().toISOString()
        });
        
        // Update follow_up_reminders with new date
        // Note: In production, should query and update the existing reminder
        await addDoc(collection(db, 'follow_up_reminders'), {
          userId,
          repId: rep.id,
          repType: 'deliver_redirecting_feedback',
          repTypeLabel: 'Redirecting Feedback',
          person: rep.person || '',
          reminderDate: ctlNextCheckDate,
          createdAt: new Date().toISOString(),
          sent: false,
          sentAt: null,
          isCTLReminder: true,
          threadId: rep.threadId,
          isReschedule: true
        });
        
      } else if (ctlDecision === 'not_observed') {
        // Not observed yet → defer with new date
        ctlData.notObservedReason = ctlNotObservedReason;
        ctlData.nextCheckDate = ctlNextCheckDate;
        
        await updateDoc(repRef, {
          'ctlData': ctlData,
          ctlDueDate: ctlNextCheckDate,
          updatedAt: new Date().toISOString()
        });
        
        // Schedule new reminder
        await addDoc(collection(db, 'follow_up_reminders'), {
          userId,
          repId: rep.id,
          repType: 'deliver_redirecting_feedback',
          repTypeLabel: 'Redirecting Feedback',
          person: rep.person || '',
          reminderDate: ctlNextCheckDate,
          createdAt: new Date().toISOString(),
          sent: false,
          sentAt: null,
          isCTLReminder: true,
          threadId: rep.threadId,
          isDeferred: true,
          deferReason: ctlNotObservedReason
        });
      }
      
      finishWizard();
      
    } catch (err) {
      console.error('Error submitting CTL:', err);
      setError(err.message || 'Failed to complete Close the Loop.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit CTL with continuation RED (behavior didn't change, gave feedback)
  const handleCtlContinuationSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!rep?.id || !userId) {
        throw new Error('Missing rep or user information');
      }

      const oldRepRef = doc(db, 'users', userId, 'conditioning_reps', rep.id);
      
      // Build CTL data for the original RED
      const ctlData = {
        decision: 'not_changed',
        observation: ctlObservation,
        gaveFollowupFeedback: true,
        submittedAt: new Date().toISOString()
      };

      // Create the new continuation RED
      const newRepId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newRepRef = doc(db, 'users', userId, 'conditioning_reps', newRepId);
      
      // Get the current week info for the new rep
      const weekId = rep.weekId || `week_${new Date().toISOString().split('T')[0]}`;
      
      const continuationRedData = {
        id: newRepId,
        taxonomyVersion: 'v2',
        repType: 'deliver_redirecting_feedback',
        category: 'lead_the_team',
        person: rep.person, // Same person (locked)
        status: 'executed', // Pre-mark as executed since they already did the feedback
        
        // Thread linkage
        threadId: rep.threadId,
        parentRedId: rep.id,
        isContinuation: true,
        continuationNumber: (rep.continuationNumber || 0) + 1,
        
        // Pre-filled context from original
        originalContext: {
          behavior: rep.evidence?.redEvidence?.responses?.behavior_statement,
          impact: rep.evidence?.redEvidence?.responses?.impact_statement,
          request: rep.evidence?.redEvidence?.responses?.request_statement
        },
        
        // New evidence from continuation form
        evidence: {
          inputMethod: 'structured_v2',
          submittedAt: new Date().toISOString(),
          level: 'level_1',
          redEvidence: {
            situationBranch: 'continuation',
            responses: continuationResponses
          }
        },
        
        // Timing
        weekId,
        cohortId: rep.cohortId || null,
        commitmentType: 'in_moment',
        occurredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Mark as awaiting CTL by default
        awaitingCTL: true,
        ctlDueDate: new Date(Date.now() + CTL_DEFAULT_SCHEDULE_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      // Save both: update old RED with CTL data, create new RED
      await Promise.all([
        updateDoc(oldRepRef, {
          'ctlData': ctlData,
          'continuationRedId': newRepId,
          updatedAt: new Date().toISOString()
          // Note: old RED stays in follow_up_pending, thread continues
        }),
        // Note: Using setDoc equivalent - need to import or use different approach
        // For now, use the conditioningService to create the rep
      ]);
      
      // Create the new rep via service
      await conditioningService.createRep(db, userId, continuationRedData);
      
      // Schedule CTL reminder for the new RED
      await addDoc(collection(db, 'follow_up_reminders'), {
        userId,
        repId: newRepId,
        repType: 'deliver_redirecting_feedback',
        repTypeLabel: 'Redirecting Feedback (Continuation)',
        person: rep.person || '',
        reminderDate: continuationRedData.ctlDueDate,
        createdAt: new Date().toISOString(),
        sent: false,
        sentAt: null,
        isCTLReminder: true,
        threadId: rep.threadId,
        continuationNumber: continuationRedData.continuationNumber
      });
      
      // Trigger AI assessment for the continuation RED
      try {
        const assessRed = conditioningService.getCallableFunction('assessRepQuality');
        await assessRed({
          repType: 'deliver_redirecting_feedback',
          person: rep.person,
          data: continuationResponses,
          repId: newRepId
        });
      } catch (assessErr) {
        console.warn('Continuation RED assessment failed:', assessErr);
      }
      
      setConfirmationMessage(`Continuation feedback recorded. A new Close the Loop check will be scheduled.`);
      finishWizard();
      
    } catch (err) {
      console.error('Error submitting CTL continuation:', err);
      setError(err.message || 'Failed to create follow-up rep.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to close wizard
  const finishWizard = () => {
    // Notify other components to refresh data
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('conditioning-data-changed'));
    }, 100);

    // If we created separate reps during this flow, show prompt before closing
    if (createdReps.length > 0) {
      setShowSeparateRepPrompt(true);
      return;
    }
    
    onSubmit?.({ qualityAssessment });
    onClose?.();
  };

  // Handle RepUp Review completion
  const handleRepUpDone = async () => {
    // Mark review as viewed and close - Plan Follow-up is a separate session
    if (effectiveMode === 'review') {
      try {
        if (db && user?.uid && rep?.id) {
          const repRef = doc(db, 'users', user.uid, 'conditioning_reps', rep.id);
          await updateDoc(repRef, { reviewViewedAt: new Date().toISOString() });
        }
      } catch (e) {
        console.warn('Failed to mark review viewed:', e);
      }
      // Close wizard - user will return later for Plan Follow-up
      finishWizard();
      return;
    }

    // Check if we should go to Complete the Loop step
    // Only for SCE, DRF, FUW, and LWV reps that weren't missed
    const hasLoopQuestions = (isSCERep || isDRFRep || isFUWRep || isLWVRep) && outcome !== 'missed';
    
    if (hasLoopQuestions) {
      setCurrentScreen(7);
      return;
    }
    
    finishWizard();
  };

  // Determine modal title and icon based on mode
  const getModalTitle = () => {
    if (effectiveMode === 'ctl') {
      return ctlCurrentScreen === 3 ? 'Continue Redirecting' : 'Close the Loop';
    }
    if (currentScreen === 6) return 'RepUp Review';
    if (currentScreen === 7) return 'Plan Follow-up';
    return 'Capture Evidence';
  };

  const getModalIcon = () => {
    if (effectiveMode === 'ctl') return RotateCw;
    if (currentScreen === 6) return Award;
    if (currentScreen === 7) return RotateCw;
    return Camera;
  };

  return (
    <>
      <ConditioningModal
        isOpen={true}
        onClose={onClose}
        title={getModalTitle()}
        icon={getModalIcon()}
        currentStep={effectiveMode === 'ctl' ? ctlCurrentScreen - 1 : currentScreen - 1}
        totalSteps={effectiveMode === 'ctl' ? (ctlDecision === 'not_changed' && ctlGaveFollowupFeedback === true ? 3 : 2) : (effectiveMode === 'review' ? 1 : effectiveMode === 'plan' ? 1 : 5)}
        stepLabels={effectiveMode === 'ctl' 
          ? (ctlDecision === 'not_changed' && ctlGaveFollowupFeedback === true 
              ? ['Decision', 'Observation', 'Continue']
              : ['Decision', 'Observation'])
          : ((isSCERep || isDRFRep || isFUWRep || isLWVRep) 
            ? ['Overview', 'Evidence', 'Response', 'Artifacts', 'Complete']
            : ['Overview', 'What Happened', 'Response', 'Artifacts', 'Complete'])
        }
      >
        {/* Error display */}
        {error && (
          <div className="mx-4 mt-2 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CTL Screens (when effectiveMode === 'ctl') */}
        {effectiveMode === 'ctl' && ctlCurrentScreen === 1 && (
          <ScreenCTLDecision
            linkedRep={rep}
            ctlDecision={ctlDecision}
            setCtlDecision={setCtlDecision}
            onNext={handleCtlNext}
            onBack={handleCtlBack}
          />
        )}

        {effectiveMode === 'ctl' && ctlCurrentScreen === 2 && (
          <ScreenCTLObservation
            linkedRep={rep}
            ctlDecision={ctlDecision}
            ctlObservation={ctlObservation}
            setCtlObservation={setCtlObservation}
            ctlNotObservedReason={ctlNotObservedReason}
            setCtlNotObservedReason={setCtlNotObservedReason}
            ctlGaveReinforcing={ctlGaveReinforcing}
            setCtlGaveReinforcing={setCtlGaveReinforcing}
            ctlGaveFollowupFeedback={ctlGaveFollowupFeedback}
            setCtlGaveFollowupFeedback={setCtlGaveFollowupFeedback}
            ctlNextAction={ctlNextAction}
            setCtlNextAction={setCtlNextAction}
            ctlNextCheckDate={ctlNextCheckDate}
            setCtlNextCheckDate={setCtlNextCheckDate}
            onNext={handleCtlNext}
            onBack={handleCtlBack}
            showValidation={showValidation}
          />
        )}

        {effectiveMode === 'ctl' && ctlCurrentScreen === 3 && (
          <ScreenCTLContinueRED
            linkedRep={rep}
            continuationResponses={continuationResponses}
            setContinuationResponses={setContinuationResponses}
            onSubmit={handleCtlContinuationSubmit}
            onBack={handleCtlBack}
            isSubmitting={isSubmitting}
            showValidation={showValidation}
          />
        )}

        {/* Normal Evidence Capture Screens (when effectiveMode !== 'ctl') */}
        {effectiveMode !== 'ctl' && currentScreen === 1 && (
          <ScreenOverview rep={rep} onNext={handleNext} />
        )}
        
        {effectiveMode !== 'ctl' && currentScreen === 2 && !isSCERep && !isDRFRep && !isFUWRep && !isLWVRep && (
          <ScreenWhatHappened
            value={whatHappened}
            onChange={setWhatHappened}
            onNext={handleNext}
            onBack={handleBack}
            showValidation={showValidation}
          />
        )}
        
        {effectiveMode !== 'ctl' && currentScreen === 2 && (isSCERep || isDRFRep || isFUWRep || isLWVRep) && (
          <ScreenStructuredEvidence
            rep={rep}
            responses={isSCERep ? sceResponses : ((isFUWRep || isLWVRep) ? sceResponses : drfResponses)}
            setResponses={isSCERep ? setSceResponses : ((isFUWRep || isLWVRep) ? setSceResponses : setDrfResponses)}
            showOwnershipWarning={showOwnershipWarning}
            setShowOwnershipWarning={setShowOwnershipWarning}
            onNext={handleNext}
            onBack={handleBack}
            showValidation={showValidation}
          />
        )}
        
        {effectiveMode !== 'ctl' && currentScreen === 3 && (
          <ScreenResponseDynamics
            rep={rep}
            response={response}
            setResponse={setResponse}
            otherResponseText={otherResponseText}
            setOtherResponseText={setOtherResponseText}
            pushbackLogOption={pushbackLogOption}
            setPushbackLogOption={setPushbackLogOption}
            pushbackResponses={pushbackResponses}
            setPushbackResponses={setPushbackResponses}
            pushbackNote={pushbackNote}
            setPushbackNote={setPushbackNote}
            closeLoopOption={closeLoopOption}
            setCloseLoopOption={setCloseLoopOption}
            closeLoopLogOption={closeLoopLogOption}
            setCloseLoopLogOption={setCloseLoopLogOption}
            behaviorChange={behaviorChange}
            setBehaviorChange={setBehaviorChange}
            behaviorChangeNote={behaviorChangeNote}
            setBehaviorChangeNote={setBehaviorChangeNote}
            onNext={handleScreen3Next}
            onBack={handleBack}
            showValidation={showValidation}
            isLevel3OrHigher={isLevel3OrHigher}
          />
        )}
        
        {effectiveMode !== 'ctl' && currentScreen === 4 && (
          <ScreenArtifacts
            db={db}
            storage={storage}
            userId={userId}
            repId={rep?.id}
            notes={notes}
            setNotes={setNotes}
            artifacts={artifacts}
            setArtifacts={setArtifacts}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        
        {effectiveMode !== 'ctl' && currentScreen === 5 && (
          <ScreenCloseRR
            rep={rep}
            outcome={outcome}
            setOutcome={setOutcome}
            selfAssessmentResponses={selfAssessmentResponses}
            setSelfAssessmentResponses={setSelfAssessmentResponses}
            nextTimeReflection={nextTimeReflection}
            setNextTimeReflection={setNextTimeReflection}
            // Removed completeLoopResponses props from Step 5
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )}
        
        {effectiveMode !== 'ctl' && currentScreen === 6 && (
          <ScreenRepUpReview
            qualityAssessment={qualityAssessment}
            onDone={handleRepUpDone}
          />
        )}

        {effectiveMode !== 'ctl' && currentScreen === 7 && (
          <ScreenCompleteLoop
            rep={rep}
            completeLoopResponses={completeLoopResponses}
            setCompleteLoopResponses={setCompleteLoopResponses}
            onSubmit={handleCompleteLoopSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </ConditioningModal>

      {/* Prompt to capture evidence for separate reps created during wizard */}
      {showSeparateRepPrompt && createdReps.length > 0 && (
        <ConditioningModal
          isOpen={true}
          onClose={() => {
            setShowSeparateRepPrompt(false);
            onSubmit?.({ qualityAssessment, createdReps });
            onClose?.();
          }}
          title="Separate Reps Created"
          icon={CheckCircle2}
        >
          <div className="p-4 space-y-4">
            <div className="bg-corporate-teal/10 rounded-lg p-4 space-y-3">
              <p className="text-sm text-corporate-navy dark:text-white">
                You've created {createdReps.length} separate rep{createdReps.length > 1 ? 's' : ''} that will appear in your Conditioning list:
              </p>
              <ul className="space-y-2">
                {createdReps.map((repInfo, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-corporate-teal" />
                    <span className="font-medium text-corporate-navy dark:text-white">
                      {repInfo.type === 'handle_pushback' ? 'Handle Pushback' : 'Close the Loop'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              These reps are now in your queue. Capture evidence when they happen.
            </p>
            
            <Button
              onClick={() => {
                setShowSeparateRepPrompt(false);
                onSubmit?.({ qualityAssessment, createdReps });
                onClose?.();
              }}
              className="w-full"
            >
              <Check className="w-4 h-4 mr-2" />
              Got It
            </Button>
          </div>
        </ConditioningModal>
      )}

      {/* Confirmation popup for separate rep creation */}
      {confirmationMessage && (
        <ConfirmationPopup
          message={confirmationMessage}
          onClose={() => setConfirmationMessage(null)}
        />
      )}
    </>
  );
};

export default EvidenceCaptureWizard;
