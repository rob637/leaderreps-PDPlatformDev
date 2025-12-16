// src/components/screens/Dashboard4.jsx
// Dashboard 4: Fully Modular "The Arena"
// All sections are controlled by Feature Lab flags.

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
  MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
  Edit3, Loader, LayoutDashboard, Target, Layers, Sun, Moon, Clipboard, Zap, TrendingUp,
  Dumbbell, CheckCircle, PenTool, Quote, User, AlertTriangle, Coffee
} from 'lucide-react';
import { useDashboard } from './dashboard/DashboardHooks.jsx';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { UnifiedAnchorEditorModal, CalendarSyncModal } from './dashboard/DashboardComponents.jsx';
import { MissedDaysModal } from './dashboard/MissedDaysModal';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { createWidgetSDK } from '../../services/WidgetSDK';
import { Card } from '../ui';
import { useLayout } from '../../providers/LayoutProvider';
import { LayoutToggle } from '../ui/LayoutToggle';
import PMReflectionWidget from '../widgets/PMReflectionWidget';
import { serverTimestamp } from 'firebase/firestore';
import { FadeIn, Stagger } from '../motion';
import { useAccessControlContext } from '../../providers/AccessControlProvider';
import PrepGate from '../ui/PrepGate';
import ProgramStatusWidget from '../widgets/ProgramStatusWidget';

const DASHBOARD_FEATURES = [
  'program-status-debug',
  'prep-welcome-banner',
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
  
  // Day-based Access Control (includes Prep Gate)
  const { 
    prepStatus, 
    isPrepComplete, 
    effectiveDayNumber,
    zoneVisibility 
  } = useAccessControlContext();

  // 2. Daily Plan (New Architecture - Three Phase System)
  const { 
    currentDayData, 
    currentDayNumber,
    currentPhase,       // NEW: Phase info { id, name, displayName, trackMissedDays }
    phaseDayNumber,     // NEW: Day within current phase
    missedDays,
    userState: dailyPlanUserState, 
    simulatedNow,
    toggleItemComplete 
  } = useDailyPlan();

  // DEBUG: Log phase info
  console.log('[Dashboard] Phase Info:', { 
    phase: currentPhase?.name, 
    phaseDayNumber, 
    currentDayNumber,
    hasCurrentDayData: !!currentDayData 
  });

  // Adapter for Legacy Dashboard Hooks
  const devPlanCurrentWeek = useMemo(() => {
    if (!currentDayData) return null;
    return {
      ...currentDayData,
      // Map 'actions' to 'dailyReps' for legacy widgets
      dailyReps: (currentDayData.actions || []).map(a => ({
        id: a.id,
        text: a.label,
        isCompleted: a.isCompleted
      })),
      // Ensure weekNumber exists (fallback to math if not in doc)
      weekNumber: currentDayData.weekNumber || Math.ceil(currentDayData.dayNumber / 7)
    };
  }, [currentDayData]);

  // DEBUG: Log the current day being returned
  console.log('[Dashboard] currentDayData:', currentDayData);
  console.log('[Dashboard] currentDayNumber:', currentDayNumber);

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
  const [isCatchUpModalOpen, setIsCatchUpModalOpen] = useState(false);
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
  const currentWeekNumber = currentDayData?.weekNumber || Math.ceil(currentDayNumber / 7);

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
      className={`flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer ${
        checked 
          ? 'bg-teal-50/80 shadow-sm border border-teal-200' 
          : 'bg-white shadow-sm hover:shadow-md border border-slate-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
        checked ? 'bg-corporate-teal' : 'bg-slate-100 border border-slate-200'
      }`}>
        {checked && <CheckSquare className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${checked ? 'text-teal-900' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-body)' }}>
          {label}
        </p>
        {subLabel && (
          <p className="text-xs text-slate-400 mt-1">{subLabel}</p>
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
    Edit3, Loader, Sun, Moon, Zap, TrendingUp, Dumbbell, CheckCircle, PenTool, Quote, User, AlertTriangle, Coffee,
    
    // Components
    Card,
    Checkbox,
    
    // Functions
    navigate,
    isFeatureEnabled,
    handleHabitCheck,
    setIsAnchorModalOpen,
    setIsCalendarModalOpen,
    setIsCatchUpModalOpen,
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
    currentDayNumber, // Legacy day number (negative for prep, positive for start)
    currentDayData, // Current day config from daily_plan_v1
    currentPhase, // NEW: Phase object { id, name, displayName, trackMissedDays }
    phaseDayNumber, // NEW: Day within current phase (1-14 for prep, 1-56 for start)
    missedDays, // Only populated during START phase (cohort-based)
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
    allQuotes: globalMetadata?.SYSTEM_QUOTES || [],
    dailyPracticeData // Pass dailyPracticeData to scope for widgets
  };

  // Helper to check visibility based on Daily Plan config
  const shouldShow = (widgetId, defaultVal = true) => {
    // Legacy Mapping for backward compatibility
    const LEGACY_WIDGET_MAP = {
      'am-bookend-header': 'showAMBookend',
      'weekly-focus': 'showWeeklyFocus',
      'lis-maker': 'showLISBuilder',
      'grounding-rep': 'showGroundingRep',
      'win-the-day': 'showWinTheDay',
      'daily-leader-reps': 'showDailyReps',
      'notifications': 'showNotifications',
      'pm-bookend-header': 'showPMReflection',
      'pm-bookend': 'showPMReflection',
      'scorecard': 'showScorecard'
    };

    // Force hide daily practice widgets during Prep Phase (Day < 1) - REMOVED for Lock & Key System
    // if (currentDayNumber < 1) {
    //   const PREP_HIDDEN_WIDGETS = [
    //     'am-bookend-header', 
    //     'win-the-day', 
    //     'daily-leader-reps', 
    //     'scorecard', 
    //     'pm-bookend-header',
    //     'pm-bookend',
    //     'grounding-rep',
    //     'lis-maker'
    //   ];
    //   if (PREP_HIDDEN_WIDGETS.includes(widgetId)) return false;
    // }

    if (!currentDayData?.dashboard) return defaultVal;

    // 1. Check for direct Widget ID match (New System)
    if (currentDayData.dashboard[widgetId] !== undefined) {
        return currentDayData.dashboard[widgetId];
    }

    // 2. Check for Legacy Key match
    const legacyKey = LEGACY_WIDGET_MAP[widgetId];
    if (legacyKey && currentDayData.dashboard[legacyKey] !== undefined) {
        return currentDayData.dashboard[legacyKey];
    }

    return defaultVal;
  };

  const renderers = {
    'dashboard-header': () => <WidgetRenderer widgetId="dashboard-header" scope={scope} />,
    'program-status-debug': () => <ProgramStatusWidget />,
    'prep-welcome-banner': () => shouldShow('prep-welcome-banner', false) ? <WidgetRenderer widgetId="prep-welcome-banner" scope={scope} /> : null,
    'welcome-message': () => shouldShow('welcome-message', true) ? <WidgetRenderer widgetId="welcome-message" scope={scope} /> : null,
    'daily-quote': () => shouldShow('daily-quote', true) ? <WidgetRenderer widgetId="daily-quote" scope={scope} /> : null,
    'am-bookend-header': () => shouldShow('am-bookend-header', true) ? <WidgetRenderer widgetId="am-bookend-header" scope={scope} /> : null,
    'weekly-focus': () => shouldShow('weekly-focus', true) ? <WidgetRenderer widgetId="weekly-focus" scope={scope} /> : null,
    'lis-maker': () => shouldShow('lis-maker', false) ? <WidgetRenderer widgetId="lis-maker" scope={scope} /> : null,
    'grounding-rep': () => shouldShow('grounding-rep', false) ? <WidgetRenderer widgetId="grounding-rep" scope={scope} /> : null,
    'win-the-day': () => shouldShow('win-the-day', true) ? <WidgetRenderer widgetId="win-the-day" scope={scope} /> : null,
    'daily-plan': () => <WidgetRenderer widgetId="daily-plan" scope={scope} />,
    'daily-leader-reps': () => shouldShow('daily-leader-reps', true) ? <WidgetRenderer widgetId="daily-leader-reps" scope={scope} /> : null,
    'this-weeks-actions': () => shouldShow('this-weeks-actions', true) ? <WidgetRenderer widgetId="this-weeks-actions" scope={scope} /> : null,
    'notifications': () => shouldShow('notifications', false) ? <WidgetRenderer widgetId="notifications" scope={scope} /> : null,
    'pm-bookend-header': () => shouldShow('pm-bookend-header', true) ? <WidgetRenderer widgetId="pm-bookend-header" scope={scope} /> : null,
    'progress-feedback': () => shouldShow('progress-feedback', true) ? <WidgetRenderer widgetId="progress-feedback" scope={scope} /> : null,
    'pm-bookend': () => shouldShow('pm-bookend', true) ? <WidgetRenderer widgetId="pm-bookend" scope={scope} /> : null,
    'scorecard': () => shouldShow('scorecard', true) ? <WidgetRenderer widgetId="scorecard" scope={scope} /> : null,
    
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
    <div className="p-5 sm:p-6 lg:p-8 space-y-5 bg-[#FAFBFC] min-h-screen relative">
      <div className="max-w-[860px] mx-auto">
      {/* Prep Gate - Block Day 1+ until prep complete */}
      {currentDayNumber >= 1 && !isPrepComplete ? (
        <PrepGate />
      ) : (
        <>
      {/* Layout Toggle - Desktop Only - COMMENTED OUT FOR NOW
      <div className="absolute top-6 right-6 z-10 hidden lg:block">
        <LayoutToggle />
      </div>
      */}

      <header className="mb-8 text-center">
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-center gap-4 mb-3">
            <LayoutDashboard className="w-7 h-7 text-corporate-teal" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-corporate-navy tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Dashboard
            </h1>
            <LayoutDashboard className="w-7 h-7 text-corporate-teal" />
          </div>
          <p className="text-slate-500 mt-2 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
            {greeting} Welcome to your daily practice.
          </p>
        </FadeIn>
      </header>

      {/* Forced 1-col layout for now - with staggered animation */}
      <Stagger staggerDelay={0.08} className="grid gap-5 grid-cols-1">
        {/* DYNAMIC FEATURES */}
        {sortedFeatures.map(featureId => (
          <React.Fragment key={featureId}>
            {renderers[featureId] ? renderers[featureId]() : null}
          </React.Fragment>
        ))}
      </Stagger>

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

      <MissedDaysModal 
        isOpen={isCatchUpModalOpen}
        onClose={() => setIsCatchUpModalOpen(false)}
        missedDays={missedDays}
        onToggleAction={toggleItemComplete}
      />
        </>
      )}
      </div>
    </div>
  );
};

export default Dashboard;