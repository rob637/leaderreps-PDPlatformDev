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

// Detect Android - has issues with continuous mode causing duplicate results
const isAndroid = typeof navigator !== 'undefined' &&
  /android/i.test(navigator.userAgent);

// Detect Safari
const isSafari = typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// ============================================
// VOICE INPUT BUTTON COMPONENT
// ============================================
const VoiceInputButton = ({ 
  onTranscription, 
  onPartialTranscription,
  onError,
  disabled = false,
  size = 'default',
  continuous = true, // Changed: Default to continuous for longer recordings
  // Changed (May-11): default to manual-stop. Recording stays active until
  // the user clicks the stop button. On browsers that force non-continuous
  // mode (iOS/Safari/Android), we auto-restart recognition on `onend` so
  // the session keeps going through pauses. Pass `autoStop={true}` to opt
  // back into the legacy silence-detected auto-stop behavior.
  autoStop = false,
  autoStopDelay = 3000 // Only used when autoStop is true
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
  const hasSubmittedRef = useRef(false); // Prevent duplicate submissions
  const processedIndicesRef = useRef(new Set()); // Track processed final result indices (Android fix)
  // Manual-stop tracking (May-11): when false and `autoStop` is also false,
  // the `onend` handler will restart recognition so the session continues
  // through silence on browsers that force non-continuous mode.
  const userStoppedRef = useRef(false);
  const wantsActiveRef = useRef(false);
  // Accumulates final transcript text across auto-restarts within a single
  // user session. transcriptRef is reset on every recognition.onstart, so
  // we need a separate session-level buffer to preserve dictated text when
  // the browser ends and we restart recognition on silence.
  const sessionTranscriptRef = useRef('');
  const isRestartingRef = useRef(false);
  // Deferred-restart bookkeeping (May 2026 — fix for transcription dying
  // when the user pauses). `recognition.start()` called synchronously inside
  // `onend` throws InvalidStateError on iOS / Android because the previous
  // session hasn't fully released. We retry on a short timer with backoff
  // up to a small cap so silence pauses don't end the session.
  const restartTimerRef = useRef(null);
  const restartAttemptsRef = useRef(0);
  const RESTART_MAX_ATTEMPTS = 5;
  const RESTART_BASE_DELAY_MS = 250;
  // Store callbacks in refs to avoid re-creating recognition on every render
  const onTranscriptionRef = useRef(onTranscription);
  const onPartialTranscriptionRef = useRef(onPartialTranscription);
  const onErrorRef = useRef(onError);
  
  // Update callback refs when props change
  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
    onPartialTranscriptionRef.current = onPartialTranscription;
    onErrorRef.current = onError;
  }, [onTranscription, onPartialTranscription, onError]);
  
  // iOS and Android don't support continuous mode well - disable it
  // Android in particular has issues where results repeat many times
  const effectiveContinuous = isIOS || isSafari || isAndroid ? false : continuous;
  
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
      // Reset restart-backoff counter on every successful start.
      restartAttemptsRef.current = 0;
      // Only reset cross-restart flags on a fresh user-initiated start.
      // Auto-restarts (silence-driven) preserve sessionTranscriptRef and
      // hasSubmittedRef so dictated text accumulates across the session.
      if (!isRestartingRef.current) {
        hasSubmittedRef.current = false;
        sessionTranscriptRef.current = '';
      }
      isRestartingRef.current = false;
      processedIndicesRef.current = new Set(); // Reset processed indices (Android fix)
    };
    
    recognition.onend = () => {
      // May-11 manual-stop mode: if the user hasn't pressed stop and we're
      // not in autoStop mode, restart recognition on a short timer. We MUST
      // defer the start() call: invoking it synchronously inside onend
      // throws InvalidStateError on iOS/Android because the browser hasn't
      // released the previous session yet. The deferred retry with backoff
      // (up to RESTART_MAX_ATTEMPTS) keeps the session alive through
      // silence pauses without spinning into a tight loop.
      if (!autoStop && wantsActiveRef.current && !userStoppedRef.current) {
        // Roll the just-finished segment into the session-level buffer so
        // we don't lose anything when transcriptRef gets cleared on the
        // next onstart.
        const segment = transcriptRef.current.trim();
        if (segment) {
          sessionTranscriptRef.current = sessionTranscriptRef.current
            ? `${sessionTranscriptRef.current} ${segment}`
            : segment;
          // Surface as a partial so the parent textarea reflects accumulated
          // text between restarts (without marking the session as submitted).
          onPartialTranscriptionRef.current?.(sessionTranscriptRef.current);
        }
        transcriptRef.current = '';

        if (restartAttemptsRef.current >= RESTART_MAX_ATTEMPTS) {
          // Backoff cap reached — give up on auto-restart and fall through
          // to the normal end behavior. The accumulated transcript is still
          // submitted below.
          wantsActiveRef.current = false;
        } else {
          const attempt = restartAttemptsRef.current;
          restartAttemptsRef.current = attempt + 1;
          const delay = RESTART_BASE_DELAY_MS * Math.pow(2, attempt);
          if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
          }
          isRestartingRef.current = true;
          restartTimerRef.current = setTimeout(() => {
            restartTimerRef.current = null;
            if (!wantsActiveRef.current || userStoppedRef.current) {
              isRestartingRef.current = false;
              return;
            }
            try {
              recognitionRef.current?.start();
            } catch (e) {
              // start() can still throw on devices that haven't released the
              // mic yet. Schedule another retry until we hit the cap.
              isRestartingRef.current = false;
              if (recognitionRef.current && wantsActiveRef.current && !userStoppedRef.current) {
                // Re-enter onend's restart path by simulating it: bump the
                // attempt counter and try again on the same backoff curve.
                const next = restartAttemptsRef.current;
                if (next < RESTART_MAX_ATTEMPTS) {
                  restartAttemptsRef.current = next + 1;
                  const retryDelay = RESTART_BASE_DELAY_MS * Math.pow(2, next);
                  restartTimerRef.current = setTimeout(() => {
                    restartTimerRef.current = null;
                    if (!wantsActiveRef.current || userStoppedRef.current) return;
                    try {
                      isRestartingRef.current = true;
                      recognitionRef.current?.start();
                    } catch (_) {
                      isRestartingRef.current = false;
                    }
                  }, retryDelay);
                }
              }
            }
          }, delay);
          // Keep the visual recording state on — we're between segments.
          return;
        }
      }

      setIsRecording(false);
      setIsProcessing(false);
      setIsStarting(false);
      wantsActiveRef.current = false;

      // Clear timers
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      restartAttemptsRef.current = 0;

      // Send final transcription if we have content (only once). Combine
      // the last segment with anything accumulated across auto-restarts.
      const lastSegment = transcriptRef.current.trim();
      const combined = sessionTranscriptRef.current
        ? (lastSegment
            ? `${sessionTranscriptRef.current} ${lastSegment}`
            : sessionTranscriptRef.current)
        : lastSegment;
      if (combined && !hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        onTranscriptionRef.current?.(combined);
        transcriptRef.current = '';
        sessionTranscriptRef.current = '';
      }
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      // Process results - on mobile/non-continuous mode, use resultIndex to avoid reprocessing
      // On continuous mode, rebuild from start to handle potential corrections
      const startIndex = effectiveContinuous ? 0 : event.resultIndex;
      
      // For non-continuous mode, also include previously finalized content
      if (!effectiveContinuous && transcriptRef.current) {
        finalTranscript = transcriptRef.current + ' ';
      }
      
      for (let i = startIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          // Android fix: Skip if we've already processed this index as final
          // This prevents duplicate results when Android fires multiple onresult events
          if (processedIndicesRef.current.has(i)) {
            continue;
          }
          processedIndicesRef.current.add(i);
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Store the complete final transcript
      const finalText = finalTranscript.trim();
      if (finalText) {
        transcriptRef.current = finalText;
      }
      
      // Send partial transcription for live preview (final + interim combined)
      // Avoid duplicating if interim is a subset of final (common on mobile)
      let displayText = finalText;
      if (interimTranscript.trim() && !finalText.endsWith(interimTranscript.trim())) {
        displayText = (finalText + ' ' + interimTranscript).trim();
      } else if (!finalText && interimTranscript.trim()) {
        displayText = interimTranscript.trim();
      }

      // Prepend the session-level buffer so the live preview shows everything
      // dictated across auto-restarts (manual-stop mode), not just the
      // current segment.
      if (sessionTranscriptRef.current && displayText) {
        displayText = `${sessionTranscriptRef.current} ${displayText}`;
      } else if (sessionTranscriptRef.current) {
        displayText = sessionTranscriptRef.current;
      }
      
      if (onPartialTranscriptionRef.current && displayText) {
        onPartialTranscriptionRef.current(displayText);
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
          setError('No microphone found. Check that a mic is connected and that this site has microphone permission.');
          break;
        case 'not-allowed':
          setError('Microphone access is blocked. Tap the lock/info icon in your browser\u2019s address bar, allow microphone access for this site, then refresh and try again.');
          break;
        case 'service-not-allowed':
          setError('Microphone access is blocked at the device level. Open your device settings and allow microphone access for this browser.');
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
      // Surface error to parent (e.g., VoiceTextarea) so it can render an
      // always-visible banner. The floating tooltip can be clipped by
      // overflow-hidden ancestors, which has been a recurring \"mic doesn't
      // work\" complaint.
      if (event.error !== 'aborted') {
        try {
          onErrorRef.current?.(event.error);
        } catch (_) {
          // ignore
        }
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
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    };
  }, [effectiveContinuous, autoStop, autoStopDelay]);
  
  // Handle toggle recording
  const handleToggleRecording = useCallback(() => {
    if (!recognitionRef.current || disabled || isStarting) return;
    
    if (isRecording) {
      // Mark this as a user-initiated stop so the onend handler does NOT
      // auto-restart recognition.
      userStoppedRef.current = true;
      wantsActiveRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
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
      sessionTranscriptRef.current = '';
      hasSubmittedRef.current = false; // Reset submission flag
      processedIndicesRef.current = new Set(); // Reset processed indices (Android fix)
      userStoppedRef.current = false;
      wantsActiveRef.current = true;
      isRestartingRef.current = false;
      restartAttemptsRef.current = 0;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
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
        title="Voice input not supported in this browser. Try Chrome or Safari."
        aria-label="Voice input not supported in this browser"
        onClick={() => {
          try {
            onErrorRef.current?.('not-supported');
          } catch (_) { /* ignore */ }
        }}
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
