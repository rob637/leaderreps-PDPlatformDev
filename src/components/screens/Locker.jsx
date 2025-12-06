import React, { useMemo, useState } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { Card, PageLayout, NoWidgetsEnabled } from '../ui';
import { DashboardCard } from '../ui/DashboardCard';
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

const LockerDashboard = ({ setView }) => {
  const items = [
    { id: 'locker-wins-history', title: 'Wins History', description: 'Review your daily wins and accomplishments.', icon: Trophy, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { id: 'locker-scorecard-history', title: 'Scorecard History', description: 'Track your daily commitment scores over time.', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'locker-latest-reflection', title: 'Reflections', description: 'Read your past evening reflections.', icon: BookOpen, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'locker-reps-history', title: 'Reps History', description: 'See a log of all your completed reps.', icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map(item => (
        <DashboardCard 
          key={item.id}
          {...item}
          onClick={() => setView(item.id)}
        />
      ))}
    </div>
  );
};

const Locker = () => {
  const { dailyPracticeData, commitmentData, navigate, db, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();
  const [activeView, setActiveView] = useState('dashboard');

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
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Your Locker', path: null }
      ]}
      accentColor="teal"
      backTo={activeView === 'dashboard' ? 'dashboard' : null}
      onBack={activeView !== 'dashboard' ? () => setActiveView('dashboard') : undefined}
    >
      <WidgetRenderer widgetId="locker-controller" scope={scope} />
      <WidgetRenderer widgetId="locker-reminders" scope={scope} />
      
      {activeView === 'dashboard' ? (
        <LockerDashboard setView={setActiveView} />
      ) : (
        <WidgetRenderer widgetId={activeView} scope={scope} />
      )}
    </PageLayout>
  );
};

export default Locker;
