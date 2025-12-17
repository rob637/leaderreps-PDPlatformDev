import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { collection, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Hook to manage the Daily Plan logic.
 * Replaces useDevPlan for the new Day-by-Day architecture.
 * 
 * THREE PHASE SYSTEM:
 * ==================
 * 1. PRE-START (Prep Phase) - 14 days before cohort start
 *    - Users can join anytime, no "behind" status
 *    - Tasks to complete before program starts
 *    - DB: dayNumber 1-14, weekNumber -2 and -1
 *    - Display: "Prep Day 1-14"
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
    name: 'Pre-Start',
    displayName: 'Prep Phase',
    dbDayStart: 1,
    dbDayEnd: 14,
    weekRange: [-2, -1],
    trackMissedDays: false, // Users can start anytime
    cumulativeActions: true, // Actions accumulate - Day 1 actions persist through Day 14
    description: 'Get ready for the program'
  },
  START: {
    id: 'start',
    name: 'Development Plan',  // This IS the Development Plan
    displayName: 'Development Plan',
    dbDayStart: 15,
    dbDayEnd: 70,
    weekRange: [1, 8],
    trackMissedDays: true, // Cohort-based progression
    cumulativeActions: false, // Each day/week has specific content
    description: '8-week leadership development program'
  },
  POST_START: {
    id: 'post-start',
    name: 'Post-Start',
    displayName: 'Next Reps',
    dbDayStart: 71,
    dbDayEnd: Infinity,
    weekRange: [9, Infinity],
    trackMissedDays: false, // Ongoing maintenance
    cumulativeActions: false,
    description: 'Continue your leadership journey'
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
    title: 'Welcome to Your Leadership Journey',
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
      id: 'quick-start', 
      title: 'Quick Start Guide',
      headline: 'Welcome, Leader! Let\'s Get You Ready Fast',
      description: 'Your training starts very soon! Here\'s everything you need to know to hit the ground running.',
      widgets: ['leaderProfile', 'baselineAssessment', 'amBookend', 'pmBookend', 'appOverview'],
      features: ['leader_profile', 'baseline_assessment', 'am_bookend', 'pm_bookend', 'full_access'],
      callToAction: 'Complete your profile and assessment before Day 1!',
      tip: 'Focus on the Leader Profile and Baseline Assessment first - they\'re essential for personalization.',
      isQuickStart: true
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
export const useDailyPlan = () => {
  const { db, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const [dailyPlan, setDailyPlan] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [cohortData, setCohortData] = useState(null);
  const [timeOffset, setTimeOffset] = useState(() => {
    return parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
  });

  // 0. Initialize Time Travel Offset and listen for changes
  useEffect(() => {
    const offset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
    setTimeOffset(offset);
    
    const handleStorageChange = (e) => {
      if (e.key === 'time_travel_offset' || e.key === null) {
        const newOffset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
        setTimeOffset(newOffset);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const simulatedNow = useMemo(() => new Date(Date.now() + timeOffset), [timeOffset]);

  // 1. Fetch Daily Plan (All Days)
  useEffect(() => {
    const fetchDailyPlan = async () => {
      if (!db || !user) return;
      try {
        const planRef = collection(db, 'daily_plan_v1');
        const q = query(planRef, orderBy('dayNumber', 'asc'));
        const snapshot = await getDocs(q);
        
        const days = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`[useDailyPlan] Loaded ${days.length} days from daily_plan_v1`);
        setDailyPlan(days);
      } catch (error) {
        console.error("Error fetching daily plan:", error);
      } finally {
        setLoadingPlan(false);
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
        console.log('[useDailyPlan] No cohortId found for user');
        return;
      }
      
      try {
        const { doc: fsDoc, getDoc: fsGetDoc } = await import('firebase/firestore');
        const cohortRef = fsDoc(db, 'cohorts', cohortId);
        const cohortSnap = await fsGetDoc(cohortRef);
        
        if (cohortSnap.exists()) {
          const data = cohortSnap.data();
          setCohortData({
            id: cohortSnap.id,
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            facilitator: data.facilitator,
            settings: data.settings
          });
          console.log('[useDailyPlan] Loaded cohort:', data.name);
        } else {
          console.warn('[useDailyPlan] Cohort not found:', cohortId);
        }
      } catch (error) {
        console.error('[useDailyPlan] Error fetching cohort:', error);
      }
    };
    
    fetchCohort();
  }, [db, user, developmentPlanData?.cohortId]);

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
  useEffect(() => {
    const initPrepPhaseVisit = async () => {
      // Only track for Prep Phase users who haven't been tracked yet
      if (!user || !updateDevelopmentPlanData || developmentPlanData === undefined) return;
      if (developmentPlanData?.prepPhaseFirstVisit) return; // Already tracked
      
      // Check if we're in Prep Phase (daysFromStart < 0 means before cohort start)
      const rawDate = developmentPlanData?.startDate || user?.startDate;
      if (!rawDate) return;
      
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
      
      // If we're in Prep Phase (before start day), record first visit
      if (diffDays < 0) {
        if (window._prepPhaseInitAttempted) return;
        window._prepPhaseInitAttempted = true;
        
        console.log('[useDailyPlan] Recording first Prep Phase visit');
        try {
          await updateDevelopmentPlanData({ prepPhaseFirstVisit: serverTimestamp() });
        } catch (error) {
          console.error('[useDailyPlan] Error recording prepPhaseFirstVisit:', error);
          window._prepPhaseInitAttempted = false;
        }
      }
    };
    initPrepPhaseVisit();
  }, [developmentPlanData, updateDevelopmentPlanData, user, timeOffset]);

  // Calculate user's Journey Day (days since first Prep Phase visit)
  // Uses CALENDAR days, not 24-hour periods (so Dec 16 evening to Dec 17 morning = Day 2)
  const journeyDay = useMemo(() => {
    if (!userState.prepPhaseFirstVisit) {
      console.log('[useDailyPlan] journeyDay: No prepPhaseFirstVisit, defaulting to 1');
      return 1; // Default to Day 1 if not tracked yet
    }
    
    let firstVisit = null;
    const rawDate = userState.prepPhaseFirstVisit;
    
    if (rawDate.toDate && typeof rawDate.toDate === 'function') {
      firstVisit = rawDate.toDate();
    } else if (rawDate.seconds) {
      firstVisit = new Date(rawDate.seconds * 1000);
    } else {
      firstVisit = new Date(rawDate);
    }
    
    if (!firstVisit || isNaN(firstVisit.getTime())) {
      console.log('[useDailyPlan] journeyDay: Invalid firstVisit date, defaulting to 1');
      return 1;
    }
    
    // Calculate based on CALENDAR days, not 24-hour periods
    // This ensures Dec 16 at 8pm to Dec 17 at 9am counts as Day 2 (different calendar day)
    const firstVisitDate = new Date(firstVisit.getFullYear(), firstVisit.getMonth(), firstVisit.getDate());
    const nowDate = new Date(simulatedNow.getFullYear(), simulatedNow.getMonth(), simulatedNow.getDate());
    
    const diffMs = nowDate.getTime() - firstVisitDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)); // Round to handle DST edge cases
    
    // Journey day is 1-indexed (first day = 1, second day = 2, etc.)
    const calculatedJourneyDay = Math.max(1, diffDays + 1);
    console.log('[useDailyPlan] journeyDay calculation:', {
      prepPhaseFirstVisit: firstVisit.toISOString(),
      firstVisitDateOnly: firstVisitDate.toISOString().split('T')[0],
      simulatedNow: simulatedNow.toISOString(),
      nowDateOnly: nowDate.toISOString().split('T')[0],
      diffDays,
      calculatedJourneyDay
    });
    return calculatedJourneyDay;
  }, [userState.prepPhaseFirstVisit, simulatedNow]);

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

    // Calculate difference in days from cohort start
    // Negative = before start (Pre-Start phase)
    // Zero = start day (first day of Foundations)
    // Positive = after start
    const diffMs = simulatedNow.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    console.log('[useDailyPlan] Days From Start:', {
      source: cohortData?.startDate ? 'cohort' : 'user',
      startDate: start.toISOString(),
      now: simulatedNow.toISOString(),
      daysFromStart: diffDays
    });

    return diffDays;
  }, [userState.startDate, cohortData?.startDate, simulatedNow]);

  // 4. Map to DB Day Number and get Phase Info
  const { dbDayNumber, currentPhase, phaseDayNumber } = useMemo(() => {
    const dbDay = getDbDayNumber(daysFromStart);
    const phase = getPhaseFromDbDay(dbDay);
    const phaseDay = getPhaseDayNumber(dbDay);
    
    console.log('[useDailyPlan] Phase Info:', {
      daysFromStart,
      dbDayNumber: dbDay,
      phase: phase.name,
      phaseDayNumber: phaseDay
    });
    
    return { dbDayNumber: dbDay, currentPhase: phase, phaseDayNumber: phaseDay };
  }, [daysFromStart]);

  // 5. Get Current Day Data, Missed Days & Unlocked Content
  const { currentDayData, missedDays, unlockedContentIds, unlockedResources, prepPhaseInfo } = useMemo(() => {
    if (dailyPlan.length === 0) return { currentDayData: null, missedDays: [], unlockedContentIds: [], unlockedResources: [], prepPhaseInfo: null };

    // Find data for current day using the DB dayNumber
    const current = dailyPlan.find(d => d.dayNumber === dbDayNumber);
    
    // PREP PHASE CUMULATIVE ACTIONS:
    // In Prep Phase, actions accumulate from Day 1 through current day
    // Day 1 actions persist through Day 14
    // Day 5 additions appear on Days 5-14
    let cumulativeActions = [];
    let prepInfo = null;
    
    if (currentPhase.cumulativeActions) {
      // Accumulate all actions from Day 1 to current day
      const prepDays = dailyPlan
        .filter(d => d.dayNumber >= PHASES.PRE_START.dbDayStart && d.dayNumber <= dbDayNumber)
        .sort((a, b) => a.dayNumber - b.dayNumber);
      
      prepDays.forEach(day => {
        if (day.actions && Array.isArray(day.actions)) {
          day.actions
            .filter(action => action.enabled !== false) // Only include enabled actions
            .forEach(action => {
              // Add metadata about when this action was introduced
              cumulativeActions.push({
                ...action,
                introducedOnDay: day.dayNumber,
                introducedOnDayId: day.id,
                // Use day.dayNumber for display: "Prep Day X"
                introducedLabel: `Prep Day ${day.dayNumber}`
              });
            });
        }
      });
      
      // Calculate days until cohort start (Day 15)
      const daysUntilStart = PHASES.START.dbDayStart - dbDayNumber;
      const welcomeMessage = getPrepPhaseWelcome(daysUntilStart);
      const dailyQuote = getDailyQuote(dbDayNumber);
      
      // Get the appropriate onboarding module based on user's journey day
      // journeyDay is passed from outer scope (calculated from prepPhaseFirstVisit)
      console.log('[useDailyPlan] Calling getOnboardingModule with:', { journeyDay, daysUntilStart });
      const onboardingModule = getOnboardingModule(journeyDay, daysUntilStart);
      console.log('[useDailyPlan] Received onboardingModule:', onboardingModule);
      
      prepInfo = {
        daysUntilStart,
        totalPrepDays: PHASES.PRE_START.dbDayEnd - PHASES.PRE_START.dbDayStart + 1,
        currentPrepDay: phaseDayNumber,
        progressPercent: Math.round((phaseDayNumber / 14) * 100),
        welcome: welcomeMessage,
        quote: dailyQuote,
        // Progressive onboarding
        journeyDay,
        onboarding: onboardingModule,
        isAccelerated: daysUntilStart <= 4,
        isQuickStart: daysUntilStart <= 2,
        // Cohort info (if available)
        cohort: cohortData,
        cohortName: cohortData?.name,
        facilitator: cohortData?.facilitator,
        // Summary of prep completion
        totalActions: cumulativeActions.length,
        actionsIntroducedToday: cumulativeActions.filter(a => a.introducedOnDay === dbDayNumber).length
      };
      
      console.log('[useDailyPlan] Prep Phase cumulative actions:', {
        currentDay: dbDayNumber,
        totalCumulativeActions: cumulativeActions.length,
        daysUntilStart,
        prepInfo
      });
    }
    
    // Enrich with user progress and phase info
    let enrichedCurrent = null;
    if (current) {
      const progressKey = current.id; // e.g., 'day-001'
      const progress = userState.dailyProgress?.[progressKey] || { itemsCompleted: [] };
      enrichedCurrent = {
        ...current,
        // Phase-specific display info
        phase: currentPhase,
        phaseDayNumber: phaseDayNumber,
        displayDay: currentPhase.id === 'pre-start' 
          ? `Prep Day ${phaseDayNumber}` 
          : currentPhase.id === 'start'
            ? `Day ${phaseDayNumber}`
            : `Post Day ${phaseDayNumber}`,
        // User progress
        userProgress: progress,
        isCompleted: progress.status === 'completed',
        // For Prep Phase: replace day-specific actions with cumulative actions
        actions: currentPhase.cumulativeActions ? cumulativeActions : [...(current.actions || [])]
      };
    } else if (currentPhase.cumulativeActions && cumulativeActions.length > 0) {
      // Create a synthetic day data for prep phase even if specific day doc doesn't exist
      enrichedCurrent = {
        id: `day-${String(dbDayNumber).padStart(3, '0')}`,
        dayNumber: dbDayNumber,
        phase: currentPhase,
        phaseDayNumber: phaseDayNumber,
        displayDay: `Prep Day ${phaseDayNumber}`,
        actions: cumulativeActions,
        userProgress: { itemsCompleted: [] },
        isCompleted: false
      };
    }

    // Inject QS Sessions (Cohort-based) - Only for START phase
    if (enrichedCurrent && cohortData?.startDate && currentPhase.id === 'start') {
      // Calculate which session this might be (0, 7, 14, 21 days from start)
      // We use daysFromStart which is already calculated
      const sessionIndex = [0, 7, 14, 21].indexOf(daysFromStart);
      
      if (sessionIndex !== -1) {
        // It's a session day!
        const sessionNum = sessionIndex + 1;
        
        // Format time
        let timeStr = "Time TBD";
        let startDateObj = null;
        if (cohortData.startDate.toDate && typeof cohortData.startDate.toDate === 'function') {
          startDateObj = cohortData.startDate.toDate();
        } else if (cohortData.startDate.seconds) {
          startDateObj = new Date(cohortData.startDate.seconds * 1000);
        } else {
          startDateObj = new Date(cohortData.startDate);
        }
        
        if (startDateObj && !isNaN(startDateObj.getTime())) {
           timeStr = startDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }

        const qsAction = {
          id: `qs-session-${sessionNum}`,
          type: 'community', // Use community icon
          label: `QuickStart Session ${sessionNum}`,
          description: `Live 2-hour session at ${timeStr}`,
          resourceId: null, 
          enabled: true,
          isSystemInjected: true
        };
        
        // Check completion status
        const isCompleted = enrichedCurrent.userProgress?.itemsCompleted?.includes(qsAction.id);
        qsAction.isCompleted = isCompleted;
        
        // Add to actions at the top
        if (!enrichedCurrent.actions) enrichedCurrent.actions = [];
        enrichedCurrent.actions.unshift(qsAction);
      }
    }

    // Inject QS Sessions (Cohort-based) - Only for START phase
    if (enrichedCurrent && cohortData?.startDate && currentPhase.id === 'start') {
      // Calculate which session this might be (0, 7, 14, 21 days from start)
      // We use daysFromStart which is already calculated
      const sessionIndex = [0, 7, 14, 21].indexOf(daysFromStart);
      
      if (sessionIndex !== -1) {
        // It's a session day!
        const sessionNum = sessionIndex + 1;
        
        // Format time
        let timeStr = "Time TBD";
        let startDateObj = null;
        if (cohortData.startDate.toDate && typeof cohortData.startDate.toDate === 'function') {
          startDateObj = cohortData.startDate.toDate();
        } else if (cohortData.startDate.seconds) {
          startDateObj = new Date(cohortData.startDate.seconds * 1000);
        } else {
          startDateObj = new Date(cohortData.startDate);
        }
        
        if (startDateObj && !isNaN(startDateObj.getTime())) {
           timeStr = startDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }

        const qsAction = {
          id: `qs-session-${sessionNum}`,
          type: 'community', // Use community icon
          label: `QuickStart Session ${sessionNum}`,
          description: `Live 2-hour session at ${timeStr}`,
          resourceId: null, 
          enabled: true,
          isSystemInjected: true
        };
        
        // Check completion status
        const isCompleted = enrichedCurrent.userProgress?.itemsCompleted?.includes(qsAction.id);
        qsAction.isCompleted = isCompleted;
        
        // Add to actions at the top
        if (!enrichedCurrent.actions) enrichedCurrent.actions = [];
        enrichedCurrent.actions.unshift(qsAction);
      }
    }

    // Calculate Missed Days (only for START phase - cohort-based)
    let missed = [];
    if (currentPhase.trackMissedDays) {
      missed = dailyPlan
        .filter(d => {
          // Only track missed days within the current phase
          const dayPhase = getPhaseFromDbDay(d.dayNumber);
          return dayPhase.id === currentPhase.id && d.dayNumber < dbDayNumber;
        })
        .filter(d => {
          const progress = userState.dailyProgress?.[d.id];
          return !progress || progress.status !== 'completed';
        })
        .sort((a, b) => a.dayNumber - b.dayNumber);
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
      unlockedContentIds: unlockedIds,
      unlockedResources, // New: enriched resource data
      prepPhaseInfo: prepInfo // New: Prep Phase welcome/countdown data
    };
  }, [dailyPlan, dbDayNumber, currentPhase, phaseDayNumber, userState.dailyProgress, journeyDay, cohortData]);

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
  }, [currentPhase, daysFromStart]);

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

  return {
    // Loading state
    // Wait for both the plan template AND the user data to load
    loading: loadingPlan || developmentPlanData === null,
    
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
    
    // Legacy (for backward compatibility)
    currentDayNumber,       // User-facing day number (negative for prep, positive for start)
    
    // Current day data (enriched with phase info)
    currentDayData,         // In Prep Phase, .actions contains CUMULATIVE actions from Day 1
    
    // Catch-up (only populated during START phase)
    missedDays,
    
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