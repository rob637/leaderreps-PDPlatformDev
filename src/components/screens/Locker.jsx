import React, { useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { Card, PageLayout, NoWidgetsEnabled } from '../ui';
import { CheckCircle, Calendar, Trophy, BookOpen, Dumbbell } from 'lucide-react';
import { LockerIcon } from '../icons';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { useNotifications } from '../../providers/NotificationProvider';
import { Settings, Clock, User, Bell, AlertTriangle } from 'lucide-react';
import { Compass, ArrowRight } from 'lucide-react';
import MyJourneyWidget from '../widgets/MyJourneyWidget';
import MySettingsWidget from '../widgets/MySettingsWidget';
import ConditioningHistoryWidget from '../widgets/ConditioningHistoryWidget';
import PracticeRepsHistoryWidget from '../widgets/PracticeRepsHistoryWidget';
import AscentSmsPrefsWidget from '../widgets/AscentSmsPrefsWidget';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useDevPlan } from '../../hooks/useDevPlan';
import { useRevampFlag } from '../../hooks/useRevampFlag';

const LOCKER_FEATURES = [
  'locker-wins-history',
  'locker-scorecard-history',
  'locker-latest-reflection',
  'locker-conditioning-history',  // Replaced locker-reps-history with weekly conditioning history
  'locker-practice-reps'  // Practice a Rep (Conditioning Light) history
];

const Locker = () => {
  const { dailyPracticeData, commitmentData, navigate, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const { isFeatureEnabled, getFeatureOrder, getWidgetHelpText } = useFeatures();
  const { currentDayData, prepRequirementsComplete, dailyPlan } = useDailyPlan();
  const { currentWeek: _devPlanCurrentWeek } = useDevPlan();
  const revampEnabled = useRevampFlag();

  // Get explore-config for widget visibility after prep completion (matches Dashboard)
  const exploreConfig = useMemo(() => {
    return dailyPlan?.find(d => d.id === 'explore-config');
  }, [dailyPlan]);

  // Day-based locker visibility - tied to dashboard widget visibility
  // Locker widgets only show once their corresponding dashboard widget has been shown
  const lockerVisibility = useMemo(() => {
    const dashboard = currentDayData?.dashboard || {};
    const currentPhase = currentDayData?.phase;
    
    // During Prep Phase, hide bookend-related locker widgets UNLESS prep is complete
    if (currentPhase?.id === 'pre-start' && !prepRequirementsComplete?.allComplete) {
      return {
        showProfile: true,
        showReminders: true,
        showAMWins: false,      // Win the Day not available during prep
        showDailyReps: false,   // Daily Reps not available during prep
        showScorecard: false,   // Scorecard not available during prep
        showReflection: false   // PM Reflection not available during prep
      };
    }

    // Helper to check visibility - matches Dashboard checkVisibility logic
    // Checks both widget ID (new system) and legacy key (old system) for compatibility
    const checkVisibility = (dashboardObj, widgetId, legacyKey, defaultVal = true) => {
      if (dashboardObj[widgetId] !== undefined) return dashboardObj[widgetId];
      if (legacyKey && dashboardObj[legacyKey] !== undefined) return dashboardObj[legacyKey];
      return defaultVal;
    };

    // Prep complete but still in pre-start: use explore-config settings (matches Dashboard logic)
    if (currentPhase?.id === 'pre-start' && prepRequirementsComplete?.allComplete) {
      const exploreDash = exploreConfig?.dashboard || {};
      
      const showWinTheDay = checkVisibility(exploreDash, 'win-the-day', 'showWinTheDay', true);
      const showPMReflection = checkVisibility(exploreDash, 'pm-bookend', 'showPMReflection', true);
      
      return {
        showProfile: true,
        showReminders: true,
        showAMWins: showWinTheDay,
        showDailyReps: checkVisibility(exploreDash, 'daily-leader-reps', 'showDailyReps', true),
        // Scorecard appears when Win the Day appears (since it tallies wins/reps)
        showScorecard: showWinTheDay,
        showReflection: showPMReflection
      };
    }

    // Post prep-phase: show locker widgets when their dashboard counterpart is visible
    // Check both widget ID (new system) and legacy key (old system) for compatibility
    const showWinTheDay = checkVisibility(dashboard, 'win-the-day', 'showWinTheDay', true);
    const showPMReflection = checkVisibility(dashboard, 'pm-bookend', 'showPMReflection', true);
    
    return {
      showProfile: true,
      showReminders: true,
      showAMWins: showWinTheDay,
      showDailyReps: checkVisibility(dashboard, 'daily-leader-reps', 'showDailyReps', true),
      // Scorecard appears when Win the Day appears
      showScorecard: showWinTheDay,
      showReflection: showPMReflection
    };
  }, [currentDayData, prepRequirementsComplete, exploreConfig]);

  // Arena Data
  // winsList already contains today's data (saved via handleSaveAllWins in Dashboard)
  // No need to combine with morningBookend - that would create duplicates
  const winsList = dailyPracticeData?.winsList || [];
  
  // Evening Bookend Data
  const eveningBookend = dailyPracticeData?.eveningBookend || {};
  
  // Scorecard Data
  // Updated to read from dailyPracticeData.scorecardHistory instead of commitmentData
  const commitmentHistory = dailyPracticeData?.scorecardHistory || commitmentData?.history || [];

  // Reps History Data
  const repsHistory = dailyPracticeData?.repsHistory || [];

  // Reflection History Data - read directly from dailyPracticeData
  const reflectionHistory = dailyPracticeData?.reflectionHistory || [];

  // === LIVE SCORECARD CALCULATION ===
  // Calculate today's scorecard in real-time from current state
  // Scorecard only tracks Win the Day items (not Daily Reps - those have their own widget)
  const liveScorecard = useMemo(() => {
    // Get morning wins from daily practice data
    const morningWins = dailyPracticeData?.morningBookend?.wins || [];
    const definedWins = morningWins.filter(w => w.text && w.text.trim().length > 0);
    const winTotal = definedWins.length > 0 ? definedWins.length : 3;
    const winDone = definedWins.filter(w => w.completed).length;
    
    return {
      score: `${winDone}/${winTotal}`,
      winsDone: winDone,
      winsTotal: winTotal
    };
  }, [dailyPracticeData?.morningBookend?.wins]);

  const scope = {
    winsList,
    eveningBookend,
    commitmentHistory,
    reflectionHistory,
    repsHistory,
    liveScorecard, // Add live scorecard for real-time "Today" display
    Card,
    Trophy,
    CheckCircle,
    Calendar,
    BookOpen,
    Dumbbell,
    isFeatureEnabled,
    useNotifications,
    Settings, Clock, User, Bell, AlertTriangle,
    user,
    developmentPlanData,
    updateDevelopmentPlanData,
    lockerVisibility // Pass day-based visibility to widgets
  };

  // Filter features based on day-based visibility
  const sortedFeatures = useMemo(() => {
    return LOCKER_FEATURES
      .filter(id => {
        // Always show the Practice Reps widget — no feature flag, always-on.
        if (id === 'locker-practice-reps') return true;

        // First check feature flag
        if (!isFeatureEnabled(id)) return false;
        
        // Then check day-based visibility
        switch (id) {
          case 'locker-wins-history':
            return lockerVisibility.showAMWins;
          case 'locker-scorecard-history':
            return lockerVisibility.showScorecard;
          case 'locker-latest-reflection':
            return lockerVisibility.showReflection;
          case 'locker-conditioning-history':
            return lockerVisibility.showDailyReps; // Uses same visibility as old reps widget
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const orderA = getFeatureOrder(a);
        const orderB = getFeatureOrder(b);
        if (orderA === orderB) return LOCKER_FEATURES.indexOf(a) - LOCKER_FEATURES.indexOf(b);
        return orderA - orderB;
      });
  }, [isFeatureEnabled, getFeatureOrder, lockerVisibility]);

  // Custom renderer for special widgets
  const renderFeature = (featureId) => {
    // Special handling for conditioning history (React component, not template)
    if (featureId === 'locker-conditioning-history') {
      return <ConditioningHistoryWidget key={featureId} helpText={getWidgetHelpText(featureId)} />;
    }
    if (featureId === 'locker-practice-reps') {
      return <PracticeRepsHistoryWidget key={featureId} helpText={getWidgetHelpText(featureId)} />;
    }
    return <WidgetRenderer key={featureId} widgetId={featureId} scope={scope} />;
  };

  return (
    <PageLayout
      title="The Locker"
      subtitle="Your settings, journey progress, and completed reps."
      icon={LockerIcon}
      navigate={navigate}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Your Locker', path: null }
      ]}
      accentColor="teal"
    >
      {/* My Settings Widget - expandable profile & notifications at top */}
      <div className="mb-6">
        <MySettingsWidget />
      </div>

      {revampEnabled && (
        <div className="mb-6">
          <AscentSmsPrefsWidget />
        </div>
      )}

      {/* My Journey Widget - shows cohort and journey info, hide prep progress (shown on Dashboard) */}
      <div className="mb-6">
        <MyJourneyWidget showPrepProgress={false} />
      </div>

      {/* Leadership Identity reference card — links to the LIS builder */}
      <LeadershipIdentityCard
        leadershipIdentity={dailyPracticeData?.leadershipIdentity}
        legacyAnchor={dailyPracticeData?.identityAnchor}
        onOpen={() => navigate && navigate('identity-statement')}
      />
      
      <WidgetRenderer widgetId="locker-controller" scope={scope} />
      
      {sortedFeatures.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {sortedFeatures.map(featureId => renderFeature(featureId))}
        </div>
      ) : (
        (!isFeatureEnabled('locker-reminders') && !isFeatureEnabled('locker-controller')) && (
          <NoWidgetsEnabled moduleName="Your Locker" />
        )
      )}
    </PageLayout>
  );
};

// ---------------------------------------------------------------------------
// Leadership Identity reference card
// ---------------------------------------------------------------------------
const LeadershipIdentityCard = ({ leadershipIdentity, legacyAnchor, onOpen }) => {
  const li = leadershipIdentity || null;
  const anchorWord = li?.anchor?.word || '';
  const anchorStatement = (li?.anchor?.statement || '').trim();
  const evidence = Array.isArray(li?.evidence) ? li.evidence.filter(Boolean) : [];
  const hasStructured = !!anchorStatement;
  const hasLegacy = !hasStructured && typeof legacyAnchor === 'string' && legacyAnchor.trim().length > 0;
  const empty = !hasStructured && !hasLegacy;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left p-5 rounded-2xl border-2 border-corporate-navy/15 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 hover:border-corporate-teal hover:shadow-md transition group"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-corporate-navy/10 dark:bg-corporate-teal/20 rounded-lg">
            <Compass className="w-4 h-4 text-corporate-navy dark:text-corporate-teal" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-corporate-navy dark:text-corporate-teal">
            Leadership Identity
          </span>
          {anchorWord && (
            <span className="ml-2 text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-corporate-navy/10 dark:bg-corporate-teal/20 text-corporate-navy dark:text-corporate-teal">
              {anchorWord}
            </span>
          )}
          <ArrowRight className="ml-auto w-4 h-4 text-slate-400 group-hover:text-corporate-teal group-hover:translate-x-0.5 transition" />
        </div>

        {empty ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You haven&rsquo;t built your Leadership Identity yet. Tap to start &mdash; 4 short prompts.
          </p>
        ) : (
          <>
            <p className="text-base md:text-lg font-serif italic leading-snug text-slate-900 dark:text-slate-100">
              &ldquo;{hasStructured ? anchorStatement : legacyAnchor}&rdquo;
            </p>
            {evidence.length > 0 && (
              <ul className="mt-3 space-y-1">
                {evidence.slice(0, 3).map((e, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                    <span className="text-emerald-600 mt-0.5">&#10003;</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            )}
            {hasLegacy && (
              <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                Tap to upgrade to a structured Leadership Identity (Anchor &middot; Evidence &middot; Edge).
              </p>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default Locker;
