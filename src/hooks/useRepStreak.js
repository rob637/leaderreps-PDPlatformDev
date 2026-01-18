import { useMemo } from 'react';
import { calculateRepStreak, getStreakMilestone, isExcludedDate } from '../utils/streakCalculator';
import { timeService } from '../services/timeService';

/**
 * useRepStreak - Hook for calculating Daily Rep completion streaks
 * 
 * Uses repsHistory from dailyPracticeData to calculate:
 * - Current streak (consecutive eligible weekdays with rep completion)
 * - Longest streak ever achieved
 * - Milestone recognition
 * 
 * Excludes weekends and US holidays from streak requirements.
 * 
 * @param {Object} dailyPracticeData - The user's daily practice data
 * @param {Array} additionalCommitments - Today's active commitments (to check real-time completion)
 * @returns {Object} Streak data
 */
export const useRepStreak = (dailyPracticeData, additionalCommitments = []) => {
  const streakData = useMemo(() => {
    const repsHistory = dailyPracticeData?.repsHistory || [];
    const todayStr = timeService.getTodayStr();
    
    // Check if user has completed at least one rep TODAY
    const hasCompletedRepToday = additionalCommitments.some(c => c.status === 'Committed');
    
    // Calculate streak
    const { currentStreak, longestStreak, lastActiveDate } = calculateRepStreak(
      repsHistory,
      todayStr,
      hasCompletedRepToday
    );
    
    // Get milestone info
    const milestone = getStreakMilestone(currentStreak);
    const longestMilestone = getStreakMilestone(longestStreak);
    
    // Is today an excluded day (weekend/holiday)?
    const isTodayExcluded = isExcludedDate(todayStr);
    
    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
      milestone,
      longestMilestone,
      hasCompletedRepToday,
      isTodayExcluded,
      // For display purposes
      streakDisplay: currentStreak,
      isNewPersonalBest: currentStreak > 0 && currentStreak === longestStreak && hasCompletedRepToday
    };
  }, [dailyPracticeData?.repsHistory, additionalCommitments]);
  
  return streakData;
};

export default useRepStreak;
