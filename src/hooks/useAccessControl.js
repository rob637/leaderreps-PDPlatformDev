import { useMemo } from 'react';
import { useDevPlan } from './useDevPlan';

/**
 * Hook to manage cumulative access control (The "Unlock Engine").
 * Calculates all content, community, coaching, and reps available to the user
 * based on their current week progress.
 */
export const useAccessControl = () => {
  const { masterPlan, userState, loading, user } = useDevPlan();
  const currentWeekIndex = userState.currentWeekIndex;

  const accessData = useMemo(() => {
    if (loading || !masterPlan || masterPlan.length === 0) {
      return {
        unlockedContent: [],
        unlockedCommunity: [],
        unlockedCoaching: [],
        unlockedReps: [],
        unlockedWeeks: []
      };
    }

    // Get all weeks up to and including the current week
    // Note: currentWeekIndex is 0-based.
    // If currentWeekIndex is 2, user has access to weeks 0, 1, 2.
    const unlockedWeeks = masterPlan.filter((_, index) => index <= currentWeekIndex);

    const unlockedContent = [];
    const unlockedCommunity = [];
    const unlockedCoaching = [];
    const unlockedReps = [];

    unlockedWeeks.forEach(week => {
      if (week.content) {
        week.content.forEach(item => {
          unlockedContent.push({ ...item, weekNumber: week.weekNumber, weekId: week.id });
        });
      }
      if (week.community) {
        week.community.forEach(item => {
          unlockedCommunity.push({ ...item, weekNumber: week.weekNumber, weekId: week.id });
        });
      }
      if (week.coaching) {
        week.coaching.forEach(item => {
          unlockedCoaching.push({ ...item, weekNumber: week.weekNumber, weekId: week.id });
        });
      }
      if (week.reps) {
        week.reps.forEach(item => {
          unlockedReps.push({ ...item, weekNumber: week.weekNumber, weekId: week.id });
        });
      }
    });

    return {
      unlockedWeeks,
      unlockedContent,
      unlockedCommunity,
      unlockedCoaching,
      unlockedReps
    };
  }, [masterPlan, currentWeekIndex, loading]);

  // Helper functions to check specific access
  const isContentUnlocked = (contentId) => {
    return accessData.unlockedContent.some(item => item.contentItemId === contentId);
  };

  const isCommunityUnlocked = (communityId) => {
    return accessData.unlockedCommunity.some(item => item.communityItemId === communityId);
  };

  const isCoachingUnlocked = (coachingId) => {
    return accessData.unlockedCoaching.some(item => item.coachingItemId === coachingId);
  };

  const isRepUnlocked = (repId) => {
    return accessData.unlockedReps.some(item => item.repId === repId);
  };

  return {
    loading,
    currentWeekNumber: currentWeekIndex + 1,
    userId: user?.uid,
    userDisplayName: user?.displayName,
    ...accessData,
    isContentUnlocked,
    isCommunityUnlocked,
    isCoachingUnlocked,
    isRepUnlocked
  };
};
