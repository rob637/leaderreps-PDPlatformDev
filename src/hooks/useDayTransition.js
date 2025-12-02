// src/hooks/useDayTransition.js
// Handles day-to-day transitions for time travel testing
// Finalizes data at midnight and resets for the new day

import { useEffect, useRef } from 'react';
import { timeService, timeChange$ } from '../services/timeService';

/**
 * Hook to detect and handle day transitions (especially for time travel testing)
 * 
 * @param {Object} options
 * @param {Function} options.onDayTransition - Callback when day changes: (oldDate, newDate) => void
 * @param {boolean} options.enabled - Whether to monitor for day transitions
 */
export const useDayTransition = ({ onDayTransition, enabled = true }) => {
  const lastDateRef = useRef(timeService.getTodayStr());
  const isTimeTravelActive = timeService.isActive();

  // Check for day transition every second when time travel is active
  useEffect(() => {
    if (!enabled || !isTimeTravelActive) return;

    const checkInterval = setInterval(() => {
      const currentDate = timeService.getTodayStr();
      const lastDate = lastDateRef.current;

      if (currentDate !== lastDate) {
        console.log('[useDayTransition] Day transition detected!', {
          from: lastDate,
          to: currentDate,
          time: timeService.getNow().toLocaleTimeString()
        });

        // Update ref before calling callback to prevent multiple triggers
        lastDateRef.current = currentDate;

        // Call the transition handler
        if (onDayTransition) {
          onDayTransition(lastDate, currentDate);
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [enabled, isTimeTravelActive, onDayTransition]);

  // Also subscribe to time changes (for when travelTo is called)
  useEffect(() => {
    if (!enabled) return;

    const subscription = timeChange$.subscribe(() => {
      // Update lastDateRef when time changes to prevent false triggers
      lastDateRef.current = timeService.getTodayStr();
    });

    return () => subscription.unsubscribe();
  }, [enabled]);

  return {
    currentDate: lastDateRef.current,
    isTimeTravelActive
  };
};

export default useDayTransition;
