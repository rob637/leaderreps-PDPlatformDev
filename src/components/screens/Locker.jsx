import React, { useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { Card, PageLayout, NoWidgetsEnabled } from '../ui';
import { Archive, CheckCircle, Calendar, Trophy, BookOpen, Dumbbell } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { useNotifications } from '../../providers/NotificationProvider';
import { Settings, Clock, User, Bell, AlertTriangle } from 'lucide-react';
import LockerProgressWidget from '../widgets/LockerProgressWidget';
import MyJourneyWidget from '../widgets/MyJourneyWidget';
import MySettingsWidget from '../widgets/MySettingsWidget';
import { useDailyPlan } from '../../hooks/useDailyPlan';

const LOCKER_FEATURES = [
  'locker-progress',
  'locker-wins-history',
  'locker-scorecard-history',
  'locker-latest-reflection',
  'locker-reps-history'
];

const Locker = () => {
  const { dailyPracticeData, commitmentData, navigate, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();
  const { currentDayData, prepRequirementsComplete, dailyPlan } = useDailyPlan();

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

    // Prep complete but still in pre-start: use explore-config settings (matches Dashboard logic)
    if (currentPhase?.id === 'pre-start' && prepRequirementsComplete?.allComplete) {
      const exploreDash = exploreConfig?.dashboard || {};
      
      // Helper to check visibility - matches Dashboard checkVisibility logic
      const checkVisibility = (widgetId, legacyKey, defaultVal = true) => {
        if (exploreDash[widgetId] !== undefined) return exploreDash[widgetId];
        if (legacyKey && exploreDash[legacyKey] !== undefined) return exploreDash[legacyKey];
        return defaultVal;
      };
      
      const showWinTheDay = checkVisibility('win-the-day', 'showWinTheDay', true);
      const showPMReflection = checkVisibility('pm-bookend', 'showPMReflection', true);
      
      return {
        showProfile: true,
        showReminders: true,
        showAMWins: showWinTheDay,
        showDailyReps: checkVisibility('daily-leader-reps', 'showDailyReps', true),
        // Scorecard appears when Win the Day appears (since it tallies wins/reps)
        showScorecard: showWinTheDay,
        showReflection: showPMReflection
      };
    }

    // Post prep-phase: show locker widgets when their dashboard counterpart is visible
    const showWinTheDay = dashboard.showWinTheDay ?? true;
    return {
      showProfile: true,
      showReminders: true,
      showAMWins: showWinTheDay,
      showDailyReps: dashboard.showDailyReps ?? true,
      // Scorecard appears when Win the Day appears
      showScorecard: showWinTheDay,
      showReflection: dashboard.showPMReflection ?? true
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

  const scope = {
    winsList,
    eveningBookend,
    commitmentHistory,
    reflectionHistory,
    repsHistory,
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
          case 'locker-reps-history':
            return lockerVisibility.showDailyReps;
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
    if (featureId === 'locker-progress') {
      return <LockerProgressWidget key={featureId} />;
    }
    return <WidgetRenderer key={featureId} widgetId={featureId} scope={scope} />;
  };

  return (
    <PageLayout
      title="The Locker"
      subtitle="Your repository of completed reps, wins, and reflections."
      icon={Archive}
      navigate={navigate}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Your Locker', path: null }
      ]}
      accentColor="teal"
    >
      {/* My Settings Widget - expandable profile & notifications at top */}
      <MySettingsWidget />
      
      {/* My Journey Widget - shows cohort and journey info */}
      <MyJourneyWidget />
      
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

export default Locker;
