/**
 * Streak Calculator Utility
 * 
 * Calculates Daily Rep completion streaks, excluding weekends and US holidays.
 * A streak is maintained by completing at least one Daily Rep on each eligible weekday.
 */

// US Federal Holidays (approximate - some vary by year)
// Format: { month: 1-12, day: 1-31 } for fixed dates
// For floating holidays, we calculate dynamically
const FIXED_HOLIDAYS = [
  { month: 1, day: 1 },   // New Year's Day
  { month: 7, day: 4 },   // Independence Day
  { month: 12, day: 25 }, // Christmas Day
];

/**
 * Get US Federal Holidays for a given year (including floating holidays)
 */
const getUSHolidays = (year) => {
  const holidays = new Set();
  
  // Fixed holidays
  FIXED_HOLIDAYS.forEach(({ month, day }) => {
    holidays.add(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  });
  
  // MLK Day - 3rd Monday of January
  holidays.add(getNthWeekdayOfMonth(year, 1, 1, 3));
  
  // Presidents Day - 3rd Monday of February
  holidays.add(getNthWeekdayOfMonth(year, 2, 1, 3));
  
  // Memorial Day - Last Monday of May
  holidays.add(getLastWeekdayOfMonth(year, 5, 1));
  
  // Labor Day - 1st Monday of September
  holidays.add(getNthWeekdayOfMonth(year, 9, 1, 1));
  
  // Thanksgiving - 4th Thursday of November
  holidays.add(getNthWeekdayOfMonth(year, 11, 4, 4));
  
  // Day after Thanksgiving (commonly observed)
  const thanksgiving = getNthWeekdayOfMonth(year, 11, 4, 4);
  const thanksgivingDate = new Date(thanksgiving + 'T12:00:00');
  thanksgivingDate.setDate(thanksgivingDate.getDate() + 1);
  holidays.add(formatDateStr(thanksgivingDate));
  
  return holidays;
};

/**
 * Get the Nth occurrence of a weekday in a month
 * @param {number} year 
 * @param {number} month - 1-12
 * @param {number} weekday - 0=Sunday, 1=Monday, etc.
 * @param {number} n - 1st, 2nd, 3rd, 4th occurrence
 */
const getNthWeekdayOfMonth = (year, month, weekday, n) => {
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekday = firstOfMonth.getDay();
  let dayOffset = weekday - firstWeekday;
  if (dayOffset < 0) dayOffset += 7;
  const day = 1 + dayOffset + (n - 1) * 7;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * Get the last occurrence of a weekday in a month
 */
const getLastWeekdayOfMonth = (year, month, weekday) => {
  const lastOfMonth = new Date(year, month, 0); // Day 0 of next month = last day of this month
  const lastWeekday = lastOfMonth.getDay();
  let dayOffset = lastWeekday - weekday;
  if (dayOffset < 0) dayOffset += 7;
  const day = lastOfMonth.getDate() - dayOffset;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * Format date to YYYY-MM-DD string
 */
const formatDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date string is a weekend (Saturday or Sunday)
 */
const isWeekend = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  return day === 0 || day === 6;
};

/**
 * Check if a date string is a US holiday
 */
const isHoliday = (dateStr) => {
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getUSHolidays(year);
  return holidays.has(dateStr);
};

/**
 * Check if a date should be excluded from streak calculation (weekend or holiday)
 */
export const isExcludedDate = (dateStr) => {
  return isWeekend(dateStr) || isHoliday(dateStr);
};

/**
 * Get the previous eligible (non-excluded) date
 */
const getPreviousEligibleDate = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() - 1);
  let attempts = 0;
  
  while (attempts < 10) { // Safety limit
    const prevStr = formatDateStr(date);
    if (!isExcludedDate(prevStr)) {
      return prevStr;
    }
    date.setDate(date.getDate() - 1);
    attempts++;
  }
  return formatDateStr(date);
};

/**
 * Calculate streak from reps history
 * 
 * @param {Array} repsHistory - Array of { date: 'YYYY-MM-DD', completedCount: number, ... }
 * @param {string} todayStr - Today's date as 'YYYY-MM-DD'
 * @param {boolean} hasCompletedRepToday - Whether user has completed a rep today
 * @returns {{ currentStreak: number, longestStreak: number, lastActiveDate: string|null }}
 */
export const calculateRepStreak = (repsHistory = [], todayStr, hasCompletedRepToday = false) => {
  // Build a set of dates where at least one rep was completed
  const activeDates = new Set();
  
  repsHistory.forEach(entry => {
    if (entry.date && entry.completedCount > 0) {
      activeDates.add(entry.date);
    }
  });
  
  // If user completed a rep today, add today
  if (hasCompletedRepToday) {
    activeDates.add(todayStr);
  }
  
  if (activeDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  }
  
  // Sort dates descending (most recent first)
  const sortedDates = Array.from(activeDates).sort().reverse();
  
  // Calculate current streak (from today backwards)
  let currentStreak = 0;
  let checkDate = todayStr;
  let continueChecking = true;
  
  // If today is excluded, find the last eligible day
  if (isExcludedDate(todayStr)) {
    checkDate = getPreviousEligibleDate(todayStr);
  }
  
  // Walk backwards counting consecutive eligible days with activity
  while (continueChecking && currentStreak <= 365) {
    if (activeDates.has(checkDate)) {
      currentStreak++;
      checkDate = getPreviousEligibleDate(checkDate);
    } else if (isExcludedDate(checkDate)) {
      // Skip excluded dates (shouldn't happen after getPreviousEligibleDate, but safety)
      checkDate = getPreviousEligibleDate(checkDate);
    } else {
      // Eligible day without activity - streak broken
      continueChecking = false;
    }
  }
  
  // Calculate longest streak (scan all dates)
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Sort dates ascending for longest streak calculation
  const ascendingDates = Array.from(activeDates).sort();
  
  for (let i = 0; i < ascendingDates.length; i++) {
    const currentDate = ascendingDates[i];
    
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = ascendingDates[i - 1];
      
      // Check if this is the next eligible day after prevDate
      let expectedNext = prevDate;
      let foundCurrent = false;
      let attempts = 0;
      
      while (attempts < 100) { // Increased safety limit for holiday periods
        attempts++; // Increment at START to ensure loop terminates
        
        const nextDate = new Date(expectedNext + 'T12:00:00');
        nextDate.setDate(nextDate.getDate() + 1);
        expectedNext = formatDateStr(nextDate);
        
        if (isExcludedDate(expectedNext)) {
          continue; // Skip excluded dates
        }
        
        if (expectedNext === currentDate) {
          foundCurrent = true;
          break;
        }
        
        // We passed the current date without finding it
        if (expectedNext > currentDate) {
          break;
        }
      }
      
      if (foundCurrent) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // Ensure current streak is counted in longest
  longestStreak = Math.max(longestStreak, currentStreak);
  
  return {
    currentStreak,
    longestStreak,
    lastActiveDate: sortedDates[0] || null
  };
};

/**
 * Get streak milestone message based on current streak
 */
export const getStreakMilestone = (streak) => {
  if (streak >= 100) return { level: 'legendary', message: 'Legendary Leader', color: 'amber' };
  if (streak >= 50) return { level: 'master', message: 'Master Practitioner', color: 'purple' };
  if (streak >= 30) return { level: 'champion', message: 'Leadership Champion', color: 'blue' };
  if (streak >= 21) return { level: 'committed', message: 'Habit Formed', color: 'teal' };
  if (streak >= 14) return { level: 'dedicated', message: 'Building Momentum', color: 'green' };
  if (streak >= 7) return { level: 'consistent', message: 'One Week Strong', color: 'emerald' };
  if (streak >= 3) return { level: 'starting', message: 'Getting Started', color: 'slate' };
  return null;
};

export default {
  calculateRepStreak,
  isExcludedDate,
  getStreakMilestone
};
