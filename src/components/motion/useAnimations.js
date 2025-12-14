/**
 * Animation Hooks - Custom hooks for motion control
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * useReducedMotion - Check if user prefers reduced motion
 * Automatically disables animations for accessibility
 */
export const useReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (e) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
};

/**
 * useAnimationState - Control animation playback
 */
export const useAnimationState = (initialState = 'hidden') => {
  const [state, setState] = useState(initialState);
  const reducedMotion = useReducedMotion();

  const animate = useCallback(() => {
    setState(reducedMotion ? 'visible' : 'animate');
  }, [reducedMotion]);

  const reset = useCallback(() => {
    setState('hidden');
  }, []);

  const toggle = useCallback(() => {
    setState(current => current === 'hidden' ? 'animate' : 'hidden');
  }, []);

  return { state, animate, reset, toggle, setState };
};

/**
 * useScrollAnimation - Trigger animation on scroll
 */
export const useScrollAnimation = (threshold = 0.1) => {
  const [ref, setRef] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!ref || reducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold, reducedMotion]);

  return [setRef, isVisible];
};

/**
 * useStaggerDelay - Calculate stagger delay for list items
 */
export const useStaggerDelay = (index, baseDelay = 0.05, maxDelay = 0.5) => {
  const reducedMotion = useReducedMotion();
  
  if (reducedMotion) return 0;
  
  const delay = index * baseDelay;
  return Math.min(delay, maxDelay);
};

/**
 * useAnimationComplete - Callback when animation completes
 */
export const useAnimationComplete = (onComplete) => {
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    onComplete?.();
  }, [onComplete]);

  const reset = useCallback(() => {
    setIsComplete(false);
  }, []);

  return { isComplete, handleComplete, reset };
};

/**
 * usePresenceAnimation - Manage enter/exit animations
 */
export const usePresenceAnimation = (isPresent) => {
  const [shouldRender, setShouldRender] = useState(isPresent);
  const [animationState, setAnimationState] = useState(isPresent ? 'enter' : 'exit');
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (isPresent) {
      setShouldRender(true);
      setAnimationState('enter');
    } else {
      setAnimationState('exit');
      if (reducedMotion) {
        setShouldRender(false);
      }
    }
  }, [isPresent, reducedMotion]);

  const onExitComplete = useCallback(() => {
    if (!isPresent) {
      setShouldRender(false);
    }
  }, [isPresent]);

  return { shouldRender, animationState, onExitComplete };
};

export default {
  useReducedMotion,
  useAnimationState,
  useScrollAnimation,
  useStaggerDelay,
  useAnimationComplete,
  usePresenceAnimation,
};
