/**
 * useHaptics - Haptic feedback hook and utility
 * 
 * Uses the Vibration API for tactile feedback on mobile devices.
 * Gracefully degrades on unsupported devices.
 */
import { useCallback, useEffect, useState } from 'react';

// Check if vibration is supported
const isVibrationSupported = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Haptic patterns - predefined vibration sequences
 * Values are in milliseconds
 */
export const hapticPatterns = {
  // Single taps
  light: [10],           // Subtle tap
  medium: [20],          // Standard tap
  heavy: [30],           // Strong tap
  
  // Success/confirm
  success: [10, 50, 20], // Short-pause-medium
  
  // Error/warning
  error: [50, 50, 50],   // Three quick pulses
  warning: [30, 50, 30], // Two quick pulses
  
  // Selection
  selection: [5],        // Very light tap
  
  // Impact
  impactLight: [10],
  impactMedium: [25],
  impactHeavy: [40],
  
  // Notification
  notification: [20, 100, 20, 100, 30], // Pattern
  
  // Long press
  longPress: [50],
  
  // Scroll tick
  tick: [3],
  
  // Custom patterns
  doubleClick: [10, 30, 10],
  tripleClick: [10, 30, 10, 30, 10],
};

/**
 * Core haptic trigger function
 */
export const haptic = {
  /**
   * Trigger a vibration pattern
   * @param {string|number[]} pattern - Pattern name or custom duration array
   */
  trigger: (pattern = 'medium') => {
    if (!isVibrationSupported() || prefersReducedMotion()) {
      return false;
    }
    
    try {
      const vibrationPattern = typeof pattern === 'string' 
        ? hapticPatterns[pattern] || hapticPatterns.medium
        : pattern;
      
      navigator.vibrate(vibrationPattern);
      return true;
    } catch (e) {
      console.warn('Haptic feedback failed:', e);
      return false;
    }
  },

  /**
   * Light tap feedback
   */
  light: () => haptic.trigger('light'),

  /**
   * Medium tap feedback
   */
  medium: () => haptic.trigger('medium'),

  /**
   * Heavy tap feedback
   */
  heavy: () => haptic.trigger('heavy'),

  /**
   * Success feedback
   */
  success: () => haptic.trigger('success'),

  /**
   * Error feedback
   */
  error: () => haptic.trigger('error'),

  /**
   * Warning feedback
   */
  warning: () => haptic.trigger('warning'),

  /**
   * Selection changed feedback
   */
  selection: () => haptic.trigger('selection'),

  /**
   * Impact feedback (button press, etc.)
   */
  impact: (intensity = 'medium') => {
    const patterns = {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
    };
    return haptic.trigger(patterns[intensity] || 'impactMedium');
  },

  /**
   * Notification feedback
   */
  notification: () => haptic.trigger('notification'),

  /**
   * Tick feedback (for scrolling/sliders)
   */
  tick: () => haptic.trigger('tick'),

  /**
   * Stop any ongoing vibration
   */
  stop: () => {
    if (isVibrationSupported()) {
      navigator.vibrate(0);
    }
  },

  /**
   * Check if haptics are supported
   */
  isSupported: isVibrationSupported,
};

/**
 * useHaptics hook - React hook for haptic feedback
 */
const useHaptics = (options = {}) => {
  const { 
    enabled = true,
    respectReducedMotion = true,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);

  useEffect(() => {
    setIsSupported(isVibrationSupported());
  }, []);

  const shouldTrigger = useCallback(() => {
    if (!isSupported || !isEnabled) return false;
    if (respectReducedMotion && prefersReducedMotion()) return false;
    return true;
  }, [isSupported, isEnabled, respectReducedMotion]);

  const trigger = useCallback((pattern = 'medium') => {
    if (!shouldTrigger()) return false;
    return haptic.trigger(pattern);
  }, [shouldTrigger]);

  const light = useCallback(() => trigger('light'), [trigger]);
  const medium = useCallback(() => trigger('medium'), [trigger]);
  const heavy = useCallback(() => trigger('heavy'), [trigger]);
  const success = useCallback(() => trigger('success'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);
  const warning = useCallback(() => trigger('warning'), [trigger]);
  const selection = useCallback(() => trigger('selection'), [trigger]);
  const tick = useCallback(() => trigger('tick'), [trigger]);
  const notification = useCallback(() => trigger('notification'), [trigger]);

  const impact = useCallback((intensity = 'medium') => {
    const patterns = {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
    };
    return trigger(patterns[intensity] || 'impactMedium');
  }, [trigger]);

  return {
    trigger,
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
    tick,
    notification,
    impact,
    stop: haptic.stop,
    isSupported,
    isEnabled,
    setEnabled: setIsEnabled,
  };
};

export default useHaptics;
