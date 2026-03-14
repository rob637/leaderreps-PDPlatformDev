// src/components/conditioning/VoiceTextarea.jsx
// Standard voice-enabled textarea for all conditioning forms
// Wraps textarea + VoiceInputButton with consistent styling
// Every text field in conditioning should use this component

import React, { useState } from 'react';
import VoiceInputButton from './VoiceInputButton';
import { AlertCircle } from 'lucide-react';

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
}) => {
  const [partialTranscript, setPartialTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleTranscription = (text) => {
    const newValue = value ? `${value} ${text}` : text;
    onChange(newValue);
    setPartialTranscript('');
    setIsRecording(false);
  };

  const handlePartialTranscription = (text) => {
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
          onChange={(e) => onChange(e.target.value)}
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
            disabled={disabled}
            size="small"
          />
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-2 right-14 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs text-red-600 font-medium">Recording...</span>
          </div>
        )}
      </div>

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
