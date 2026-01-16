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
  const { currentDayData, prepRequirementsComplete } = useDailyPlan();

  // Day-based locker visibility - tied to dashboard widget visibility
  // Locker widgets only show once their corresponding dashboard widget has been shown
  const lockerVisibility = useMemo(() => {
    const dashboard = currentDayData?.dashboard || {};
    
    // During Prep Phase, hide bookend-related locker widgets UNLESS prep is complete
    // (matches Dashboard logic - once prep is complete, widgets become available)
    if (currentDayData?.phase?.id === 'pre-start' && !prepRequirementsComplete?.allComplete) {
      return {
        showProfile: true,
        showReminders: true,
        showAMWins: false,      // Win the Day not available during prep
        showDailyReps: false,   // Daily Reps not available during prep
        showScorecard: false,   // Scorecard not available during prep
        showReflection: false   // PM Reflection not available during prep
      };
    }

    // Post prep-phase OR prep complete: show locker widgets when their dashboard counterpart is visible
    // Default to true (matching Dashboard shouldShow defaults) so widgets appear unless explicitly hidden
    return {
      showProfile: true,
      showReminders: true,
      showAMWins: dashboard.showWinTheDay ?? true,
      showDailyReps: dashboard.showDailyReps ?? true,
      showScorecard: dashboard.showScorecard ?? true,
      showReflection: dashboard.showPMReflection ?? true
    };
  }, [currentDayData, prepRequirementsComplete]);

  // Arena Data
  // Combine history with today's completed wins so they appear immediately
  const historyWins = dailyPracticeData?.winsList || [];
  const todayWins = dailyPracticeData?.morningBookend?.wins?.filter(w => w.completed && w.text) || [];
  
  const todayDate = dailyPracticeData?.date || new Date().toLocaleDateString('en-CA');
  const formattedTodayWins = todayWins.map(w => ({
    id: w.id,
    text: w.text,
    completed: true,
    date: todayDate
  }));
  
  const winsList = [...formattedTodayWins, ...historyWins];
  
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
