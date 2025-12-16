import React from 'react';
import { 
  Shield, Target, ArrowRight, Rocket, Calendar, Quote, Sparkles, 
  CheckCircle2, BookOpen, Video, Sunrise, Moon, LayoutDashboard,
  ChevronRight, Zap, GraduationCap, Users
} from 'lucide-react';
import { useDailyPlan } from '../../hooks/useDailyPlan';
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
  const { prepPhaseInfo, phaseDayNumber, currentPhase, journeyDay } = useDailyPlan();
  
  // Only show in Prep Phase
  if (currentPhase?.id !== 'pre-start') return null;
  
  const info = prepPhaseInfo || {};
  const { 
    daysUntilStart = 14, 
    welcome = { headline: "Your Journey Begins Now, Leader", subtext: "Preparing for your leadership transformation.", excitement: 'start' },
    quote = { quote: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek" },
    onboarding = null,
    isAccelerated = false,
    isQuickStart = false,
    totalActions = 0,
    progressPercent = 0,
    cohort = null,
    cohortName = null,
    facilitator = null
  } = info;

  // Get user's first name for personalization
  const firstName = user?.displayName?.split(' ')[0] || 'Leader';
  
  // Excitement level determines visual styling
  const isHighExcitement = welcome.excitement === 'high' || welcome.excitement === 'launch';
  const isLaunch = welcome.excitement === 'launch';

  // Build personalized headline
  const getPersonalizedHeadline = () => {
    // First day gets special welcome with name
    if (journeyDay === 1) {
      if (cohortName) {
        return `Welcome to ${cohortName}, ${firstName}!`;
      }
      return `Welcome to the Arena, ${firstName}!`;
    }
    // Use onboarding headline if available
    if (onboarding?.headline) {
      return onboarding.headline;
    }
    // Default welcome headline
    return welcome.headline;
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
            {/* Phase Badge with Cohort Name */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-corporate-teal font-bold tracking-wider text-xs uppercase">
                {isLaunch ? <Rocket className="w-4 h-4 animate-bounce" /> : <Shield className="w-4 h-4" />}
                <span>Prep Day {phaseDayNumber} of 14</span>
              </div>
              {cohortName && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {cohortName}
                </span>
              )}
              {isAccelerated && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-bold">
                  {isQuickStart ? 'QUICK START' : 'ACCELERATED'}
                </span>
              )}
              {journeyDay && journeyDay > 1 && !isAccelerated && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  Journey Day {journeyDay}
                </span>
              )}
            </div>
            
            {/* Dynamic Headline - Personalized with user name and cohort */}
            <h2 className={`text-2xl sm:text-3xl font-bold text-white font-heading leading-tight ${isLaunch ? 'animate-pulse' : ''}`}>
              {getPersonalizedHeadline()}
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {onboarding?.description || welcome.subtext}
            </p>

            {/* Facilitator Introduction - Show on Day 1 if available */}
            {journeyDay === 1 && facilitator && (
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

            {/* Today's Focus - What's New */}
            {onboarding && (
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

            {/* Progress Indicators */}
            <div className="flex flex-wrap gap-3 pt-2">
              {daysUntilStart > 0 ? (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  isHighExcitement 
                    ? 'bg-yellow-400/20 border-yellow-400/30' 
                    : 'bg-white/10 border-white/10'
                }`}>
                  <Calendar className={`w-4 h-4 ${isHighExcitement ? 'text-yellow-400' : 'text-corporate-teal'}`} />
                  <span className="text-xs font-bold text-white">
                    {daysUntilStart} {daysUntilStart === 1 ? 'day' : 'days'} until start
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-400/20 px-3 py-1.5 rounded-lg border border-emerald-400/30">
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Starting Today!</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Target className="w-4 h-4 text-corporate-teal" />
                <span className="text-xs font-medium text-white">{totalActions} prep tasks</span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-corporate-teal" />
                <span className="text-xs font-medium text-white">{progressPercent}% through prep</span>
              </div>
            </div>

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
            <span className="text-xs text-slate-400 font-medium">until Day 1</span>
            
            {/* Journey Progress Dots (show 5 modules) */}
            {!isQuickStart && (
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((day) => (
                  <div 
                    key={day}
                    className={`w-2 h-2 rounded-full transition-all ${
                      (journeyDay || 1) >= day 
                        ? 'bg-corporate-teal' 
                        : 'bg-white/20'
                    }`}
                    title={`Onboarding Day ${day}`}
                  />
                ))}
              </div>
            )}
            <span className="text-[10px] text-slate-500">
              {isQuickStart ? 'Quick Start Mode' : `Onboarding ${Math.min(journeyDay || 1, 5)} of 5`}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrepWelcomeBanner;
