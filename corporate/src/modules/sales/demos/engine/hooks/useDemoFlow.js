import { useState, useCallback, useEffect } from 'react';
import { demoSteps, getNextStep, getPrevStep, getStepIndex, totalSteps } from '../data/demoSteps';

// Auto-advance timing per step (in seconds)
const stepDurations = {
  'welcome': 8,
  'dashboard': 12,
  'morning': 15,
  'content': 15,
  'roadmap': 12,
  'reflection': 12,
  'community': 12,
  'conclusion': 0, // Don't auto-advance from conclusion
};

export const useDemoFlow = () => {
  const [currentStepId, setCurrentStepId] = useState('welcome');
  const [mode, setMode] = useState('explore'); // Start in explore, user can enable guided
  const [visitedSteps, setVisitedSteps] = useState(['welcome']);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const currentStep = demoSteps.find(s => s.id === currentStepId);
  const currentIndex = getStepIndex(currentStepId);
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  const goToStep = useCallback((stepId) => {
    setCurrentStepId(stepId);
    setVisitedSteps(prev => 
      prev.includes(stepId) ? prev : [...prev, stepId]
    );
    // Reset timer when changing steps
    setTimeRemaining(stepDurations[stepId] || 10);
  }, []);

  const goNext = useCallback(() => {
    const next = getNextStep(currentStepId);
    if (next) {
      goToStep(next.id);
    }
  }, [currentStepId, goToStep]);

  const goPrev = useCallback(() => {
    const prev = getPrevStep(currentStepId);
    if (prev) {
      goToStep(prev.id);
    }
  }, [currentStepId, goToStep]);

  const restart = useCallback(() => {
    setCurrentStepId('welcome');
    setVisitedSteps(['welcome']);
    setTimeRemaining(stepDurations['welcome']);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const newMode = prev === 'guided' ? 'explore' : 'guided';
      if (newMode === 'guided') {
        setTimeRemaining(stepDurations[currentStepId] || 10);
        setIsPaused(false);
      }
      return newMode;
    });
  }, [currentStepId]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Auto-advance timer for guided mode
  useEffect(() => {
    if (mode !== 'guided' || isPaused || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto advance to next step
          const next = getNextStep(currentStepId);
          if (next) {
            setCurrentStepId(next.id);
            setVisitedSteps(prevVisited => 
              prevVisited.includes(next.id) ? prevVisited : [...prevVisited, next.id]
            );
            return stepDurations[next.id] || 10;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isPaused, currentStepId, timeRemaining]);

  // Initialize timer when entering guided mode or changing steps
  useEffect(() => {
    if (mode === 'guided') {
      setTimeRemaining(stepDurations[currentStepId] || 10);
    }
  }, [currentStepId, mode]);

  const canGoNext = currentIndex < totalSteps - 1;
  const canGoPrev = currentIndex > 0;
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === totalSteps - 1;

  return {
    // State
    currentStepId,
    currentStep,
    currentIndex,
    progress,
    mode,
    visitedSteps,
    totalSteps,
    allSteps: demoSteps,
    isPaused,
    timeRemaining,
    
    // Navigation
    goToStep,
    goNext,
    goPrev,
    restart,
    
    // Mode
    toggleMode,
    togglePause,
    
    // Flags
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
  };
};

export default useDemoFlow;
