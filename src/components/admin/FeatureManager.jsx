import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, FlaskConical, ArrowUp, ArrowDown, Edit3, Plus, Trash2, RefreshCw, Save, Flame, Bell, Target, Calendar, Moon, BookOpen, Play, Book, Video, FileText, Users, MessageSquare, UserPlus, Search, Radio, History, BarChart2, Bot, Cpu, Dumbbell, TrendingUp } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetEditorModal from './WidgetEditorModal';

const FeatureManager = () => {
  const { features, toggleFeature, updateFeatureOrder, saveFeature, deleteFeature, isFeatureEnabled } = useFeatures();
  const [editingWidget, setEditingWidget] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newWidget, setNewWidget] = useState({ name: '', id: '', group: 'dashboard', description: '' });

  const WIDGET_TEMPLATES = {
    'gamification': `
<div className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg">
  <div className="flex justify-between items-center mb-4">
    <h3 className="font-bold text-indigo-100">Arena Mode</h3>
    <span className="bg-indigo-800 px-2 py-1 rounded text-xs font-mono">Lvl 12</span>
  </div>
  <div className="flex justify-between text-center">
    <div>
      <div className="text-2xl font-bold text-yellow-400">1,250</div>
      <div className="text-xs text-indigo-300">XP</div>
    </div>
    <div>
      <div className="text-2xl font-bold text-orange-400">🔥 5</div>
      <div className="text-xs text-indigo-300">Streak</div>
    </div>
    <div>
      <div className="text-2xl font-bold text-teal-400">#3</div>
      <div className="text-xs text-indigo-300">Rank</div>
    </div>
  </div>
</div>
    `,
    'exec-summary': `
<div className="bg-corporate-navy text-white p-6 rounded-2xl shadow-lg flex items-center justify-between w-full">
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
    `,
    'weekly-focus': `
<section className="w-full">
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
    `,
    'identity-builder': `
<section className="text-left w-full">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
      <Flame className="w-5 h-5" />
    </div>
    <h2 className="text-xl font-bold text-[#002E47]">
      Identity Builder
    </h2>
  </div>
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
</section>
    `,
    'habit-stack': `
<section className="text-left w-full">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
      <Flame className="w-5 h-5" />
    </div>
    <h2 className="text-xl font-bold text-[#002E47]">
      Habit Stack
    </h2>
  </div>
  <div className="space-y-3 text-left">
    {dailyRepName ? (
      <div className="relative">
        <Checkbox 
          checked={dailyRepCompleted}
          onChange={() => handleHabitCheck('completedDailyRep', !dailyRepCompleted)}
          label={\`Daily Rep: \${dailyRepName}\`}
          subLabel="Execute your targeted practice."
        />
        {isFeatureEnabled('calendar-sync') && (
          <button 
            onClick={() => setIsCalendarModalOpen(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-corporate-teal" 
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
        label={\`Daily Rep: \${commitment.text || commitment.repId}\`}
        subLabel="Additional commitment"
      />
    ))}
  </div>
</section>
    `,
    'win-the-day': `
<section className="w-full">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
      <Trophy className="w-5 h-5" />
    </div>
    <h2 className="text-xl font-bold text-[#002E47]">
      AM Bookend - Win the Day
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
              disabled={amWinCompleted}
            />
            {!amWinCompleted && morningWIN && (
                <button 
                  onClick={handleSaveWINWrapper}
                  disabled={isSavingWIN || isWinSaved}
                  className={\`p-3 rounded-xl transition-colors disabled:opacity-50 \${
                    isWinSaved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600'
                  }\`}
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
            className={\`p-3 rounded-xl border-2 transition-colors \${
              amWinCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'bg-white border-slate-200 text-slate-300 hover:border-green-400'
            }\`}
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
          <div className={\`flex-1 p-3 rounded-xl border \${
            task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
          }\`}>
            <span className={\`font-medium \${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}\`}>
              {task.text}
            </span>
          </div>
          <button
            onClick={() => handleToggleTask(task.id)}
            className={\`p-3 rounded-xl border-2 transition-colors \${
              task.completed
                ? 'bg-teal-500 border-teal-500 text-white' 
                : 'bg-white border-slate-200 text-slate-300 hover:border-teal-400'
            }\`}
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
    `,
    'notifications': `
<section className="text-left w-full">
  <div className="flex items-center gap-2 mb-4">
    <Bell className="w-5 h-5 text-slate-400" />
    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
      Notifications
    </h2>
  </div>
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3 text-left">
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
    `,
    'scorecard': `
<section className="w-full">
  <div className="bg-[#002E47] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10" />
    
    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
      <Trophy className="w-5 h-5 text-yellow-400" /> Today Scorecard
    </h2>

    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium">I did my reps today</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-xl">{scorecard.reps.done}</span>
          <span className="text-slate-400 text-sm"> / {scorecard.reps.total}</span>
          <span className={\`ml-2 text-sm font-bold \${
            scorecard.reps.pct === 100 ? 'text-green-400' : 'text-slate-400'
          }\`}>
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
          <span className={\`ml-2 text-sm font-bold \${
            scorecard.win.pct === 100 ? 'text-green-400' : 'text-slate-400'
          }\`}>
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
</section>
    `,
    'pm-bookend': `
<section className="w-full">
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
</section>
    `,
    'calendar-sync': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <Calendar className="w-4 h-4" />
    Today's Schedule
  </h3>
  <div className="space-y-3">
    <div className="flex gap-3 border-l-2 border-blue-500 pl-3">
      <div className="text-xs text-gray-500 font-mono">09:00</div>
      <div>
        <p className="text-sm font-bold text-gray-800">Team Sync</p>
        <p className="text-xs text-gray-500">Zoom Room A</p>
      </div>
    </div>
    <div className="flex gap-3 border-l-2 border-purple-500 pl-3">
      <div className="text-xs text-gray-500 font-mono">11:30</div>
      <div>
        <p className="text-sm font-bold text-gray-800">Leadership Coaching</p>
        <p className="text-xs text-gray-500">with Coach Mike</p>
      </div>
    </div>
  </div>
</div>
    `,
    'course-library': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <BookOpen className="w-4 h-4 text-teal-600" />
    Course Library
  </h3>
  <div className="space-y-3">
    <div className="flex gap-3 items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
        <Play className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">Strategic Thinking</p>
        <p className="text-xs text-gray-500">Module 3 • 15 mins</p>
      </div>
    </div>
    <div className="flex gap-3 items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
        <Play className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">Team Dynamics</p>
        <p className="text-xs text-gray-500">Module 1 • 20 mins</p>
      </div>
    </div>
  </div>
</div>
    `,
    'reading-hub': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <Book className="w-4 h-4 text-orange-600" />
    Reading Hub
  </h3>
  <div className="flex gap-3 overflow-x-auto pb-2">
    <div className="min-w-[100px] bg-gray-100 rounded-lg p-2 text-center">
      <div className="w-full h-16 bg-gray-300 rounded mb-2"></div>
      <p className="text-xs font-bold text-gray-700 truncate">Atomic Habits</p>
    </div>
    <div className="min-w-[100px] bg-gray-100 rounded-lg p-2 text-center">
      <div className="w-full h-16 bg-gray-300 rounded mb-2"></div>
      <p className="text-xs font-bold text-gray-700 truncate">Dare to Lead</p>
    </div>
    <div className="min-w-[100px] bg-gray-100 rounded-lg p-2 text-center">
      <div className="w-full h-16 bg-gray-300 rounded mb-2"></div>
      <p className="text-xs font-bold text-gray-700 truncate">Start with Why</p>
    </div>
  </div>
</div>
    `,
    'leadership-videos': `
<div className="bg-black text-white p-4 rounded-xl shadow-lg">
  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
    <Video className="w-4 h-4 text-red-500" />
    Featured Talk
  </h3>
  <div className="relative w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-3 group cursor-pointer">
    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
      <Play className="w-6 h-6 text-white fill-current" />
    </div>
    <span className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs">12:45</span>
  </div>
  <p className="font-bold text-sm">Simon Sinek: How Great Leaders Inspire Action</p>
</div>
    `,
    'strat-templates': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <FileText className="w-4 h-4 text-blue-600" />
    Templates
  </h3>
  <div className="grid grid-cols-2 gap-2">
    <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-blue-600 mb-2" />
      <p className="text-xs font-bold text-blue-900">QBR Deck</p>
    </button>
    <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-green-600 mb-2" />
      <p className="text-xs font-bold text-green-900">1:1 Agenda</p>
    </button>
    <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-purple-600 mb-2" />
      <p className="text-xs font-bold text-purple-900">OKRs Sheet</p>
    </button>
    <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-orange-600 mb-2" />
      <p className="text-xs font-bold text-orange-900">Feedback Form</p>
    </button>
  </div>
</div>
    `,
    'community-feed': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <Users className="w-4 h-4 text-indigo-600" />
    Community Pulse
  </h3>
  <div className="space-y-4">
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
      <div>
        <p className="text-sm text-gray-800"><span className="font-bold">Sarah J.</span> shared a win</p>
        <p className="text-xs text-gray-500 mt-1">"Just completed my first 30-day streak! The consistency is really paying off..."</p>
        <div className="flex gap-3 mt-2 text-xs text-gray-400">
          <span className="hover:text-indigo-600 cursor-pointer">Like</span>
          <span className="hover:text-indigo-600 cursor-pointer">Reply</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    'my-discussions': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <MessageSquare className="w-4 h-4 text-indigo-600" />
    My Discussions
  </h3>
  <div className="space-y-2">
    <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold text-gray-800">Managing Remote Teams</p>
        <span className="bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full">3 new</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">Last reply 2h ago by Mike T.</p>
    </div>
    <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold text-gray-800">Book Club: Atomic Habits</p>
      </div>
      <p className="text-xs text-gray-500 mt-1">Last reply 1d ago by You</p>
    </div>
  </div>
</div>
    `,
    'mastermind': `
<div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-lg">
  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
    <Users className="w-4 h-4" />
    Mastermind Group
  </h3>
  <p className="text-xs text-indigo-200 mb-4">Next session in 2 days</p>
  <div className="flex -space-x-2 mb-4">
    <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-indigo-600"></div>
    <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-indigo-600"></div>
    <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-indigo-600"></div>
    <div className="w-8 h-8 rounded-full bg-indigo-800 border-2 border-indigo-600 flex items-center justify-center text-xs font-bold">+2</div>
  </div>
  <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
    View Agenda
  </button>
</div>
    `,
    'mentor-match': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <UserPlus className="w-4 h-4 text-teal-600" />
    Mentor Match
  </h3>
  <div className="text-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2 text-teal-600">
      <Search className="w-6 h-6" />
    </div>
    <p className="text-sm font-bold text-gray-800">Find a Mentor</p>
    <p className="text-xs text-gray-500 mb-3">Connect with experienced leaders in your industry.</p>
    <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-colors">
      Start Matching
    </button>
  </div>
</div>
    `,
    'live-events': `
<div className="bg-red-50 p-4 rounded-xl border border-red-100">
  <div className="flex justify-between items-start mb-3">
    <h3 className="font-bold text-red-800 flex items-center gap-2">
      <Radio className="w-4 h-4" />
      Live Events
    </h3>
    <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">Live Now</span>
  </div>
  <div className="bg-white rounded-lg p-3 border border-red-100 shadow-sm">
    <p className="text-sm font-bold text-gray-800">Town Hall: Q3 Vision</p>
    <p className="text-xs text-gray-500 mt-1">Started 15 mins ago</p>
    <button className="mt-3 w-full py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-colors">
      Join Stream
    </button>
  </div>
</div>
    `,
    'practice-history': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <History className="w-4 h-4 text-gray-500" />
    Recent Practice
  </h3>
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-bold text-gray-800">Difficult Conversation</p>
        <p className="text-xs text-gray-500">Yesterday</p>
      </div>
      <span className="text-green-600 font-bold text-sm">92%</span>
    </div>
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-bold text-gray-800">Public Speaking</p>
        <p className="text-xs text-gray-500">3 days ago</p>
      </div>
      <span className="text-yellow-600 font-bold text-sm">78%</span>
    </div>
  </div>
</div>
    `,
    'progress-analytics': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <BarChart2 className="w-4 h-4 text-blue-600" />
    Growth Analytics
  </h3>
  <div className="flex items-end gap-2 h-24 mt-4">
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '40%' }}></div>
    </div>
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '60%' }}></div>
    </div>
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '55%' }}></div>
    </div>
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '85%' }}></div>
    </div>
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '75%' }}></div>
    </div>
  </div>
  <div className="flex justify-between mt-2 text-xs text-gray-400">
    <span>Mon</span>
    <span>Fri</span>
  </div>
</div>
    `,
    'ai-roleplay': `
<div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-4 rounded-xl shadow-lg">
  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
    <Bot className="w-4 h-4" />
    AI Roleplay
  </h3>
  <p className="text-xs text-purple-200 mb-4">Practice real-world scenarios with AI.</p>
  <div className="bg-white/10 rounded-lg p-3 mb-3 backdrop-blur-sm">
    <p className="text-xs font-bold text-purple-100 uppercase mb-1">Recommended</p>
    <p className="text-sm font-bold">Giving Constructive Feedback</p>
  </div>
  <button className="w-full py-2 bg-white text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-50 transition-colors">
    Start Session
  </button>
</div>
    `,
    'scenario-sim': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <Cpu className="w-4 h-4 text-orange-600" />
    Scenario Sim
  </h3>
  <div className="space-y-3">
    <div className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors cursor-pointer">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-orange-600">Crisis Management</span>
        <span className="text-xs text-gray-400">Hard</span>
      </div>
      <p className="text-sm font-bold text-gray-800">Data Breach Response</p>
    </div>
    <div className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors cursor-pointer">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-green-600">Strategy</span>
        <span className="text-xs text-gray-400">Medium</span>
      </div>
      <p className="text-sm font-bold text-gray-800">Market Expansion</p>
    </div>
  </div>
</div>
    `,
    'feedback-gym': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <Dumbbell className="w-4 h-4 text-teal-600" />
    Feedback Gym
  </h3>
  <p className="text-xs text-gray-500 mb-3">Quick drills to improve your delivery.</p>
  <div className="grid grid-cols-2 gap-2">
    <div className="bg-teal-50 p-2 rounded-lg text-center cursor-pointer hover:bg-teal-100 transition-colors">
      <p className="text-lg font-bold text-teal-700">Radical</p>
      <p className="text-[10px] text-teal-600">Candor</p>
    </div>
    <div className="bg-blue-50 p-2 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition-colors">
      <p className="text-lg font-bold text-blue-700">SBI</p>
      <p className="text-[10px] text-blue-600">Model</p>
    </div>
  </div>
</div>
    `,
    'roi-report': `
<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
    <TrendingUp className="w-4 h-4 text-green-600" />
    ROI Report
  </h3>
  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-xs text-gray-500">Leadership Score</p>
      <p className="text-2xl font-bold text-gray-800">+15%</p>
    </div>
    <div className="text-right">
      <p className="text-xs text-gray-500">Team Engagement</p>
      <p className="text-2xl font-bold text-gray-800">+8%</p>
    </div>
  </div>
  <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
    Download PDF
  </button>
</div>
    `
  };
  
  const FEATURE_METADATA = {
    // Dashboard
    'identity-builder': { name: 'Identity Builder', description: 'Grounding Rep & Identity Statement tools.' },
    'habit-stack': { name: 'Habit Stack', description: 'Daily Rep tracking and habit formation.' },
    'win-the-day': { name: 'AM Bookend (Win The Day)', description: 'AM Bookend 1-2-3 priority setting.' },
    'gamification': { name: 'Gamification Engine', description: 'Arena Mode logic, streaks, coins, and leaderboards.' },
    'exec-summary': { name: 'Executive Summary Widget', description: 'High-level view of leadership growth.' },
    'calendar-sync': { name: 'Calendar Integration', description: 'Sync Daily Reps and coaching sessions to Outlook/Google.' },
    'weekly-focus': { name: 'Weekly Focus', description: 'Display current development plan focus area.' },
    'notifications': { name: 'Notifications', description: 'Alerts and reminders widget.' },
    'scorecard': { name: 'Today Scorecard', description: 'Daily progress summary and streak display.' },
    'pm-bookend': { name: 'PM Bookend', description: 'Evening reflection and journaling.' },
    
    // Content
    'course-library': { name: 'Course Library', description: 'Structured video modules for deep-dive learning.' },
    'reading-hub': { name: 'Professional Reading Hub', description: 'Curated book summaries and leadership articles.' },
    'leadership-videos': { name: 'Leadership Videos (Media)', description: 'Video content, leader talks, and multimedia resources.' },
    'strat-templates': { name: 'Strategic Templates', description: 'Downloadable worksheets and tools.' },
    
    // Community
    'community-feed': { name: 'Community Feed', description: 'Main discussion stream and posting interface.' },
    'my-discussions': { name: 'My Discussions', description: 'Filter view for user-owned threads.' },
    'mastermind': { name: 'Peer Mastermind Groups', description: 'Automated matching for accountability squads.' },
    'mentor-match': { name: 'Mentor Match', description: 'Connect aspiring leaders with senior executives.' },
    'live-events': { name: 'Live Event Streaming', description: 'Integrated video player for town halls and workshops.' },
    
    // Coaching
    'practice-history': { name: 'Practice History', description: 'Review past performance and scores.' },
    'progress-analytics': { name: 'Progress Analytics', description: 'Track performance trends and strengths.' },
    'ai-roleplay': { name: 'AI Roleplay Scenarios', description: 'Interactive practice for difficult conversations.' },
    'scenario-sim': { name: 'Scenario Sim', description: 'Complex leadership simulations and decision trees.' },
    'feedback-gym': { name: 'Feedback Gym', description: 'Instant feedback on communication style.' },
    'roi-report': { name: 'Executive ROI Report', description: 'Automated reports showing progress and value.' },
  };

  const initialGroups = {
    dashboard: ['identity-builder', 'habit-stack', 'win-the-day', 'gamification', 'exec-summary', 'calendar-sync', 'weekly-focus', 'notifications', 'scorecard', 'pm-bookend'],
    content: ['course-library', 'reading-hub', 'leadership-videos', 'strat-templates'],
    community: ['community-feed', 'my-discussions', 'mastermind', 'mentor-match', 'live-events'],
    coaching: ['practice-history', 'progress-analytics', 'ai-roleplay', 'scenario-sim', 'feedback-gym', 'roi-report']
  };

  // Group features dynamically
  const groups = {
    dashboard: [],
    content: [],
    community: [],
    coaching: []
  };

  // Merge DB features with metadata for display
  Object.entries(features).forEach(([id, data]) => {
    const group = data.group || (initialGroups.dashboard.includes(id) ? 'dashboard' : 
                                 initialGroups.content.includes(id) ? 'content' :
                                 initialGroups.community.includes(id) ? 'community' : 
                                 initialGroups.coaching.includes(id) ? 'coaching' : 'dashboard');
    
    const meta = FEATURE_METADATA[id] || {};
    
    if (groups[group]) {
      groups[group].push({
        id,
        name: data.name || meta.name || id,
        description: data.description || meta.description || '',
        enabled: data.enabled,
        order: data.order ?? 999,
        code: data.code || WIDGET_TEMPLATES[id] || ''
      });
    }
  });

  // Sort groups
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.order - b.order);
  });

  const handleSyncDefaults = async () => {
    if (!window.confirm('This will populate the database with default widgets. Continue?')) return;
    
    for (const [id, meta] of Object.entries(FEATURE_METADATA)) {
       if (!features[id] || !features[id].name) {
         await saveFeature(id, {
           name: meta.name,
           description: meta.description,
           code: WIDGET_TEMPLATES[id] || '',
           group: initialGroups.dashboard.includes(id) ? 'dashboard' : 
                  initialGroups.content.includes(id) ? 'content' :
                  initialGroups.community.includes(id) ? 'community' : 'coaching',
           enabled: true,
           order: 999
         });
       }
    }
    alert('Defaults synced!');
  };

  const handleAddWidget = async () => {
    if (!newWidget.name || !newWidget.id) return;
    await saveFeature(newWidget.id, {
      ...newWidget,
      code: '<div className="p-4 bg-white rounded-lg shadow border border-gray-200"><h3>New Widget</h3><p>Start editing...</p></div>',
      enabled: true,
      order: 999
    });
    setIsAdding(false);
    setNewWidget({ name: '', id: '', group: 'dashboard', description: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      await deleteFeature(id);
    }
  };

  const handleMove = (groupKey, index, direction) => {
    const currentList = [...groups[groupKey]];
    if (direction === 'up' && index > 0) {
      [currentList[index], currentList[index - 1]] = [currentList[index - 1], currentList[index]];
    } else if (direction === 'down' && index < currentList.length - 1) {
      [currentList[index], currentList[index + 1]] = [currentList[index + 1], currentList[index]];
    } else {
      return;
    }
    
    // Update orders
    currentList.forEach((item, idx) => {
        saveFeature(item.id, { ...features[item.id], order: idx });
    });
  };

  const groupTitles = {
    dashboard: 'Dashboard',
    content: 'Content',
    community: 'Community',
    coaching: 'Coaching'
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy font-serif">Widget Lab</h2>
          <p className="text-gray-500 text-sm">Manage, design, and deploy widgets for each module.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Widget
            </button>
            <button 
                onClick={handleSyncDefaults}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors"
                title="Restore default widgets to database"
            >
                <RefreshCw className="w-4 h-4" /> Sync Defaults
            </button>
        </div>
      </div>

      {/* Add Widget Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 space-y-4">
                <h3 className="font-bold text-lg">Add New Widget</h3>
                <input 
                    className="w-full p-2 border rounded" 
                    placeholder="Widget Name" 
                    value={newWidget.name}
                    onChange={e => setNewWidget({...newWidget, name: e.target.value, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                />
                <input 
                    className="w-full p-2 border rounded" 
                    placeholder="Widget ID" 
                    value={newWidget.id}
                    onChange={e => setNewWidget({...newWidget, id: e.target.value})}
                />
                <select 
                    className="w-full p-2 border rounded"
                    value={newWidget.group}
                    onChange={e => setNewWidget({...newWidget, group: e.target.value})}
                >
                    <option value="dashboard">Dashboard</option>
                    <option value="content">Content</option>
                    <option value="community">Community</option>
                    <option value="coaching">Coaching</option>
                </select>
                <textarea 
                    className="w-full p-2 border rounded" 
                    placeholder="Description" 
                    value={newWidget.description}
                    onChange={e => setNewWidget({...newWidget, description: e.target.value})}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                    <button onClick={handleAddWidget} className="px-4 py-2 bg-teal-600 text-white rounded">Add</button>
                </div>
            </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.keys(groups).map((groupKey) => (
          <div key={groupKey} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">
              {groupTitles[groupKey]}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {groups[groupKey].length === 0 && (
                  <p className="text-gray-400 italic">No widgets in this group.</p>
              )}
              {groups[groupKey].map((feature, index) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {/* Reorder Controls */}
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleMove(groupKey, index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-corporate-navy disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleMove(groupKey, index, 'down')}
                          disabled={index === groups[groupKey].length - 1}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-corporate-navy disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <h4 
                            className="font-bold text-corporate-navy text-lg cursor-pointer hover:text-teal-600 hover:underline decoration-dotted underline-offset-4"
                            onClick={() => setEditingWidget(feature)}
                            title="Click to edit widget design"
                          >
                            {feature.name}
                          </h4>
                          <button 
                            onClick={() => setEditingWidget(feature)}
                            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                            title="Edit Widget Design"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {feature.enabled ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">Disabled</span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1 text-sm">{feature.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                        onClick={() => toggleFeature(feature.id, !feature.enabled)}
                        className={`
                            transition-colors duration-200
                            ${feature.enabled ? 'text-corporate-teal' : 'text-gray-300 hover:text-gray-400'}
                        `}
                        >
                        {feature.enabled ? (
                            <ToggleRight className="w-10 h-10" />
                        ) : (
                            <ToggleLeft className="w-10 h-10" />
                        )}
                        </button>
                        <button 
                            onClick={() => handleDelete(feature.id)}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Widget"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
        <strong>Note:</strong> Feature toggles and order are persisted globally via Firestore. Changes affect all users immediately.
      </div>

      {/* Widget Editor Modal */}
      {editingWidget && (
        <WidgetEditorModal
          isOpen={!!editingWidget}
          onClose={() => setEditingWidget(null)}
          widgetId={editingWidget.id}
          widgetName={editingWidget.name}
          initialCode={editingWidget.code}
          onSave={async (code) => {
              await saveFeature(editingWidget.id, { ...features[editingWidget.id], code });
          }}
        />
      )}
    </div>
  );
};

export default FeatureManager;
