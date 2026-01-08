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
import NotificationSettingsWidget from '../widgets/NotificationSettingsWidget';
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
  const { currentDayData } = useDailyPlan();

  // Day-based locker visibility from daily plan
  const lockerVisibility = useMemo(() => {
    // During Prep Phase (progress-based, not time-based), allow all enabled widgets to show
    // This ensures widgets enabled in Widget Lab appear as expected
    if (currentDayData?.phase === 'pre-start') {
      return {
        showProfile: true,
        showReminders: true,
        showAMWins: true,
        showDailyReps: true,
        showScorecard: true,
        showReflection: true
      };
    }

    return {
      showProfile: currentDayData?.locker?.showProfile ?? true,
      showReminders: currentDayData?.locker?.showReminders ?? true,
      showAMWins: currentDayData?.locker?.showAMWins ?? true,
      showDailyReps: currentDayData?.locker?.showDailyReps ?? true,
      showScorecard: currentDayData?.locker?.showScorecard ?? true,
      showReflection: currentDayData?.locker?.showReflection ?? true
    };
  }, [currentDayData]);

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
      {/* My Journey Widget - always show at top */}
      <MyJourneyWidget />
      
      <WidgetRenderer widgetId="locker-controller" scope={scope} />
      <NotificationSettingsWidget />
      
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
