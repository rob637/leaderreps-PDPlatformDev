import React from 'react';
import { 
  Shield, Target, ArrowRight, Rocket, Calendar, Quote, Sparkles, 
  CheckCircle2, BookOpen, Video, Sunrise, Moon, LayoutDashboard,
  ChevronRight, Zap, GraduationCap, Users, PlayCircle
} from 'lucide-react';
import { useDailyPlan, ONBOARDING_MODULES } from '../../hooks/useDailyPlan';
import { useAppServices } from '../../services/useAppServices';

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
  const { prepPhaseInfo, phaseDayNumber, currentPhase, journeyDay, currentDayData, userState } = useDailyPlan();
  
  // Debug logging
  console.log('[PrepWelcomeBanner] Rendering with:', {
    currentPhase: currentPhase?.id,
    journeyDay,
    phaseDayNumber,
    hasOnboarding: !!prepPhaseInfo?.onboarding
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
    isAccelerated = false,
    isQuickStart = false,
    totalActions = 0,
    progressPercent = 0,
    cohortName = null,
    facilitator = null
  } = info;

  // Get user's first name for personalization
  const firstName = user?.displayName?.split(' ')[0] || 'Leader';
  
  // Excitement level determines visual styling
  const isHighExcitement = welcome.excitement === 'high' || welcome.excitement === 'launch';
  const isLaunch = welcome.excitement === 'launch';
  
  // Calculate effective journey day
  // 1. Clamp to phaseDayNumber so early birds don't get ahead of the official schedule
  const clampedJourneyDay = Math.min(journeyDay || 1, phaseDayNumber || 14);
  
  // Check for incomplete required actions
  const actions = currentDayData?.actions || [];
  
  const incompleteRequiredActions = actions.filter(action => {
    const isRequired = action.required !== false && !action.optional;
    
    // Determine which day's progress to check
    // In Prep Phase, actions are cumulative, so we need to check the day they were introduced
    const dayId = action.introducedOnDayId || currentDayData?.id;
    const dayProgress = userState?.dailyProgress?.[dayId];
    const completedItems = dayProgress?.itemsCompleted || [];
    
    const isCompleted = completedItems.includes(action.id);
    return isRequired && !isCompleted;
  });

  const hasIncompleteRequiredActions = incompleteRequiredActions.length > 0;
  
  // 2. Determine if prep is complete (more than 5 days of content AND no required actions pending)
  const isPrepComplete = clampedJourneyDay > 5 && !hasIncompleteRequiredActions;
  
  // 3. Effective day for content lookup (capped at 5)
  const effectiveJourneyDay = Math.min(clampedJourneyDay, 5);

  // 4. Get the correct onboarding module for this effective day
  const effectiveOnboarding = ONBOARDING_MODULES[effectiveJourneyDay];
  const onboarding = effectiveOnboarding || originalOnboarding;

  // Build personalized headline
  const getPersonalizedHeadline = () => {
    // After 5 days of prep, show "You're Ready!" message
    if (isPrepComplete) {
      return `You're Ready, ${firstName}!`;
    }

    // If past day 5 but not complete
    if (clampedJourneyDay > 5 && !isPrepComplete) {
        return `Finish Strong, ${firstName}!`;
    }

    // First day gets special welcome with name
    if (clampedJourneyDay === 1) {
      if (cohortName) {
        return `Welcome to ${cohortName}, ${firstName}!`;
      }
      return `Welcome to the Arena, ${firstName}!`;
    }
    // Days 2-5 use the onboarding headline if available
    if (onboarding?.headline) {
      return onboarding.headline;
    }
    // Fallback to welcome headline
    return welcome.headline;
  };

  // Get the subtext - different for Day 1 vs other days
  const getSubtext = () => {
    // After 5 days of prep, show countdown to QuickStart
    if (isPrepComplete) {
      if (daysUntilStart <= 0) {
        return "Your QuickStart begins today! Let's launch your leadership journey.";
      }
      if (daysUntilStart === 1) {
        return "QuickStart begins tomorrow! Keep practicing your daily rituals.";
      }
      return `You've completed your prep! ${daysUntilStart} days until QuickStart. Keep practicing your AM & PM Bookends.`;
    }

    // If past day 5 but not complete
    if (clampedJourneyDay > 5 && !isPrepComplete) {
        const count = incompleteRequiredActions.length;
        return `You have ${count} required action${count === 1 ? '' : 's'} left. Complete them to unlock your full readiness status.`;
    }

    if (clampedJourneyDay === 1) {
      // Day 1: Use the onboarding description as subtext
      return onboarding?.description || welcome.subtext;
    }
    // Days 2-5: Use onboarding description
    return onboarding?.description || welcome.subtext;
  };

  // Get icon for onboarding module
  const getModuleIcon = (moduleId) => {
    const icons = {
      'welcome': GraduationCap,
      'bookends': Sunrise,
      'reading': BookOpen,
      'video': Video,
      'recap': LayoutDashboard,
      'welcome-bookends': Zap,
      'content-recap': LayoutDashboard,
      'quick-start': Rocket
    };
    return icons[moduleId] || Target;
  };

  const ModuleIcon = onboarding ? getModuleIcon(onboarding.id) : Target;

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-xl mb-6 ${
      isLaunch 
        ? 'bg-gradient-to-br from-emerald-600 via-corporate-teal to-corporate-navy' 
        : isHighExcitement
          ? 'bg-gradient-to-br from-corporate-teal via-[#002E47] to-corporate-navy'
          : 'bg-gradient-to-br from-corporate-navy via-[#002E47] to-corporate-teal'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-corporate-teal rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        {isHighExcitement && (
          <>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-emerald-400 rounded-full blur-2xl animate-pulse delay-150"></div>
          </>
        )}
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          
          {/* Left Content */}
          <div className="flex-1 space-y-4">
            {/* Phase Badge with Cohort Name - Show journey day (1-5) or "Prep Complete" */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-corporate-teal font-bold tracking-wider text-xs uppercase">
                {isLaunch ? <Rocket className="w-4 h-4 animate-bounce" /> : <Shield className="w-4 h-4" />}
                <span>{isPrepComplete ? 'Prep Complete' : `Prep Day ${effectiveJourneyDay}`}</span>
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
              {isAccelerated && !isPrepComplete && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-bold">
                  {isQuickStart ? 'QUICK START' : 'ACCELERATED'}
                </span>
              )}
            </div>
            
            {/* Dynamic Headline - Personalized with user name and cohort */}
            <h2 className={`text-2xl sm:text-3xl font-bold text-white font-heading leading-tight ${isLaunch ? 'animate-pulse' : ''}`}>
              {getPersonalizedHeadline()}
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {getSubtext()}
            </p>

            {/* Facilitator Introduction - Show on Day 1 if available */}
            {effectiveJourneyDay === 1 && facilitator && (
              <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-corporate-teal to-corporate-navy flex items-center justify-center text-white font-bold text-sm">
                  {facilitator.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{facilitator.name}</p>
                  <p className="text-slate-400 text-xs">Your Facilitator</p>
                </div>
              </div>
            )}

            {/* Today's Focus - What's New (Skip the box on Day 1 since headline IS the welcome) */}
            {onboarding && effectiveJourneyDay > 1 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isQuickStart ? 'bg-yellow-400/20' : 'bg-corporate-teal/20'
                  }`}>
                    <ModuleIcon className={`w-5 h-5 ${
                      isQuickStart ? 'text-yellow-400' : 'text-corporate-teal'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {onboarding.title}
                    </h3>
                    
                    {/* Features being introduced */}
                    {onboarding.widgets && onboarding.widgets.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {onboarding.widgets.slice(0, 4).map((widget, idx) => {
                          const widgetLabels = {
                            'leaderProfile': 'Leader Profile',
                            'baselineAssessment': 'Baseline Assessment',
                            'todaysActions': 'Today\'s Actions',
                            'amBookend': 'AM Bookend',
                            'pmBookend': 'PM Bookend',
                            'readingContent': 'Reading Library',
                            'videoContent': 'Video Library',
                            'appOverview': 'App Guide'
                          };
                          
                          // Special handling for video content
                          if (widget === 'videoContent') {
                            return (
                              <span 
                                key={idx}
                                className="text-xs px-2 py-1 rounded-md bg-white/10 text-white/80 flex items-center gap-1"
                              >
                                <PlayCircle className="w-3 h-3 text-emerald-400" />
                                {widgetLabels[widget] || widget}
                                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 ml-1 font-medium tracking-wide">OPTIONAL</span>
                              </span>
                            );
                          }

                          return (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-1 rounded-md bg-white/10 text-white/80 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {widgetLabels[widget] || widget}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Tip */}
                    {onboarding.tip && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-slate-400">
                        <Sparkles className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span>{onboarding.tip}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Day 1: Show widgets inline without nested box */}
            {onboarding && effectiveJourneyDay === 1 && (
              <div className="flex flex-wrap gap-2">
                {onboarding.widgets?.slice(0, 4).map((widget, idx) => {
                  const widgetLabels = {
                    'leaderProfile': 'Leader Profile',
                    'baselineAssessment': 'Baseline Assessment',
                    'todaysActions': 'Today\'s Actions',
                    'amBookend': 'AM Bookend',
                    'pmBookend': 'PM Bookend'
                  };
                  return (
                    <span 
                      key={idx}
                      className="text-xs px-2 py-1 rounded-md bg-white/10 text-white/80 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {widgetLabels[widget] || widget}
                    </span>
                  );
                })}
              </div>
            )}
            
            {/* Day 1 Tip */}
            {onboarding?.tip && effectiveJourneyDay === 1 && (
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Sparkles className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>{onboarding.tip}</span>
              </div>
            )}



            {/* Call to Action */}
            {onboarding?.callToAction && (
              <div className="mt-3 flex items-center gap-2 text-sm text-corporate-teal">
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium">{onboarding.callToAction}</span>
              </div>
            )}
            
            {/* Daily Quote */}
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

          {/* Right Visual - Countdown Circle + Journey Progress */}
          <div className="hidden lg:flex flex-col items-center gap-4">
            {/* Countdown Circle */}
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${
              isLaunch 
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30 animate-pulse' 
                : isHighExcitement
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/30'
                  : 'bg-gradient-to-br from-corporate-teal to-emerald-600 shadow-corporate-teal/20'
            }`}>
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
            <span className="text-xs text-slate-400 font-medium">until QuickStart</span>
            
            {/* Journey Progress Dots (show 5 modules) */}
            {!isQuickStart && (
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((day) => (
                  <div 
                    key={day}
                    className={`w-2 h-2 rounded-full transition-all ${
                      effectiveJourneyDay >= day 
                        ? 'bg-corporate-teal' 
                        : 'bg-white/20'
                    }`}
                    title={`Prep Day ${day}`}
                  />
                ))}
              </div>
            )}
            <span className="text-[10px] text-slate-500">
              {isQuickStart ? 'Quick Start Mode' : isPrepComplete ? 'Prep Complete!' : `Prep ${effectiveJourneyDay} of 5`}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrepWelcomeBanner;
