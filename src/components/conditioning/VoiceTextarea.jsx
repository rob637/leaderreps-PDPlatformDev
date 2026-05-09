// src/components/conditioning/VoiceTextarea.jsx
// Standard voice-enabled textarea for all conditioning forms
// Wraps textarea + VoiceInputButton with consistent styling
// Every text field in conditioning should use this component

import React, { useState } from 'react';
import VoiceInputButton from './VoiceInputButton';
import { polishTranscript } from './polishTranscript';
import { useAppServices } from '../../services/useAppServices';
import { AlertCircle, Sparkles, Undo2, RotateCcw } from 'lucide-react';

// ============================================
// VOICE TEXTAREA COMPONENT
// ============================================
const VoiceTextarea = ({
  id,
  label,
  helpText,
  value = '',
  onChange,
  placeholder = 'Type or tap the mic to speak...',
  minLength,
  maxLength,
  showCount,
  error,
  required = false,
  rows = 4,
  disabled = false,
  autoFocus = false,
  className = '',
  polish = true,
}) => {
  const { callSecureGeminiAPI, geminiModel, hasGeminiKey } = useAppServices();
  const [partialTranscript, setPartialTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [micError, setMicError] = useState(null);
  // Tracks the most recent polish so the user can flip between polished and
  // raw text. Cleared automatically as soon as they manually edit the field.
  const [lastPolish, setLastPolish] = useState(null); // { raw, polished, mode }

  const MIC_ERROR_MESSAGES = {
    'not-allowed':
      'Microphone access is blocked. Tap the lock/info icon in your browser\u2019s address bar, allow microphone access for this site, then refresh.',
    'service-not-allowed':
      'Microphone access is blocked at the device level. Open device settings and allow microphone for this browser.',
    'audio-capture':
      'No microphone detected. Check that one is connected and not in use by another app.',
    network: 'Network error reaching the speech service. Check your connection.',
    'no-speech': 'We didn\u2019t hear anything. Try moving closer to the mic.',
    'not-supported':
      'Voice input isn\u2019t supported in this browser. Try Chrome on desktop or Safari on iOS.',
  };

  const handleMicError = (code) => {
    setMicError(MIC_ERROR_MESSAGES[code] || 'Voice input failed. Please try again.');
    setIsRecording(false);
  };

  const handleTranscription = async (text) => {
    setMicError(null);
    setPartialTranscript('');
    setIsRecording(false);

    const canPolish =
      polish &&
      typeof callSecureGeminiAPI === 'function' &&
      (typeof hasGeminiKey !== 'function' || hasGeminiKey());

    const prefix = value ? `${value} ` : '';
    const rawFull = `${prefix}${text}`;

    if (!canPolish) {
      setLastPolish(null);
      onChange(rawFull);
      return;
    }

    setIsPolishing(true);
    let polished = text;
    try {
      polished = await polishTranscript(text, {
        callSecureGeminiAPI,
        model: geminiModel,
      });
    } finally {
      setIsPolishing(false);
    }

    const polishedFull = `${prefix}${polished}`;
    if (polished && polished.trim() !== text.trim()) {
      setLastPolish({ raw: rawFull, polished: polishedFull, mode: 'polished' });
    } else {
      setLastPolish(null);
    }
    onChange(polishedFull);
  };

  const handlePartialTranscription = (text) => {
    setMicError(null);
    setPartialTranscript(text);
    setIsRecording(true);
  };

  // Show partial while recording, otherwise show value
  const displayText =
    isRecording && partialTranscript
      ? value
        ? `${value} ${partialTranscript}`
        : partialTranscript
      : value;

  const hasError = !!error;
  const charCount = (value || '').length;
  
  // Determine if we should show the footer elements
  const hasMinLength = typeof minLength === 'number' && minLength > 0;
  const hasMaxLength = typeof maxLength === 'number' && maxLength > 0;
  
  // Only show counter if explicitly requested or if limits exist and user has started typing
  const shouldShowCounter = showCount || ((hasMinLength || hasMaxLength) && charCount > 0);
  
  // Only render footer if we have something to show (error, min warning, or counter)
  const showFooter = hasError || hasMinLength || shouldShowCounter;

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-corporate-navy dark:text-white mb-1">
          {label}
        </label>
      )}

      {/* Help text */}
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{helpText}</p>
      )}

      {/* Textarea with mic */}
      <div className="relative">
        <textarea
          id={id}
          value={displayText}
          onChange={(e) => {
            // Manual edits invalidate the polish toggle.
            if (lastPolish) setLastPolish(null);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={`w-full p-3 pr-14 border rounded-xl text-sm resize-none transition-all duration-200
            ${isRecording
              ? 'bg-red-50/50 dark:bg-red-900/20 border-red-300 dark:border-red-700 ring-2 ring-red-200 dark:ring-red-800 text-slate-900 dark:text-white'
              : hasError
              ? 'border-corporate-orange bg-orange-50/30 dark:bg-orange-900/20 ring-2 ring-orange-200 dark:ring-orange-800 text-slate-900 dark:text-white'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white'}
          `}
        />

        {/* Mic button */}
        <div className="absolute right-2 bottom-2">
          <VoiceInputButton
            onTranscription={handleTranscription}
            onPartialTranscription={handlePartialTranscription}
            onError={handleMicError}
            disabled={disabled}
            size="small"
          />
        </div>

        {/* Recording / polishing indicator */}
        {isRecording && (
          <div className="absolute top-2 right-14 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs text-red-600 font-medium">Recording...</span>
          </div>
        )}
        {!isRecording && isPolishing && (
          <div className="absolute top-2 right-14 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-corporate-teal animate-pulse" />
            <span className="text-xs text-corporate-teal-ink font-medium">Polishing…</span>
          </div>
        )}
      </div>

      {/* Show original / Revert toggle (only after a polish actually changed the text) */}
      {lastPolish && !isRecording && !isPolishing && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3 h-3 text-corporate-teal flex-shrink-0" />
          <span>
            {lastPolish.mode === 'polished'
              ? 'Cleaned by AI.'
              : 'Showing your original words.'}
          </span>
          <button
            type="button"
            onClick={() => {
              if (lastPolish.mode === 'polished') {
                onChange(lastPolish.raw);
                setLastPolish({ ...lastPolish, mode: 'raw' });
              } else {
                onChange(lastPolish.polished);
                setLastPolish({ ...lastPolish, mode: 'polished' });
              }
            }}
            className="inline-flex items-center gap-1 font-semibold text-corporate-teal-ink hover:underline"
          >
            {lastPolish.mode === 'polished' ? (
              <>
                <Undo2 className="w-3 h-3" /> Show original
              </>
            ) : (
              <>
                <RotateCcw className="w-3 h-3" /> Use cleaned version
              </>
            )}
          </button>
        </div>
      )}

      {/* Inline mic error banner (visible even if the floating tooltip
          inside VoiceInputButton is clipped by an overflow-hidden parent) */}
      {micError && (
        <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{micError}</div>
          <button
            type="button"
            onClick={() => setMicError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Footer row: char count + min warning + error */}
      {showFooter && (
        <div className="flex items-center justify-between mt-1 min-h-[1.25rem]">
          <div className="flex-1">
            {hasError ? (
              <div className="flex items-center gap-1 text-xs text-corporate-orange font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : hasMinLength ? (
              <div className={`text-xs font-medium transition-colors ${
                charCount >= minLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                Min {minLength} characters {charCount >= minLength && '✓'}
              </div>
            ) : null}
          </div>
          {shouldShowCounter && (
            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {charCount} / {maxLength || minLength || '-'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceTextarea;
