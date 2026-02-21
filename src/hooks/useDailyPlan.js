import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { collection, query, orderBy, getDocs, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { timeChange$ } from '../services/timeService';
import { useActionProgress } from './useActionProgress';
import { useLeaderProfile } from './useLeaderProfile';
import { getDaysBetweenInTimezone, DEFAULT_TIMEZONE } from '../services/dateUtils';

/**
 * PREP REQUIREMENT ACTION IDS (DEPRECATED - For backwards compatibility only)
 * ===========================
 * These are legacy hardcoded IDs. The system now dynamically reads required
 * prep items from the daily plan data using the `required` and `optional` flags.
 * Keep these for backwards compatibility with existing action progress data.
 */
export const PREP_REQUIREMENT_IDS = {
  LEADER_PROFILE: 'action-prep-leader-profile',
  BASELINE_ASSESSMENT: 'action-prep-baseline-assessment', 
  VIDEO: 'action-prep-001-video',
  WORKBOOK: 'action-prep-001-workbook',
  EXERCISES: 'action-prep-003-exercises'
};

/**
 * Hook to manage the Daily Plan logic.
 * Replaces useDevPlan for the new Day-by-Day architecture.
 * 
 * THREE PHASE SYSTEM:
 * ==================
 * 1. PRE-START (Prep Phase) - PROGRESS-BASED, NOT TIME-BASED
 *    - Users can join anytime, no "behind" status
 *    - Completion based on Required Prep items + optional Explore
 *    - DB: phase='pre-start', dayNumber used for ordering only
 *    - Display: "Required Prep" and "Explore" sections
 * 
 * 2. START (Foundations) - 8 weeks (56 days)
 *    - Cohort-based progression
 *    - Missed days are tracked
 *    - DB: dayNumber 15-70, weekNumber 1-8
 *    - Display: "Day 1-56" or "Week 1-8"
 * 
 * 3. POST-START (After Program) - Ongoing
 *    - Post-program content and maintenance
 *    - DB: dayNumber 71+, weekNumber 9+
 *    - Display: "Post Day 1+"
 */

// Phase Configuration
export const PHASES = {
  PRE_START: {
    id: 'pre-start',
    name: 'Preparation',
    displayName: 'Preparation',
    // NOTE: dbDayStart/dbDayEnd are for backwards compatibility only
    // Prep Phase identification should use phase === 'pre-start'
    dbDayStart: 1,
    dbDayEnd: 14, // Legacy - actual prep can have any number of days
    weekRange: [-2, -1],
    trackMissedDays: false, // Users can start anytime - no time constraint
    cumulativeActions: true, // Actions accumulate - Day 1 actions persist through Day 14
    description: 'Get ready for your leadership journey',
    isProgressBased: true // Progress-based, not time-based
  },
  START: {
    id: 'start',
    name: 'Foundation',
    displayName: 'Foundation',
    dbDayStart: 15,
    dbDayEnd: 70,
    weekRange: [1, 8],
    trackMissedDays: true, // Cohort-based progression
    cumulativeActions: false, // Each day/week has specific content
    description: '8-week leadership development program'
  },
  POST_START: {
    id: 'post-start',
    name: 'Ascent',
    displayName: 'Ascent',
    dbDayStart: 71,
    dbDayEnd: Infinity,
    weekRange: [9, Infinity],
    trackMissedDays: false, // Ongoing maintenance
    cumulativeActions: false,
    description: 'Continue your leadership journey',
    isIndefinite: true // Subscription-based indefinite phase
  }
};

// Leadership quotes for Prep Phase countdown
export const PREP_PHASE_QUOTES = [
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek" },
  { quote: "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others.", author: "Jack Welch" },
  { quote: "The greatest leader is not necessarily one who does the greatest things, but one who gets people to do the greatest things.", author: "Ronald Reagan" },
  { quote: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { quote: "Leadership and learning are indispensable to each other.", author: "John F. Kennedy" },
  { quote: "The task of leadership is not to put greatness into people, but to elicit it, for the greatness is there already.", author: "John Buchan" },
  { quote: "True leadership lies in guiding others to success.", author: "Bill Owens" },
  { quote: "Leadership is the capacity to translate vision into reality.", author: "Warren Bennis" },
  { quote: "The function of leadership is to produce more leaders, not more followers.", author: "Ralph Nader" },
  { quote: "People ask the difference between a leader and a boss. The leader leads, and the boss drives.", author: "Theodore Roosevelt" },
  { quote: "Effective leadership is putting first things first.", author: "Stephen Covey" },
  { quote: "The quality of a leader is reflected in the standards they set for themselves.", author: "Ray Kroc" },
  { quote: "Leaders think and talk about solutions. Followers think and talk about problems.", author: "Brian Tracy" }
];

/**
 * PROGRESSIVE ONBOARDING MODULES
 * ==============================
 * Content introduced progressively based on user's JOURNEY DAY (not calendar day).
 * A user who joins on Prep Day 12 will see Day 1 content first, then Day 2 on their next visit.
 * 
 * Journey Day = days since user's first Prep Phase visit
 * 
 * For late joiners (< 5 days until start), we use ACCELERATED mode:
 * - Combine multiple days of content into fewer sessions
 */
export const ONBOARDING_MODULES = {
  1: {
    id: 'welcome',
    title: 'Your First Steps',
    headline: null, // Day 1 uses personalized welcome headline from banner
    description: 'Today we set the foundation. Complete your Leader Profile and Baseline Assessment to help us personalize your experience.',
    widgets: ['leaderProfile', 'baselineAssessment', 'todaysActions'],
    features: ['leader_profile', 'baseline_assessment'],
    callToAction: 'Come back tomorrow to discover your daily leadership rhythm!',
    tip: 'Take your time with the assessments - honest answers lead to better growth.'
  },
  2: {
    id: 'bookends',
    title: 'Your Daily Leadership Ritual',
    headline: 'Welcome Back! Let\'s Build Your Daily Rhythm',
    description: 'Great leaders start and end each day with intention. The AM Bookend sets your morning focus, the PM Bookend captures evening reflections. These 5-minute rituals will transform your leadership.',
    widgets: ['amBookend', 'pmBookend'],
    features: ['am_bookend', 'pm_bookend'],
    callToAction: 'Try both bookends today! Tomorrow we introduce powerful reading habits.',
    tip: 'Tip: Your AM Bookend reminder is set for 11:30 AM and PM Bookend for 7:00 PM. Adjust these in your Locker!'
  },
  3: {
    id: 'reading',
    title: 'Leadership Through Reading',
    headline: 'Day 3: Fuel Your Mind with Great Ideas',
    description: 'The best leaders are avid readers. We\'ve curated book summaries and excerpts designed for busy leaders like you.',
    widgets: ['readingContent'],
    features: ['reading_library'],
    callToAction: 'Explore your first reading today. Tomorrow brings video content!',
    tip: 'Even 10 minutes of focused reading daily compounds into powerful knowledge.'
  },
  4: {
    id: 'video',
    title: 'Video Learning Library',
    headline: 'Day 4: Watch, Learn, Lead',
    description: 'Short, impactful videos from leadership experts. Perfect for your commute or lunch break.',
    widgets: ['videoContent'],
    features: ['video_library'],
    callToAction: 'Watch your first leadership video today. Tomorrow we do a full recap!',
    tip: 'Bookmark videos you want to revisit - they\'re always available in your library.'
  },
  5: {
    id: 'recap',
    title: 'You\'re Ready!',
    headline: 'Day 5: Your Toolkit is Complete',
    description: 'You\'ve explored all the core features. Keep practicing daily until your cohort starts!',
    widgets: ['appOverview'],
    features: ['full_access'],
    callToAction: 'Keep practicing daily! The real journey begins when your cohort starts.',
    appOverview: {
      dashboard: 'Your home base - see today\'s priorities and progress',
      devPlan: 'Track your 8-week development journey (coming soon!)',
      library: 'Access all videos, readings, and tools anytime',
      coaching: 'Live sessions and coaching resources',
      community: 'Connect with fellow leaders'
    },
    tip: 'Consistency beats intensity. Small daily actions create lasting change.'
  }
};

// Accelerated onboarding for late joiners
export const ACCELERATED_MODULES = {
  // 3-4 days until start: 2 sessions
  accelerated_2: [
    { ...ONBOARDING_MODULES[1], ...ONBOARDING_MODULES[2], id: 'welcome-bookends', title: 'Welcome & Daily Rhythm' },
    { ...ONBOARDING_MODULES[3], ...ONBOARDING_MODULES[4], ...ONBOARDING_MODULES[5], id: 'content-recap', title: 'Your Content & Tools' }
  ],
  // 1-2 days until start: 1 session (everything)
  accelerated_1: [
    { 
      id: 'foundation', 
      title: 'Foundation Guide',
      headline: 'Welcome, Leader! Let\'s Get You Ready Fast',
      description: 'Your training starts very soon! Here\'s everything you need to know to hit the ground running.',
      widgets: ['leaderProfile', 'baselineAssessment', 'amBookend', 'pmBookend', 'appOverview'],
      features: ['leader_profile', 'baseline_assessment', 'am_bookend', 'pm_bookend', 'full_access'],
      callToAction: 'Complete your profile and assessment before Day 1!',
      tip: 'Focus on the Leader Profile and Baseline Assessment first - they\'re essential for personalization.',
      isFoundation: true
    }
  ]
};

// Get onboarding module based on journey day and days until start
export const getOnboardingModule = (journeyDay, daysUntilStart) => {
  // Quick start for very late joiners (0-2 days until start)
  if (daysUntilStart <= 2) {
    return ACCELERATED_MODULES.accelerated_1[0];
  }
  
  // Accelerated for late joiners (3-4 days until start)
  if (daysUntilStart <= 4) {
    const sessionIndex = Math.min(journeyDay - 1, 1);
    return ACCELERATED_MODULES.accelerated_2[sessionIndex] || ACCELERATED_MODULES.accelerated_2[1];
  }
  
  // Normal progression - cap at day 5
  const effectiveDay = Math.min(journeyDay, 5);
  return ONBOARDING_MODULES[effectiveDay] || ONBOARDING_MODULES[5];
};

// Get welcome message based on days until start
export const getPrepPhaseWelcome = (daysUntilStart) => {
  if (daysUntilStart <= 0) {
    return {
      headline: "Your Journey Begins Today!",
      subtext: "Welcome to Day 1 of your leadership transformation.",
      excitement: 'launch'
    };
  }
  if (daysUntilStart === 1) {
    return {
      headline: "Tomorrow is the Big Day!",
      subtext: "Your leadership journey starts in just 24 hours. Get ready!",
      excitement: 'high'
    };
  }
  if (daysUntilStart <= 3) {
    return {
      headline: `${daysUntilStart} Days Until Launch!`,
      subtext: "The countdown is on. Final preparations are underway.",
      excitement: 'high'
    };
  }
  if (daysUntilStart <= 7) {
    return {
      headline: `${daysUntilStart} Days Until Your Journey Begins`,
      subtext: "One week away from transforming your leadership. Keep preparing!",
      excitement: 'medium'
    };
  }
  if (daysUntilStart <= 10) {
    return {
      headline: `${daysUntilStart} Days to Go, Leader`,
      subtext: "You're building a strong foundation. Stay focused.",
      excitement: 'medium'
    };
  }
  return {
    headline: "Your Journey Begins Now, Leader",
    subtext: `${daysUntilStart} days until your cohort starts. Let's get you ready!`,
    excitement: 'start'
  };
};

// Get a quote for the day (deterministic based on day number)
export const getDailyQuote = (dayNumber) => {
  const index = (dayNumber - 1) % PREP_PHASE_QUOTES.length;
  return PREP_PHASE_QUOTES[index];
};

// Helper: Get phase from DB dayNumber
export const getPhaseFromDbDay = (dbDayNumber) => {
  if (dbDayNumber <= PHASES.PRE_START.dbDayEnd) return PHASES.PRE_START;
  if (dbDayNumber <= PHASES.START.dbDayEnd) return PHASES.START;
  return PHASES.POST_START;
};

// Helper: Get phase-specific day number for display
export const getPhaseDayNumber = (dbDayNumber) => {
  const phase = getPhaseFromDbDay(dbDayNumber);
  return dbDayNumber - phase.dbDayStart + 1;
};

// Helper: Get DB dayNumber from days relative to cohort start
// daysFromStart: negative = before start, positive = after start
export const getDbDayNumber = (daysFromStart) => {
  if (daysFromStart < 0) {
    // Pre-Start: -14 to -1 maps to DB 1-14
    // -14 days → DB day 1, -1 day → DB day 14
    return Math.max(1, 15 + daysFromStart); // -14 + 15 = 1, -1 + 15 = 14
  }
  // Start/Post: 0+ days from start maps to DB 15+
  // 0 days (start day) → DB day 15, 55 days → DB day 70
  return 15 + daysFromStart;
};

// =============================================================================
// MODULE-LEVEL CACHE FOR DAILY PLAN
// =============================================================================
// Multiple components call useDailyPlan(), each creating its own hook instance.
// Without caching, each instance fetches the daily plan independently and has
// its own loadingPlan state. This causes race conditions where Dashboard shows
// spinner even after data has loaded.
//
// Solution: Cache the fetched daily plan at module level so all instances share
// the same data immediately.
// =============================================================================
let _dailyPlanCache = null;
let _dailyPlanFetchPromise = null;
let _dailyPlanListeners = new Set();

const notifyDailyPlanListeners = (days) => {
  _dailyPlanListeners.forEach(listener => listener(days));
};

export const useDailyPlan = () => {
  const { db, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const { getItemProgress } = useActionProgress();
  const { isComplete: leaderProfileComplete } = useLeaderProfile();
  
  // Initialize from cache if available
  const [dailyPlan, setDailyPlan] = useState(() => _dailyPlanCache || []);
  // Track if we're actively fetching (not just waiting for data) - available if needed
  const [_isFetching, setIsFetching] = useState(false);
  const [cohortData, setCohortData] = useState(null);
  const [timeOffset, setTimeOffset] = useState(() => {
    return parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
  });
  
  // Derive loading from actual data state, not a separate flag
  // This ensures all instances see consistent loading state
  const loadingPlan = dailyPlan.length === 0 && !_dailyPlanCache;

  // 0. Initialize Time Travel Offset and listen for changes
  useEffect(() => {
    // Subscribe to time service changes (handles in-app updates)
    const subscription = timeChange$.subscribe(newOffset => {
      setTimeOffset(newOffset);
    });
    
    // Also listen for storage changes (handles cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'time_travel_offset' || e.key === null) {
        const newOffset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
        setTimeOffset(newOffset);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const simulatedNow = useMemo(() => new Date(Date.now() + timeOffset), [timeOffset]);

  // Subscribe to daily plan updates from other instances
  // AND sync from cache if it was populated before this component mounted
  useEffect(() => {
    // Check cache immediately on mount - another component may have already loaded it
    if (_dailyPlanCache !== null && dailyPlan.length === 0) {
      setDailyPlan(_dailyPlanCache);
    }
    
    const listener = (days) => {
      setDailyPlan(days);
    };
    _dailyPlanListeners.add(listener);
    
    return () => {
      _dailyPlanListeners.delete(listener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // 1. Fetch Daily Plan (All Days) - WITH MODULE-LEVEL CACHE
  useEffect(() => {
    const fetchDailyPlan = async () => {
      // If cache exists, use it immediately
      if (_dailyPlanCache !== null) {
        setDailyPlan(_dailyPlanCache);
        return;
      }
      
      if (!db || !user) {
        // Can't fetch without db/user, but loadingPlan will stay true
        // waiting for cache from another instance
        return;
      }
      
      // If another instance is already fetching, wait for it
      if (_dailyPlanFetchPromise) {
        try {
          const days = await _dailyPlanFetchPromise;
          setDailyPlan(days);
        } catch (e) {
          console.error('[useDailyPlan] Error waiting for fetch:', e);
        }
        return;
      }
      
      setIsFetching(true);
      
      // This instance will fetch - create the promise
      _dailyPlanFetchPromise = (async () => {
        const planRef = collection(db, 'daily_plan_v1');
        const q = query(planRef, orderBy('dayNumber', 'asc'));
        const snapshot = await getDocs(q);
        
        const days = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`[useDailyPlan] Loaded ${days.length} days from daily_plan_v1`);
        
        // Cache the result
        _dailyPlanCache = days;
        
        // Notify all other listening instances
        notifyDailyPlanListeners(days);
        
        return days;
      })();
      
      try {
        const days = await _dailyPlanFetchPromise;
        setDailyPlan(days);
      } catch (error) {
        console.error("Error fetching daily plan:", error);
      } finally {
        setIsFetching(false);
        _dailyPlanFetchPromise = null;
      }
    };

    fetchDailyPlan();
  }, [db, user]);

  // 1b. Fetch Cohort Data (if user has cohortId)
  useEffect(() => {
    const fetchCohort = async () => {
      if (!db || !user) return;
      
      // Get cohortId from user data or development plan
      const cohortId = user?.cohortId || developmentPlanData?.cohortId;
      
      if (!cohortId) {
        // Only log if we expected a cohort (e.g. in Start Phase)
        // Otherwise this log is too noisy for new users
        if (developmentPlanData?.startDate) {
           console.log('[useDailyPlan] No cohortId found for user (has startDate)');
        }
        return;
      }
      
      // Avoid re-fetching if we already have the correct cohort data
      if (cohortData?.id === cohortId) return;

      try {
        const cohortRef = doc(db, 'cohorts', cohortId);
        const cohortSnap = await getDoc(cohortRef);
        
        if (cohortSnap.exists()) {
          const data = cohortSnap.data();
          setCohortData({
            id: cohortSnap.id,
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            timezone: data.timezone, // Load cohort timezone
            facilitator: data.facilitator,
            settings: data.settings
          });
          console.log('[useDailyPlan] Loaded cohort:', data.name, 'timezone:', data.timezone);
          
          // Set the global timezone for timeService so all date calculations use cohort timezone
          if (data.timezone) {
            const { timeService } = await import('../services/timeService');
            timeService.setTimezone(data.timezone);
          }
        } else {
          console.warn('[useDailyPlan] Cohort not found:', cohortId);
        }
      } catch (error) {
        console.error('[useDailyPlan] Error fetching cohort:', error);
      }
    };
    
    fetchCohort();
  }, [db, user, developmentPlanData?.cohortId, cohortData?.id, developmentPlanData?.startDate]);

  // 2. Derive User State & Current Day
  const userState = useMemo(() => {
    const defaultState = {
      dailyProgress: {},
      startDate: null,
      cohortId: null,
      prepPhaseFirstVisit: null, // Track first Prep Phase login for progressive onboarding
      onboardingCompleted: {}    // Track which onboarding modules have been seen
    };

    const baseData = developmentPlanData || {};

    // Extract dailyProgress
    const dailyProgress = { ...(baseData.dailyProgress || {}) };
    
    // Handle dot-notation if any (legacy support pattern)
    Object.keys(baseData).forEach(key => {
      if (key.startsWith('dailyProgress.')) {
        const dayKey = key.replace('dailyProgress.', '');
        dailyProgress[dayKey] = baseData[key];
      }
    });

    return {
      ...defaultState,
      ...baseData,
      // Prioritize user doc fields for cohort sync (CohortManager updates user doc)
      startDate: user?.startDate || baseData.startDate,
      cohortId: user?.cohortId || baseData.cohortId,
      dailyProgress,
      prepPhaseFirstVisit: baseData.prepPhaseFirstVisit || null,
      onboardingCompleted: baseData.onboardingCompleted || {}
    };
  }, [developmentPlanData, user]);

  // ============================================================================
  // PREP REQUIREMENTS COMPLETION CHECK
  // ============================================================================
  // Dynamically reads required prep items from the daily plan data.
  // Items are considered "required" if: required === true OR (required !== false AND optional !== true)
  // This is COMPLETION-BASED, not day-based.
  const prepRequirementsComplete = useMemo(() => {
    // Helper to check if an action is completed
    const isActionComplete = (actionId) => {
      // Check via useActionProgress
      const progress = getItemProgress(actionId);
      if (progress?.status === 'completed') return true;
      
      // Fallback: Check all dailyProgress entries for legacy data
      const dailyProgress = developmentPlanData?.dailyProgress || {};
      return Object.values(dailyProgress).some(dayProgress => 
        dayProgress?.itemsCompleted?.includes(actionId)
      );
    };
    
    // Get all prep phase days from daily plan (phase-based, not time-based)
    const prepDays = dailyPlan.filter(d => d.phase === 'pre-start');
    
    // Collect all prep actions from the daily plan
    const allPrepActions = [];
    prepDays.forEach(day => {
      if (day.actions) {
        day.actions.forEach((action, idx) => {
          allPrepActions.push({
            ...action,
            dayId: day.id,
            dayNumber: day.dayNumber,
            id: action.id || `daily-${day.id}-${idx}`
          });
        });
      }
    });
    
    // Filter to get only REQUIRED prep actions
    // Required = required === true OR (required !== false AND optional !== true)
    // Exclude daily_rep type as those are not milestone items
    // Exclude actions from explore-config (those are always optional)
    const requiredPrepActions = allPrepActions.filter(action => {
      if (action.type === 'daily_rep') return false;
      // Actions from explore-config are always optional, not required
      if (action.dayId === 'explore-config') return false;
      const isRequired = action.required === true || (action.required !== false && action.optional !== true);
      return isRequired;
    });
    
    // Build items array with completion status
    const items = requiredPrepActions.map(action => {
      const handlerType = action.handlerType || '';
      const labelLower = (action.label || '').toLowerCase();
      
      let complete = false;
      
      // Special handling for interactive items
      if (handlerType === 'leader-profile' || labelLower.includes('leader profile')) {
        complete = leaderProfileComplete || false;
      } else if (handlerType === 'baseline-assessment' || labelLower.includes('baseline assessment')) {
        // Check assessmentHistory or focusAreas
        complete = !!(
          developmentPlanData?.assessmentHistory?.length > 0 ||
          developmentPlanData?.currentPlan?.focusAreas?.length > 0
        );
      } else if (handlerType === 'notification-setup' || labelLower.includes('notification')) {
        // Check notificationSettings has been configured
        const ns = developmentPlanData?.notificationSettings || user?.notificationSettings;
        complete = !!(ns && ns.strategy);
      } else if (handlerType === 'foundation-commitment' || labelLower.includes('foundation commitment') || labelLower.includes('foundation expectations')) {
        // Check foundationCommitment in user doc
        complete = !!(user?.foundationCommitment?.acknowledged);
      } else if (handlerType === 'conditioning-tutorial' || labelLower.includes('conditioning tutorial')) {
        // Check conditioningTutorial in user doc
        complete = !!(user?.conditioningTutorial?.completed);
      } else {
        // Standard action progress check
        complete = isActionComplete(action.id);
      }
      
      return {
        id: action.id,
        label: action.label || 'Required Item',
        complete,
        handlerType: action.handlerType,
        type: action.type
      };
    });
    
    const completedCount = items.filter(i => i.complete).length;
    const totalCount = items.length;
    const allComplete = totalCount > 0 && completedCount === totalCount;
    const remaining = items.filter(i => !i.complete);

    // Also provide legacy individual flags for backwards compatibility
    const leaderProfile = items.find(i => 
      i.handlerType === 'leader-profile' || (i.label || '').toLowerCase().includes('leader profile')
    )?.complete || false;
    
    const baselineAssessment = items.find(i => 
      i.handlerType === 'baseline-assessment' || (i.label || '').toLowerCase().includes('baseline assessment')
    )?.complete || false;

    return {
      // Legacy individual flags (for backwards compatibility)
      leaderProfile,
      baselineAssessment,
      // Dynamic items from daily plan
      items,
      completedCount,
      totalCount,
      allComplete,
      remaining,
      // Progress percentage
      progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    };
  }, [getItemProgress, developmentPlanData, leaderProfileComplete, dailyPlan, user]);

  // Auto-initialize startDate if missing (only for users WITHOUT a cohort)
  useEffect(() => {
    const autoInit = async () => {
      // Skip if user has a cohortId - cohort provides the start date
      // Check user.cohortId FIRST - this is set immediately when user is assigned to cohort
      // Don't wait for cohortData to load
      if (user?.cohortId) {
        console.log('[useDailyPlan] User has cohortId, skipping auto-init (cohort provides start date)');
        return;
      }
      
      // Also skip if cohort data already loaded
      if (cohortData?.startDate) {
        console.log('[useDailyPlan] User has cohort startDate loaded, skipping auto-init');
        return;
      }
      
      // Skip if user doc has startDate from cohort assignment
      if (user?.startDate) {
        console.log('[useDailyPlan] User has startDate from cohort assignment, skipping auto-init');
        return;
      }

      if (user && updateDevelopmentPlanData && developmentPlanData !== undefined && !developmentPlanData?.startDate) {
        if (window._dailyPlanInitAttempted) return;
        window._dailyPlanInitAttempted = true;

        console.log('[useDailyPlan] Auto-initializing startDate for user (no cohort)');
        try {
          // Default to today if no start date
          await updateDevelopmentPlanData({ startDate: serverTimestamp(), version: 'v2-daily' });
        } catch (error) {
          console.error('[useDailyPlan] Error auto-initializing startDate:', error);
          window._dailyPlanInitAttempted = false;
        }
      }
    };
    autoInit();
  }, [developmentPlanData, updateDevelopmentPlanData, user, cohortData]);

  // Auto-initialize prepPhaseFirstVisit when user first enters Prep Phase
  // AND track daily visits for sequential onboarding
  useEffect(() => {
    const trackPrepVisit = async () => {
      if (!user || !updateDevelopmentPlanData || developmentPlanData === undefined) return;
      
      // IMPORTANT: Use cohort startDate if available, otherwise fall back to dev plan startDate
      // The cohort startDate determines when the actual program begins (e.g., Dec 31)
      // The dev plan startDate might be when the user first logged in (e.g., Dec 17)
      const rawDate = cohortData?.startDate || developmentPlanData?.startDate || user?.startDate;
      if (!rawDate) {
        console.log('[useDailyPlan] trackPrepVisit: No startDate found');
        return;
      }
      
      let start = null;
      if (rawDate.toDate && typeof rawDate.toDate === 'function') {
        start = rawDate.toDate();
      } else if (rawDate.seconds) {
        start = new Date(rawDate.seconds * 1000);
      } else {
        start = new Date(rawDate);
      }
      
      if (!start || isNaN(start.getTime())) return;
      
      const now = new Date(Date.now() + timeOffset);
      const diffMs = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      console.log('[useDailyPlan] trackPrepVisit:', {
        startDateSource: cohortData?.startDate ? 'cohort' : 'devPlan',
        startDate: start.toISOString(),
        now: now.toISOString(),
        diffDays,
        isInPrepPhase: diffDays < 0
      });
      
      // If we're in Prep Phase (before start day)
      if (diffDays < 0) {
        // 1. Record first visit if needed (Legacy support)
        if (!developmentPlanData?.prepPhaseFirstVisit) {
          if (!window._prepPhaseInitAttempted) {
            window._prepPhaseInitAttempted = true;
            console.log('[useDailyPlan] Recording first Prep Phase visit');
            try {
              await updateDevelopmentPlanData({ prepPhaseFirstVisit: serverTimestamp() });
            } catch (error) {
              console.error('[useDailyPlan] Error recording prepPhaseFirstVisit:', error);
              window._prepPhaseInitAttempted = false;
            }
          }
        }

        // 2. Track Daily Visit for Sequential Onboarding
        const todayStr = now.toISOString().split('T')[0];
        const visitLog = developmentPlanData?.prepVisitLog || [];
        
        console.log('[useDailyPlan] Prep visit check:', {
          todayStr,
          visitLog,
          alreadyLogged: visitLog.includes(todayStr),
          guardedDate: window._prepVisitTracked
        });
        
        // If today is NOT logged yet, add it
        if (!visitLog.includes(todayStr)) {
          // Prevent double-firing in strict mode / rapid re-renders
          if (window._prepVisitTracked === todayStr) return;
          window._prepVisitTracked = todayStr;

          console.log('[useDailyPlan] Tracking new Prep Phase visit:', todayStr);
          try {
            // Use full array replacement to support optimistic UI updates
            // (arrayUnion would be ignored by local state manager, causing stale UI)
            const newLog = [...visitLog, todayStr];
            await updateDevelopmentPlanData({ prepVisitLog: newLog });
          } catch (error) {
            console.error('[useDailyPlan] Error tracking prep visit:', error);
            window._prepVisitTracked = null;
          }
        }
      }
    };
    trackPrepVisit();
  }, [developmentPlanData, updateDevelopmentPlanData, user, timeOffset, cohortData]);

  // Calculate user's Journey Day (count of distinct days visited in Prep Phase)
  // This ensures users see Day 1, then Day 2, then Day 3 content sequentially
  // regardless of how many calendar days pass between logins.
  const journeyDay = useMemo(() => {
    // Get the visit log from user state
    const visitLog = userState.prepVisitLog || [];
    
    // journeyDay = total count of logged visits
    // Each login adds one entry to the log, regardless of how many days pass between logins
    let count = visitLog.length;
    
    // Check if today (using simulated time if time traveling) is already logged
    // If not, add 1 to reflect the current session
    const todayStr = simulatedNow.toISOString().split('T')[0];
    if (!visitLog.includes(todayStr)) {
      count += 1;
    }
    
    // Default to 1 if no visits tracked yet
    const calculatedJourneyDay = Math.max(1, count);
    
    console.log('[useDailyPlan] journeyDay calculation (Login-Based):', {
      visitLogLength: visitLog.length,
      todayStr,
      isTodayLogged: visitLog.includes(todayStr),
      calculatedJourneyDay
    });
    
    return calculatedJourneyDay;
  }, [userState.prepVisitLog, simulatedNow]);

  // 3. Calculate Days From Start (can be negative for Pre-Start)
  const daysFromStart = useMemo(() => {
    // Prioritize Cohort Start Date if available
    const effectiveStartDate = cohortData?.startDate || userState.startDate;
    
    if (!effectiveStartDate) return 0; // Default to start day

    let start = null;
    const rawDate = effectiveStartDate;
    
    if (rawDate.toDate && typeof rawDate.toDate === 'function') {
      start = rawDate.toDate();
    } else if (rawDate.seconds) {
      start = new Date(rawDate.seconds * 1000);
    } else {
      start = new Date(rawDate);
    }
    
    if (!start || isNaN(start.getTime())) return 0;

    // Use cohort timezone for consistent day calculations across global users
    // This ensures a cohort in "America/New_York" calculates days based on ET midnight
    const cohortTimezone = cohortData?.timezone || DEFAULT_TIMEZONE;
    const diffDays = getDaysBetweenInTimezone(start, simulatedNow, cohortTimezone);

    console.log('[useDailyPlan] Days From Start:', {
      source: cohortData?.startDate ? 'cohort' : 'user',
      startDate: start.toISOString(),
      now: simulatedNow.toISOString(),
      timezone: cohortTimezone,
      daysFromStart: diffDays
    });

    return diffDays;
  }, [userState.startDate, cohortData?.startDate, cohortData?.timezone, simulatedNow]);

  // 4. Map to DB Day Number and get Phase Info
  const { dbDayNumber, currentPhase, phaseDayNumber } = useMemo(() => {
    // Default to calendar-based calculation
    let dbDay = getDbDayNumber(daysFromStart);
    
    // OVERRIDE FOR PREP PHASE (12/18/25):
    // Prep Phase is now LOGIN-DRIVEN (Visit Count), not Calendar-Driven.
    // If we are in the calendar window for Prep Phase (daysFromStart < 0),
    // we use the journeyDay (visit count) to determine which content to show.
    if (daysFromStart < 0) {
      // Use journeyDay, but cap at 14 (end of Prep Phase content)
      // This ensures that on the 15th visit (or more), they still see the last Prep Day content
      // until the actual Start Date arrives.
      dbDay = Math.min(journeyDay, 14);
      
      console.log('[useDailyPlan] Using Visit-Based Prep Day:', {
        calendarDaysFromStart: daysFromStart,
        visitCount: journeyDay,
        assignedDbDay: dbDay
      });
    }

    const phase = getPhaseFromDbDay(dbDay);
    const phaseDay = getPhaseDayNumber(dbDay);
    
    console.log('[useDailyPlan] Phase Info:', {
      daysFromStart,
      dbDayNumber: dbDay,
      phase: phase.name,
      phaseDayNumber: phaseDay,
      isVisitBased: daysFromStart < 0
    });
    
    return { dbDayNumber: dbDay, currentPhase: phase, phaseDayNumber: phaseDay };
  }, [daysFromStart, journeyDay]);

  // 5. Get Current Day Data, Missed Weeks & Unlocked Content
  const { currentDayData, missedDays, missedWeeks, unlockedContentIds, unlockedResources, prepPhaseInfo } = useMemo(() => {
    if (dailyPlan.length === 0) return { currentDayData: null, missedDays: [], missedWeeks: [], unlockedContentIds: [], unlockedResources: [], prepPhaseInfo: null };

    // Find data for current day using the DB dayNumber
    const current = dailyPlan.find(d => d.dayNumber === dbDayNumber);
    
    // PREP PHASE CUMULATIVE ACTIONS:
    // In Prep Phase, actions accumulate from Day 1 through current day
    // Day 1 actions persist through Day 14
    // Day 5 additions appear on Days 5-14
    let cumulativeActions = [];
    let prepInfo = null;
    
    if (currentPhase.cumulativeActions) {
      // PREP PHASE: Progress-based, NOT time-based
      // Get ALL prep phase actions - they're all available from day 1
      // The user completes Required Prep items, then can access Explore
      const prepDays = dailyPlan
        .filter(d => d.phase === 'pre-start')
        .sort((a, b) => a.dayNumber - b.dayNumber);
      
      prepDays.forEach(day => {
        if (day.actions && Array.isArray(day.actions)) {
          day.actions
            .filter(action => action.enabled !== false) // Only include enabled actions
            .forEach(action => {
              cumulativeActions.push({
                ...action,
                dayId: day.id
              });
            });
        }
      });
      
      // Calculate days until cohort start (for countdown display only)
      const daysUntilStart = daysFromStart < 0 ? Math.abs(daysFromStart) : 0;
      
      prepInfo = {
        daysUntilStart,
        // Cohort info (if available) - convert Firestore Timestamp to Date
        cohort: cohortData,
        cohortName: cohortData?.name,
        cohortStartDate: cohortData?.startDate?.toDate ? cohortData.startDate.toDate() : 
                         cohortData?.startDate?.seconds ? new Date(cohortData.startDate.seconds * 1000) :
                         cohortData?.startDate ? new Date(cohortData.startDate) : null,
        facilitator: cohortData?.facilitator,
        // NOTE: Progress tracking is purely completion-based via prepRequirementsComplete
        // There are no "days" or "login counts" in the prep phase
        totalActions: cumulativeActions.length
      };
      
      console.log('[useDailyPlan] Prep Phase cumulative actions:', {
        currentDay: dbDayNumber,
        totalCumulativeActions: cumulativeActions.length,
        daysUntilStart,
        prepInfo
      });
    }
    
    // START PHASE WEEK-CUMULATIVE ACTIONS:
    // In Start Phase, actions accumulate from the first day of the week through current day
    // So if Day 15 has actions, they persist through Days 15-21 (Week 1)
    let weekCumulativeActions = [];
    if (currentPhase.id === 'start' && current) {
      // Get the week number from current day
      const currentWeekNum = current.weekNumber;
      
      if (currentWeekNum) {
        // Find all days in the same week, up to and including current day
        const weekDays = dailyPlan
          .filter(d => d.weekNumber === currentWeekNum && d.dayNumber <= dbDayNumber)
          .sort((a, b) => a.dayNumber - b.dayNumber);
        
        weekDays.forEach(day => {
          if (day.actions && Array.isArray(day.actions)) {
            day.actions
              .filter(action => action.enabled !== false)
              .forEach(action => {
                // Avoid duplicates (same action ID)
                if (!weekCumulativeActions.find(a => a.id === action.id)) {
                  weekCumulativeActions.push({
                    ...action,
                    introducedOnDay: day.dayNumber,
                    introducedOnDayId: day.id,
                    introducedLabel: `Day ${day.dayNumber - PHASES.START.dbDayStart + 1}`
                  });
                }
              });
          }
        });
        
        console.log('[useDailyPlan] Start Phase week-cumulative actions:', {
          currentDay: dbDayNumber,
          weekNumber: currentWeekNum,
          totalWeekActions: weekCumulativeActions.length
        });
      }
    }

    // Enrich with user progress and phase info
    let enrichedCurrent = null;
    if (current) {
      const progressKey = current.id; // e.g., 'day-001'
      const progress = userState.dailyProgress?.[progressKey] || { itemsCompleted: [] };
      
      // Determine which actions to use:
      // - Prep Phase: cumulative from Day 1 through current day
      // - Start Phase: cumulative from first day of week through current day
      // - Post Phase: just current day's actions
      let actionsToUse = [...(current.actions || [])];
      if (currentPhase.cumulativeActions) {
        actionsToUse = cumulativeActions;
      } else if (currentPhase.id === 'start' && weekCumulativeActions.length > 0) {
        actionsToUse = weekCumulativeActions;
      }
      
      enrichedCurrent = {
        ...current,
        // Phase-specific display info
        phase: currentPhase,
        phaseDayNumber: phaseDayNumber,
        displayDay: currentPhase.id === 'pre-start' 
          ? `Login ${journeyDay}` // Use journeyDay (visit count) for display
          : currentPhase.id === 'start'
            ? `Day ${phaseDayNumber}`
            : `Post Day ${phaseDayNumber}`,
        // User progress
        userProgress: progress,
        isCompleted: progress.status === 'completed',
        // Use appropriate actions based on phase
        actions: actionsToUse
      };
    } else if (currentPhase.cumulativeActions && cumulativeActions.length > 0) {
      // Create a synthetic day data for prep phase even if specific day doc doesn't exist
      enrichedCurrent = {
        id: `day-${String(dbDayNumber).padStart(3, '0')}`,
        dayNumber: dbDayNumber,
        phase: currentPhase,
        phaseDayNumber: phaseDayNumber,
        displayDay: `Login ${journeyDay}`, // Use journeyDay (visit count) for display
        actions: cumulativeActions,
        userProgress: { itemsCompleted: [] },
        isCompleted: false
      };
    }

    // Inject QS Sessions (Cohort-based) - Only for START phase
    if (enrichedCurrent && cohortData?.startDate && currentPhase.id === 'start') {
      // Calculate which session this might be (Weeks 1-4)
      // Show session for the entire week it belongs to
      const sessionIndex = Math.floor(daysFromStart / 7);
      
      // Only show for first 4 weeks (Sessions 1-4)
      if (sessionIndex >= 0 && sessionIndex < 4) {
        const sessionNum = sessionIndex + 1;
        
        // Format time and day
        let timeStr = "Time TBD";
        let dateStr = "";
        let startDateObj = null;
        let sessionDateObj = null;
        
        if (cohortData.startDate.toDate && typeof cohortData.startDate.toDate === 'function') {
          startDateObj = cohortData.startDate.toDate();
        } else if (cohortData.startDate.seconds) {
          startDateObj = new Date(cohortData.startDate.seconds * 1000);
        } else {
          startDateObj = new Date(cohortData.startDate);
        }
        
        if (startDateObj && !isNaN(startDateObj.getTime())) {
           timeStr = startDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
           // Calculate the actual session date (startDate + sessionIndex * 7 days)
           sessionDateObj = new Date(startDateObj);
           sessionDateObj.setDate(sessionDateObj.getDate() + (sessionIndex * 7));
           
           // Format: "Wednesday, Oct 12"
           dateStr = sessionDateObj.toLocaleDateString('en-US', { 
             weekday: 'long',
             month: 'short',
             day: 'numeric'
           });
        }

        const qsAction = {
          id: `qs-session-${sessionNum}`,
          type: 'community', // Use community icon
          label: `Foundation Session ${sessionNum}`,
          description: dateStr ? `Live 2-hour session on ${dateStr} at ${timeStr}` : `Live 2-hour session at ${timeStr}`,
          resourceId: null, 
          enabled: true,
          isSystemInjected: true,
          // Calendar data for "Add to Calendar" button
          calendarEvent: sessionDateObj ? {
            title: `Foundation Session ${sessionNum} - LeaderReps`,
            startDate: sessionDateObj,
            duration: 120, // 2 hours in minutes
            description: `Foundation Session ${sessionNum} for LeaderReps Professional Development`,
            location: cohortData.meetingLink || 'Virtual - Link TBD'
          } : null
        };
        
        // Check completion status globally (since it appears across multiple days)
        const isCompletedGlobally = Object.values(userState.dailyProgress || {}).some(dayProgress => 
          dayProgress.itemsCompleted?.includes(qsAction.id)
        );
        qsAction.isCompleted = isCompletedGlobally;
        
        // Add to actions at the top
        if (!enrichedCurrent.actions) enrichedCurrent.actions = [];
        
        // Avoid duplicates if already injected
        if (!enrichedCurrent.actions.find(a => a.id === qsAction.id)) {
          enrichedCurrent.actions.unshift(qsAction);
        }
      }
    }

    // Calculate Missed Weeks (only for START phase - cohort-based)
    // UPDATED LOGIC (12/18/25):
    // Users are only "behind" if they have incomplete required actions from PREVIOUS weeks.
    // Within the current week, they have the full week to complete actions.
    // UPDATED (1/15/25): Changed from counting individual days to counting weeks.
    let missed = [];
    let missedWeekNumbers = [];
    if (currentPhase.trackMissedDays) {
      // Determine current week number based on current day
      // Note: dbDayNumber is the current day (e.g. 16)
      // We need to find the week number for this day.
      const currentDayObj = dailyPlan.find(d => d.dayNumber === dbDayNumber);
      const currentWeekNum = currentDayObj?.weekNumber || Math.ceil((dbDayNumber - 14) / 7);

      missed = dailyPlan
        .filter(d => {
          // Only track missed days within the current phase
          const dayPhase = getPhaseFromDbDay(d.dayNumber);
          
          // Only look at days from PREVIOUS weeks
          // If d.weekNumber < currentWeekNum, it's a past week.
          // If d.weekNumber === currentWeekNum, it's the current week (not missed yet).
          const isPastWeek = d.weekNumber < currentWeekNum;
          
          return dayPhase.id === currentPhase.id && isPastWeek;
        })
        .filter(d => {
          // 1. Check legacy dailyProgress (fast check)
          const progress = userState.dailyProgress?.[d.id];
          if (progress && progress.status === 'completed') return false;

          // 2. Check granular actions via useActionProgress
          // This ensures that if the user completed actions but dailyProgress wasn't updated,
          // we still count it as done.
          const actions = d.actions || [];
          
          // Filter for REQUIRED actions
          // Note: Matches logic in PrepWelcomeBanner and ThisWeeksActionsWidget
          const requiredActions = actions.filter(a => a.required !== false && !a.optional);
          
          // If no required actions, we can't determine "missed" status from actions alone,
          // so we fall back to the legacy check (which returned true/missed above).
          // However, if there are NO actions at all, maybe it shouldn't be missed?
          // For now, assume if it has content but no required actions, it's not "missed".
          if (requiredActions.length === 0) return false;

          // Check if ALL required actions are completed
          const allRequiredCompleted = requiredActions.every(a => {
             const p = getItemProgress(a.id);
             // Also check legacy itemsCompleted array as fallback
             const legacyCompleted = progress?.itemsCompleted?.includes(a.id);
             return p.status === 'completed' || legacyCompleted;
          });

          return !allRequiredCompleted;
        })
        .map(d => ({
          ...d,
          userProgress: userState.dailyProgress?.[d.id] || { itemsCompleted: [] }
        }))
        .sort((a, b) => a.dayNumber - b.dayNumber);
      
      // Count unique weeks with missed items
      missedWeekNumbers = [...new Set(missed.map(d => d.weekNumber).filter(Boolean))].sort((a, b) => a - b);
    }

    // Calculate Unlocked Content (resources linked to actions up to current day)
    // NEW MODEL: Resources are unlocked when linked to actions, not via separate content array
    const unlockedResources = [];
    dailyPlan.forEach(d => {
      if (d.dayNumber <= dbDayNumber) {
        // New model: resources linked to actions
        if (d.actions && Array.isArray(d.actions)) {
          d.actions.forEach(action => {
            if (action.resourceId) {
              unlockedResources.push({
                id: action.resourceId,
                title: action.resourceTitle || action.label,
                type: action.resourceType,
                unlockedOnDay: d.dayNumber,
                linkedAction: action.label
              });
            }
          });
        }
        // Legacy support: still check content array if it exists
        if (d.content && Array.isArray(d.content)) {
          d.content.forEach(item => {
            if (item.id && !unlockedResources.find(r => r.id === item.id)) {
              unlockedResources.push({
                id: item.id,
                title: item.title,
                type: item.type,
                unlockedOnDay: d.dayNumber,
                linkedAction: null // Legacy - not linked to specific action
              });
            }
          });
        }
      }
    });
    
    // Create simple ID list for backward compatibility
    const unlockedIds = unlockedResources.map(r => r.id);

    return { 
      currentDayData: enrichedCurrent, 
      missedDays: missed, 
      missedWeeks: missedWeekNumbers, // New: unique week numbers with missed items
      unlockedContentIds: unlockedIds,
      unlockedResources, // New: enriched resource data
      prepPhaseInfo: prepInfo // New: Prep Phase welcome/countdown data
    };
  }, [dailyPlan, dbDayNumber, currentPhase, phaseDayNumber, userState.dailyProgress, journeyDay, cohortData, daysFromStart, getItemProgress]);

  // Legacy: currentDayNumber for backward compatibility
  // This returns the "user-facing" day number (negative for prep, positive for start)
  const currentDayNumber = useMemo(() => {
    if (currentPhase.id === 'pre-start') {
      // Return negative days: -14 to -1
      return daysFromStart; // Already negative
    }
    if (currentPhase.id === 'start') {
      // Return 1-56 for the 8-week program
      return daysFromStart + 1; // 0 → 1, 55 → 56
    }
    // Post-start: return days since program ended
    return daysFromStart - 55; // 56 → 1, 57 → 2, etc.
  }, [currentPhase.id, daysFromStart]);

  // 6. Actions

  // Toggle Item Complete
  const toggleItemComplete = useCallback(async (dayId, itemId, isComplete) => {
    if (!dayId || !itemId) return;

    const currentProgress = userState.dailyProgress?.[dayId] || { itemsCompleted: [] };
    let newItemsCompleted = [...(currentProgress.itemsCompleted || [])];
    
    if (isComplete) {
      if (!newItemsCompleted.includes(itemId)) newItemsCompleted.push(itemId);
    } else {
      newItemsCompleted = newItemsCompleted.filter(id => id !== itemId);
    }

    // Check if all items for the day are complete?
    // For now, just update items.
    
    const updates = {
      [`dailyProgress.${dayId}`]: {
        ...currentProgress,
        itemsCompleted: newItemsCompleted,
        lastUpdated: serverTimestamp()
      }
    };

    await updateDevelopmentPlanData(updates);
  }, [userState, updateDevelopmentPlanData]);

  // Mark Day as Complete (e.g. after PM Reflection)
  const completeDay = useCallback(async (dayId) => {
    if (!dayId) return;
    
    const updates = {
      [`dailyProgress.${dayId}.status`]: 'completed',
      [`dailyProgress.${dayId}.completedAt`]: serverTimestamp()
    };

    await updateDevelopmentPlanData(updates);
  }, [updateDevelopmentPlanData]);

  // Debug loading state before return
  const loadingValue = loadingPlan || developmentPlanData == null;
  console.log('[useDailyPlan] Loading state:', { 
    loadingPlan, 
    devPlanIsNull: developmentPlanData == null,
    finalLoading: loadingValue,
    dailyPlanLength: dailyPlan.length
  });

  return {
    // Loading state
    // Wait for both the plan template AND the user data to load
    // Use == null to catch both null AND undefined (serviceData starts as {} so field is undefined)
    loading: loadingValue,
    
    // Raw data
    dailyPlan,
    userState,
    
    // Cohort info (NEW)
    cohortData,             // Full cohort object { id, name, description, startDate, facilitator, settings }
    
    // Phase info (NEW)
    currentPhase,           // { id, name, displayName, trackMissedDays, cumulativeActions, ... }
    phaseDayNumber,         // Day within current phase (1-14 for prep, 1-56 for start, etc.)
    daysFromStart,          // Raw days from cohort start (can be negative)
    dbDayNumber,            // Database dayNumber (1-71+)
    
    // Prep Phase specific (NEW)
    prepPhaseInfo,          // { daysUntilStart, welcome, quote, onboarding, journeyDay, cohort, ... } - only in prep phase
    journeyDay,             // User's personal journey day (days since first prep phase visit)
    prepRequirementsComplete, // { allComplete, completedCount, totalCount, items, remaining, ... } - dynamic required prep items
    
    // Legacy (for backward compatibility)
    currentDayNumber,       // User-facing day number (negative for prep, positive for start)
    
    // Current day data (enriched with phase info)
    currentDayData,         // In Prep Phase, .actions contains CUMULATIVE actions from Day 1
    
    // Catch-up (only populated during START phase)
    missedDays,             // Individual days with incomplete required actions
    missedWeeks,            // Unique week numbers with missed items
    
    // Content unlocking
    unlockedContentIds,     // Simple ID list (backward compatible)
    unlockedResources,      // Enriched: { id, title, type, unlockedOnDay, linkedAction }
    
    // Actions
    toggleItemComplete,
    completeDay,
    
    // Time travel support
    simulatedNow
  };
};