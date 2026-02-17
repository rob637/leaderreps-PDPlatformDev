// src/components/conditioning/VoiceInputButton.jsx
// Voice input component using Web Speech API
// Provides real-time speech-to-text transcription

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, AlertCircle, Loader2 } from 'lucide-react';

// Check for browser support
const SpeechRecognition = typeof window !== 'undefined' && (
  window.SpeechRecognition || window.webkitSpeechRecognition
);

// Detect iOS for special handling
const isIOS = typeof navigator !== 'undefined' && 
  /iPad|iPhone|iPod/.test(navigator.userAgent) && 
  !window.MSStream;

// Detect Safari
const isSafari = typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// ============================================
// VOICE INPUT BUTTON COMPONENT
// ============================================
const VoiceInputButton = ({ 
  onTranscription, 
  onPartialTranscription,
  disabled = false,
  size = 'default',
  continuous = true, // Changed: Default to continuous for longer recordings
  autoStop = true,
  autoStopDelay = 3000 // Changed: 3 seconds of silence before auto-stop (was 1500)
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const recognitionRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const startupTimerRef = useRef(null);
  const transcriptRef = useRef('');
  // Store callbacks in refs to avoid re-creating recognition on every render
  const onTranscriptionRef = useRef(onTranscription);
  const onPartialTranscriptionRef = useRef(onPartialTranscription);
  
  // Update callback refs when props change
  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
    onPartialTranscriptionRef.current = onPartialTranscription;
  }, [onTranscription, onPartialTranscription]);
  
  // iOS doesn't support continuous mode well - disable it
  const effectiveContinuous = isIOS || isSafari ? false : continuous;
  
  // Initialize speech recognition (only once)
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = effectiveContinuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      // Clear startup timer - recognition started successfully
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
      setIsStarting(false);
      setIsRecording(true);
      setError(null);
      transcriptRef.current = '';
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      setIsProcessing(false);
      setIsStarting(false);
      
      // Clear timers
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
      
      // Send final transcription if we have content
      if (transcriptRef.current.trim()) {
        onTranscriptionRef.current?.(transcriptRef.current.trim());
      }
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      // Process all results from the beginning to build complete transcript
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Store the complete final transcript (rebuilt each time)
      if (finalTranscript.trim()) {
        transcriptRef.current = finalTranscript.trim();
      }
      
      // Send partial transcription for live preview (final + interim)
      const fullText = (finalTranscript + interimTranscript).trim();
      if (onPartialTranscriptionRef.current && fullText) {
        onPartialTranscriptionRef.current(fullText);
      }
      
      // Auto-stop after silence (reset timer on any new result)
      if (autoStop) {
        if (autoStopTimerRef.current) {
          clearTimeout(autoStopTimerRef.current);
        }
        autoStopTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // Ignore - may already be stopped
            }
          }
        }, autoStopDelay);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsProcessing(false);
      setIsStarting(false);
      
      // Clear timers on error
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Try again.');
          break;
        case 'audio-capture':
          setError('No microphone found.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Tap the lock icon in your browser\'s address bar to allow microphone access, then try again.');
          break;
        case 'network':
          setError('Network error. Check your connection.');
          break;
        case 'aborted':
          // Don't show error for user-initiated stops
          break;
        default:
          setError('Speech recognition error. Please try again.');
      }
    };
    
    recognitionRef.current = recognition;
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore - recognition may not be active
        }
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
      }
    };
  }, [effectiveContinuous, autoStop, autoStopDelay]);
  
  // Handle toggle recording
  const handleToggleRecording = useCallback(() => {
    if (!recognitionRef.current || disabled || isStarting) return;
    
    if (isRecording) {
      setIsProcessing(true);
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore - may already be stopped
        setIsRecording(false);
        setIsProcessing(false);
      }
    } else {
      transcriptRef.current = '';
      setError(null);
      setIsStarting(true);
      
      // Set a timeout to detect if recognition stalls (common on iOS)
      // If onstart doesn't fire within 5 seconds, show error and reset
      startupTimerRef.current = setTimeout(() => {
        if (!isRecording) {
          setIsStarting(false);
          setError(isIOS 
            ? 'Voice input timed out. On iOS, try closing Safari and reopening, or use the keyboard instead.'
            : 'Voice input timed out. Please try again.'
          );
          // Try to stop any pending recognition
          try {
            recognitionRef.current?.stop();
          } catch (e) {
            // Ignore
          }
        }
      }, 5000);
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setIsStarting(false);
        if (startupTimerRef.current) {
          clearTimeout(startupTimerRef.current);
          startupTimerRef.current = null;
        }
        // Check for specific iOS error
        if (e.message?.includes('already started')) {
          setError('Voice input is busy. Please wait a moment and try again.');
        } else {
          setError('Failed to start recording. Please try again.');
        }
      }
    }
  }, [isRecording, isStarting, disabled]);
  
  // Size classes
  const sizeClasses = {
    small: 'p-2',
    default: 'p-3',
    large: 'p-4'
  };
  
  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  // Not supported fallback
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed`}
        title="Voice input not supported in this browser"
      >
        <MicOff className={iconSizes[size]} />
      </button>
    );
  }
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggleRecording}
        disabled={disabled || isStarting}
        className={`${sizeClasses[size]} rounded-full transition-all ${
          isRecording 
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
            : isProcessing || isStarting
            ? 'bg-amber-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
        } ${disabled || isStarting ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isRecording ? 'Stop recording' : isStarting ? 'Starting...' : 'Start recording'}
        title={isRecording ? 'Click to stop' : isStarting ? 'Waiting for microphone...' : 'Click to record'}
      >
        {isProcessing || isStarting ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : isRecording ? (
          <Square className={`${iconSizes[size]} fill-current`} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>
      
      {/* Starting indicator */}
      {isStarting && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-amber-600 whitespace-nowrap">
          Starting...
        </div>
      )}
      
      {/* Recording indicator */}
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
      
      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-lg w-64 flex items-start gap-1 shadow-lg z-50">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

// ============================================
// VOICE INPUT WITH PREVIEW
// ============================================
export const VoiceInputWithPreview = ({
  value,
  onChange,
  placeholder = 'Click mic to speak, or type here...',
  className = '',
  rows = 4
}) => {
  const [partialTranscript, setPartialTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const handleTranscription = (text) => {
    // Append transcription to existing value
    const newValue = value ? `${value} ${text}` : text;
    onChange(newValue);
    setPartialTranscript('');
    setIsRecording(false);
  };
  
  const handlePartialTranscription = (text) => {
    setPartialTranscript(text);
    setIsRecording(true);
  };
  
  // Display text: show partial while recording, otherwise show value
  const displayText = isRecording && partialTranscript
    ? (value ? `${value} ${partialTranscript}` : partialTranscript)
    : value;
  
  return (
    <div className={`relative ${className}`}>
      <textarea
        value={displayText}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-3 pr-14 border rounded-xl text-sm resize-none transition-all duration-200 ${
          isRecording 
            ? 'bg-red-50/50 dark:bg-red-900/20/50 border-red-300 ring-2 ring-red-200' 
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal'
        }`}
      />
      <div className="absolute right-2 bottom-2">
        <VoiceInputButton
          onTranscription={handleTranscription}
          onPartialTranscription={handlePartialTranscription}
        />
      </div>
      
      {/* Recording hint */}
      {isRecording && (
        <div className="absolute top-2 right-14 text-xs text-red-600 animate-pulse">
          Recording...
        </div>
      )}
    </div>
  );
};

export default VoiceInputButton;
