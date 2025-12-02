import React, { useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { Card, PageLayout, NoWidgetsEnabled } from '../ui';
import { Archive, CheckCircle, Calendar, Trophy, BookOpen } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { useNotifications } from '../../providers/NotificationProvider';
import { Settings, Clock, User, Bell, AlertTriangle } from 'lucide-react';

const LOCKER_FEATURES = [
  'locker-wins-history',
  'locker-scorecard-history',
  'locker-latest-reflection',
  'locker-reps-history'
];

const Locker = () => {
  const { dailyPracticeData, commitmentData, navigate, db, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();

  // Arena Data
  // Assuming winsList is an array of { text, completed, date } objects
  // If it's not present, default to empty array
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
    isFeatureEnabled,
    useNotifications,
    Settings, Clock, User, Bell, AlertTriangle,
    user,
    developmentPlanData,
    updateDevelopmentPlanData
  };

  const sortedFeatures = useMemo(() => {
    return LOCKER_FEATURES
      .filter(id => isFeatureEnabled(id))
      .sort((a, b) => {
        const orderA = getFeatureOrder(a);
        const orderB = getFeatureOrder(b);
        if (orderA === orderB) return LOCKER_FEATURES.indexOf(a) - LOCKER_FEATURES.indexOf(b);
        return orderA - orderB;
      });
  }, [isFeatureEnabled, getFeatureOrder]);

  return (
    <PageLayout
      title="The Locker"
      subtitle="Your repository of completed reps, wins, and reflections."
      icon={Archive}
      navigate={navigate}
      backTo="dashboard"
      accentColor="teal"
    >
      <WidgetRenderer widgetId="locker-controller" scope={scope} />
      <WidgetRenderer widgetId="locker-reminders" scope={scope} />
      {sortedFeatures.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {sortedFeatures.map(featureId => (
            <WidgetRenderer key={featureId} widgetId={featureId} scope={scope} />
          ))}
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
