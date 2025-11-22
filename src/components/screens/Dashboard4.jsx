// src/components/screens/Dashboard4.jsx
// Dashboard 4: Fully Modular "The Arena"
// All sections are controlled by Feature Lab flags.

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
  MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
  Edit3, Loader
} from 'lucide-react';
import { Card, Button } from '../shared/UI';
import { ProgressBar } from './developmentplan/DevPlanComponents';
import { COLORS } from './developmentplan/devPlanConstants';
import ProgressBreakdown from './developmentplan/ProgressBreakdown';
import { useDashboard } from './dashboard/DashboardHooks.jsx';
import { UnifiedAnchorEditorModal, CalendarSyncModal } from './dashboard/DashboardComponents.jsx';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { createWidgetSDK } from '../../services/WidgetSDK';

const DASHBOARD_FEATURES = [
  'daily-quote', 'welcome-message',
  'gamification', 'exec-summary', 'weekly-focus', 
  'identity-builder', 'habit-stack', 'win-the-day', 
  'notifications', 'scorecard', 'pm-bookend'
];

const Dashboard4 = () => {
  const { 
    user, 
    dailyPracticeData, 
    updateDailyPracticeData,
    developmentPlanData,
    globalMetadata,
    navigate
  } = useAppServices();

  const { isFeatureEnabled, getFeatureOrder } = useFeatures();

  // --- PLAN DATA ---
  const plan = useMemo(() => developmentPlanData?.currentPlan || {}, [developmentPlanData]);
  const cycle = plan.cycle || 1;
  const summary = useMemo(() => plan.summary || { 
    totalSkills: 0, 
    completedSkills: 0, 
    progress: 0,
    currentWeek: 0
  }, [plan]);

  // --- HOOKS ---
  const {
    // Identity & Anchors
    identityStatement,
    habitAnchor,
    whyStatement,
    handleSaveIdentity,
    handleSaveHabit,
    handleSaveWhy,
    
    // AM Bookend (Win the Day)
    morningWIN,
    setMorningWIN,
    otherTasks,
    handleAddTask,
    handleToggleTask,
    handleRemoveTask,
    handleToggleWIN,
    handleSaveWIN,
    isSavingWIN,
    amWinCompleted,
    
    // PM Bookend (Reflection)
    reflectionGood,
    setReflectionGood,
    reflectionBetter,
    setReflectionBetter,
    handleSaveEveningBookend,
    isSavingBookend,
    
    // Habits / Reps
    habitsCompleted,
    handleHabitToggle,
    
    // Streak
    streakCount,
    
    // Additional Reps
    additionalCommitments,
    handleToggleAdditionalRep,

    // Scorecard
    scorecard,
    handleSaveScorecard,
    isSavingScorecard
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData,
    globalMetadata // Pass globalMetadata for scorecard calculation
  });

  // --- LOCAL STATE ---
  const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [isWinSaved, setIsWinSaved] = useState(false);

  // --- WRAPPERS FOR AUTO-SAVE ---
  const handleHabitCheck = async (key, value) => {
    // 1. Update local state immediately for UI responsiveness
    handleHabitToggle(key, value);
    
    // 2. Save to Firestore
    // We construct the new object manually because state update might lag
    const newHabits = { ...habitsCompleted, [key]: value };
    
    try {
      await updateDailyPracticeData({
        'eveningBookend.habits': newHabits
      });
    } catch (error) {
      console.error('Error auto-saving habit:', error);
      // Revert on error (optional, but good practice)
      handleHabitToggle(key, !value);
    }
  };

  // --- DERIVED DATA ---
  
  // 1. Greeting & Quote
  const greeting = `Hey, ${user?.displayName?.split(' ')[0] || 'Leader'}.`;
  const dailyQuote = useMemo(() => {
    const quotes = globalMetadata?.SYSTEM_QUOTES || [];
    if (quotes.length === 0) return "Leadership is a practice, not a position.";
    // Simple random quote based on date to keep it consistent for the day
    const today = new Date().getDate();
    return quotes[today % quotes.length];
  }, [globalMetadata]);

  // 2. Weekly Focus
  // Prioritize Admin Portal setting (globalMetadata), fallback to Dev Plan, then default
  const weeklyFocus = globalMetadata?.weeklyFocus || developmentPlanData?.currentPlan?.focusAreas?.[0]?.name || 'Feedback';

  // 3. Daily Reps Logic
  const hasLIS = !!identityStatement;
  const lisRead = habitsCompleted?.readLIS || false;
  
  // Get the "Daily Rep" name (Target Rep)
  const dailyRepName = useMemo(() => {
    const repId = dailyPracticeData?.dailyTargetRepId;
    if (!repId) return null;
    // Try to find name in catalog if available, else use ID
    const catalog = Array.isArray(globalMetadata?.REP_LIBRARY) ? globalMetadata.REP_LIBRARY : [];
    const rep = catalog.find(r => r.id === repId);
    return rep ? rep.name : repId;
  }, [dailyPracticeData, globalMetadata]);

  const dailyRepCompleted = habitsCompleted?.completedDailyRep || false;

  // 4. Scorecard Logic - Moved to DashboardHooks
  // const scorecard = ... (removed)

  // --- HANDLERS ---

  const handleSaveWINWrapper = async () => {
    await handleSaveWIN();
    setIsWinSaved(true);
    setTimeout(() => setIsWinSaved(false), 2000);
  };

  const handleAddOtherTask = () => {
    if (newTaskText.trim()) {
      handleAddTask(newTaskText);
      setNewTaskText('');
    }
  };

  // --- RENDER HELPERS ---
  
  const Checkbox = ({ checked, onChange, label, subLabel, disabled }) => (
    <div 
      onClick={!disabled ? onChange : undefined}
      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
        checked 
          ? 'bg-teal-50 border-teal-500' 
          : 'bg-white border-gray-200 hover:border-teal-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${
        checked ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-300'
      }`}>
        {checked && <CheckSquare className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${checked ? 'text-teal-900' : 'text-gray-700'}`}>
          {label}
        </p>
        {subLabel && (
          <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>
        )}
      </div>
    </div>
  );

  // --- DYNAMIC FEATURE RENDERING ---

  const sortedFeatures = useMemo(() => {
    return DASHBOARD_FEATURES
      .filter(id => isFeatureEnabled(id))
      .sort((a, b) => {
        const orderA = getFeatureOrder(a);
        const orderB = getFeatureOrder(b);
        if (orderA === orderB) return DASHBOARD_FEATURES.indexOf(a) - DASHBOARD_FEATURES.indexOf(b);
        return orderA - orderB;
      });
  }, [isFeatureEnabled, getFeatureOrder]);

  const sdk = useMemo(() => createWidgetSDK({ navigate, user }), [navigate, user]);

  const scope = {
    // SDK (New Standard)
    sdk,

    // Icons
    CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
    MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
    Edit3, Loader,
    
    // Components
    Checkbox,
    Card,
    Button,
    ProgressBar,

    // Constants
    COLORS,
    
    // Functions
    navigate,
    onScan: () => navigate('development-plan'),
    onTimeline: () => navigate('development-plan'),
    onDetail: () => navigate('development-plan'),
    setShowBreakdown,
    onEditPlan: () => navigate('development-plan'),

    isFeatureEnabled,
    handleHabitCheck,
    setIsAnchorModalOpen,
    setIsCalendarModalOpen,
    handleToggleAdditionalRep,
    setMorningWIN,
    handleSaveWINWrapper,
    handleToggleWIN,
    handleToggleTask,
    handleRemoveTask,
    setNewTaskText,
    handleAddOtherTask,
    setReflectionGood,
    setReflectionBetter,
    handleSaveEveningBookend,
    
    // State
    weeklyFocus,
    hasLIS,
    lisRead,
    dailyRepName,
    dailyRepCompleted,
    additionalCommitments,
    amWinCompleted,
    morningWIN,
    isSavingWIN,
    isWinSaved,
    otherTasks,
    winsList: otherTasks, // Alias
    newTaskText,
    scorecard,
    handleSaveScorecard,
    isSavingScorecard,
    streakCount,
    reflectionGood,
    reflectionBetter,
    isSavingBookend,
    eveningBookend: dailyPracticeData?.eveningBookend || {},
    commitmentHistory: additionalCommitments || [],

    // Plan Data
    plan,
    cycle,
    summary,
    
    // User Data
    user: user ? {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    } : null,
    greeting,
    dailyQuote,
    allQuotes: globalMetadata?.SYSTEM_QUOTES || []
  };

  const renderers = {
    'dashboard-header': () => <WidgetRenderer widgetId="dashboard-header" scope={scope} />,
    'daily-quote': () => <WidgetRenderer widgetId="daily-quote-v2" scope={scope} />,
    'welcome-message': () => <WidgetRenderer widgetId="welcome-message-v2" scope={scope} />,
    'gamification': () => <WidgetRenderer widgetId="gamification" scope={scope} />,
    'exec-summary': () => <WidgetRenderer widgetId="exec-summary" scope={scope} />,
    'weekly-focus': () => <WidgetRenderer widgetId="weekly-focus" scope={scope} />,
    'identity-builder': () => <WidgetRenderer widgetId="identity-builder" scope={scope} />,
    'habit-stack': () => <WidgetRenderer widgetId="habit-stack" scope={scope} />,
    'win-the-day': () => <WidgetRenderer widgetId="win-the-day-v2" scope={scope} />,
    'notifications': () => <WidgetRenderer widgetId="notifications-v2" scope={scope} />,
    'scorecard': () => <WidgetRenderer widgetId="scorecard-v2" scope={scope} />,
    'pm-bookend': () => <WidgetRenderer widgetId="pm-bookend-v2" scope={scope} />
  };

  const handleSaveAnchors = async (data) => {
    await Promise.all([
      handleSaveIdentity(data.identity),
      handleSaveHabit(data.habit),
      handleSaveWhy(data.why)
    ]);
    setIsAnchorModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* DYNAMIC FEATURES */}
        {sortedFeatures.map(featureId => (
          <React.Fragment key={featureId}>
            {renderers[featureId] ? renderers[featureId]() : null}
          </React.Fragment>
        ))}

      </div>

      {/* Anchor Editor Modal */}
      <UnifiedAnchorEditorModal
        isOpen={isAnchorModalOpen}
        initialIdentity={identityStatement}
        initialHabit={habitAnchor}
        initialWhy={whyStatement}
        onSave={handleSaveAnchors}
        onClose={() => setIsAnchorModalOpen(false)}
      />

      <CalendarSyncModal 
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* Plan Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 max-w-3xl mx-auto">
                <div className="mb-4">
                    <Button onClick={() => setShowBreakdown(false)} variant="nav-back" size="sm">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Dashboard
                    </Button>
                </div>
                <ProgressBreakdown plan={plan} globalMetadata={globalMetadata} />
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard4;