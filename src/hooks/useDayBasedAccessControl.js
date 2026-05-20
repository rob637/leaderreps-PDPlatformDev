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
    // currentPhase - available if needed
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
        !hasBaselineAssessment && 'Leadership Skills Baseline'
      ].filter(Boolean)
    };
  }, [prepRequirementsComplete, leaderProfileIsComplete, developmentPlanData]);

  // --- EFFECTIVE DAY ---
  // Use the actual current day number. Incomplete prep items carry forward
  // to Foundation as Catch Up items — they don't block zone access.
  const effectiveDayNumber = useMemo(() => {
    return currentDayNumber;
  }, [currentDayNumber]);

  // --- UNLOCKED DAYS ---
  // May 2026 three-phase refactor: day-based gating removed. All days in the
  // legacy daily plan are exposed; consumers should rely on phaseKey instead.
  const unlockedDays = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return [];
    return dailyPlan;
  }, [dailyPlan]);

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
    
    // Helper to check visibility - checks both widget ID (new system) and legacy key (old system)
    const checkVisibility = (widgetId, legacyKey, defaultVal = true) => {
      if (dashboard[widgetId] !== undefined) return dashboard[widgetId];
      if (legacyKey && dashboard[legacyKey] !== undefined) return dashboard[legacyKey];
      return defaultVal;
    };
    
    return {
      // Dashboard Widgets - check both widget ID and legacy key for compatibility
      showWeeklyFocus: checkVisibility('weekly-focus', 'showWeeklyFocus', true),
      showLISBuilder: checkVisibility('lis-maker', 'showLISBuilder', false),
      showGroundingRep: checkVisibility('grounding-rep', 'showGroundingRep', false),
      showWinTheDay: checkVisibility('win-the-day', 'showWinTheDay', true),
      showDailyReps: checkVisibility('daily-leader-reps', 'showDailyReps', true),
      showNotifications: checkVisibility('notifications', 'showNotifications', false),
      showPMBookendHeader: checkVisibility('pm-bookend-header', 'showPMBookendHeader', false),
      showPMReflection: checkVisibility('pm-bookend', 'showPMReflection', false),
      showScorecard: checkVisibility('scorecard', 'showScorecard', false),
      
      // Zone Access \u2014 May 2026 three-phase refactor
      // All zones open once Onboarding (prep) is complete. No more day-gating.
      isCommunityZoneOpen: prepStatus.isComplete,
      isCoachingZoneOpen: prepStatus.isComplete,
      isCoaching1on1Window: prepStatus.isComplete,
      isConditioningZoneOpen: prepStatus.isComplete,
      
      // Content Zone is always open but items are gated
      isContentZoneOpen: true,
      
      // Locker is always available
      isLockerZoneOpen: true
    };
  }, [currentDayData, prepStatus.isComplete]);

  // --- HELPER FUNCTIONS ---
  //
  // May 2026 demolition: day/week/milestone gating has been removed. The new
  // three-phase model relies on phaseKey + trainer approvals (foundationCompleted,
  // ascentApproved). For backward compatibility we keep these helpers but make
  // them open-by-default so existing consumers continue to work without listing
  // every content/coaching id explicitly.
  //
  // Onboarding users still hit the prep gate via zoneVisibility flags above.

  const isContentUnlocked = () => true;

  const isCommunityUnlocked = () => {
    return zoneVisibility.isCommunityZoneOpen !== false;
  };

  const isCoachingUnlocked = () => {
    return zoneVisibility.isCoachingZoneOpen !== false;
  };

  const isRepUnlocked = () => true;

  // Check if a specific day is accessible — open in the new model.
  const isDayUnlocked = () => true;
  // The legacy implementation gated days behind currentDayNumber; that
  // behaviour has been removed by Commit 3 of the three-phase refactor.

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
