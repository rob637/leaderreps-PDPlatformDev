import { BehaviorSubject } from 'rxjs';

// Singleton state for time travel
// We use a Subject so we can subscribe to changes outside of React components if needed
const timeState = {
  offset: 0, // Milliseconds offset from real time
  isTimeTravelActive: false
};

// Load from local storage on init
try {
  const savedOffset = localStorage.getItem('time_travel_offset');
  if (savedOffset) {
    timeState.offset = parseInt(savedOffset, 10);
    timeState.isTimeTravelActive = timeState.offset !== 0;
    console.log('[TimeService] Loaded time offset:', timeState.offset);
  }
} catch (e) {
  console.error('Failed to load time offset', e);
}

// Observable for time changes (useful for triggering re-renders or logic updates)
export const timeChange$ = new BehaviorSubject(timeState.offset);

export const timeService = {
  /**
   * Get the current "app time" (simulated or real)
   * @returns {Date}
   */
  getNow: () => {
    return new Date(Date.now() + timeState.offset);
  },

  /**
   * Get today's date string in YYYY-MM-DD format based on app time
   * @returns {string}
   */
  getTodayStr: () => {
    return timeService.getNow().toLocaleDateString('en-CA');
  },

  /**
   * Get ISO string of current app time
   * @returns {string}
   */
  getISOString: () => {
    return timeService.getNow().toISOString();
  },

  /**
   * Set the app time to a specific date
   * @param {Date} targetDate 
   */
  travelTo: (targetDate) => {
    const now = Date.now();
    const target = targetDate.getTime();
    timeState.offset = target - now;
    timeState.isTimeTravelActive = true;
    
    localStorage.setItem('time_travel_offset', timeState.offset.toString());
    timeChange$.next(timeState.offset);
    
    console.log(`[TimeService] Traveled to ${targetDate.toLocaleString()} (Offset: ${timeState.offset}ms)`);
    
    // Force reload to ensure all components/services pick up the new time
    // This is the safest way to ensure consistent state across the app
    window.location.reload();
  },

  /**
   * Reset to real time
   */
  reset: () => {
    timeState.offset = 0;
    timeState.isTimeTravelActive = false;
    localStorage.removeItem('time_travel_offset');
    timeChange$.next(0);
    console.log('[TimeService] Reset to real time');
    window.location.reload();
  },

  /**
   * Check if time travel is active
   * @returns {boolean}
   */
  isActive: () => {
    return timeState.isTimeTravelActive;
  },

  /**
   * Get milliseconds until the next midnight (app time)
   * @returns {number}
   */
  getMsUntilMidnight: () => {
    const now = timeService.getNow();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }
};
