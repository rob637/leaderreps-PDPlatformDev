// src/components/screens/Dashboard4.jsx
// Dashboard 4: Fully Modular "The Arena"
// All sections are controlled by Feature Lab flags.

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
  MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
  Edit3, Loader, LayoutDashboard, Target, Layers, Sun, Moon, Clipboard, Zap, TrendingUp,
  Dumbbell, CheckCircle, PenTool, Quote, User
} from 'lucide-react';
import { useDashboard } from './dashboard/DashboardHooks.jsx';
import { useDevPlan } from '../../hooks/useDevPlan';
import { UnifiedAnchorEditorModal, CalendarSyncModal } from './dashboard/DashboardComponents.jsx';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { createWidgetSDK } from '../../services/WidgetSDK';
import { Card } from '../ui';
import { useLayout } from '../../providers/LayoutProvider';
import { LayoutToggle } from '../ui/LayoutToggle';
import PMReflectionWidget from '../widgets/PMReflectionWidget';
import { serverTimestamp } from 'firebase/firestore';

const DASHBOARD_FEATURES = [
  'welcome-message',
  'daily-quote',
  'am-bookend-header',
  'weekly-focus',
  'grounding-rep',
  'win-the-day',
  'daily-plan',
  'daily-leader-reps',
  'this-weeks-actions',
  'notifications',
  'pm-bookend-header',
  'progress-feedback',
  'pm-bookend',
  'scorecard'
];

const Dashboard = (props) => {
  const { 
    user, 
    dailyPracticeData, 
    updateDailyPracticeData,
    developmentPlanData,
    updateDevelopmentPlanData,
    globalMetadata,
    userData,
    navigate,
    db // <--- Added db here
  } = useAppServices();

  const { layoutMode } = useLayout();
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();

  // 2. Development Plan (moved up for scorecard calculation) - with Time Travel support
  const { 
    currentWeek: devPlanCurrentWeek, 
    userState: devPlanUserState, 
    simulatedNow,
    toggleItemComplete 
  } = useDevPlan();

  // DEBUG: Log the current week being returned
  console.log('[Dashboard] devPlanCurrentWeek:', devPlanCurrentWeek?.weekNumber, devPlanCurrentWeek?.id, devPlanCurrentWeek);
  console.log('[Dashboard] devPlanUserState:', devPlanUserState);

  // --- HOOKS ---
  const {
    // Identity & Anchors
    identityStatement,
    setIdentityStatement,
    habitAnchor,
    setHabitAnchor,
    whyStatement,
    setWhyStatement,
    handleSaveIdentity,
    handleSaveHabit,
    handleSaveWhy,
    
    // AM Bookend (Win the Day)
    morningWIN,
    setMorningWIN,
    morningWins, // New Array
    handleUpdateWin,
    handleSaveSingleWin,
    handleSaveAllWins,
    handleToggleWinComplete,
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
    reflectionBest,
    setReflectionBest,
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
    handleSaveReps,
    isSavingReps,

    // Scorecard
    scorecard,
    handleSaveScorecard,
    isSavingScorecard,
    
    // Grounding Rep (click-to-reveal)
    groundingRepCompleted,
    groundingRepRevealed,
    groundingRepConfetti,
    handleGroundingRepComplete,
    handleGroundingRepClose
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData,
    globalMetadata, // Pass globalMetadata for scorecard calculation
    devPlanCurrentWeek, // Pass Dev Plan current week for scorecard reps (12/05/25)
    db,
    userId: user?.uid
  });

  // --- LOCAL STATE ---
  const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false);
// ...existing code...
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [isWinSaved, setIsWinSaved] = useState(false);
  const [isEditingLIS, setIsEditingLIS] = useState(false);

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

  // Weekly Focus - uses Development Plan (already retrieved above) with Time Travel support
  // Get focus from current week in Dev Plan, with fallbacks
  const weeklyFocus = useMemo(() => {
    // Priority 1: Current week's focus from Development Plan (time-travel aware)
    if (devPlanCurrentWeek?.focus) {
      return devPlanCurrentWeek.focus;
    }
    // Priority 2: Admin Portal override
    if (globalMetadata?.weeklyFocus) {
      return globalMetadata.weeklyFocus;
    }
    // Priority 3: Legacy focusAreas from developmentPlanData
    if (developmentPlanData?.currentPlan?.focusAreas?.[0]?.name) {
      return developmentPlanData.currentPlan.focusAreas[0].name;
    }
    // Default
    return 'Leadership Identity';
  }, [devPlanCurrentWeek, globalMetadata, developmentPlanData]);
  
  // Also expose the current week number for the weekly-focus widget
  const currentWeekNumber = devPlanUserState?.currentWeekIndex != null 
    ? devPlanUserState.currentWeekIndex + 1 
    : null;

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
    Edit3, Loader, Sun, Moon, Zap, TrendingUp, Dumbbell, CheckCircle, PenTool, Quote, User,
    
    // Components
    Card,
    Checkbox,
    
    // Functions
    navigate,
    isFeatureEnabled,
    handleHabitCheck,
    setIsAnchorModalOpen,
    setIsCalendarModalOpen,
    isEditingLIS,
    setIsEditingLIS,
    handleToggleAdditionalRep,
    handleSaveReps,
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
    
    // Identity & Anchors Handlers
    setIdentityStatement,
    handleSaveIdentity,
    setHabitAnchor,
    handleSaveHabit,
    setWhyStatement,
    handleSaveWhy,
    
    // New Win Functions
    handleUpdateWin,
    handleSaveSingleWin,
    handleSaveAllWins,
    handleToggleWinComplete,
    
    // State
    weeklyFocus,
    currentWeekNumber,
    simulatedNow,
    devPlanCurrentWeek,
    currentWeek: devPlanCurrentWeek, // Alias for widgets expecting 'currentWeek'
    toggleItemComplete,
    hasLIS,
    lisRead,
    dailyRepName,
    dailyRepCompleted,
    additionalCommitments,
    isSavingReps,
    amWinCompleted,
    morningWIN,
    morningWins, // New Array
    isSavingWIN,
    isWinSaved,
    otherTasks,
    newTaskText,
    scorecard,
    handleSaveScorecard,
    isSavingScorecard,
    streakCount,
    reflectionGood,
    reflectionBetter,
    reflectionBest,
    setReflectionBest,
    isSavingBookend,
    
    // Grounding Rep (click-to-reveal)
    groundingRepCompleted,
    groundingRepRevealed,
    groundingRepConfetti,
    handleGroundingRepComplete,
    handleGroundingRepClose,
    
    // Identity & Anchors State
    identityStatement,
    habitAnchor,
    whyStatement,
    
    // Development Plan Data
    developmentPlanData,
    handleResetPlanStartDate: async () => {
      console.log('[Dashboard] handleResetPlanStartDate called');
      console.log('[Dashboard] updateDevelopmentPlanData exists:', !!updateDevelopmentPlanData);
      if (updateDevelopmentPlanData) {
        try {
          await updateDevelopmentPlanData({ startDate: serverTimestamp() });
          console.log('[Dashboard] startDate set successfully');
          alert("Plan Start Date reset to NOW. Time travel will be relative to this moment.");
          window.location.reload();
        } catch (error) {
          console.error('[Dashboard] Error setting startDate:', error);
          alert("Error setting start date: " + error.message);
        }
      } else {
        console.error('[Dashboard] updateDevelopmentPlanData is not available');
        alert("Error: updateDevelopmentPlanData function not available");
      }
    },
    
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
    'welcome-message': () => <WidgetRenderer widgetId="welcome-message" scope={scope} />,
    'daily-quote': () => <WidgetRenderer widgetId="daily-quote" scope={scope} />,
    'am-bookend-header': () => <WidgetRenderer widgetId="am-bookend-header" scope={scope} />,
    'weekly-focus': () => <WidgetRenderer widgetId="weekly-focus" scope={scope} />,
    'lis-maker': () => <WidgetRenderer widgetId="lis-maker" scope={scope} />,
    'grounding-rep': () => <WidgetRenderer widgetId="grounding-rep" scope={scope} />,
    'win-the-day': () => <WidgetRenderer widgetId="win-the-day" scope={scope} />,
    'daily-plan': () => <WidgetRenderer widgetId="daily-plan" scope={scope} />,
    'daily-leader-reps': () => <WidgetRenderer widgetId="daily-leader-reps" scope={scope} />,
    'this-weeks-actions': () => <WidgetRenderer widgetId="this-weeks-actions" scope={scope} />,
    'notifications': () => <WidgetRenderer widgetId="notifications" scope={scope} />,
    'pm-bookend-header': () => <WidgetRenderer widgetId="pm-bookend-header" scope={scope} />,
    'progress-feedback': () => <WidgetRenderer widgetId="progress-feedback" scope={scope} />,
    'pm-bookend': () => <WidgetRenderer widgetId="pm-bookend" scope={scope} />,
    'scorecard': () => <WidgetRenderer widgetId="scorecard" scope={scope} />,
    
    // Legacy / Optional
    'gamification': () => <WidgetRenderer widgetId="gamification" scope={scope} />,
    'exec-summary': () => <WidgetRenderer widgetId="exec-summary" scope={scope} />,
    'identity-builder': () => <WidgetRenderer widgetId="identity-builder" scope={scope} />,
    'habit-stack': () => <WidgetRenderer widgetId="habit-stack" scope={scope} />,
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
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen relative">
      <div className="max-w-[860px] mx-auto">
      {/* Layout Toggle - Desktop Only - COMMENTED OUT FOR NOW
      <div className="absolute top-6 right-6 z-10 hidden lg:block">
        <LayoutToggle />
      </div>
      */}

      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <LayoutDashboard className="w-8 h-8 text-corporate-teal" />
          <h1 className="text-3xl font-bold text-corporate-navy">
            Dashboard
          </h1>
          <LayoutDashboard className="w-8 h-8 text-corporate-teal" />
        </div>
        <p className="text-slate-600 mt-2">
          {greeting} Welcome to your daily practice.
        </p>
      </header>

      {/* Forced 1-col layout for now */}
      <div className="grid gap-6 grid-cols-1">
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
      </div>
    </div>
  );
};

export default Dashboard;