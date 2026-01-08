import React, { useMemo, useState } from 'react';
import { 
  Target, Rocket, Calendar, Quote, 
  ChevronRight, Users, Info
} from 'lucide-react';
import { useDailyPlan, ONBOARDING_MODULES } from '../../hooks/useDailyPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
import { useAppServices } from '../../services/useAppServices';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import FacilitatorProfileModal from './FacilitatorProfileModal';

/**
 * PrepWelcomeBanner - Progressive Onboarding for Prep Phase
 * 
 * Shows different content based on user's JOURNEY DAY (not calendar day):
 * - Day 1: Welcome, Leader Profile, Baseline Assessment
 * - Day 2: AM/PM Bookends introduction
 * - Day 3: Reading content introduction
 * - Day 4: Video content introduction
 * - Day 5+: Recap & app overview
 * 
 * Late joiners get accelerated/quick-start versions.
 * Now includes cohort name and facilitator info!
 */
const PrepWelcomeBanner = () => {
  const { user } = useAppServices();
  const { prepPhaseInfo, phaseDayNumber, currentPhase, journeyDay, currentDayData, userState, prepRequirementsComplete } = useDailyPlan();
  const { getItemProgress } = useActionProgress();
  const { isComplete: leaderProfileComplete, profile: leaderProfile } = useLeaderProfile();
  const [showFacilitatorModal, setShowFacilitatorModal] = useState(false);

  // Baseline Assessment completion tracking
  const baselineAssessmentComplete = useMemo(() => {
    const assessmentHistory = userState?.assessmentHistory;
    return assessmentHistory && assessmentHistory.length > 0;
  }, [userState?.assessmentHistory]);

  // Normalize daily plan actions to match ThisWeeksActionsWidget IDs
  // This ensures we check the exact same IDs that are being saved
  const normalizeDailyActions = (actions, dayId) => {
    return (actions || []).map((action, idx) => {
      const label = action.label || 'Daily Action';
      // Same fallback ID generation as ThisWeeksActionsWidget
      const fallbackId = `daily-${dayId}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}-${idx}`;
      
      return {
        ...action,
        id: action.id || fallbackId,
      };
    });
  };

  // Check for incomplete required actions (Moved before early return to satisfy Rules of Hooks)
  const actions = useMemo(() => {
    const dailyActions = normalizeDailyActions(currentDayData?.actions, currentDayData?.id);
    
    // Filter out Leader Profile and Baseline Assessment from daily actions (handled by interactive content)
    const onboardingLabels = ['leader profile', 'baseline assessment'];
    const filteredDailyActions = dailyActions.filter(action => {
      const labelLower = (action.label || '').toLowerCase();
      return !onboardingLabels.some(keyword => labelLower.includes(keyword));
    });
    
    // Add interactive content items (Leader Profile & Baseline Assessment)
    // These match the IDs used in ThisWeeksActionsWidget
    const interactiveItems = [
      {
        id: 'interactive-leader-profile',
        type: 'INTERACTIVE',
        handlerType: 'leader-profile',
        label: 'Complete Your Leader Profile',
        required: true,
        optional: false,
        isInteractive: true,
        autoComplete: leaderProfileComplete
      },
      {
        id: 'interactive-baseline-assessment',
        type: 'INTERACTIVE',
        handlerType: 'baseline-assessment',
        label: 'Take Baseline Assessment',
        required: true,
        optional: false,
        isInteractive: true,
        autoComplete: baselineAssessmentComplete
      }
    ];
    
    return [...interactiveItems, ...filteredDailyActions];
  }, [currentDayData, leaderProfileComplete, baselineAssessmentComplete]);
  
  // Debug logging
  console.log('[PrepWelcomeBanner] Rendering with:', {
    currentPhase: currentPhase?.id,
    journeyDay,
    phaseDayNumber,
    hasOnboarding: !!prepPhaseInfo?.onboarding,
    prepVisitLog: userState?.prepVisitLog || 'no visitLog'
  });
  
  // Only show in Prep Phase
  if (currentPhase?.id !== 'pre-start') {
    console.log('[PrepWelcomeBanner] NOT showing - phase is:', currentPhase?.id);
    return null;
  }
  
  const info = prepPhaseInfo || {};
  const { 
    daysUntilStart = 14, 
    welcome = { headline: "Your Journey Begins Now, Leader", subtext: "Preparing for your leadership transformation.", excitement: 'start' },
    quote = { quote: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek" },
    onboarding: originalOnboarding = null,
    cohortName = null,
    cohortStartDate = null,
    facilitator = null
  } = info;

  // Get user's first name for personalization - prefer profile data over displayName
  const firstName = leaderProfile?.firstName || user?.displayName?.split(' ')[0] || 'Leader';
  
  // Launch mode for Session One
  const isLaunch = welcome.excitement === 'launch';
  
  // Calculate effective journey day
  // 1. Clamp to phaseDayNumber so early birds don't get ahead of the official schedule
  const clampedJourneyDay = Math.min(journeyDay || 1, phaseDayNumber || 14);
  
  const incompleteRequiredActions = actions.filter(action => {
    // An action is required if it's not explicitly optional AND not explicitly marked as not required.
    // This matches the logic in ThisWeeksActionsWidget to ensure the count matches the "Required" badges shown.
    const isRequired = action.required !== false && !action.optional;
    
    // If not required, skip it immediately
    if (!isRequired) return false;

    // Interactive items (Leader Profile & Baseline Assessment) have autoComplete flag
    // that tracks their completion status directly
    if (action.isInteractive && action.autoComplete) {
      return false; // Already completed
    }
    
    // Check completion status using the unified action progress system
    // This handles both legacy week-based and new day-based completions
    const progress = getItemProgress(action.id);
    const isCompleted = progress.status === 'completed';
    
    // Fallback: Check dailyProgress from userState (legacy/redundant check)
    if (!isCompleted) {
      const dayId = action.introducedOnDayId || currentDayData?.id;
      const dayProgress = userState?.dailyProgress?.[dayId];
      const completedItems = dayProgress?.itemsCompleted || [];
      if (completedItems.includes(action.id)) return false; // It is completed in legacy system
    }
    
    return !isCompleted;
  });

  const hasIncompleteRequiredActions = incompleteRequiredActions.length > 0;
  
  // 2. Determine if prep is complete using the new completion-based flag
  // This checks all 5 required prep items: Leader Profile, Baseline Assessment, Video, Workbook, Exercises
  // When all 5 are done, prep is complete regardless of journey day
  const isPrepComplete = prepRequirementsComplete?.allComplete || false;

  // DIAGNOSTIC LOGGING
  if (currentPhase?.id === 'pre-start') {
    console.warn('[PrepWelcomeBanner] STATUS CHECK:', {
      journeyDay,
      clampedJourneyDay,
      isPrepComplete,
      prepRequirementsComplete: prepRequirementsComplete ? {
        allComplete: prepRequirementsComplete.allComplete,
        completedCount: prepRequirementsComplete.completedCount,
        remaining: prepRequirementsComplete.remaining?.map(i => i.label)
      } : null,
      hasIncomplete: hasIncompleteRequiredActions,
      incompleteCount: incompleteRequiredActions.length,
      totalActions: actions.length,
      userStateKeys: Object.keys(userState?.dailyProgress || {})
    });
  }
  
  // 3. Effective day for content lookup (capped at 5)
  const effectiveJourneyDay = Math.min(clampedJourneyDay, 5);

  // 4. Get the correct onboarding module for this effective day
  let effectiveOnboarding = ONBOARDING_MODULES[effectiveJourneyDay];

  // Override content if prep requirements not complete
  // Use the new prepRequirementsComplete flag for accurate tracking
  if (!isPrepComplete && prepRequirementsComplete) {
    const remaining = prepRequirementsComplete.remaining || [];
    const count = remaining.length;
    
    if (count > 0 && clampedJourneyDay >= 5) {
      if (clampedJourneyDay > 5) {
        // Past Day 5: Show "Finish Strong" messaging
        effectiveOnboarding = {
          id: 'finish-strong',
          title: 'Finish Strong!',
          headline: `Finish Strong!`,
          description: `You have ${count} required task${count === 1 ? '' : 's'} left: ${remaining.map(r => r.label).join(', ')}. Complete ${count === 1 ? 'it' : 'them'} to unlock your full readiness status.`,
          widgets: ['appOverview'],
          tip: 'Complete your remaining prep tasks to be fully ready for Session 1.'
        };
      } else {
        // Day 5 exactly: Show "Almost Ready" messaging
        effectiveOnboarding = {
          ...effectiveOnboarding,
          title: 'Almost Ready!',
          headline: `Day 5: Finish Your Toolkit`,
          description: `You have ${count} required task${count === 1 ? '' : 's'} remaining: ${remaining.map(r => r.label).join(', ')}.`
        };
      }
    }
  }

  const onboarding = effectiveOnboarding || originalOnboarding;

  // Build headline - shorter, no duplicate welcome greeting
  const getPersonalizedHeadline = () => {
    // After 5 days of prep, show "You're Ready!" message
    if (isPrepComplete) {
      return `You're Ready!`;
    }

    // If past day 5 but not complete
    if (clampedJourneyDay > 5 && !isPrepComplete) {
        return `Finish Strong!`;
    }

    // First day - just show cohort name without redundant greeting
    if (clampedJourneyDay === 1) {
      if (cohortName) {
        return cohortName;
      }
      return `Foundation Prep`;
    }
    // Days 2-5 use the onboarding headline if available (without name)
    if (onboarding?.headline) {
      // Strip any name from the headline
      return onboarding.headline.replace(/, \${firstName}!?/g, '').replace(/,?\s*Leader!?$/g, '');
    }
    // Fallback
    return `Day ${clampedJourneyDay}`;
  };

  // Get the subtext - different for Day 1 vs other days
  const getSubtext = () => {
    // After prep requirements complete, show success message with additional resources note
    if (isPrepComplete) {
      if (daysUntilStart <= 0) {
        return "Session One begins today! Let's launch your leadership journey.";
      }
      if (daysUntilStart === 1) {
        return "Session One begins tomorrow! You've unlocked all pre-Session 1 resources below. Practice your AM & PM Bookends.";
      }
      return `Great work! You've unlocked all pre-Session 1 resources. ${daysUntilStart} days until Session One — practice your AM & PM Bookends daily.`;
    }

    // If past day 5 but not complete
    if (clampedJourneyDay > 5 && !isPrepComplete) {
        const count = incompleteRequiredActions.length;
        return `You have ${count} required action${count === 1 ? '' : 's'} left. Complete them to unlock all pre-Session 1 resources.`;
    }

    if (clampedJourneyDay === 1) {
      // Day 1: Use the onboarding description as subtext
      return onboarding?.description || welcome.subtext;
    }
    // Days 2-5: Use onboarding description
    return onboarding?.description || welcome.subtext;
  };

  // DIAGNOSTIC LOGGING
  if (currentPhase?.id === 'pre-start') {
    console.log('[PrepWelcomeBanner] STATUS CHECK:', {
      journeyDay,
      clampedJourneyDay,
      isPrepComplete,
      hasIncomplete: hasIncompleteRequiredActions,
      incompleteCount: incompleteRequiredActions.length,
      headline: getPersonalizedHeadline(),
      subtext: getSubtext()
    });
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-lg mb-6 ${
      isLaunch 
        ? 'bg-gradient-to-br from-emerald-600 via-corporate-teal to-corporate-navy' 
        : 'bg-gradient-to-br from-corporate-navy to-corporate-teal'
    }`}>
      {/* Simplified Background Pattern - Clean and minimal */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          
          {/* Left Content - Simplified */}
          <div className="flex-1 space-y-4">
            {/* Phase Badge - Cleaner, simpler */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-corporate-teal font-bold tracking-wider text-xs uppercase">
                <Target className="w-4 h-4" />
                <span>Foundation Prep</span>
              </div>
              {cohortName && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {cohortName}
                </span>
              )}
              {isPrepComplete && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400 font-bold">
                  ✓ READY
                </span>
              )}
            </div>
            
            {/* Dynamic Headline - Clean and direct */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading leading-tight">
              {getPersonalizedHeadline()}
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {getSubtext()}
            </p>

            {/* Facilitator Introduction - Show on Day 1 if available, clickable for more info */}
            {effectiveJourneyDay === 1 && facilitator && (
              <button
                onClick={() => setShowFacilitatorModal(true)}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 border border-white/10 hover:border-white/20 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-corporate-teal to-corporate-navy flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                  {facilitator.photoUrl ? (
                    <img 
                      src={facilitator.photoUrl} 
                      alt={facilitator.name}
                      className="w-10 h-10 object-cover"
                    />
                  ) : (
                    facilitator.name?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm group-hover:text-corporate-teal transition-colors">{facilitator.name}</p>
                  <p className="text-slate-400 text-xs">Your Facilitator • Tap for details</p>
                </div>
                <Info className="w-4 h-4 text-white/30 group-hover:text-corporate-teal transition-colors" />
              </button>
            )}

            {/* Facilitator Profile Modal */}
            <FacilitatorProfileModal
              facilitator={facilitator}
              cohortName={cohortName}
              isOpen={showFacilitatorModal}
              onClose={() => setShowFacilitatorModal(false)}
            />

            {/* Call to Action - Simple and direct */}
            {hasIncompleteRequiredActions && (
              <div className="mt-3 flex items-center gap-2 text-sm text-corporate-teal">
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium">Complete your {incompleteRequiredActions.length} required action{incompleteRequiredActions.length !== 1 ? 's' : ''} below</span>
              </div>
            )}
            
            {/* Daily Quote - Keep for inspiration */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex gap-3 items-start">
                <Quote className="w-5 h-5 text-corporate-teal/60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-300/90 text-sm italic leading-relaxed">
                    "{quote.quote}"
                  </p>
                  <p className="text-corporate-teal text-xs mt-1 font-medium">
                    — {quote.author}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual - Countdown to Session One with Date - Clean and simple */}
          <div className="hidden lg:flex flex-col items-center gap-3">
            {/* Countdown Circle - Simplified */}
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-corporate-teal to-emerald-600 shadow-corporate-teal/20">
              {isLaunch ? (
                <Rocket className="w-10 h-10 text-white" />
              ) : (
                <div className="text-center">
                  <span className="text-3xl font-bold text-white">{daysUntilStart}</span>
                  <span className="block text-xs text-white/80 font-medium">
                    {daysUntilStart === 1 ? 'day' : 'days'}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium">until Session One</span>
            
            {/* Session One Date - Show actual date from cohort */}
            {cohortStartDate && (
              <div className="text-center bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                <div className="flex items-center gap-1.5 text-white/90">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {new Date(cohortStartDate).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
            
            {/* Prep Status - Simple indicator without login counts */}
            <span className="text-[10px] text-slate-500">
              {isPrepComplete ? '✓ Prep Complete' : 'Prep in Progress'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrepWelcomeBanner;
