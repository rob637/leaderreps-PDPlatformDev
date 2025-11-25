// src/components/screens/Dashboard4.jsx
// Dashboard 4: Fully Modular "The Arena"
// All sections are controlled by Feature Lab flags.

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
  MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
  Edit3, Loader, LayoutDashboard, Target, Layers, Sun, Moon, Clipboard
} from 'lucide-react';
import { useDashboard } from './dashboard/DashboardHooks.jsx';
import { UnifiedAnchorEditorModal, CalendarSyncModal } from './dashboard/DashboardComponents.jsx';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { createWidgetSDK } from '../../services/WidgetSDK';
import { Card } from '../shared/UI';

const DASHBOARD_FEATURES = [
  'daily-quote', 'welcome-message',
  'gamification', 'exec-summary', 'weekly-focus', 
  'identity-builder', 'habit-stack', 'win-the-day', 
  'notifications', 'scorecard', 'pm-bookend'
];

const Dashboard4 = (props) => {
  const { 
    user, 
    dailyPracticeData, 
    updateDailyPracticeData,
    developmentPlanData,
    globalMetadata,
    userData,
    navigate
  } = useAppServices();

  const { isFeatureEnabled, getFeatureOrder } = useFeatures();

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
  const [newTaskText, setNewTaskText] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
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
    
    // Functions
    navigate,
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
    newTaskText,
    scorecard,
    handleSaveScorecard,
    isSavingScorecard,
    streakCount,
    reflectionGood,
    reflectionBetter,
    isSavingBookend,
    
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
    'daily-quote': () => (
      <WidgetRenderer widgetId="daily-quote" scope={scope}>
        <Card title="Daily Inspiration" icon={MessageSquare} className="border-t-4 border-[#47A88D] h-full">
          <div className="flex flex-col justify-center h-full">
            <blockquote className="text-lg font-medium text-slate-700 italic text-center">
              "{dailyQuote}"
            </blockquote>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'welcome-message': () => <WidgetRenderer widgetId="welcome-message" scope={scope} />,
    'gamification': () => <WidgetRenderer widgetId="gamification" scope={scope} />,
    'exec-summary': () => (
      <WidgetRenderer widgetId="exec-summary" scope={scope}>
        <Card title="Executive Summary" icon={Trophy} className="border-t-4 border-[#002E47] h-full">
          <div className="bg-[#002E47] text-white p-6 rounded-xl shadow-inner flex items-center justify-between w-full">
            <div>
              <h2 className="text-lg font-bold mb-1">Impact</h2>
              <p className="text-blue-200 text-sm">Your leadership at a glance.</p>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-[#47A88D]">94%</div>
                <div className="text-xs text-blue-200 uppercase">Consistency</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#E04E1B]">12</div>
                <div className="text-xs text-blue-200 uppercase">Reps Done</div>
              </div>
            </div>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'weekly-focus': () => (
      <WidgetRenderer widgetId="weekly-focus" scope={scope}>
        <Card title="Weekly Focus" icon={Target} className="border-t-4 border-[#47A88D] h-full">
          <div className="flex flex-col justify-between h-full">
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                Current Focus
              </h2>
              <p className="text-2xl font-bold text-[#002E47]">
                {weeklyFocus}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Pulls from Development Plan
              </p>
            </div>
            <div className="mt-4 text-right">
              <button 
                onClick={() => navigate('development-plan')}
                className="text-teal-600 hover:text-teal-700 text-sm font-semibold flex items-center gap-1 justify-end ml-auto"
              >
                View Plan <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'identity-builder': () => (
      <WidgetRenderer widgetId="identity-builder" scope={scope}>
        <Card title="Identity Builder" icon={Flame} className="border-t-4 border-orange-500 h-full">
          <div className="space-y-3 text-left">
            {hasLIS ? (
              <Checkbox 
                checked={lisRead}
                onChange={() => handleHabitCheck('readLIS', !lisRead)}
                label="Grounding Rep: Read LIS"
                subLabel="Center yourself on your identity."
              />
            ) : (
              <div className="p-4 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-orange-800">Grounding Rep: Read LIS</p>
                  <p className="text-xs text-orange-600">No Identity Statement set yet.</p>
                </div>
                <button 
                  onClick={() => setIsAnchorModalOpen(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors"
                >
                  Enter / Save
                </button>
              </div>
            )}
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'habit-stack': () => (
      <WidgetRenderer widgetId="habit-stack" scope={scope}>
        <Card title="Habit Stack" icon={Layers} className="border-t-4 border-blue-500 h-full">
          <div className="space-y-3 text-left">
            {dailyRepName ? (
              <div className="relative">
                <Checkbox 
                  checked={dailyRepCompleted}
                  onChange={() => handleHabitCheck('completedDailyRep', !dailyRepCompleted)}
                  label={`Daily Rep: ${dailyRepName}`}
                  subLabel="Execute your targeted practice."
                />
                {isFeatureEnabled('calendar-sync') && (
                  <button 
                    onClick={() => setIsCalendarModalOpen(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#47A88D]" 
                    title="Sync to Calendar"
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-white opacity-75">
                <p className="font-semibold text-slate-700">Daily Rep</p>
                <p className="text-xs text-slate-500">
                  Daily reps are delivered based on your Focus/Dev Plan.
                  <button onClick={() => navigate('development-plan')} className="text-teal-600 ml-1 hover:underline">
                    Check Plan
                  </button>
                </p>
              </div>
            )}
            {/* Additional Reps */}
            {additionalCommitments.map((commitment, idx) => (
              <Checkbox 
                key={idx}
                checked={commitment.status === 'Committed'}
                onChange={() => handleToggleAdditionalRep(commitment.id, commitment.status)} 
                label={`Daily Rep: ${commitment.text || commitment.repId}`}
                subLabel="Additional commitment"
              />
            ))}
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'win-the-day': () => (
      <WidgetRenderer widgetId="win-the-day" scope={scope}>
        <Card title="AM Bookend - Win the Day" icon={Sun} className="border-t-4 border-yellow-500 h-full">
          <div className="space-y-6">
            {/* 1. Top Priority */}
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">
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
                    <input 
                      type="text"
                      value={morningWIN}
                      onChange={(e) => setMorningWIN(e.target.value)}
                      placeholder="What is the ONE thing that must get done?"
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
                      disabled={amWinCompleted}
                    />
                    {!amWinCompleted && morningWIN && (
                        <button 
                          onClick={handleSaveWINWrapper}
                          disabled={isSavingWIN || isWinSaved}
                          className={`p-3 rounded-xl transition-colors disabled:opacity-50 ${
                            isWinSaved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600'
                          }`}
                          title="Save WIN"
                        >
                          {isSavingWIN ? <Loader className="w-5 h-5 animate-spin" /> : 
                          isWinSaved ? <CheckSquare className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
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

            {/* 2 & 3. Next Most Important */}
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-400 uppercase text-left">
                  2 & 3. Next Most Important
                </label>
                {otherTasks.length > 0 && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" /> Auto-saved
                  </span>
                )}
              </div>
              
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
                        ? 'bg-teal-500 border-teal-500 text-white' 
                        : 'bg-white border-slate-200 text-slate-300 hover:border-teal-400'
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
                  <input 
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOtherTask()}
                    placeholder="Add another priority..."
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                  />
                  <button 
                    onClick={handleAddOtherTask}
                    disabled={!newTaskText.trim()}
                    className="p-3 bg-slate-200 text-slate-600 rounded-xl hover:bg-teal-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'notifications': () => (
      <WidgetRenderer widgetId="notifications" scope={scope}>
        <Card title="Notifications" icon={Bell} className="border-t-4 border-red-500 h-full">
          <div className="space-y-3 text-left">
            
            {/* Dev Note */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-500 italic text-center">
              Waiting for inputs to be defined and built. (Mock Data)
            </div>

            <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
              <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#002E47]">Yesterday's "Needs Work"</p>
                <p className="text-xs text-slate-500">Review your reflection from yesterday.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
              <div className="w-2 h-2 mt-2 rounded-full bg-teal-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#002E47]">Upcoming Feedback Practice</p>
                <p className="text-xs text-slate-500">Nov 29, 4:00 PM <span className="text-teal-600 font-bold ml-1">Register</span></p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#002E47]">New R&R Unlocked</p>
                <p className="text-xs text-slate-500">Check your resource library.</p>
              </div>
            </div>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'scorecard': () => (
      <WidgetRenderer widgetId="scorecard" scope={scope}>
        <Card title="Today Scorecard" icon={Clipboard} className="border-t-4 border-green-500 h-full">
          <div className="bg-[#002E47] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">I did my reps today</span>
                </div>
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
                <div className="flex items-center gap-3">
                  <span className="font-medium">I won the day</span>
                </div>
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
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-xl">{streakCount}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Day Streak</span>
              </div>
              <div className="text-xs text-slate-500">
                Keep it up!
              </div>
            </div>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'pm-bookend': () => (
      <WidgetRenderer widgetId="pm-bookend" scope={scope}>
        <Card title="PM Bookend - Reflection" icon={Moon} className="border-t-4 border-indigo-500 h-full">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-green-700 mb-2 text-left">
                What went well today?
              </label>
              <textarea 
                value={reflectionGood}
                onChange={(e) => setReflectionGood(e.target.value)}
                className="w-full p-3 bg-green-50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                rows={2}
                placeholder="Celebrate a win..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-orange-700 mb-2 text-left">
                What needs work?
              </label>
              <textarea 
                value={reflectionBetter}
                onChange={(e) => setReflectionBetter(e.target.value)}
                className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                rows={2}
                placeholder="Identify an improvement..."
              />
            </div>

            <button 
              onClick={handleSaveEveningBookend}
              disabled={isSavingBookend || (!reflectionGood && !reflectionBetter)}
              className="w-full py-3 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingBookend ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Journal Page
            </button>
            <p className="text-xs text-center text-slate-400">
              Saved to history in Locker
            </p>
          </div>
        </Card>
      </WidgetRenderer>
    )
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
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <LayoutDashboard className="w-8 h-8 text-[#47A88D]" />
          <h1 className="text-3xl font-bold text-[#002E47]">
            The Arena
          </h1>
          <LayoutDashboard className="w-8 h-8 text-[#47A88D]" />
        </div>
        <p className="text-slate-600 mt-2">
          {greeting} Welcome to your daily practice.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  );
};

export default Dashboard4;