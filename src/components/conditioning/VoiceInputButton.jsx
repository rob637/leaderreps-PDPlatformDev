// src/components/conditioning/VoiceInputButton.jsx
// Voice input component using the Web Speech API.
//
// Design goals (May 2026 rewrite — "world class, simple"):
//   1. PERSIST AS YOU GO. Every interim result is streamed to the parent
//      via onPartialTranscription, and finals are accumulated in a ref.
//      If the session dies for any reason (silence, network blip, tab
//      switch) the latest text is already visible in the textarea — the
//      user never loses dictated words on a pause.
//   2. NO FAKE CONTINUOUS. On Chrome desktop we use native continuous
//      mode (the browser keeps listening through short pauses). On
//      iOS Safari, Safari, and Android the browser forces single-
//      utterance mode and reliably ends on silence; we honor that and
//      let the user tap again. The previous implementation tried to
//      auto-restart on every onend, which caused rapid mic icon
//      flashing and the OS mic indicator to pulse continuously when
//      start() threw InvalidStateError before the previous session
//      released the device.
//   3. ONE BOUNDED RESTART. For true continuous platforms we allow a
//      single deferred restart if the engine ends unexpectedly within
//      a session. Beyond that we stop cleanly.
//   4. HARD-STOP ON FATAL ERRORS (not-allowed, audio-capture,
//      service-not-allowed). Never auto-restart through a permission
//      or hardware error — that's what created the "flashing forever"
//      bug in Ask-A-Trainer.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, AlertCircle, Loader2 } from 'lucide-react';

// Browser support
const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

// Platform detection
const isIOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !window.MSStream;
const isAndroid =
  typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
const isSafari =
  typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Continuous mode is only reliable on desktop Chrome / Edge. iOS Safari,
// Android Chrome, and macOS Safari all force single-utterance mode under
// the hood. Trying to fake continuous via restart loops on those platforms
// caused the mic indicator to flash rapidly and dictated text to be lost.
const NATIVE_CONTINUOUS_SUPPORTED = !(isIOS || isAndroid || isSafari);

const ERROR_MESSAGES = {
  'no-speech': "We didn't hear anything. Tap the mic and try again.",
  'audio-capture':
    'No microphone found. Check that one is connected and not in use by another app.',
  'not-allowed':
    "Microphone access is blocked. Tap the lock/info icon in your browser's address bar, allow microphone access for this site, then refresh.",
  'service-not-allowed':
    'Microphone access is blocked at the device level. Open your device settings and allow microphone access for this browser.',
  network: 'Network error reaching the speech service. Check your connection.',
  aborted: null, // user-initiated; suppress
  'not-supported':
    'Voice input is not supported in this browser. Try Chrome on desktop or Safari on iOS.',
};

// Errors we must never try to auto-recover from.
const FATAL_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
]);

// ============================================
// VOICE INPUT BUTTON
// ============================================
const VoiceInputButton = ({
  onTranscription,
  onPartialTranscription,
  onError,
  disabled = false,
  size = 'default',
  // Hint that the caller wants long-form dictation. We honor this when the
  // platform actually supports continuous mode; otherwise the user re-taps
  // to dictate the next phrase. (Same external API as before for back-compat.)
  continuous = true,
  // Legacy prop — kept for back-compat. The new implementation always
  // behaves as autoStop=false: we never time out a session ourselves.
  // eslint-disable-next-line no-unused-vars
  autoStop = false,
  // eslint-disable-next-line no-unused-vars
  autoStopDelay = 3000,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  // True from the moment the user taps "record" until they tap stop or a
  // fatal error fires. Drives whether onend should attempt a restart.
  const wantsActiveRef = useRef(false);
  // Accumulates finalized text for the current session. Reset on each new
  // session and on successful commit to the parent.
  const finalTextRef = useRef('');
  // Timestamp (ms) when onstart fired. Used to guard against rapid
  // start/end loops — we refuse to restart if a session lasted <800ms.
  const startTsRef = useRef(0);
  // We allow at most ONE auto-restart per user session, on platforms with
  // native continuous support. This is the safety belt against the icon-
  // flashing loop that motivated this rewrite.
  const restartedRef = useRef(false);
  // Timer handle for the deferred restart attempt.
  const restartTimerRef = useRef(null);
  // Startup watchdog — if onstart never fires within 5s, surface a clear
  // error (common iOS Safari failure mode).
  const startupTimerRef = useRef(null);

  // Callback refs so prop changes don't recreate the recognition object.
  const onTranscriptionRef = useRef(onTranscription);
  const onPartialRef = useRef(onPartialTranscription);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
    onPartialRef.current = onPartialTranscription;
    onErrorRef.current = onError;
  }, [onTranscription, onPartialTranscription, onError]);

  const useContinuous = continuous && NATIVE_CONTINUOUS_SUPPORTED;

  // Commit accumulated final text to the parent (once per session).
  const commit = useCallback(() => {
    const text = finalTextRef.current.trim();
    if (text) {
      onTranscriptionRef.current?.(text);
      finalTextRef.current = '';
    }
  }, []);

  // Build & wire the recognition object once per useContinuous change.
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = useContinuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      startTsRef.current = Date.now();
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
      setIsStarting(false);
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      // Only inspect results from `resultIndex` forward — those are the
      // new/changed results in this event. We accumulate finals into
      // finalTextRef and stream a live preview (final + current interim)
      // to the parent on every event. The previous implementation tried
      // to rebuild the entire transcript from index 0 in continuous mode,
      // which caused duplicate text on Android.
      let appendedFinal = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = res[0]?.transcript || '';
        if (res.isFinal) {
          const clean = txt.trim();
          if (clean) {
            appendedFinal += (appendedFinal ? ' ' : '') + clean;
          }
        } else {
          interim += txt;
        }
      }

      if (appendedFinal) {
        finalTextRef.current = finalTextRef.current
          ? `${finalTextRef.current} ${appendedFinal}`
          : appendedFinal;
      }

      const interimTrim = interim.trim();
      const preview = interimTrim
        ? finalTextRef.current
          ? `${finalTextRef.current} ${interimTrim}`
          : interimTrim
        : finalTextRef.current;

      if (preview) {
        onPartialRef.current?.(preview);
      }
    };

    recognition.onerror = (event) => {
      const code = event.error;
      // Always log — these are useful for diagnosing field issues.
      // eslint-disable-next-line no-console
      console.warn('[VoiceInputButton] recognition error:', code);

      if (FATAL_ERRORS.has(code)) {
        // Hard stop: disable any restart attempt and surface the error.
        wantsActiveRef.current = false;
        restartedRef.current = true;
      }

      if (code && code !== 'aborted') {
        setError(ERROR_MESSAGES[code] || 'Voice input failed. Please try again.');
        try {
          onErrorRef.current?.(code);
        } catch (_) {
          /* ignore */
        }
      }
    };

    recognition.onend = () => {
      const elapsed = Date.now() - startTsRef.current;
      // Only attempt a restart when:
      //   - user has not pressed stop
      //   - platform actually supports continuous mode
      //   - we haven't already used our one restart credit
      //   - the just-ended session lasted long enough that we're not
      //     in a tight start/end loop (>= 800ms)
      const canRestart =
        useContinuous &&
        wantsActiveRef.current &&
        !restartedRef.current &&
        elapsed >= 800;

      if (canRestart) {
        restartedRef.current = true;
        // Defer the restart so the browser fully releases the previous
        // session — calling start() synchronously from onend throws
        // InvalidStateError on Chromium and triggers the mic-flashing loop.
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;
          if (!wantsActiveRef.current || !recognitionRef.current) return;
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Couldn't restart — give up gracefully and commit whatever
            // we have. No second retry; we never loop.
            wantsActiveRef.current = false;
            setIsRecording(false);
            commit();
          }
        }, 350);
        return;
      }

      // Final stop — clean up UI state and commit accumulated text.
      setIsRecording(false);
      setIsStarting(false);
      wantsActiveRef.current = false;
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
      commit();
    };

    recognitionRef.current = recognition;

    return () => {
      // Tear down. abort() is preferred over stop() because it discards
      // any in-flight results synchronously and won't fire onend.
      try {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort?.();
      } catch (_) {
        /* ignore */
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
    };
  }, [useContinuous, commit]);

  // User toggles recording on/off
  const handleToggleRecording = useCallback(() => {
    if (!recognitionRef.current || disabled || isStarting) return;

    // STOP
    if (isRecording || wantsActiveRef.current) {
      wantsActiveRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      try {
        recognitionRef.current.stop();
      } catch (_) {
        setIsRecording(false);
      }
      return;
    }

    // START a fresh session
    finalTextRef.current = '';
    restartedRef.current = false;
    wantsActiveRef.current = true;
    setError(null);
    setIsStarting(true);

    // Watchdog — if onstart doesn't fire within 5s the device is stuck.
    if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
    startupTimerRef.current = setTimeout(() => {
      startupTimerRef.current = null;
      setIsStarting(false);
      wantsActiveRef.current = false;
      setError(
        isIOS
          ? 'Voice input timed out. On iOS, try closing the tab and reopening, or use the keyboard.'
          : 'Voice input timed out. Please try again.',
      );
      try {
        recognitionRef.current?.abort?.();
      } catch (_) {
        /* ignore */
      }
    }, 5000);

    try {
      recognitionRef.current.start();
    } catch (e) {
      // InvalidStateError = engine already running. Reset and try again
      // on the next user tap.
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
      setIsStarting(false);
      wantsActiveRef.current = false;
      setError('Voice input is busy. Please wait a moment and try again.');
    }
  }, [isRecording, isStarting, disabled]);

  // Size classes
  const sizeClasses = { small: 'p-2', default: 'p-3', large: 'p-4' };
  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  // Unsupported browser fallback
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
          } catch (_) {
            /* ignore */
          }
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
            : isStarting
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
        } ${disabled || isStarting ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={
          isRecording
            ? 'Stop recording'
            : isStarting
              ? 'Starting...'
              : 'Start recording'
        }
        title={
          isRecording
            ? 'Click to stop'
            : isStarting
              ? 'Waiting for microphone...'
              : 'Click to record'
        }
      >
        {isStarting ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : isRecording ? (
          <Square className={`${iconSizes[size]} fill-current`} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>

      {isStarting && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-amber-600 whitespace-nowrap">
          Starting...
        </div>
      )}

      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}

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
// VOICE INPUT WITH PREVIEW (back-compat)
// ============================================
export const VoiceInputWithPreview = ({
  value,
  onChange,
  placeholder = 'Click mic to speak, or type here...',
  className = '',
  rows = 4,
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

  const displayText =
    isRecording && partialTranscript
      ? value
        ? `${value} ${partialTranscript}`
        : partialTranscript
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

      {isRecording && (
        <div className="absolute top-2 right-14 text-xs text-red-600 animate-pulse">
          Recording...
        </div>
      )}
    </div>
  );
};

export default VoiceInputButton;
