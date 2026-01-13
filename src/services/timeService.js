import { BehaviorSubject, Subject } from 'rxjs';

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

// Subject for midnight crossing events during time warp
// Emits array of dates that were crossed (e.g., if warping 3 days, emits 3 dates)
export const midnightCrossing$ = new Subject();

/**
 * Calculate all midnight crossings between two dates
 * @param {Date} fromDate - Starting date/time
 * @param {Date} toDate - Ending date/time
 * @returns {Array<{oldDate: string, newDate: string}>} Array of midnight crossings
 */
const getMidnightCrossings = (fromDate, toDate) => {
  const crossings = [];
  
  // Normalize to start of day for comparison
  const fromDay = new Date(fromDate);
  fromDay.setHours(0, 0, 0, 0);
  
  const toDay = new Date(toDate);
  toDay.setHours(0, 0, 0, 0);
  
  // If same day, no crossings
  if (fromDay.getTime() === toDay.getTime()) {
    return crossings;
  }
  
  // Determine direction (forward or backward in time)
  const isForward = toDate > fromDate;
  
  if (isForward) {
    // Moving forward: iterate through each day
    let currentDay = new Date(fromDay);
    while (currentDay < toDay) {
      const oldDate = currentDay.toLocaleDateString('en-CA');
      currentDay.setDate(currentDay.getDate() + 1);
      const newDate = currentDay.toLocaleDateString('en-CA');
      crossings.push({ oldDate, newDate });
    }
  } else {
    // Moving backward: we still need to handle this case
    // When going backward, we're essentially "undoing" days
    // For now, we'll just note the crossing but not trigger rollover
    // (Going backward is mainly for testing, not for production flow)
    console.log('[TimeService] Backward time travel - no rollover triggered');
  }
  
  return crossings;
};

// Default timezone for the application
const DEFAULT_TIMEZONE = 'America/New_York';

// Store the active timezone (can be set per-user or per-cohort)
let activeTimezone = DEFAULT_TIMEZONE;

export const timeService = {
  /**
   * Get the current "app time" (simulated or real)
   * @returns {Date}
   */
  getNow: () => {
    return new Date(Date.now() + timeState.offset);
  },

  /**
   * Set the active timezone for date calculations
   * This should be called when loading user/cohort data
   * @param {string} timezone - IANA timezone string (e.g., 'America/New_York')
   */
  setTimezone: (timezone) => {
    if (timezone) {
      activeTimezone = timezone;
      console.log('[TimeService] Active timezone set to:', timezone);
    }
  },

  /**
   * Get the current active timezone
   * @returns {string}
   */
  getTimezone: () => activeTimezone,

  /**
   * Get today's date string in YYYY-MM-DD format based on app time and active timezone
   * @param {string} timezone - Optional timezone override (uses activeTimezone if not provided)
   * @returns {string}
   */
  getTodayStr: (timezone) => {
    const tz = timezone || activeTimezone;
    const now = timeService.getNow();
    console.log('[TimeService.getTodayStr] Using timezone:', tz, '| activeTimezone:', activeTimezone);
    try {
      const result = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
      console.log('[TimeService.getTodayStr] Result:', result);
      return result;
    } catch (e) {
      console.error('[TimeService] Invalid timezone, falling back to local:', tz, e);
      return now.toLocaleDateString('en-CA');
    }
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
   * @param {Object} options - Optional settings
   * @param {boolean} options.skipMidnightRollover - If true, don't trigger rollover (for backward travel)
   */
  travelTo: (targetDate, options = {}) => {
    const currentAppTime = timeService.getNow();
    const now = Date.now();
    const target = targetDate.getTime();
    
    // Calculate midnight crossings BEFORE changing the offset
    const crossings = getMidnightCrossings(currentAppTime, targetDate);
    
    // Update offset
    timeState.offset = target - now;
    timeState.isTimeTravelActive = true;
    
    localStorage.setItem('time_travel_offset', timeState.offset.toString());
    
    console.log(`[TimeService] Traveled to ${targetDate.toLocaleString()} (Offset: ${timeState.offset}ms)`);
    
    // If there are midnight crossings and we're moving forward, emit them
    if (crossings.length > 0 && !options.skipMidnightRollover) {
      console.log(`[TimeService] 🌙 Detected ${crossings.length} midnight crossing(s):`, crossings);
      
      // Store crossings in localStorage so they can be processed after reload
      localStorage.setItem('pending_midnight_crossings', JSON.stringify(crossings));
    }
    
    timeChange$.next(timeState.offset);
    
    // Force reload to ensure all components/services pick up the new time
    // This is the safest way to ensure consistent state across the app
    console.log('[TimeService] Scheduling reload in 500ms...');
    setTimeout(() => {
      console.log('[TimeService] Reloading now...');
      window.location.reload();
    }, 500);
  },

  /**
   * Reset to real time
   */
  reset: () => {
    console.log('[TimeService] Resetting to real time...');
    timeState.offset = 0;
    timeState.isTimeTravelActive = false;
    
    try {
      localStorage.removeItem('time_travel_offset');
      localStorage.removeItem('pending_midnight_crossings');
      console.log('[TimeService] Storage cleared.');
    } catch (e) {
      console.error('[TimeService] Error clearing storage:', e);
    }

    timeChange$.next(0);
    
    // Delay reload to ensure storage persistence and UI feedback
    setTimeout(() => {
      console.log('[TimeService] Reloading for reset...');
      window.location.reload();
    }, 200);
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
  },

  /**
   * Check for and retrieve any pending midnight crossings from a time warp
   * Should be called on app initialization
   * @returns {Array<{oldDate: string, newDate: string}>|null}
   */
  getPendingMidnightCrossings: () => {
    try {
      const pending = localStorage.getItem('pending_midnight_crossings');
      if (pending) {
        localStorage.removeItem('pending_midnight_crossings');
        return JSON.parse(pending);
      }
    } catch (e) {
      console.error('[TimeService] Error reading pending crossings:', e);
    }
    return null;
  }
};
