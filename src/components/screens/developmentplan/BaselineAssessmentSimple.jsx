// src/components/screens/developmentplan/BaselineAssessmentSimple.jsx
// Leadership Baseline Assessment — 15 questions: frequency, agreement, open text, multi-select

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader, ClipboardCheck, X } from 'lucide-react';
import { Button } from '../../ui';
import VoiceTextarea from '../../conditioning/VoiceTextarea';

// --- Questions 1-10: Frequency Scale (last 30 days) ---
const FREQUENCY_QUESTIONS = [
  { id: 'q1', text: 'I clearly defined the criteria for success when I assigned work.', category: 'Clarity' },
  { id: 'q2', text: 'I explicitly named ownership of the outcome and confirmed that my direct accepted it.', category: 'Ownership' },
  { id: 'q3', text: 'I gave reinforcing (positive) feedback tied to a specific behavior and impact.', category: 'Feedback' },
  { id: 'q4', text: 'I gave redirecting (correcting) feedback when behavior missed the standard.', category: 'Feedback' },
  { id: 'q5', text: 'I followed up on work rather than assuming it was on track.', category: 'Follow-Through' },
  { id: 'q6', text: 'I modeled vulnerability by acknowledging a mistake, gap, or miss of my own.', category: 'Vulnerability' },
  { id: 'q7', text: 'I intentionally checked after giving feedback to confirm whether the behavior changed.', category: 'Follow-Through' },
  { id: 'q8', text: 'I noticed patterns early rather than waiting until issues escalated.', category: 'Awareness' },
  { id: 'q9', text: 'I asked my direct report for their plan when progress stalled or mistakes happened on their assigned work.', category: 'Ownership' },
  { id: 'q10', text: 'I adjusted my approach when I met resistance during feedback.', category: 'Adaptability' },
];

const FREQUENCY_OPTIONS = [
  { value: 1, label: 'Never / Rarely', shortLabel: 'Never', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 text-red-700 hover:bg-red-200' },
  { value: 2, label: 'Seldom / < 50%', shortLabel: '<50%', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 text-orange-700 hover:bg-orange-200' },
  { value: 3, label: 'Often / > 50%', shortLabel: '>50%', color: 'bg-teal-100 dark:bg-teal-900/30 border-teal-300 text-teal-700 hover:bg-teal-200' },
  { value: 4, label: 'Consistently / Always', shortLabel: 'Always', color: 'bg-green-100 dark:bg-green-900/30 border-green-300 text-green-700 hover:bg-green-200' },
];

// --- Questions 11-13: Agreement Scale ---
const AGREEMENT_QUESTIONS = [
  { id: 'q11', text: 'I have a clear intention for how I want to show up when navigating a difficult leadership moment.', category: 'Intentionality' },
  { id: 'q12', text: 'I have practical tools to handle difficult conversations with my direct report(s).', category: 'Tools' },
  { id: 'q13', text: 'I hold regular one-on-ones with my direct report(s) and allow them to set the agenda.', category: 'Structure' },
];

const AGREEMENT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree', shortLabel: 'SD', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 text-red-700 hover:bg-red-200' },
  { value: 2, label: 'Disagree', shortLabel: 'D', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 text-orange-700 hover:bg-orange-200' },
  { value: 3, label: 'Agree', shortLabel: 'A', color: 'bg-teal-100 dark:bg-teal-900/30 border-teal-300 text-teal-700 hover:bg-teal-200' },
  { value: 4, label: 'Strongly Agree', shortLabel: 'SA', color: 'bg-green-100 dark:bg-green-900/30 border-green-300 text-green-700 hover:bg-green-200' },
];

// --- Question 14: Open Text ---
const OPEN_TEXT_QUESTION = {
  id: 'q14',
  text: 'What leadership situation is currently challenging or frustrating for you?',
  category: 'Reflection',
};

// --- Question 15: Multi-Select ---
const MULTI_SELECT_QUESTION = {
  id: 'q15',
  text: 'Which important leadership moments do you tend to delay, soften, or avoid?',
  subtitle: 'Check all that apply. There are no "right" or "wrong" answers.',
  category: 'Self-Awareness',
  options: [
    'Redirecting poor performance.',
    'Clarifying expectations when things feel awkward.',
    'Holding someone who is well-liked accountable.',
    'Letting someone struggle instead of stepping in.',
    'Following up when I expect resistance.',
    'I rarely avoid these moments. I tend to act quickly.',
  ],
};

// All scored (radio) questions
const ALL_SCORED_QUESTIONS = [...FREQUENCY_QUESTIONS, ...AGREEMENT_QUESTIONS];
const TOTAL_REQUIRED = ALL_SCORED_QUESTIONS.length + 2; // +1 open text + 1 multi-select = 15

const BaselineAssessmentSimple = ({ onComplete, onClose, isLoading = false, initialData = null }) => {
  const validIds = ALL_SCORED_QUESTIONS.map(q => q.id);
  const initialResponses = initialData?.answers
    ? Object.fromEntries(
        Object.entries(initialData.answers).filter(([key]) => validIds.includes(key))
      )
    : {};

  const [responses, setResponses] = useState(initialResponses);
  const [openText, setOpenText] = useState(initialData?.answers?.q14 || '');
  const [multiSelect, setMultiSelect] = useState(initialData?.answers?.q15 || []);
  const [multiSelectOther, setMultiSelectOther] = useState(initialData?.answers?.q15_other || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) formRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  // Completion tracking
  const scoredCount = ALL_SCORED_QUESTIONS.filter(q => responses[q.id] !== undefined).length;
  const hasOpenText = openText.trim().length > 0;
  const hasMultiSelect = multiSelect.length > 0;
  const completedCount = scoredCount + (hasOpenText ? 1 : 0) + (hasMultiSelect ? 1 : 0);
  const isComplete = scoredCount === ALL_SCORED_QUESTIONS.length && hasOpenText && hasMultiSelect;
  const progress = (completedCount / TOTAL_REQUIRED) * 100;

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const toggleMultiSelect = (option) => {
    setMultiSelect(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const handleComplete = () => {
    if (!isComplete) return;
    setIsGenerating(true);

    setTimeout(() => {
      const allAnswers = {
        ...responses,
        q14: openText.trim(),
        q15: multiSelect,
        ...(multiSelectOther.trim() ? { q15_other: multiSelectOther.trim() } : {}),
      };

      const assessment = {
        date: new Date().toISOString(),
        answers: allAnswers,
        openEnded: [openText.trim()],
        cycle: initialData?.cycle ? initialData.cycle + 1 : 1,
      };

      setIsGenerating(false);
      setShowSuccess(true);

      setTimeout(() => {
        onComplete(assessment);
      }, 2000);
    }, 1000);
  };

  const isTotalLoading = isLoading || isGenerating;

  // --- Loading state ---
  if (isGenerating) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 bg-corporate-teal/10 rounded-full flex items-center justify-center mb-4">
            <Loader className="w-8 h-8 text-corporate-teal animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-corporate-navy mb-2">Saving Assessment...</h3>
          <p className="text-slate-600 dark:text-slate-300">Recording your responses.</p>
        </div>
      </div>
    );
  }

  // --- Success state with reframe message ---
  if (showSuccess) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-corporate-navy mb-3">Assessment Saved!</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Thank you. This snapshot is not a verdict — it's a starting point.
            You'll revisit this after Foundation to see what changed as you learned
            to handle leadership moments with clarity and consistency.
          </p>
        </div>
      </div>
    );
  }

  // Shared renderer for rating questions (frequency or agreement)
  const renderRatingQuestion = (question, options, globalIdx) => (
    <div
      key={question.id}
      className={`p-4 rounded-xl transition-all ${
        responses[question.id]
          ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          : 'bg-white dark:bg-slate-800 border-2 border-slate-100 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
          responses[question.id]
            ? 'bg-green-500 text-white'
            : 'bg-corporate-navy text-white'
        }`}>
          {responses[question.id] ? <CheckCircle className="w-4 h-4" /> : globalIdx}
        </span>
        <div className="flex-1">
          <p className="text-corporate-navy dark:text-white font-medium leading-relaxed text-sm">{question.text}</p>
          <span className="text-xs text-gray-500 dark:text-slate-400 mt-1 inline-block">{question.category}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 ml-10">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => handleResponse(question.id, option.value)}
            title={option.label}
            className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all text-center
              ${responses[question.id] === option.value
                ? `${option.color.split(' hover:')[0]} ring-2 ring-offset-1 ring-corporate-teal/40 scale-105`
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:bg-slate-50'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col w-full max-h-[85vh] min-h-[50vh]">
      {/* Header */}
      <div className="bg-[#002E47] text-white p-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Leadership Baseline Assessment</h2>
              <p className="text-blue-200 text-sm">Thinking about the last 30 days, how often did you do the following?</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="flex justify-between text-xs text-blue-200 font-medium mb-1.5 uppercase tracking-wider">
          <span>{completedCount} of {TOTAL_REQUIRED} answered</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-corporate-teal transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Questions — Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Section: Frequency Questions (1-10) */}
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Frequency — Last 30 Days</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
            {FREQUENCY_OPTIONS.map(o => (
              <span key={o.value} className={`px-2 py-1 rounded border text-center ${o.color.split(' hover:')[0]}`}>{o.label}</span>
            ))}
          </div>
        </div>

        {FREQUENCY_QUESTIONS.map((q, idx) => renderRatingQuestion(q, FREQUENCY_OPTIONS, idx + 1))}

        {/* Section: Agreement Questions (11-13) */}
        <div className="mt-6 mb-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Agreement</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
            {AGREEMENT_OPTIONS.map(o => (
              <span key={o.value} className={`px-2 py-1 rounded border text-center ${o.color.split(' hover:')[0]}`}>{o.label}</span>
            ))}
          </div>
        </div>

        {AGREEMENT_QUESTIONS.map((q, idx) => renderRatingQuestion(q, AGREEMENT_OPTIONS, 11 + idx))}

        {/* Section: Open Text (Q14) */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className={`p-4 rounded-xl transition-all ${
            hasOpenText
              ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              : 'bg-white dark:bg-slate-800 border-2 border-slate-100 shadow-sm'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                hasOpenText ? 'bg-green-500 text-white' : 'bg-corporate-navy text-white'
              }`}>
                {hasOpenText ? <CheckCircle className="w-4 h-4" /> : 14}
              </span>
              <div className="flex-1">
                <p className="text-corporate-navy dark:text-white font-medium leading-relaxed text-sm">{OPEN_TEXT_QUESTION.text}</p>
                <span className="text-xs text-gray-500 dark:text-slate-400 mt-1 inline-block">{OPEN_TEXT_QUESTION.category}</span>
              </div>
            </div>
            <div className="ml-10">
              <VoiceTextarea
                id="q14"
                value={openText}
                onChange={(val) => setOpenText(val)}
                placeholder="Type or tap the mic to speak..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section: Multi-Select (Q15) */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className={`p-4 rounded-xl transition-all ${
            hasMultiSelect
              ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              : 'bg-white dark:bg-slate-800 border-2 border-slate-100 shadow-sm'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                hasMultiSelect ? 'bg-green-500 text-white' : 'bg-corporate-navy text-white'
              }`}>
                {hasMultiSelect ? <CheckCircle className="w-4 h-4" /> : 15}
              </span>
              <div className="flex-1">
                <p className="text-corporate-navy dark:text-white font-medium leading-relaxed text-sm">{MULTI_SELECT_QUESTION.text}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{MULTI_SELECT_QUESTION.subtitle}</p>
              </div>
            </div>
            <div className="ml-10 space-y-2">
              {MULTI_SELECT_QUESTION.options.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                    multiSelect.includes(option)
                      ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-navy dark:text-white font-medium'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={multiSelect.includes(option)}
                    onChange={() => toggleMultiSelect(option)}
                    className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal/50"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
              {/* Other free-text option */}
              <label
                className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                  multiSelectOther.trim()
                    ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-navy dark:text-white font-medium'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm pt-1.5">Other:</span>
                <input
                  type="text"
                  value={multiSelectOther}
                  onChange={(e) => setMultiSelectOther(e.target.value)}
                  placeholder="Describe..."
                  className="flex-1 px-2 py-1 text-sm border-b border-slate-300 dark:border-slate-600 bg-transparent focus:border-corporate-teal focus:outline-none"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — consistent gray bar with action buttons */}
      <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {onClose && (
            <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors text-sm font-medium">
              Cancel
            </button>
          )}
          <div className="flex-1 text-center">
            {!isComplete && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {TOTAL_REQUIRED - completedCount} more to go
              </p>
            )}
          </div>
          <Button
            onClick={handleComplete}
            disabled={!isComplete || isTotalLoading}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 ${
              isComplete ? 'bg-corporate-teal hover:bg-corporate-teal/90' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isTotalLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isTotalLoading ? 'Saving...' : (initialData ? 'Update' : 'Complete')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BaselineAssessmentSimple;
