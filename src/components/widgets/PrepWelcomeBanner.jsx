import React, { useMemo, useState } from 'react';
import { 
  Target, Rocket, Calendar, 
  ChevronRight, Users, Info
} from 'lucide-react';
import { useDailyPlan, ONBOARDING_MODULES } from '../../hooks/useDailyPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
import { useAppServices } from '../../services/useAppServices';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import FacilitatorProfileModal from './FacilitatorProfileModal';

/**
 * PrepWelcomeBanner - Progress-Based Onboarding for Prep Phase
 * 
 * Shows content based on user's COMPLETION STATUS (not days or logins):
 * - Not started: Welcome message, encourage to start Required Prep
 * - In progress: Show remaining required items
 * - Complete: Congratulations, show Explore section is unlocked
 * 
 * Includes cohort name and facilitator info if available.
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
  
  // Only show in Prep Phase
  if (currentPhase?.id !== 'pre-start') {
    return null;
  }
  
  const info = prepPhaseInfo || {};
  const { 
    daysUntilStart = 0, 
    cohortName = null,
    cohortStartDate = null,
    facilitator = null
  } = info;

  // Get user's first name for personalization - prefer profile data over displayName
  const firstName = leaderProfile?.firstName || user?.displayName?.split(' ')[0] || 'Leader';
  
  const incompleteRequiredActions = actions.filter(action => {
    // An action is required if it's not explicitly optional AND not explicitly marked as not required.
    const isRequired = action.required !== false && !action.optional;
    
    // If not required, skip it immediately
    if (!isRequired) return false;

    // Interactive items (Leader Profile & Baseline Assessment) have autoComplete flag
    // that tracks their completion status directly
    if (action.isInteractive && action.autoComplete) {
      return false; // Already completed
    }
    
    // Check completion status using the unified action progress system
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
  
  // Determine if prep is complete using the completion-based flag
  // Progress-based: not day or time dependent
  const isPrepComplete = prepRequirementsComplete?.allComplete || false;

  // Build headline - progress-based, not day-based
  const getPersonalizedHeadline = () => {
    // Prep complete - show success!
    if (isPrepComplete) {
      return `You're Ready, ${firstName}!`;
    }
    
    // Get remaining count
    const remainingCount = prepRequirementsComplete?.remaining?.length || incompleteRequiredActions.length;
    
    // In progress - show encouraging message
    if (remainingCount > 0 && remainingCount < (prepRequirementsComplete?.completedCount || 0) + remainingCount) {
      return `Keep Going, ${firstName}!`;
    }
    
    // Just starting
    if (cohortName) {
      return `Welcome to ${cohortName}!`;
    }
    return `Welcome, ${firstName}!`;
  };

  // Get the subtext - progress-based messaging
  const getSubtext = () => {
    // After prep requirements complete, show success message with explanation of new functionality
    if (isPrepComplete) {
      if (daysUntilStart <= 0) {
        return "Session One begins today! Let's launch your leadership journey.";
      }
      return `Great work! You've unlocked your daily leadership tools. Use Win the Day to set your priorities each morning, explore additional content below, and end your day with a PM Reflection.`;
    }

    // Show remaining count
    const remaining = prepRequirementsComplete?.remaining || [];
    const count = remaining.length;
    
    if (count > 0) {
      const completed = prepRequirementsComplete?.completedCount || 0;
      if (completed > 0) {
        return `You've completed ${completed} of ${completed + count} required items. Keep going!`;
      }
      return `Complete ${count} required item${count === 1 ? '' : 's'} to get ready for Session One.`;
    }
    
    return "Complete your Required Prep to unlock additional tools to explore.";
  };

  // Launch mode for Session One (when cohort starts today)
  const isLaunch = daysUntilStart <= 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-md border ${
      isLaunch 
        ? 'bg-corporate-light-gray border-corporate-teal/40' 
        : 'bg-corporate-light-gray border-corporate-teal/20'
    }`}>
      {/* Simplified Background Pattern - Clean and minimal */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-corporate-teal rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
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
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {cohortName}
                </span>
              )}
              {isPrepComplete && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-bold">
                  ✓ READY
                </span>
              )}
            </div>
            
            {/* Dynamic Headline - Clean and direct */}
            <h2 className="text-2xl sm:text-3xl font-bold text-corporate-navy font-heading leading-tight">
              {getPersonalizedHeadline()}
            </h2>
            
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
              {getSubtext()}
            </p>

            {/* Facilitator Introduction - Show if available */}
            {facilitator && (
              <button
                onClick={() => setShowFacilitatorModal(true)}
                className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 rounded-lg px-4 py-3 border border-slate-200 hover:border-slate-300 transition-all group text-left"
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
                  <p className="text-corporate-navy font-medium text-sm group-hover:text-corporate-teal transition-colors">{facilitator.name}</p>
                  <p className="text-slate-500 text-xs">Your Facilitator • Tap for details</p>
                </div>
                <Info className="w-4 h-4 text-slate-400 group-hover:text-corporate-teal transition-colors" />
              </button>
            )}

            {/* Facilitator Profile Modal */}
            <FacilitatorProfileModal
              facilitator={facilitator}
              cohortName={cohortName}
              isOpen={showFacilitatorModal}
              onClose={() => setShowFacilitatorModal(false)}
            />
          </div>

          {/* Right Visual - Countdown to Session One with Date - Clean and simple */}
          <div className="hidden lg:flex flex-col items-center gap-3">
            {/* Countdown Circle - Simplified */}
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-corporate-teal to-emerald-600 shadow-corporate-teal/20">
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
            <span className="text-xs text-slate-500 font-medium">until Session One</span>
            
            {/* Session One Date - Show actual date from cohort */}
            {cohortStartDate && (
              <div className="text-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-600">
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
            

          </div>

        </div>
      </div>
    </div>
  );
};

export default PrepWelcomeBanner;
