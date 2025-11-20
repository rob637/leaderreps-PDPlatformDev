// src/components/screens/Dashboard4.jsx
// Dashboard 4: Fully Modular "The Arena"
// All sections are controlled by Feature Lab flags.

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
  MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
  Edit3, Loader
} from 'lucide-react';
import { COLORS } from './dashboard/dashboardConstants.js';
import { useDashboard } from './dashboard/DashboardHooks.jsx';
import { UnifiedAnchorEditorModal, StreakTracker } from './dashboard/DashboardComponents.jsx';
import { useFeatures } from '../../providers/FeatureProvider';

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

  const { features, isFeatureEnabled } = useFeatures();

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
    streakCoins,
    
    // Additional Reps
    additionalCommitments,
    handleToggleAdditionalRep
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData
  });

  // --- LOCAL STATE ---
  const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false);
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
  const weeklyFocus = developmentPlanData?.currentPlan?.focusAreas?.[0]?.name || 'Leadership Fundamentals';

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

  // 4. Scorecard Logic
  const scorecard = useMemo(() => {
    // "I did my reps today"
    // Components: LIS + Daily Rep + Additional Commitments
    let repsTotal = 1; // LIS is always a rep
    let repsDone = lisRead ? 1 : 0;
    
    if (dailyRepName) {
      repsTotal++;
      if (dailyRepCompleted) repsDone++;
    }
    
    // Add additional commitments
    if (additionalCommitments && additionalCommitments.length > 0) {
      repsTotal += additionalCommitments.length;
      repsDone += additionalCommitments.filter(c => c.status === 'Committed').length;
    }
    
    const repsPct = Math.round((repsDone / repsTotal) * 100);

    // "I won the day"
    // Components: Top Priority (WIN) + Other Tasks
    let winTotal = 1; // Top Priority
    let winDone = amWinCompleted ? 1 : 0;
    
    if (otherTasks && otherTasks.length > 0) {
      winTotal += otherTasks.length;
      winDone += otherTasks.filter(t => t.completed).length;
    }
    
    const winPct = Math.round((winDone / winTotal) * 100);

    return {
      reps: { done: repsDone, total: repsTotal, pct: repsPct },
      win: { done: winDone, total: winTotal, pct: winPct }
    };
  }, [lisRead, dailyRepName, dailyRepCompleted, additionalCommitments, amWinCompleted, otherTasks]);

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

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 1. HEADER */}
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#002E47]">
            {greeting}
          </h1>
          <p className="text-lg text-slate-500 italic font-medium border-l-4 border-teal-500 pl-4 py-1">
            "{dailyQuote}"
          </p>
        </header>

        {/* FEATURE: Gamification Engine */}
        {isFeatureEnabled('gamification') && (
          <div className="flex justify-end">
             <StreakTracker streakCount={streakCount} streakCoins={streakCoins} userEmail={user?.email} />
          </div>
        )}

        {/* FEATURE: Executive Summary Widget */}
        {isFeatureEnabled('exec-summary') && (
          <div className="bg-corporate-navy text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Executive Summary</h2>
              <p className="text-blue-200 text-sm">Your leadership impact at a glance.</p>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-corporate-teal">94%</div>
                <div className="text-xs text-blue-200 uppercase">Consistency</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-corporate-orange">12</div>
                <div className="text-xs text-blue-200 uppercase">Reps Done</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN (Main Work) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 2. WEEKLY FOCUS */}
            {isFeatureEnabled('weekly-focus') && (
              <section>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                    This Week's Focus
                  </h2>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-[#002E47]">
                      {weeklyFocus}
                    </p>
                    <button 
                      onClick={() => navigate('development-plan')}
                      className="text-teal-600 hover:text-teal-700 text-sm font-semibold flex items-center gap-1"
                    >
                      View Plan <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 3. AM BOOKEND - DO MY REPS */}
            {(isFeatureEnabled('identity-builder') || isFeatureEnabled('habit-stack')) && (
              <section className="text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-[#002E47]">
                    AM Bookend - Lock-in Your Day
                  </h2>
                </div>
                
                <div className="space-y-3 text-left">
                  {/* Grounding Rep */}
                  {isFeatureEnabled('identity-builder') && (
                    hasLIS ? (
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
                    )
                  )}

                  {/* Daily Rep */}
                  {isFeatureEnabled('habit-stack') && (
                    dailyRepName ? (
                      <div className="relative">
                        <Checkbox 
                          checked={dailyRepCompleted}
                          onChange={() => handleHabitCheck('completedDailyRep', !dailyRepCompleted)}
                          label={`Daily Rep: ${dailyRepName}`}
                          subLabel="Execute your targeted practice."
                        />
                        {/* FEATURE: Calendar Integration */}
                        {isFeatureEnabled('calendar-sync') && (
                          <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-corporate-teal" title="Sync to Calendar">
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
                    )
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
              </section>
            )}

            {/* 4. WIN THE DAY - 1-2-3 */}
            {isFeatureEnabled('win-the-day') && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-[#002E47]">
                    Win the Day (Today's 1-2-3)
                  </h2>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                  
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
                            disabled={amWinCompleted} // Can't edit if checked (unless we add uncheck logic)
                          />
                          {/* Save Button (Initial '+') */}
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
                      
                      {/* Checkbox to complete (only shows if saved/has value) */}
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
              </section>
            )}

          </div>

          {/* RIGHT COLUMN (Stats & Reflection) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* 5. NOTIFICATIONS */}
            {isFeatureEnabled('notifications') && (
              <section className="text-left">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Notifications
                  </h2>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3 text-left">
                  {/* Mock Notifications based on wireframe */}
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
              </section>
            )}

            {/* 6. TODAY SCORECARD */}
            {isFeatureEnabled('scorecard') && (
              <section>
                <div className="bg-[#002E47] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10" />
                  
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" /> Today Scorecard
                  </h2>

                  <div className="space-y-4">
                    {/* Reps Score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          scorecard.reps.pct === 100 ? 'bg-green-500 border-green-500' : 'border-slate-500'
                        }`}>
                          {scorecard.reps.pct === 100 && <CheckSquare className="w-3 h-3 text-white" />}
                        </div>
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

                    {/* Win Score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          scorecard.win.pct === 100 ? 'bg-green-500 border-green-500' : 'border-slate-500'
                        }`}>
                          {scorecard.win.pct === 100 && <CheckSquare className="w-3 h-3 text-white" />}
                        </div>
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
                    {/* Placeholder for 0 Day Streak from wireframe? Maybe "Best Streak"? */}
                    <div className="text-xs text-slate-500">
                      Keep it up!
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 7. PM BOOKEND - REFLECTION */}
            {isFeatureEnabled('pm-bookend') && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-[#002E47]">
                    PM Bookend - Reflection
                  </h2>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-green-700 mb-2">
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
                    <label className="block text-sm font-bold text-orange-700 mb-2">
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
              </section>
            )}

          </div>
        </div>
      </div>

      {/* Anchor Editor Modal */}
      <UnifiedAnchorEditorModal
        isOpen={isAnchorModalOpen}
        onClose={() => setIsAnchorModalOpen(false)}
        onSave={async (data) => {
          await Promise.all([
            handleSaveIdentity(data.identity),
            handleSaveHabit(data.habit),
            handleSaveWhy(data.why)
          ]);
          setIsAnchorModalOpen(false);
        }}
        initialIdentity={identityStatement}
        initialHabit={habitAnchor}
        initialWhy={whyStatement}
      />
    </div>
  );
};

export default Dashboard4;