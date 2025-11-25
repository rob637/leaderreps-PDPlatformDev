// src/components/screens/dashboard/DashboardComponents.jsx
// MODIFIED: Refactored to use Tailwind CSS and remove COLORS object dependency.

import React, { useState, useEffect } from 'react';
import { 
  Target, Clock, User, Save, Loader, CheckCircle, TrendingUp, Star, 
  ChevronDown, ChevronUp, Plus, X, Sunrise, Moon, Flame, Anchor,
  ToggleLeft, ToggleRight, Zap, AlertTriangle, MessageSquare, Trophy,
  Send, Users, Activity, Edit3, Calendar, ChevronRight
} from 'lucide-react';

// --- Helper function to format timestamps ---
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  try {
    // Handle both Date objects and Firestore Timestamps
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.();
    if (!date) return 'Just now';
    
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Recently';
  }
};

// --- Corporate Button Component ---
export const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#47A88D] text-white shadow-md hover:bg-[#3d917a] focus:ring-[#47A88D]/50",
    secondary: "bg-[#E04E1B] text-white shadow-md hover:bg-[#c44317] focus:ring-[#E04E1B]/50",
    outline: "bg-white text-[#47A88D] border-2 border-[#47A88D] shadow-sm hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    'nav-back': "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 focus:ring-slate-300/50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-xl",
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

// --- Corporate Card Component ---
export const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  
  const accentColors = {
    NAVY: 'text-[#002E47] border-[#002E47]',
    TEAL: 'text-[#47A88D] border-[#47A88D]',
    ORANGE: 'text-[#E04E1B] border-[#E04E1B]',
    GREEN: 'text-green-600 border-green-600',
    BLUE: 'text-blue-600 border-blue-600',
  };
  
  const accentColorClass = accentColors[accent] || accentColors.NAVY;
  const iconBgColors = {
    NAVY: 'bg-[#002E47]/10',
    TEAL: 'bg-[#47A88D]/10',
    ORANGE: 'bg-[#E04E1B]/10',
    GREEN: 'bg-green-100',
    BLUE: 'bg-blue-100',
  };
  const iconBgClass = iconBgColors[accent] || iconBgColors.NAVY;

  const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };

  return (
    <Tag
      {...(interactive ? { type: 'button' } : {})}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left relative overflow-hidden ${interactive ? 'cursor-pointer hover:-translate-y-1 transition-transform duration-200' : ''} ${className}`}
    >
      {/* Accent Bar */}
      {Icon && title && <div className={`absolute top-0 left-0 right-0 h-1 ${accent === 'NAVY' ? 'bg-[#002E47]' : accent === 'TEAL' ? 'bg-[#47A88D]' : accent === 'ORANGE' ? 'bg-[#E04E1B]' : 'bg-slate-200'}`} />}

      {Icon && title && (
           <div className="flex items-center gap-4 mb-6">
              <div className={`flex items-center justify-center flex-shrink-0 w-14 h-14 rounded-xl ${iconBgClass}`}>
                  <Icon className={`w-7 h-7 ${accentColorClass.split(' ')[0]}`} />
              </div>
              <h2 className="text-xl font-bold text-[#002E47]">{title}</h2>
          </div>
      )}
      {!Icon && title && (
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-[#002E47]">{title}</h2>
        </div>
      )}

      <div className="text-slate-600">{children}</div>
    </Tag>
  );
};

/* =========================================================
   MODE SWITCH COMPONENT
========================================================= */
export const ModeSwitch = ({ isArenaMode, onToggle, isLoading }) => (
  <button
    onClick={onToggle}
    disabled={isLoading}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border-2 text-white font-semibold text-sm ${
      isArenaMode 
        ? 'bg-[#47A88D] border-[#47A88D]' 
        : 'bg-[#E04E1B] border-[#E04E1B]'
    } ${isLoading ? 'opacity-60' : ''}`}
  >
    {isArenaMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
    <span>{isArenaMode ? 'Arena Mode' : 'Solo Mode'}</span>
  </button>
);

/* =========================================================
   STREAK TRACKER COMPONENT
========================================================= */
export const StreakTracker = ({ streakCount, streakCoins, userEmail }) => {
  // Only show tokens for developer
  const isDeveloper = userEmail === 'rob@sagecg.com';
  
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-[#E04E1B]" />
        <span className="font-bold text-lg text-[#002E47]">{streakCount}</span>
        <span className="text-sm text-slate-500">Day Streak</span>
      </div>
      {isDeveloper && (
        <>
          <div className="h-6 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-bold text-lg text-[#002E47]">{streakCoins}</span>
            <span className="text-sm text-slate-500">Tokens</span>
          </div>
        </>
      )}
    </div>
  );
};

/* =========================================================
   TAB BUTTON (for Dynamic Bookend Container)
========================================================= */
export const TabButton = ({ active, onClick, label, minimized = false }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 relative ${
      active 
        ? 'bg-[#47A88D] text-white shadow-md' 
        : 'bg-transparent text-slate-600 border-2 border-slate-200 hover:bg-slate-50'
    }`}
  >
    {label}
    {minimized && !active && (
      <span 
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E04E1B]"
        title="Incomplete"
      />
    )}
  </button>
);

/* =========================================================
   DYNAMIC BOOKEND CONTAINER
========================================================= */
export const DynamicBookendContainer = ({ 
  morningProps,
  eveningProps,
  dailyPracticeData
}) => {
  const [activeTab, setActiveTab] = useState('AM');
  
  // Time-based default logic
  useEffect(() => {
    const currentHour = new Date().getHours();
    
    if (currentHour < 12) {
      setActiveTab('AM');
    } else if (currentHour >= 16) {
      setActiveTab('PM');
    } else {
      setActiveTab('PM'); // Default to PM in the afternoon
    }
  }, []);
  
  const currentHour = new Date().getHours();
  const shouldMinimizeAM = currentHour >= 12 && 
    !dailyPracticeData?.morningBookend?.completedAt;
  
  return (
    <Card title="📋 Daily Bookends" accent="NAVY">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <TabButton 
          active={activeTab === 'AM'}
          onClick={() => setActiveTab('AM')}
          label="AM Bookend"
          minimized={shouldMinimizeAM}
        />
        <TabButton 
          active={activeTab === 'PM'}
          onClick={() => setActiveTab('PM')}
          label="PM Bookend"
        />
      </div>
      
      {/* Conditional Rendering */}
      {activeTab === 'AM' && <MorningBookend {...morningProps} />}
      {activeTab === 'PM' && <EveningBookend {...eveningProps} />}
    </Card>
  );
};

/* =========================================================
   MORNING BOOKEND COMPONENT
========================================================= */
export const MorningBookend = ({ 
    dailyWIN, setDailyWIN, otherTasks, onAddTask, onToggleTask, onRemoveTask,
    showLIS, setShowLIS, identityStatement, onSave, isSaving, 
    onToggleWIN, onSaveWIN, isSavingWIN,
    completedAt, winCompleted
}) => {
    const [newTaskText, setNewTaskText] = useState('');
    
    const handleAddClick = () => {
        if (newTaskText.trim()) { onAddTask(newTaskText); setNewTaskText(''); }
    };
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleAddClick(); };
    
    const isChecklistMode = !!completedAt;
    const currentHour = new Date().getHours();
    const isPastNoon = currentHour >= 12;
    
    // Show warning if past noon and not completed
    const showNoonWarning = isPastNoon && !isChecklistMode && !dailyWIN;
    
    // CHECKLIST MODE - After completion
    if (isChecklistMode) {
        return (
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <Sunrise className="w-5 h-5 text-[#47A88D]" />
                    <h3 className="text-lg font-bold text-[#002E47]">
                        ✅ Today's Plan
                    </h3>
                </div>
                
                {/* WIN Display with Checkbox */}
                <div className={`p-3 rounded-lg border-2 ${winCompleted ? 'bg-green-50 border-green-500' : 'bg-teal-50 border-[#47A88D]'}`}>
                    <div className="flex items-start gap-3">
                        <input 
                            type="checkbox"
                            checked={winCompleted || false}
                            onChange={onToggleWIN}
                            className="mt-1 w-5 h-5 flex-shrink-0 accent-[#47A88D]"
                        />
                        <div className="flex-1">
                            <p className="text-xs font-semibold mb-1 text-slate-500">
                                🏆 TODAY'S WIN:
                            </p>
                            <p className={`text-sm font-bold text-[#002E47] ${winCompleted ? 'line-through opacity-60' : ''}`}>
                                {dailyWIN || 'No WIN set'}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Tasks Display with Checkboxes */}
                <div className="space-y-2"> 
                    <p className="text-xs font-semibold text-slate-500">
                        📋 OTHER TASKS:
                    </p>
                    {otherTasks && otherTasks.length > 0 ? (
                        otherTasks.map((task, idx) => (
                            <div key={task.id || idx} 
                                 className={`flex items-center gap-3 p-2 border rounded-lg ${task.completed ? 'border-green-500' : 'border-slate-200'}`}>
                                
                                {task.isSystem ? (
                                    <button 
                                        onClick={task.onClick}
                                        className="text-sm flex-1 text-left font-medium hover:text-[#47A88D] transition-colors text-[#002E47]"
                                    >
                                        <span className="mr-2 text-red-500">→</span>
                                        {task.text}
                                    </button>
                                ) : (
                                  <>
                                    <input 
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => onToggleTask(task.id ?? idx)}
                                        className="w-4 h-4 accent-[#47A88D]"
                                    />
                                    <span className={`text-sm flex-1 text-slate-700 ${task.completed ? 'line-through opacity-60' : ''}`}>
                                        {task.text}
                                    </span>
                                  </>
                                )}
                                {!task.isSystem && !task.completed && (
                                    <button 
                                        onClick={() => onRemoveTask(task.id ?? idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm italic pt-2 text-slate-500">No tasks were set for today.</p>
                    )}
                </div>
                
                {/* LIS Display (if enabled) */}
                {showLIS && identityStatement && (
                    <div className="p-3 rounded-lg border border-[#47A88D]/30 bg-[#47A88D]/10">
                        <p className="text-xs font-semibold mb-1 text-[#47A88D]">
                            🎯 IDENTITY ANCHOR:
                        </p>
                        <p className="text-sm italic text-slate-700">
                            {identityStatement}
                        </p>
                    </div>
                )}
                
                {/* Completion Status */}
                <div className="pt-3 border-t border-slate-200 text-center">
                    <p className="text-xs font-semibold text-green-600">
                        ✓ Morning plan locked in!
                    </p>
                </div>
            </div>
        );
    }
    
    // INPUT MODE - Before completion
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Sunrise className="w-5 h-5 text-[#E04E1B]" />
                <h3 className="text-lg font-bold text-[#002E47]">
                    🌅 Plan Your Day
                </h3>
            </div>
            
            {/* Warning if past noon */}
            {showNoonWarning && (
                <div className="p-3 rounded-lg border-l-4 bg-amber-50 border-amber-500">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                        <div>
                            <p className="text-xs font-semibold text-amber-700">
                               ⚠️ LATE START ALERT
                            </p>
                            <p className="text-xs mt-1 text-slate-700">
                                It's past noon! Set your WIN and lock in your plan to stay on track.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Why It Matters Section */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-semibold mb-1 text-blue-700">
                    💡 WHY IT MATTERS:
                </p>
                <p className="text-xs text-slate-700">
                    Leaders who plan their day intentionally are 3x more likely to achieve their goals. 
                    Your WIN keeps you focused on what truly matters.
                </p>
            </div>
            
            {/* WIN Input */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center text-slate-700">
                    <Target className="w-4 h-4 mr-1 text-[#E04E1B]" />
                    Today's WIN (What's Important Now)
                </label>
                <textarea 
                    value={dailyWIN} onChange={(e) => setDailyWIN(e.target.value)}
                    placeholder="What is the ONE thing that must get done today?"
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#47A88D] outline-none transition-all"
                    rows={2}
                />
                <Button 
                    onClick={onSaveWIN}
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    disabled={isSavingWIN || !dailyWIN?.trim()}
                >
                    {isSavingWIN ? (
                        <><Loader className="w-4 h-4 mr-1 animate-spin" /> Saving WIN...</>
                    ) : (
                        <><Save className="w-4 h-4 mr-1" /> Save Today's WIN</>
                    )}
                </Button>
            </div>

            {/* Tasks Input */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center justify-between text-slate-700">
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-[#47A88D]" />
                        Other Important Tasks ({otherTasks?.length || 0}/5)
                    </span>
                </label>
                
                {/* Existing Tasks */}
                {otherTasks && otherTasks.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {otherTasks.map((task, idx) => (
                            <div key={task.id || idx} 
                                 className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50">
                                
                                {task.isSystem ? (
                                    <button 
                                        onClick={task.onClick}
                                        className="text-sm flex-1 text-left font-medium hover:text-[#47A88D] transition-colors text-[#002E47]"
                                    >
                                        <span className="mr-2 text-red-500">→</span>
                                        {task.text}
                                    </button>
                                ) : (
                                    <span className="text-sm flex-1 text-slate-700">{task.text}</span>
                                )}

                                {!task.isSystem && (
                                    <button 
                                        onClick={() => onRemoveTask(task.id ?? idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Add New Task */}
                {(!otherTasks || otherTasks.length < 5) && (
                    <div className="flex gap-2">
                        <input 
                            type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyPress={handleKeyPress} placeholder="Add a task (auto-saves when you click +)..."
                            className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#47A88D] outline-none transition-all"
                        />
                        <button 
                            onClick={handleAddClick}
                            disabled={!newTaskText.trim() || (otherTasks && otherTasks.length >= 5)}
                            className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 bg-[#47A88D] hover:bg-[#3d917a]"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* LIS Toggle */}
            <div>
                <button 
                    onClick={() => setShowLIS(!showLIS)}
                    className="text-sm font-semibold flex items-center gap-2 transition-colors hover:opacity-80 text-[#47A88D]"
                >
                    {showLIS ? 'Hide' : 'Show'} Leadership Identity Statement
                    {showLIS ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showLIS && (
                    <div className="mt-3 p-4 rounded-lg border border-[#47A88D]/30 bg-[#47A88D]/10">
                        <p className="text-sm italic font-medium text-slate-700">
                            "I am the kind of leader who {identityStatement || '...'}"
                        </p>
                    </div>
                )}
            </div>

            {/* Validation - require WIN before completion */}
            <div className="pt-4 border-t border-slate-200">
                {!dailyWIN && (
                    <p className="text-xs mb-2 text-center text-amber-600">
                        ⚠️ Set your WIN before completing the bookend
                    </p>
                )}
                <Button 
                    onClick={onSave} 
                    disabled={isSaving || !dailyWIN} 
                    variant="primary" 
                    size="md" 
                    className="w-full"
                >
                    {isSaving ? <><Loader className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 
                               <><CheckCircle className="w-5 h-5 mr-2" />✓ Complete Morning Bookend</>}
                </Button>
            </div>
        </div>
    );
};

/* =========================================================
   EVENING BOOKEND COMPONENT
========================================================= */
export const EveningBookend = ({ 
    reflectionGood, setReflectionGood, reflectionBetter, setReflectionBetter,
    reflectionBest, setReflectionBest, habitsCompleted, onHabitToggle, onSave, isSaving,
    onNavigate, amWinCompleted, amTasksCompleted
}) => {
    const minHeightStyle = { minHeight: '445px' };
    
    return (
        <div className="space-y-4" style={minHeightStyle}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Moon className="w-5 h-5 text-[#002E47]" />
                <h3 className="text-lg font-bold text-[#002E47]">
                    🌙 Evening Reflection
                </h3>
            </div>
            
            {/* Good */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Good - What went well today?
                </label>
                <textarea value={reflectionGood} onChange={(e) => setReflectionGood(e.target.value)}
                    placeholder="Celebrate your wins..." className="w-full p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    rows={2}
                />
            </div>

            {/* Better */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center text-amber-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Better - What needs improvement?
                </label>
                <textarea value={reflectionBetter} onChange={(e) => setReflectionBetter(e.target.value)}
                    placeholder="Areas for growth..." className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    rows={2}
                />
            </div>

            {/* Best */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center text-blue-600">
                    <Star className="w-4 h-4 mr-1" />
                    Best - What do I need to do to show up as my best tomorrow?
                </label>
                <textarea value={reflectionBest} onChange={(e) => setReflectionBest(e.target.value)}
                    placeholder="Tomorrow's commitment..." className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    rows={2}
                />
            </div>

            {/* Daily Habits Tracker */}
            <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-semibold mb-3 text-slate-700">Daily Habits Tracker</p>
                
                {/* Auto-Tracked Habits */}
                <div className="space-y-2 mb-3 p-3 rounded-lg bg-[#47A88D]/5">
                    <p className="text-xs font-semibold mb-2 text-[#47A88D]">
                        🔗 AUTO-TRACKED FROM MORNING:
                    </p>
                    
                    <label className="flex items-center gap-2 p-2 rounded opacity-75">
                        <input type="checkbox" checked={amWinCompleted || false}
                            disabled 
                            className="w-4 h-4 accent-[#47A88D]"
                        />
                        <span className="text-sm text-slate-700">Completed Morning WIN</span>
                    </label>
                    
                    <label className="flex items-center gap-2 p-2 rounded opacity-75">
                        <input type="checkbox" checked={amTasksCompleted || false}
                            disabled
                            className="w-4 h-4 accent-[#47A88D]"
                        />
                        <span className="text-sm text-slate-700">Completed All Morning Tasks</span>
                    </label>
                </div>
                
                {/* Manual Tracking */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold mb-2 text-slate-500">
                        ✍️ MANUAL TRACKING:
                    </p>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={(habitsCompleted || {}).readLIS || false}
                            onChange={(e) => onHabitToggle('readLIS', e.target.checked)}
                            className="w-4 h-4 accent-[#47A88D]"
                        />
                        <span className="text-sm text-slate-700">Read LIS</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={(habitsCompleted || {}).completedDailyRep || false}
                            onChange={(e) => onHabitToggle('completedDailyRep', e.target.checked)}
                            className="w-4 h-4 accent-[#47A88D]"
                        />
                        <span className="text-sm text-slate-700">Complete Daily Rep</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={(habitsCompleted || {}).eveningReflection || false}
                            onChange={(e) => onHabitToggle('eveningReflection', e.target.checked)}
                            className="w-4 h-4 accent-[#47A88D]"
                        />
                        <span className="text-sm text-slate-700">Evening Reflection</span>
                    </label>
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-200">
                <Button onClick={onSave} disabled={isSaving} variant="primary" size="md" className="w-full">
                    {isSaving ? <><Loader className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 
                               <><Save className="w-5 h-5 mr-2" />Save Reflection</>}
                </Button>
            </div>
            
            {/* View History Link */}
            {onNavigate && (
                <div className="pt-3">
                    <Button 
                        onClick={() => onNavigate('daily-practice')}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        📖 View Full Reflection History
                    </Button>
                </div>
            )}
        </div>
    );
};

/* =========================================================
   SUGGESTION MODAL
========================================================= */
export const SuggestionModal = ({ title, prefix, suggestions, onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#002E47]">
          {title}
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="overflow-y-auto flex-1 space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion.value || suggestion.text || suggestion)}
            className="w-full text-left p-4 rounded-lg border-2 border-slate-200 transition-all hover:border-[#47A88D] hover:bg-teal-50"
          >
            <p className="text-sm font-medium text-slate-700">
              {prefix} <strong>{suggestion.value || suggestion.text || suggestion}</strong>
            </p>
            {suggestion.description && (
              <p className="text-xs mt-1 text-slate-500">
                {suggestion.description}
              </p>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200">
        <Button onClick={onClose} variant="outline" size="sm" className="w-full">
          Close
        </Button>
      </div>
    </div>
  </div>
);

/* =========================================================
   SAVE INDICATOR
========================================================= */
export const SaveIndicator = ({ show, message = "Saved!" }) => {
  if (!show) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
};

/* =========================================================
   BONUS EXERCISE MODAL
========================================================= */
export const BonusExerciseModal = ({ exercise, onComplete, onSkip }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 max-w-lg w-full">
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-[#E04E1B]/20">
          <Trophy className="w-8 h-8 text-[#E04E1B]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[#002E47]">
          🎉 Bonus Challenge!
        </h2>
        <p className="text-sm text-slate-500">
          Complete this 2-minute exercise to earn +50 coins
        </p>
      </div>

      <div className="p-4 rounded-lg mb-4 bg-[#47A88D]/10">
        <h3 className="font-bold mb-2 text-[#002E47]">
          {exercise.name || exercise.title}
        </h3>
        <p className="text-sm mb-3 text-slate-700">
          {exercise.description}
        </p>
        {exercise.instructions && (
          <div className="text-xs text-slate-500">
            <strong>How to do it:</strong>
            <p className="mt-1">{exercise.instructions}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onComplete} variant="primary" size="md" className="flex-1">
          ✓ I Did It! (+50 🪙)
        </Button>
        <Button onClick={onSkip} variant="outline" size="md" className="flex-1">
          Skip for Now
        </Button>
      </div>
    </div>
  </div>
);

/* =========================================================
   ADDITIONAL REPS CARD
========================================================= */
export const AdditionalRepsCard = ({ commitments, onToggle, repLibrary }) => {
  const enrichedCommitments = commitments.map(commitment => {
    if (typeof commitment === 'string') {
      return { id: commitment, text: commitment, completed: false };
    }
    
    if (commitment.repId && repLibrary) {
      const repDetails = repLibrary.find(rep => rep.id === commitment.repId || rep.repId === commitment.repId);
      if (repDetails) {
        return {
          ...commitment,
          name: repDetails.name,
          description: repDetails.description,
          category: repDetails.category
        };
      }
    }
    
    return commitment;
  });

  return (
    <Card title="⏳ Additional Daily Reps" accent='TEAL'>
      <div className="space-y-3">
        {enrichedCommitments.map((commitment, idx) => (
          <div key={commitment.id || idx} 
               className={`p-4 rounded-lg border-2 transition-all ${commitment.completed ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                checked={commitment.completed || false}
                onChange={() => onToggle(commitment.id)}
                className="mt-1 w-5 h-5 flex-shrink-0 accent-[#47A88D]"
              />
              <div className="flex-1">
                <p className={`text-sm font-bold mb-1 text-[#002E47] ${commitment.completed ? 'line-through opacity-60' : ''}`}>
                  {commitment.name || commitment.text || commitment.repId}
                </p>
                {commitment.description && (
                  <p className="text-xs mb-2 text-slate-500">
                    {commitment.description}
                  </p>
                )}
                {commitment.category && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                    {commitment.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* =========================================================
   SOCIAL POD CARD
========================================================= */
export const SocialPodCard = ({ podMembers, activityFeed, onSendMessage, onFindPod }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <Card title="🤝 Social Pod Feed" accent='TEAL'>
      {/* Pod Members Section */}
      {podMembers && podMembers.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2 text-slate-500">
              YOUR POD MEMBERS:
            </p>
            <div className="flex gap-2 flex-wrap">
              {podMembers.map((member, idx) => (
                <div key={idx} 
                     className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#47A88D] text-white">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#002E47]">
                      {member.name || 'Leader'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {member.streak || 0} day streak
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2 text-slate-500">
              RECENT ACTIVITY:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activityFeed && activityFeed.length > 0 ? (
                activityFeed.map((activity, idx) => (
                  <div key={idx} 
                       className="p-3 rounded-lg border-l-4 bg-slate-50 border-[#47A88D]">
                    <div className="flex items-start gap-2">
                      <Activity className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#47A88D]" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#002E47]">
                          {activity.userName}
                        </p>
                        <p className="text-xs text-slate-700">
                          {activity.message}
                        </p>
                        <p className="text-xs mt-1 text-slate-500">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center py-4 text-slate-500">
                  No recent activity. Be the first to share!
                </p>
              )}
            </div>
          </div>

          {/* Send Message */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex gap-2">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Share your progress..."
                className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 bg-[#47A88D]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <p className="text-sm font-semibold mb-2 text-[#002E47]">
            No Pod Members Yet
          </p>
          <p className="text-xs mb-4 text-slate-500">
            Connect with other leaders to build accountability
          </p>
          <Button onClick={onFindPod} variant="outline" size="sm">
            Find a Pod
          </Button>
        </div>
      )}
    </Card>
  );
};

/* =========================================================
   AI COACH NUDGE
========================================================= */
export const AICoachNudge = ({ onOpenLab, disabled }) => (
  <Card>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#47A88D]/20 text-[#47A88D]">
        <MessageSquare className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold mb-1 text-[#002E47]">Need coaching support?</h3>
        <p className="text-sm mb-3 text-slate-700">
          Practice scenarios, get feedback, or work through challenges with your AI coach.
        </p>
        <Button onClick={onOpenLab} variant="outline" size="sm" disabled={disabled}>
          <Zap className="w-4 h-4 mr-1" /> Open Coaching
        </Button>
      </div>
    </div>
  </Card>
);

/* =========================================================
   DEV PLAN PROGRESS LINK
========================================================= */
export const DevPlanProgressLink = ({ progress, focusArea, onNavigate }) => (
  <Card>
    <div className="flex items-center justify-between mb-3">
      <div className="flex-1">
        <p className="text-xs font-semibold mb-1 text-slate-500">
          CURRENT DEVELOPMENT FOCUS
        </p>
        <p className="text-base font-bold text-[#002E47]">
          {focusArea || 'Not Set'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xl sm:text-2xl sm:text-3xl font-bold text-[#47A88D]">
          {progress || 0}%
        </p>
        <p className="text-xs text-slate-500">
          Complete
        </p>
      </div>
    </div>
    <Button 
      onClick={onNavigate}
      variant="outline"
      size="sm"
      className="w-full"
    >
      View Development Plan →
    </Button>
  </Card>
);

/* =========================================================
   REMINDER BANNER COMPONENTS
========================================================= */
export const ReminderBanner = ({ message, onDismiss, type = 'best' }) => {
  const bgColorClass = type === 'best' ? 'bg-[#47A88D]/10 border-[#47A88D]' : 'bg-amber-100 border-amber-500';
  const textColorClass = type === 'best' ? 'text-[#47A88D]' : 'text-amber-600';
  const emoji = type ==='best' ? '🌟' : '💡';
  const label = type === 'best' ? "YESTERDAY'S COMMITMENT:" : "AREA FOR IMPROVEMENT:";
  
  if (!message || typeof message !== 'string') {
    return null;
  }
  
  return (
    <div className={`p-4 rounded-lg border-l-4 ${bgColorClass}`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <p className={`text-xs font-semibold mb-1 ${textColorClass}`}>
            {emoji} {label}
          </p>
          <p className="text-sm text-[#002E47]">
            {message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Dismiss reminder"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   UNIFIED ANCHOR EDITOR MODAL
========================================================= */
const AnchorInputSection = ({ 
    title, description, value, setValue, 
    suggestions, onSelectSuggestion, isTextArea = false,
    icon: Icon 
}) => {
    const suggestionPrefix = title === '1. Identity Anchor' ? '... ' : ''; 
        
    return (
        <div className="p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-[#47A88D]" />
                <h3 className="text-lg font-bold text-[#002E47]">
                    {title}
                </h3>
            </div>
            <p className="text-xs mb-3 text-slate-500">
                {description}
            </p>
            
            {isTextArea ? (
                <textarea 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter your anchor..."
                    className="w-full p-3 border border-slate-200 rounded-lg mb-4"
                    rows={3}
                />
            ) : (
                <input 
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter your anchor..."
                    className="w-full p-3 border border-slate-200 rounded-lg mb-4"
                />
            )}
            
            {suggestions && suggestions.length > 0 && (
                <>
                    <p className="text-xs font-semibold mb-2 text-slate-500">
                        SUGGESTIONS:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {suggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectSuggestion(suggestion.text)}
                                className="w-full text-left p-2 rounded-lg text-sm transition-all bg-slate-50 hover:bg-teal-50 text-[#002E47]"
                            >
                                {suggestionPrefix} {suggestion.text}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const UnifiedAnchorEditorModal = ({ 
    isOpen = false,
    initialIdentity = '', initialHabit = '', initialWhy = '',
    identitySuggestions = [], habitSuggestions = [], whySuggestions = [],
    onSave, onClose
}) => {
    const [identity, setIdentity] = useState(initialIdentity);
    const [habit, setHabit] = useState(initialHabit);
    const [why, setWhy] = useState(initialWhy);

    const handleSave = () => {
        if (onSave) {
            onSave({ identity, habit, why });
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
                    <h2 className="text-xl font-bold text-[#002E47] flex items-center gap-2">
                        <Anchor className="w-6 h-6 text-[#47A88D]" />
                        Define Your Leadership Anchors
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                    <AnchorInputSection
                        title="1. Identity Anchor"
                        icon={User}
                        description='Complete the statement: "I am the kind of leader who..."'
                        value={identity}
                        setValue={setIdentity}
                        suggestions={identitySuggestions}
                        onSelectSuggestion={setIdentity}
                    />

                    <AnchorInputSection
                        title="2. Habit Anchor (Cue)"
                        icon={Clock}
                        description='Your daily cue: "When I..."'
                        value={habit}
                        setValue={setHabit}
                        suggestions={habitSuggestions}
                        onSelectSuggestion={setHabit}
                    />
                    
                    <AnchorInputSection
                        title="3. Your 'Why It Matters'"
                        icon={Zap}
                        description='Your core purpose: Why does this leadership journey matter to you?'
                        value={why}
                        setValue={setWhy}
                        suggestions={whySuggestions}
                        onSelectSuggestion={setWhy}
                        isTextArea={true}
                    />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex gap-3">
                    <Button onClick={handleSave} variant="primary" size="md" className="flex-1">
                        <Save className="w-4 h-4 mr-2" /> Save All Anchors
                    </Button>
                    <Button onClick={handleClose} variant="outline" size="md" className="flex-1">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const CalendarSyncModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleSync = (provider) => {
        alert(`Integration with ${provider} is coming soon!`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
                    <h2 className="text-xl font-bold text-[#002E47] flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-[#47A88D]" />
                        Calendar Integration
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <p className="text-slate-600 mb-6">
                    Sync your Daily Reps and Coaching Sessions directly to your personal calendar. Never miss a beat in your leadership journey.
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleSync('Google Calendar')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#47A88D] hover:bg-teal-50 transition-all group"
                    >
                        <span className="font-semibold text-slate-700 group-hover:text-teal-700">Google Calendar</span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#47A88D]" />
                    </button>
                    
                    <button 
                        onClick={() => handleSync('Outlook')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#47A88D] hover:bg-teal-50 transition-all group"
                    >
                        <span className="font-semibold text-slate-700 group-hover:text-teal-700">Outlook Calendar</span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#47A88D]" />
                    </button>
                    
                    <button 
                        onClick={() => handleSync('Apple Calendar')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#47A88D] hover:bg-teal-50 transition-all group"
                    >
                        <span className="font-semibold text-slate-700 group-hover:text-teal-700">Apple Calendar (iCal)</span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#47A88D]" />
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        Secure one-way sync. We never read your personal events.
                    </p>
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   ANCHORS IN ACTION
========================================================= */
export const AnchorsInAction = ({ identityStatement, habitAnchor, whyStatement }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!identityStatement && !habitAnchor && !whyStatement) {
        return null;
    }
    
    return (
        <Card accent="BLUE">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Anchor className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-[#002E47]">
                            Your Leadership Anchors
                        </h3>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                    </button>
                </div>
                
                {isExpanded && (
                    <div className="space-y-3">
                        {/* Identity Anchor */}
                        {identityStatement && (
                            <div className="p-3 rounded-lg border-l-4 bg-[#47A88D]/10 border-[#47A88D]">
                                <div className="flex items-start gap-2">
                                    <User className="w-4 h-4 flex-shrink-0 mt-1 text-[#47A88D]" />
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold mb-1 text-[#47A88D]">
                                            🎯 IDENTITY ANCHOR:
                                        </p>
                                        <p className="text-sm italic text-slate-700">
                                            "I am the kind of leader who {identityStatement}"
                                        </p>
                                        <p className="text-xs mt-2 text-slate-500">
                                            ✓ Displayed in your Morning Bookend to ground your daily practice
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Habit Anchor */}
                        {habitAnchor && (
                            <div className="p-3 rounded-lg border-l-4 bg-blue-100 border-blue-600">
                                <div className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 flex-shrink-0 mt-1 text-blue-600" />
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold mb-1 text-blue-600">
                                            ⏰ HABIT ANCHOR (CUE):
                                        </p>
                                        <p className="text-sm italic text-slate-700">
                                            "When I {habitAnchor}..."
                                        </p>
                                        <p className="text-xs mt-2 text-slate-500">
                                            ✓ Triggers your daily leadership practice routine
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Why Statement */}
                        {whyStatement && (
                            <div className="p-3 rounded-lg border-l-4 bg-[#E04E1B]/10 border-[#E04E1B]">
                                <div className="flex items-start gap-2">
                                    <Zap className="w-4 h-4 flex-shrink-0 mt-1 text-[#E04E1B]" />
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold mb-1 text-[#E04E1B]">
                                            💡 WHY IT MATTERS:
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            {whyStatement}
                                        </p>
                                        <p className="text-xs mt-2 text-slate-500">
                                            ✓ Your core purpose that keeps you motivated
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* How Anchors Are Used */}
                        <div className="pt-3 border-t border-slate-200">
                            <p className="text-xs font-semibold mb-2 text-[#002E47]">
                                📍 WHERE YOUR ANCHORS APPEAR:
                            </p>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-700">
                                    • <strong>Morning Bookend:</strong> Identity statement visible in optional LIS section
                                </p>
                                <p className="text-xs text-slate-700">
                                    • <strong>Daily Reminders:</strong> Why statement reminds you of your purpose
                                </p>
                                <p className="text-xs text-slate-700">
                                    • <strong>Habit Building:</strong> Cue triggers consistent daily practice
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

/* =========================================================
   DAILY PROGRESS SUMMARY
========================================================= */
export const DailyProgressSummary = ({ dailyPracticeData }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    const todaysWIN = dailyPracticeData?.morningBookend?.dailyWIN;
    const eveningReflection = dailyPracticeData?.eveningBookend;
    const winCompleted = dailyPracticeData?.morningBookend?.winCompleted;
    
    if (!todaysWIN && !eveningReflection?.good) {
        return null;
    }
    
    return (
        <Card accent="TEAL">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#47A88D]" />
                        <h3 className="text-lg font-bold text-[#002E47]">
                            Today's Progress
                        </h3>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                    </button>
                </div>
                
                {isExpanded && (
                    <>
                        {/* Today's WIN */}
                        {todaysWIN && (
                            <div className={`p-3 rounded-lg border-2 ${winCompleted ? 'bg-green-50 border-green-500' : 'bg-teal-50 border-[#47A88D]'}`}>
                                <div className="flex items-start gap-3">
                                    {winCompleted && (
                                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold mb-1 text-slate-500">
                                            🏆 TODAY'S WIN:
                                        </p>
                                        <p className={`text-sm font-bold text-[#002E47] ${winCompleted ? 'line-through opacity-60' : ''}`}>
                                            {todaysWIN}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Evening Reflection Summary */}
                        {eveningReflection?.good && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-500">
                                    🌙 TODAY'S REFLECTION:
                                </p>
                                
                                {/* What Went Well */}
                                <div className="p-2 rounded-lg bg-green-100">
                                    <p className="text-xs font-semibold mb-1 text-green-600">
                                        ✅ What Went Well:
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        {eveningReflection.good}
                                    </p>
                                </div>
                                
                                {/* What Could Be Better */}
                                {eveningReflection.better && (
                                    <div className="p-2 rounded-lg bg-amber-100">
                                        <p className="text-xs font-semibold mb-1 text-amber-600">
                                            💡 What Could Be Better:
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            {eveningReflection.better}
                                        </p>
                                    </div>
                                )}
                                
                                {/* Tomorrow's Focus */}
                                {eveningReflection.best && (
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <p className="text-xs font-semibold mb-1 text-blue-600">
                                            🎯 Tomorrow's Focus:
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            {eveningReflection.best}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
};

/* =========================================================
   WINS LIST COMPONENT
========================================================= */
export const WinsList = ({ winsList, onDeleteWin }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    if (!winsList || winsList.length === 0) {
        return null;
    }

    return (
        <Card accent="GREEN">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-bold text-[#002E47]">
                            🏆 Your Wins ({winsList.length})
                        </h3>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                    </button>
                </div>
                
                {isExpanded && (
                    <div className="space-y-3">
                        {winsList.slice().reverse().map((win, index) => (
                            <div key={win.id || index} 
                                 className="p-3 rounded-lg border-2 bg-gradient-to-r from-green-50 to-teal-50 border-green-600">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star className="w-4 h-4 text-green-600" />
                                            <span className="text-xs font-semibold text-slate-500">
                                                {win.date}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700">
                                            {win.text}
                                        </p>
                                    </div>
                                    {onDeleteWin && (
                                        <button
                                            onClick={() => onDeleteWin(win.id)}
                                            className="p-1 rounded-full hover:bg-red-100 transition-colors text-red-500 hover:text-red-700"
                                            title="Delete this win"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};

/* =========================================================
   PLACEHOLDER COMPONENTS
========================================================= */
export const IdentityAnchorCard = () => null;
export const HabitAnchorCard = () => null;
export const WhyAnchorCard = () => null;
