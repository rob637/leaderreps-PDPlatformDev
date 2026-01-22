import { useState, useEffect, useRef, useCallback } from 'react';

// Audio file mapping for each step
const audioFiles = {
  'welcome': '/audio/welcome.mp3',
  'dashboard': '/audio/dashboard.mp3',
  'morning': '/audio/morning.mp3',
  'content': '/audio/content.mp3',
  'roadmap': '/audio/roadmap.mp3',
  'reflection': '/audio/reflection.mp3',
  'community': '/audio/community.mp3',
  'conclusion': '/audio/conclusion.mp3',
};

export const useNarrationAudio = (currentStepId, isGuidedMode, isPaused) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [error, setError] = useState(null);

  // Check if audio file exists for current step
  const audioSrc = audioFiles[currentStepId];

  // Create/update audio element when step changes
  useEffect(() => {
    if (!audioSrc) {
      setHasAudio(false);
      return;
    }

    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.addEventListener('canplaythrough', () => {
      setIsLoaded(true);
      setHasAudio(true);
      setError(null);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('error', () => {
      setHasAudio(false);
      setIsLoaded(false);
      // Don't set error - just means audio file doesn't exist yet
    });

    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('canplaythrough', () => {});
      audio.removeEventListener('ended', () => {});
      audio.removeEventListener('error', () => {});
    };
  }, [audioSrc]);

  // Auto-play when entering guided mode or changing steps
  useEffect(() => {
    if (isGuidedMode && hasAudio && audioRef.current && !isPaused) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentStepId, isGuidedMode, hasAudio, isPaused]);

  // Handle pause/resume
  useEffect(() => {
    if (!audioRef.current || !hasAudio) return;

    if (isPaused) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (isGuidedMode) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPaused, isGuidedMode, hasAudio]);

  const play = useCallback(() => {
    if (audioRef.current && hasAudio) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [hasAudio]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const replay = useCallback(() => {
    if (audioRef.current && hasAudio) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [hasAudio]);

  return {
    isPlaying,
    isLoaded,
    hasAudio,
    error,
    play,
    pause,
    replay,
  };
};

export default useNarrationAudio;
