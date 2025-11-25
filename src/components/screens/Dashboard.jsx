// src/components/screens/Dashboard.jsx
// RESTORED: Widget System Integration with Widget Lab
// Uses WidgetRenderer for dynamic, customizable widgets

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { useDashboard } from './dashboard/DashboardHooks';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { 
  UnifiedAnchorEditorModal, CalendarSyncModal, 
  ModeSwitch, StreakTracker, SaveIndicator
} from './dashboard/DashboardComponents';
import { 
  Sunrise, Moon, Flame, Trophy, Bell, Target, Calendar,
  CheckSquare, Square, Plus, Save, X, Loader, MessageSquare,
  Edit3, ChevronRight, ArrowRight, Anchor, Zap
} from 'lucide-react';

// --- ATOMIC COMPONENTS ---
import { 
  Button, Card, CardHeader, CardTitle, CardContent, CardFooter,
  Input, Textarea, Checkbox, Badge 
} from '../ui';

// Dashboard Widget IDs (from widgetTemplates.js)
const DASHBOARD_FEATURES = [
  'daily-quote',
  'welcome-message',
  'identity-builder',
  'habit-stack',
  'win-the-day',
  'notifications',
  'scorecard',
  'pm-bookend'
];

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const { 
    user, 
    dailyPracticeData, 
    updateDailyPracticeData,
    globalMetadata,
    navigate 
  } = useAppServices();

  const { isFeatureEnabled, getFeatureOrder, features } = useFeatures();

  // Use the core dashboard logic hook
  const {
    // Identity & Anchors
    identityStatement,
    setIdentityStatement,
    habitAnchor,
    whyStatement,
    handleSaveIdentity,
    handleSaveHabit,
    handleSaveWhy,
    
    // AM Bookend (Win the Day)
    morningWIN,
    setMorningWIN,
    otherTasks,
    handleToggleTask,
    handleRemoveTask,
    handleToggleWIN,
    handleAddTask,
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
    streakCoins,
    
    // Additional Reps
    additionalCommitments,
    handleToggleAdditionalRep,

    // Scorecard
    scorecard,
    handleSaveScorecard,
    isSavingScorecard,

    // Mode
    isArenaMode,
    handleToggleMode,
    isTogglingMode
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData,
    globalMetadata
  });

  // Modal states
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  // Computed values for widget scope
  const greeting = user?.displayName ? `Hey, ${user.displayName.split(' ')[0]}.` : 'Hey, Leader.';
  
  const dailyQuote = useMemo(() => {
    const quotes = globalMetadata?.SYSTEM_QUOTES || [];
    if (quotes.length === 0) return 'Leadership is influence.|John Maxwell';
    const today = new Date().getDate();
    return quotes[today % quotes.length];
  }, [globalMetadata]);

  const weeklyFocus = globalMetadata?.weeklyFocus || '';
  const hasLIS = !!identityStatement;
  const lisRead = habitsCompleted?.readLIS || false;
  
  const dailyRepName = useMemo(() => {
    const repId = dailyPracticeData?.dailyTargetRepId;
    if (!repId) return null;
    const catalog = Array.isArray(globalMetadata?.REP_LIBRARY) ? globalMetadata.REP_LIBRARY : [];
    const rep = catalog.find(r => r.id === repId);
    return rep ? rep.name : repId;
  }, [dailyPracticeData, globalMetadata]);

  const dailyRepCompleted = habitsCompleted?.completedDailyRep || false;
  const isWinSaved = !!(dailyPracticeData?.morningBookend?.dailyWIN);

  // Handle adding other task
  const handleAddOtherTask = () => {
    if (newTaskText.trim() && otherTasks.length < 5) {
      handleAddTask(newTaskText.trim());
      setNewTaskText('');
    }
  };

  // Widget scope - all data and functions available to dynamic widgets
  const scope = {
    // Icons
    CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
    MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
    Edit3, Loader, Anchor, Target, Zap, Sunrise, Moon,
    
    // Components
    Checkbox: ({ checked, onChange, label, subLabel, disabled }) => (
      <div 
        onClick={!disabled ? onChange : undefined}
        className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
          checked 
            ? 'bg-teal-50 border-corporate-teal' 
            : 'bg-white border-slate-200 hover:border-teal-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${
          checked ? 'bg-corporate-teal border-corporate-teal' : 'bg-white border-slate-300'
        }`}>
          {checked && <CheckSquare className="w-4 h-4 text-white" />}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${checked ? 'text-teal-900' : 'text-slate-700'}`}>
            {label}
          </p>
          {subLabel && (
            <p className="text-xs text-slate-500 mt-0.5">{subLabel}</p>
          )}
        </div>
      </div>
    ),
    Card,
    Button,
    
    // Functions
    navigate,
    isFeatureEnabled,
    handleHabitCheck: (key, val) => handleHabitToggle(key, val),
    setIsAnchorModalOpen: setShowAnchorModal,
    setIsCalendarModalOpen: setShowCalendarModal,
    handleToggleAdditionalRep,
    setMorningWIN,
    handleSaveWINWrapper: handleSaveWIN,
    handleToggleWIN,
    handleToggleTask,
    handleRemoveTask,
    setNewTaskText,
    handleAddOtherTask,
    setReflectionGood,
    setReflectionBetter,
    setReflectionBest,
    handleSaveEveningBookend,
    handleSaveScorecard,
    
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
    newTaskText,
    scorecard,
    streakCount,
    reflectionGood,
    reflectionBetter,
    reflectionBest,
    isSavingBookend,
    isSavingScorecard,
    
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
    
    // Options from feature config
    options: {}
  };

  // Get scope for a specific widget (adds widget-specific options)
  const getScopeForWidget = (widgetId) => {
    return {
      ...scope,
      options: features[widgetId]?.options || {}
    };
  };

  // Default renderers for each widget (fallback if no custom code)
  const renderers = {
    'daily-quote': () => (
      <WidgetRenderer widgetId="daily-quote" scope={getScopeForWidget('daily-quote')}>
        <div className="overflow-hidden bg-corporate-navy text-white rounded-2xl shadow-lg py-4 px-6 text-center">
          <p className="text-lg italic font-medium text-white/90">
            "{dailyQuote.split('|')[0]}"
          </p>
          {dailyQuote.split('|')[1] && (
            <p className="text-xs text-corporate-teal font-bold uppercase tracking-wider mt-2">
              — {dailyQuote.split('|')[1]}
            </p>
          )}
        </div>
      </WidgetRenderer>
    ),
    
    'welcome-message': () => (
      <WidgetRenderer widgetId="welcome-message" scope={getScopeForWidget('welcome-message')}>
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-corporate-navy mb-2">
            {greeting}
          </h1>
          <p className="text-slate-500 text-lg">
            Ready to win the day? Let's get to work.
          </p>
        </div>
      </WidgetRenderer>
    ),
    
    'win-the-day': () => (
      <WidgetRenderer widgetId="win-the-day" scope={getScopeForWidget('win-the-day')}>
        <Card title="AM Bookend - Win the Day" icon={Trophy} accent="orange">
          <div className="space-y-6">
            {/* Top Priority */}
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                1. Top Priority (The WIN)
              </label>
              <div className="flex gap-3">
                {amWinCompleted ? (
                  <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-900 line-through opacity-75">{morningWIN}</span>
                  </div>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <Input 
                      value={morningWIN}
                      onChange={(e) => setMorningWIN(e.target.value)}
                      placeholder="What is the ONE thing that must get done?"
                      disabled={amWinCompleted}
                    />
                    {!amWinCompleted && morningWIN && (
                      <Button 
                        onClick={handleSaveWIN}
                        disabled={isSavingWIN || isWinSaved}
                        variant={isWinSaved ? 'primary' : 'primary'}
                      >
                        {isSavingWIN ? <Loader className="w-5 h-5 animate-spin" /> : 
                        isWinSaved ? <CheckSquare className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </Button>
                    )}
                  </div>
                )}
                
                {morningWIN && !isSavingWIN && (
                  <button
                    onClick={handleToggleWIN}
                    className={`p-3 rounded-xl border-2 transition-colors ${
                      amWinCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'bg-white border-slate-200 text-slate-300 hover:border-green-400'
                    }`}
                  >
                    <CheckSquare className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Secondary Tasks */}
            <div className="space-y-3 text-left">
              <label className="block text-xs font-bold text-slate-400 uppercase">
                2 & 3. Next Most Important
              </label>
              
              {otherTasks.map((task, idx) => (
                <div key={task.id || idx} className="flex items-center gap-3">
                  <div className={`flex-1 p-3 rounded-xl border ${
                    task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
                  }`}>
                    <span className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {task.text}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-3 rounded-xl border-2 transition-colors ${
                      task.completed
                        ? 'bg-corporate-teal border-corporate-teal text-white' 
                        : 'bg-white border-slate-200 text-slate-300 hover:border-corporate-teal'
                    }`}
                  >
                    <CheckSquare className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleRemoveTask(task.id)}
                    className="p-3 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {otherTasks.length < 2 && (
                <div className="flex gap-2">
                  <Input 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOtherTask()}
                    placeholder="Add another priority..."
                  />
                  <Button 
                    onClick={handleAddOtherTask}
                    disabled={!newTaskText.trim()}
                    variant="secondary"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    
    'scorecard': () => (
      <WidgetRenderer widgetId="scorecard" scope={getScopeForWidget('scorecard')}>
        <div className="bg-corporate-navy rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10" />
          
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> Today Scorecard
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">I did my reps today</span>
              <div className="text-right">
                <span className="font-bold text-xl">{scorecard.reps.done}</span>
                <span className="text-slate-400 text-sm"> / {scorecard.reps.total}</span>
                <span className={`ml-2 text-sm font-bold ${
                  scorecard.reps.pct === 100 ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {scorecard.reps.pct}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">I won the day</span>
              <div className="text-right">
                <span className="font-bold text-xl">{scorecard.win.done}</span>
                <span className="text-slate-400 text-sm"> / {scorecard.win.total}</span>
                <span className={`ml-2 text-sm font-bold ${
                  scorecard.win.pct === 100 ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {scorecard.win.pct}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-corporate-orange" />
              <span className="font-bold text-xl">{streakCount}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Day Streak</span>
            </div>
            <Button 
              onClick={handleSaveScorecard}
              disabled={isSavingScorecard}
              variant="link"
              className="text-corporate-teal hover:text-teal-300"
            >
              {isSavingScorecard ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span className="ml-1 text-xs">Save to Locker</span>
            </Button>
          </div>
        </div>
      </WidgetRenderer>
    ),
    
    'pm-bookend': () => (
      <WidgetRenderer widgetId="pm-bookend" scope={getScopeForWidget('pm-bookend')}>
        <Card title="PM Bookend - Reflection" icon={Moon} accent="navy">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-green-700 mb-2 text-left">
                What went well today?
              </label>
              <Textarea 
                value={reflectionGood}
                onChange={(e) => setReflectionGood(e.target.value)}
                className="bg-green-50 border-green-100 focus:ring-green-500"
                rows={2}
                placeholder="Celebrate a win..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-corporate-orange mb-2 text-left">
                What needs work?
              </label>
              <Textarea 
                value={reflectionBetter}
                onChange={(e) => setReflectionBetter(e.target.value)}
                className="bg-orange-50 border-orange-100 focus:ring-orange-500"
                rows={2}
                placeholder="Identify an improvement..."
              />
            </div>

            <Button 
              onClick={handleSaveEveningBookend}
              disabled={isSavingBookend || (!reflectionGood && !reflectionBetter)}
              className="w-full"
            >
              {isSavingBookend ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save Journal Page
            </Button>
            <p className="text-xs text-center text-slate-400">
              Saved to history in Locker
            </p>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    
    'notifications': () => (
      <WidgetRenderer widgetId="notifications" scope={getScopeForWidget('notifications')}>
        <div className="text-left">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Notifications
            </h2>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-500 italic text-center">
              Notifications coming soon.
            </div>
          </div>
        </div>
      </WidgetRenderer>
    )
  };

  // Sort features by order, then filter enabled ones
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

  if (!user) return <div className="p-8 text-center">Please log in.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-corporate-navy">
                Welcome back, {user.displayName?.split(' ')[0] || 'Leader'}
              </h1>
              <p className="text-slate-500 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <StreakTracker 
                streakCount={streakCount} 
                streakCoins={streakCoins}
                userEmail={user.email}
              />
              <ModeSwitch 
                isArenaMode={isArenaMode} 
                onToggle={handleToggleMode} 
                isLoading={isTogglingMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - Dynamic Widgets */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {sortedFeatures.map(featureId => (
          <React.Fragment key={featureId}>
            {renderers[featureId] ? renderers[featureId]() : null}
          </React.Fragment>
        ))}
        
        {sortedFeatures.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg font-medium mb-2">No widgets enabled</p>
            <p className="text-sm">Go to Widget Lab in Admin Portal to enable dashboard widgets.</p>
          </div>
        )}
      </main>

      {/* MODALS */}
      <UnifiedAnchorEditorModal 
        isOpen={showAnchorModal}
        onClose={() => setShowAnchorModal(false)}
        initialIdentity={identityStatement}
        initialHabit={habitAnchor}
        initialWhy={whyStatement}
        onSave={async (anchors) => {
          if (anchors.identity) await handleSaveIdentity(anchors.identity);
          if (anchors.habit) await handleSaveHabit(anchors.habit);
          if (anchors.why) await handleSaveWhy(anchors.why);
          setShowAnchorModal(false);
        }}
      />

      <CalendarSyncModal 
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />

      <SaveIndicator show={showSaveIndicator} />
    </div>
  );
};

export default Dashboard;
