/**
 * Timezone-Aware Date Utilities
 * 
 * This module provides consistent date handling for a global user base.
 * All date calculations that affect program progression should use these utilities.
 * 
 * Key Concepts:
 * - Cohort Timezone: The "official" timezone for a cohort (e.g., America/New_York)
 *   All cohort members see the same "Day 1", "Day 2", etc. based on this timezone.
 * - User Timezone: The user's preferred timezone for notifications and display.
 * - Date Keys: Always use YYYY-MM-DD format (en-CA locale) for consistency.
 */

// Default timezone if none specified
export const DEFAULT_TIMEZONE = 'America/New_York';

// Common timezones for selection
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
  { value: 'UTC', label: 'UTC' }
];

/**
 * Get the current date/time in a specific timezone
 * Note: JavaScript Date objects are always UTC internally. This function returns a Date
 * object that represents "now", but if you need the time/date components in a specific
 * timezone, use getTimeInTimezone() or getDateKeyInTimezone() instead.
 * 
 * @param {string} _timezone - IANA timezone string (reserved for future use)
 * @returns {Date} - Current Date object
 */
export const getNowInTimezone = (_timezone = DEFAULT_TIMEZONE) => {
  // Date objects don't carry timezone info - they're always UTC internally
  // For timezone-specific operations, use getTimeInTimezone() or getDateKeyInTimezone()
  return new Date();
};

/**
 * Get today's date key (YYYY-MM-DD) in a specific timezone
 * This is the primary function for getting consistent date keys across timezones.
 * 
 * @param {Date} date - Date to convert (defaults to now)
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const getDateKeyInTimezone = (date = new Date(), timezone = DEFAULT_TIMEZONE) => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (e) {
    console.warn(`[dateUtils] Invalid timezone "${timezone}", falling back to default`, e);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
};

/**
 * Get the current hour and minute in a specific timezone
 * Used for notification scheduling
 * 
 * @param {Date} date - Date to check (defaults to now)
 * @param {string} timezone - IANA timezone string
 * @returns {{ hours: number, minutes: number }}
 */
export const getTimeInTimezone = (date = new Date(), timezone = DEFAULT_TIMEZONE) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    
    return { hours, minutes };
  } catch (e) {
    console.warn(`[dateUtils] Error getting time in timezone "${timezone}"`, e);
    return { hours: date.getHours(), minutes: date.getMinutes() };
  }
};

/**
 * Parse a date and get its components in a specific timezone
 * @param {Date} date - Date to parse
 * @param {string} timezone - IANA timezone string
 * @returns {{ year: number, month: number, day: number, hours: number, minutes: number }}
 */
export const getDatePartsInTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    
    return {
      year: parseInt(parts.find(p => p.type === 'year')?.value || '0', 10),
      month: parseInt(parts.find(p => p.type === 'month')?.value || '0', 10),
      day: parseInt(parts.find(p => p.type === 'day')?.value || '0', 10),
      hours: parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10),
      minutes: parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)
    };
  } catch (e) {
    console.warn(`[dateUtils] Error parsing date in timezone "${timezone}"`, e);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes()
    };
  }
};

/**
 * Calculate days between two dates in a specific timezone
 * This is crucial for cohort day calculations - all users in a cohort
 * should be on the same "day" regardless of their local timezone.
 * 
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @param {string} timezone - IANA timezone string (cohort timezone)
 * @returns {number} - Number of days (positive if toDate > fromDate)
 */
export const getDaysBetweenInTimezone = (fromDate, toDate, timezone = DEFAULT_TIMEZONE) => {
  // Get the date keys for both dates in the target timezone
  const fromKey = getDateKeyInTimezone(fromDate, timezone);
  const toKey = getDateKeyInTimezone(toDate, timezone);
  
  // Parse the keys back to dates (at midnight UTC for consistent calculation)
  const fromMidnight = new Date(fromKey + 'T00:00:00Z');
  const toMidnight = new Date(toKey + 'T00:00:00Z');
  
  // Calculate difference in days
  const diffMs = toMidnight.getTime() - fromMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if a given time has passed today in a specific timezone
 * Used for notification scheduling
 * 
 * @param {string} timeStr - Time string in "HH:MM" format
 * @param {string} timezone - IANA timezone string
 * @param {Date} now - Current date/time (defaults to now)
 * @returns {boolean} - True if the time has passed
 */
export const hasTimePassedInTimezone = (timeStr, timezone = DEFAULT_TIMEZONE, now = new Date()) => {
  const [targetHours, targetMinutes] = timeStr.split(':').map(Number);
  const { hours, minutes } = getTimeInTimezone(now, timezone);
  
  if (hours > targetHours) return true;
  if (hours === targetHours && minutes >= targetMinutes) return true;
  return false;
};

/**
 * Format a date for display in user's timezone
 * @param {Date} date - Date to format
 * @param {string} timezone - IANA timezone string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDateInTimezone = (date, timezone = DEFAULT_TIMEZONE, options = {}) => {
  const defaultOptions = {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (e) {
    console.warn(`[dateUtils] Error formatting date in timezone "${timezone}"`, e);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
};

/**
 * Format a time for display in user's timezone
 * @param {Date} date - Date/time to format
 * @param {string} timezone - IANA timezone string
 * @param {boolean} hour12 - Use 12-hour format
 * @returns {string} - Formatted time string
 */
export const formatTimeInTimezone = (date, timezone = DEFAULT_TIMEZONE, hour12 = true) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12
    }).format(date);
  } catch (e) {
    console.warn(`[dateUtils] Error formatting time in timezone "${timezone}"`, e);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
};

/**
 * Get the start of day (midnight) for a date in a specific timezone
 * @param {Date} date - Date
 * @param {string} timezone - IANA timezone string
 * @returns {Date} - Date object set to midnight in the timezone
 */
export const getStartOfDayInTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
  const dateKey = getDateKeyInTimezone(date, timezone);
  // Return midnight UTC of that date key - this gives us a consistent reference point
  return new Date(dateKey + 'T00:00:00Z');
};

/**
 * Validate a timezone string
 * @param {string} timezone - IANA timezone string to validate
 * @returns {boolean} - True if valid
 */
export const isValidTimezone = (timezone) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get user's browser timezone
 * @returns {string} - IANA timezone string
 */
export const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return DEFAULT_TIMEZONE;
  }
};

export default {
  DEFAULT_TIMEZONE,
  COMMON_TIMEZONES,
  getNowInTimezone,
  getDateKeyInTimezone,
  getTimeInTimezone,
  getDatePartsInTimezone,
  getDaysBetweenInTimezone,
  hasTimePassedInTimezone,
  formatDateInTimezone,
  formatTimeInTimezone,
  getStartOfDayInTimezone,
  isValidTimezone,
  getBrowserTimezone
};
