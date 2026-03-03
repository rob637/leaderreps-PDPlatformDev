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
import { Button } from '../ui';
import { 
  ChevronLeft, ChevronRight, Check, User, Calendar, Target,
  MessageSquare, AlertCircle, Camera, FileText, Mic, Image,
  Link2, Plus, X, CheckCircle2, Award
} from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';
import QualityAssessmentCard from './QualityAssessmentCard';
import { 
  REP_OUTCOME_OPTIONS as OUTCOME_OPTIONS,
  RESPONSE_OPTIONS,
  PUSHBACK_RESPONSE_OPTIONS,
  BEHAVIOR_CHANGE_OPTIONS,
  FEEDBACK_REP_TYPES,
  PUSHBACK_LOG_OPTIONS,
  CLOSE_LOOP_LOG_OPTIONS,
  CLOSE_LOOP_OPTIONS
} from './constants';

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
        className="w-full bg-corporate-teal hover:bg-corporate-teal/90 text-white mt-4"
      >
        Continue
        <ChevronRight className="w-4 h-4 ml-2" />
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
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
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
  onBack
  // showValidation - reserved for future use
}) => {
  const isFeedbackRep = FEEDBACK_REP_TYPES.includes(rep?.repType);
  
  // Determine if pushback prompts should show
  const showPushbackPrompt = isFeedbackRep && ['disengaged', 'some_resistance', 'strong_pushback'].includes(response);
  const showPushbackEvidence = pushbackLogOption === 'link';
  
  // Determine if close loop prompts should show (after pushback logic is resolved)
  const pushbackLogComplete = !showPushbackPrompt || pushbackLogOption;
  const showCloseLoopPrompt = isFeedbackRep && pushbackLogComplete;
  const showCloseLoopEvidence = closeLoopLogOption === 'link';
  
  // Validation
  const isValid = useMemo(() => {
    if (!response) return false;
    if (showPushbackPrompt && !pushbackLogOption) return false;
    if (showPushbackEvidence && pushbackResponses.length === 0) return false;
    if (showCloseLoopPrompt && !closeLoopOption) return false;
    if (closeLoopOption === 'yes' && !closeLoopLogOption) return false;
    if (showCloseLoopEvidence && !behaviorChange) return false;
    return true;
  }, [response, showPushbackPrompt, pushbackLogOption, showPushbackEvidence, pushbackResponses, showCloseLoopPrompt, closeLoopOption, closeLoopLogOption, showCloseLoopEvidence, behaviorChange]);

  // Toggle pushback response checkbox
  const togglePushbackResponse = (id) => {
    setPushbackResponses(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Simple flow for non-feedback reps
  if (!isFeedbackRep) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
            Response & Dynamics
          </h3>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-corporate-navy dark:text-white">
            How did the other person respond?
          </label>
          <div className="space-y-2">
            {RESPONSE_OPTIONS.map((option) => (
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

        <div className="flex gap-3 mt-4">
          <Button onClick={onBack} variant="outline" className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!response}
            className="flex-1 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
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
          How did the other person respond?
        </label>
        <div className="space-y-2">
          {RESPONSE_OPTIONS.map((option) => (
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
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// ============================================
// SCREEN 4: ARTIFACTS & NOTES
// ============================================
const ScreenArtifacts = ({ 
  notes, 
  setNotes, 
  // artifacts and setArtifacts reserved for future file upload feature
  // eslint-disable-next-line no-unused-vars
  artifacts: _artifacts,
  // eslint-disable-next-line no-unused-vars
  setArtifacts: _setArtifacts,
  onNext, 
  onBack
}) => {
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

      {/* Artifact upload placeholder - could add file upload later */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-corporate-navy dark:text-white">
          Attachments
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-center text-gray-400 cursor-not-allowed"
          >
            <Image className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Screenshot</span>
          </button>
          <button
            type="button"
            disabled
            className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-center text-gray-400 cursor-not-allowed"
          >
            <FileText className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Document</span>
          </button>
          <button
            type="button"
            disabled
            className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-center text-gray-400 cursor-not-allowed"
          >
            <Mic className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Voice memo</span>
          </button>
          <button
            type="button"
            disabled
            className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-center text-gray-400 cursor-not-allowed"
          >
            <MessageSquare className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Transcript</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Attachment support coming soon
        </p>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center italic">
        Only add what helps capture what happened. More is not always better.
      </p>

      <div className="flex gap-3 mt-4">
        <Button onClick={onBack} variant="outline" className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
        >
          Continue
          <ChevronRight className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );
};

// NOTE: OUTCOME_OPTIONS imported from './constants'

// ============================================
// SCREEN 5: CLOSE RR (Reflection)
// ============================================
const ScreenCloseRR = ({
  outcome,
  setOutcome,
  whatWentWell,
  setWhatWentWell,
  whatDifferent,
  setWhatDifferent,
  onSubmit,
  onBack,
  isSubmitting,
  showValidation
}) => {
  // Validation
  const isValid = outcome && whatWentWell.trim().length >= 10;

  // Get dynamic prompt based on outcome
  const getWhatWentWellPrompt = () => {
    switch (outcome) {
      case 'did_it':
        return 'What went well?';
      case 'partial':
        return 'What part worked?';
      case 'missed':
        return 'What got in the way?';
      case 'pivoted':
        return 'What did you do instead?';
      default:
        return 'What went well?';
    }
  };

  const getWhatDifferentPrompt = () => {
    switch (outcome) {
      case 'did_it':
        return 'What would you do differently next time?';
      case 'partial':
        return 'What would help you complete it fully next time?';
      case 'missed':
        return 'What will you do differently to make it happen?';
      case 'pivoted':
        return 'What did you learn from this pivot?';
      default:
        return 'What would you do differently?';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
          Complete Real Rep
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          How did you do executing the rep?
        </p>
      </div>

      {/* Outcome Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-corporate-navy dark:text-white">
          What happened?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {OUTCOME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setOutcome(option.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                outcome === option.id
                  ? 'border-corporate-teal bg-corporate-teal/10 dark:bg-corporate-teal/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-corporate-teal/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{option.icon}</span>
                <span className={`font-medium ${
                  outcome === option.id 
                    ? 'text-corporate-teal' 
                    : 'text-corporate-navy dark:text-white'
                }`}>
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reflection fields appear after outcome selected */}
      {outcome && (
        <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
          <VoiceTextarea
            id="what-went-well"
            label={getWhatWentWellPrompt()}
            value={whatWentWell}
            onChange={setWhatWentWell}
            placeholder="Brief reflection..."
            rows={2}
            minLength={10}
            error={showValidation && whatWentWell.trim().length < 10 ? 'Add a brief reflection (at least 10 characters)' : null}
            autoFocus
          />

          <VoiceTextarea
            id="what-different"
            label={getWhatDifferentPrompt()}
            value={whatDifferent}
            onChange={setWhatDifferent}
            placeholder="Optional but encouraged..."
            rows={2}
          />
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <Button onClick={onBack} variant="outline" className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          className="flex-1 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
        >
          <Check className="w-4 h-4 mr-2" />
          Complete Rep
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
        className="w-full bg-corporate-teal hover:bg-corporate-teal/90 text-white mt-4"
      >
        <Check className="w-4 h-4 mr-2" />
        Done
      </Button>
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
        className="w-full mt-4 bg-corporate-teal hover:bg-corporate-teal/90 text-white"
      >
        Got it
      </Button>
    </div>
  </div>
);

// ============================================
// MAIN WIZARD COMPONENT
// ============================================
const EvidenceCaptureWizard = ({ rep, onClose, onSubmit }) => {
  const { db, user } = useAppServices();
  const userId = user?.uid;
  
  // Draft loading state
  const [draftLoaded, setDraftLoaded] = useState(false);
  const saveTimeoutRef = useRef(null);
  
  // Screen state
  const [currentScreen, setCurrentScreen] = useState(1);
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  
  // Screen 2: What Happened
  const [whatHappened, setWhatHappened] = useState('');
  
  // Screen 3: Response & Dynamics
  const [response, setResponse] = useState(null);
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
  
  // Screen 6: RepUp Review (AI feedback)
  const [qualityAssessment, setQualityAssessment] = useState(null);
  
  // Track created separate reps
  const [createdReps, setCreatedReps] = useState([]);
  
  // Separate rep evidence prompt
  const [showSeparateRepPrompt, setShowSeparateRepPrompt] = useState(false);

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
          setCurrentScreen(draft.currentScreen || 1);
          setWhatHappened(fd.whatHappened || '');
          setResponse(fd.response || null);
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
          response,
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
          whatDifferent
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
    currentScreen, whatHappened, response, pushbackLogOption, pushbackResponses,
    pushbackNote, closeLoopOption, closeLoopLogOption, behaviorChange,
    behaviorChangeNote, notes, artifacts, outcome, whatWentWell, whatDifferent
  ]);

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
        commitmentType: 'in_moment',
        cohortId: rep.cohortId,
        weekId: rep.weekId
      };
      
      const newRepId = await conditioningService.createRepV2(db, userId, newRepData);
      
      // Mark as executed (needs evidence)
      await conditioningService.transitionRepState(db, userId, newRepId, 'executed');
      
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
        commitmentType: 'in_moment',
        cohortId: rep.cohortId,
        weekId: rep.weekId
      };
      
      const newRepId = await conditioningService.createRepV2(db, userId, newRepData);
      
      // Mark as executed (needs evidence)
      await conditioningService.transitionRepState(db, userId, newRepId, 'executed');
      
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
      const evidenceData = {
        whatYouSaid: whatHappened,
        howTheyResponded: RESPONSE_OPTIONS.find(o => o.id === response)?.label || '',
        responseType: response,
        outcome,
        inputMethod: 'written',
        
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
      
      // Step 1: Submit evidence using V2 method
      await conditioningService.submitEvidenceV2(db, userId, rep.id, evidenceData);
      
      // Step 2: Close the rep with reflection and get AI feedback
      const closeData = {
        outcome,
        whatWentWell: whatWentWell.trim(),
        whatDifferent: whatDifferent.trim()
      };
      
      const { quality } = await conditioningService.closeRepV2(db, userId, rep.id, closeData);
      
      // Store quality assessment for display
      setQualityAssessment(quality);
      
      // Clear draft on successful submission
      await deleteEvidenceDraft(db, userId, rep.id).catch(() => {});
      
      // Always go to screen 6 (RepUp Review) to show AI feedback
      // Separate rep prompt will show when user clicks Done if needed
      setCurrentScreen(6);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error submitting:', err);
      setError(err.message || 'Failed to complete rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle RepUp Review completion
  const handleRepUpDone = () => {
    // If we created separate reps during this flow, show prompt before closing
    if (createdReps.length > 0) {
      setShowSeparateRepPrompt(true);
      return;
    }
    
    onSubmit?.({ qualityAssessment });
    onClose?.();
  };

  return (
    <>
      <ConditioningModal
        isOpen={true}
        onClose={currentScreen === 6 ? handleRepUpDone : onClose}
        title={currentScreen === 6 ? "RepUp Review" : "Capture Evidence"}
        icon={currentScreen === 6 ? Award : Camera}
        currentStep={currentScreen - 1}
        totalSteps={6}
        stepLabels={['Overview', 'What Happened', 'Response', 'Artifacts', 'Complete', 'Review']}
      >
        {/* Error display */}
        {error && (
          <div className="mx-4 mt-2 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Screens */}
        {currentScreen === 1 && (
          <ScreenOverview rep={rep} onNext={handleNext} />
        )}
        
        {currentScreen === 2 && (
          <ScreenWhatHappened
            value={whatHappened}
            onChange={setWhatHappened}
            onNext={handleNext}
            onBack={handleBack}
            showValidation={showValidation}
          />
        )}
        
        {currentScreen === 3 && (
          <ScreenResponseDynamics
            rep={rep}
            response={response}
            setResponse={setResponse}
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
          />
        )}
        
        {currentScreen === 4 && (
          <ScreenArtifacts
            notes={notes}
            setNotes={setNotes}
            artifacts={artifacts}
            setArtifacts={setArtifacts}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        
        {currentScreen === 5 && (
          <ScreenCloseRR
            outcome={outcome}
            setOutcome={setOutcome}
            whatWentWell={whatWentWell}
            setWhatWentWell={setWhatWentWell}
            whatDifferent={whatDifferent}
            setWhatDifferent={setWhatDifferent}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            showValidation={showValidation}
          />
        )}
        
        {currentScreen === 6 && (
          <ScreenRepUpReview
            qualityAssessment={qualityAssessment}
            onDone={handleRepUpDone}
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
              className="w-full bg-corporate-teal hover:bg-corporate-teal/90 text-white"
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
