// src/components/conditioning/VoiceInputButton.jsx
// Voice input component using Web Speech API
// Provides real-time speech-to-text transcription

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, AlertCircle, Loader2 } from 'lucide-react';

// Check for browser support
const SpeechRecognition = typeof window !== 'undefined' && (
  window.SpeechRecognition || window.webkitSpeechRecognition
);

// ============================================
// VOICE INPUT BUTTON COMPONENT
// ============================================
const VoiceInputButton = ({ 
  onTranscription, 
  onPartialTranscription,
  disabled = false,
  size = 'default',
  continuous = false,
  autoStop = true,
  autoStopDelay = 1500 // ms of silence before auto-stop
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const transcriptRef = useRef('');
  
  // Initialize speech recognition
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
      transcriptRef.current = '';
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      setIsProcessing(false);
      
      // Clear auto-stop timer
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      
      // Send final transcription if we have content
      if (transcriptRef.current.trim()) {
        onTranscription?.(transcriptRef.current.trim());
      }
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update transcript ref with final results
      if (finalTranscript) {
        transcriptRef.current += (transcriptRef.current ? ' ' : '') + finalTranscript;
      }
      
      // Send partial transcription for live preview
      if (onPartialTranscription) {
        onPartialTranscription(transcriptRef.current + (interimTranscript ? ' ' + interimTranscript : ''));
      }
      
      // Auto-stop after silence
      if (autoStop && finalTranscript) {
        if (autoStopTimerRef.current) {
          clearTimeout(autoStopTimerRef.current);
        }
        autoStopTimerRef.current = setTimeout(() => {
          recognition.stop();
        }, autoStopDelay);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsProcessing(false);
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Try again.');
          break;
        case 'audio-capture':
          setError('No microphone found.');
          break;
        case 'not-allowed':
          setError('Microphone access denied.');
          break;
        case 'network':
          setError('Network error. Check your connection.');
          break;
        default:
          setError('Speech recognition error.');
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
    };
  }, [continuous, autoStop, autoStopDelay, onTranscription, onPartialTranscription]);
  
  // Handle toggle recording
  const handleToggleRecording = useCallback(() => {
    if (!recognitionRef.current || disabled) return;
    
    if (isRecording) {
      setIsProcessing(true);
      recognitionRef.current.stop();
    } else {
      transcriptRef.current = '';
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setError('Failed to start recording.');
      }
    }
  }, [isRecording, disabled]);
  
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
        disabled={disabled}
        className={`${sizeClasses[size]} rounded-full transition-all ${
          isRecording 
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
            : isProcessing
            ? 'bg-amber-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        title={isRecording ? 'Click to stop' : 'Click to record'}
      >
        {isProcessing ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : isRecording ? (
          <Square className={`${iconSizes[size]} fill-current`} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>
      
      {/* Recording indicator */}
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
      
      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 text-xs rounded-lg whitespace-nowrap flex items-center gap-1 shadow-lg">
          <AlertCircle className="w-3 h-3" />
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
