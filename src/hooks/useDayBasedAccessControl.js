import { useMemo } from 'react';
import { useDailyPlan } from './useDailyPlan';
import { useAppServices } from '../services/useAppServices';
import useLeaderProfile from './useLeaderProfile';

/**
 * Day-Based Access Control Hook
 * Replaces the week-based useAccessControl for the Day-by-Day architecture.
 * 
 * Features:
 * - Prep Gate: Blocks Day 1+ until prep requirements are met
 * - Content/Community/Coaching unlocking based on current day
 * - Zone-specific visibility flags per day
 * 
 * UPDATED: Now uses prepRequirementsComplete for dynamic completion check.
 * Prep items are loaded from Firestore daily_plan_v1 collection where required=true.
 * The count and items can change via Admin without code changes.
 */
export const useDayBasedAccessControl = () => {
  const { developmentPlanData, user } = useAppServices();
  const { 
    dailyPlan, 
    currentDayNumber, 
    currentDayData, 
    loading,
    unlockedContentIds,
    prepRequirementsComplete,
    currentPhase
  } = useDailyPlan();
  const { isComplete: leaderProfileIsComplete } = useLeaderProfile();

  // --- PREP GATE CHECK ---
  // User must complete required prep items before accessing Day 1+
  // Items are dynamically configured in the Daily Plan
  const prepStatus = useMemo(() => {
    // Use the new prepRequirementsComplete for comprehensive dynamic item check
    if (prepRequirementsComplete) {
      return {
        hasLeaderProfile: prepRequirementsComplete.leaderProfile,
        hasBaselineAssessment: prepRequirementsComplete.baselineAssessment,
        hasVideo: prepRequirementsComplete.videoWatched,
        hasWorkbook: prepRequirementsComplete.workbookDownloaded,
        hasExercises: prepRequirementsComplete.exercisesComplete,
        isComplete: prepRequirementsComplete.allComplete,
        completedCount: prepRequirementsComplete.completedCount,
        totalCount: prepRequirementsComplete.totalCount || prepRequirementsComplete.items?.length || 0,
        missingItems: prepRequirementsComplete.remaining?.map(r => r.label) || []
      };
    }
    
    // Fallback to legacy 2-item check if prepRequirementsComplete not available
    const hasLeaderProfile = leaderProfileIsComplete;
    const hasBaselineAssessment = !!(
      developmentPlanData?.currentPlan?.focusAreas && 
      developmentPlanData.currentPlan.focusAreas.length > 0
    );
    
    return {
      hasLeaderProfile,
      hasBaselineAssessment,
      isComplete: hasLeaderProfile && hasBaselineAssessment,
      completedCount: (hasLeaderProfile ? 1 : 0) + (hasBaselineAssessment ? 1 : 0),
      totalCount: 2,
      missingItems: [
        !hasLeaderProfile && 'Leader Profile',
        !hasBaselineAssessment && 'Baseline Assessment'
      ].filter(Boolean)
    };
  }, [prepRequirementsComplete, leaderProfileIsComplete, developmentPlanData]);

  // --- EFFECTIVE DAY ---
  // If prep is not complete, user is locked to prep phase (Day -14 to Day -1)
  const effectiveDayNumber = useMemo(() => {
    if (!prepStatus.isComplete && currentDayNumber > 0) {
      // Force user back to prep phase until complete
      return -1; // Last day of prep
    }
    return currentDayNumber;
  }, [prepStatus.isComplete, currentDayNumber]);

  // --- UNLOCKED DAYS ---
  const unlockedDays = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return [];
    
    return dailyPlan.filter(day => {
      // Prep days are always accessible during prep phase
      if (day.dayNumber < 0 && !prepStatus.isComplete) return true;
      // Once prep is complete, all days up to current are unlocked
      if (prepStatus.isComplete) return day.dayNumber <= currentDayNumber;
      // If not complete, only prep days are accessible
      return day.dayNumber < 0;
    });
  }, [dailyPlan, currentDayNumber, prepStatus.isComplete]);

  // --- AGGREGATE UNLOCKED ITEMS BY ZONE ---
  const accessData = useMemo(() => {
    const content = new Set();
    const community = new Set();
    const coaching = new Set();
    const reps = new Set();

    unlockedDays.forEach(day => {
      // Content
      if (day.content && Array.isArray(day.content)) {
        day.content.forEach(item => {
          if (item.id) content.add(item.id);
          if (item.contentId) content.add(item.contentId);
          if (item.title) content.add(item.title.toLowerCase());
        });
      }
      
      // Community
      if (day.community && Array.isArray(day.community)) {
        day.community.forEach(item => {
          if (item.id) community.add(item.id);
          if (item.communityItemId) community.add(item.communityItemId);
        });
      }
      
      // Coaching
      if (day.coaching && Array.isArray(day.coaching)) {
        day.coaching.forEach(item => {
          if (item.id) coaching.add(item.id);
          if (item.coachingItemId) coaching.add(item.coachingItemId);
        });
      }
      
      // Reps
      if (day.reps && Array.isArray(day.reps)) {
        day.reps.forEach(item => {
          if (item.id) reps.add(item.id);
          if (item.repId) reps.add(item.repId);
        });
      }

      // Also add from actions
      if (day.actions && Array.isArray(day.actions)) {
        day.actions.forEach(action => {
          if (action.type === 'daily_rep' && action.id) reps.add(action.id);
        });
      }
    });

    return {
      unlockedContent: Array.from(content),
      unlockedCommunity: Array.from(community),
      unlockedCoaching: Array.from(coaching),
      unlockedReps: Array.from(reps)
    };
  }, [unlockedDays]);

  // --- ZONE VISIBILITY (from current day's dashboard flags) ---
  const zoneVisibility = useMemo(() => {
    const dashboard = currentDayData?.dashboard || {};
    
    return {
      // Dashboard Widgets
      showWeeklyFocus: dashboard.showWeeklyFocus ?? true,
      showLISBuilder: dashboard.showLISBuilder ?? false,
      showGroundingRep: dashboard.showGroundingRep ?? false,
      showWinTheDay: dashboard.showWinTheDay ?? true,
      showDailyReps: dashboard.showDailyReps ?? true,
      showNotifications: dashboard.showNotifications ?? false,
      showPMBookendHeader: dashboard.showPMBookendHeader ?? false,  // PM Bookend Header (separate from Reflection)
      showPMReflection: dashboard.showPMReflection ?? false,
      showScorecard: dashboard.showScorecard ?? false,  // Scorecard (separate widget)
      
      // Zone Access (derived from CSV structure)
      // Community is available after Day 15 (Week 1)
      isCommunityZoneOpen: effectiveDayNumber >= 15,
      // Coaching 1:1 scheduling window is Days 23-35
      isCoachingZoneOpen: effectiveDayNumber >= 22,
      isCoaching1on1Window: effectiveDayNumber >= 23 && effectiveDayNumber <= 35,
      
      // Content Zone is always open but items are gated
      isContentZoneOpen: true,
      
      // Locker is always available
      isLockerZoneOpen: true
    };
  }, [currentDayData, effectiveDayNumber]);

  // --- HELPER FUNCTIONS ---
  const isContentUnlocked = (contentId) => {
    if (!contentId) return false;
    const normalizedId = String(contentId).toLowerCase();
    return accessData.unlockedContent.some(id => 
      String(id).toLowerCase() === normalizedId
    ) || unlockedContentIds.some(id => 
      String(id).toLowerCase() === normalizedId
    );
  };

  const isCommunityUnlocked = (communityId) => {
    if (!zoneVisibility.isCommunityZoneOpen) return false;
    if (!communityId) return true; // Zone is open, item check is optional
    return accessData.unlockedCommunity.some(id => id === communityId);
  };

  const isCoachingUnlocked = (coachingId) => {
    if (!zoneVisibility.isCoachingZoneOpen) return false;
    if (!coachingId) return true; // Zone is open, item check is optional
    return accessData.unlockedCoaching.some(id => id === coachingId);
  };

  const isRepUnlocked = (repId) => {
    if (!repId) return false;
    return accessData.unlockedReps.some(id => id === repId);
  };

  // Check if a specific day is accessible
  const isDayUnlocked = (dayNumber) => {
    if (dayNumber < 0) return true; // Prep days always accessible
    if (!prepStatus.isComplete) return false; // Blocked at prep gate
    return dayNumber <= currentDayNumber;
  };

  return {
    loading,
    
    // Prep Gate
    prepStatus,
    isPrepComplete: prepStatus.isComplete,
    
    // Day Info
    currentDayNumber,
    effectiveDayNumber,
    currentDayData,
    
    // Unlocked Data
    unlockedDays,
    ...accessData,
    unlockedContentIds,
    
    // Zone Visibility
    zoneVisibility,
    
    // Helper Functions
    isContentUnlocked,
    isCommunityUnlocked,
    isCoachingUnlocked,
    isRepUnlocked,
    isDayUnlocked,
    
    // User Info
    userId: user?.uid,
    userDisplayName: user?.displayName || user?.name
  };
};
