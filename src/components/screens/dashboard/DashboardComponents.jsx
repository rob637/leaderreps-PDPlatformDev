// src/components/screens/dashboard/DashboardComponents.jsx
// MODIFIED: 10/30/25 - Final version with UnifiedAnchorEditorModal, LeadershipAnchorsCard, 
//                      clickable system tasks, and fixed height for Morning Bookend to prevent layout shift.

import React, { useState, useEffect } from 'react';
import { 
  Target, Clock, User, Save, Loader, CheckCircle, TrendingUp, Star, 
  ChevronDown, ChevronUp, Plus, X, Sunrise, Moon, Flame, Anchor,
  ToggleLeft, ToggleRight, Zap, AlertTriangle, MessageSquare, Trophy,
  Send, Users, Activity, Edit3
} from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';

/* =========================================================
   COLORS & BASE COMPONENTS
========================================================= */
export const COLORS = { 
  NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', 
  GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', 
  OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', 
  PURPLE: '#7C3AED', BG: '#F9FAFB' 
};

// --- Standardized Button Component (Unchanged) ---
export const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;

  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm';
  else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg';
  else baseStyle += ' px-6 py-3 text-base';

  if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
  else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
  else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;

  if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';

  return <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>;
};

// --- Standardized Card Component (Unchanged) ---
export const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.NAVY;
  const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };

  return (
    <Tag
      {...(interactive ? { type: 'button' } : {})}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`}
      style={{
          background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)',
          borderColor: COLORS.SUBTLE,
          color: COLORS.NAVY
      }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

      {Icon && title && (
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
                  <Icon className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2>
          </div>
      )}
      {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}

      <div>{children}</div>
    </Tag>
  );
};

/* =========================================================
   MODE SWITCH COMPONENT (Unchanged)
========================================================= */
export const ModeSwitch = ({ isArenaMode, onToggle, isLoading }) => (
  <button
    onClick={onToggle}
    disabled={isLoading}
    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border-2"
    style={{
      backgroundColor: isArenaMode ? COLORS.TEAL : COLORS.ORANGE,
      borderColor: isArenaMode ? COLORS.TEAL : COLORS.ORANGE,
      color: 'white',
      opacity: isLoading ? 0.6 : 1
    }}
  >
    {isArenaMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
    <span className="font-semibold text-sm">{isArenaMode ? 'Arena Mode' : 'Solo Mode'}</span>
  </button>
);

/* =========================================================
   STREAK TRACKER COMPONENT (Unchanged)
========================================================= */
export const StreakTracker = ({ streakCount, streakCoins }) => (
  <div className="flex items-center gap-4 px-4 py-2 rounded-lg border-2" 
       style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.LIGHT_GRAY }}>
    <div className="flex items-center gap-2">
      <Flame className="w-5 h-5" style={{ color: COLORS.ORANGE }} />
      <span className="font-bold text-lg" style={{ color: COLORS.NAVY }}>{streakCount}</span>
      <span className="text-sm" style={{ color: COLORS.MUTED }}>Day Streak</span>
    </div>
    <div className="h-6 w-px" style={{ backgroundColor: COLORS.SUBTLE }} />
    <div className="flex items-center gap-2">
      <span className="text-xl">🪙</span>
      <span className="font-bold text-lg" style={{ color: COLORS.NAVY }}>{streakCoins}</span>
      <span className="text-sm" style={{ color: COLORS.MUTED }}>Coins</span>
    </div>
  </div>
);

/* =========================================================
   TAB BUTTON (for Dynamic Bookend Container) (Unchanged)
========================================================= */
export const TabButton = ({ active, onClick, label, minimized = false }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 relative ${
      active ? 'shadow-md' : 'hover:bg-gray-50'
    }`}
    style={{
      backgroundColor: active ? COLORS.TEAL : 'transparent',
      color: active ? 'white' : COLORS.TEXT,
      border: active ? 'none' : `2px solid ${COLORS.SUBTLE}`
    }}
  >
    {label}
    {minimized && !active && (
      <span 
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
        style={{ backgroundColor: COLORS.ORANGE }}
        title="Incomplete"
      />
    )}
  </button>
);

/* =========================================================
   DYNAMIC BOOKEND CONTAINER (Unchanged)
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
  
  // FIX #7: Improved minimization logic for AM bookend
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
   MORNING BOOKEND COMPONENT (WITH LAYOUT FIX)
========================================================= */
export const MorningBookend = ({ 
    dailyWIN, setDailyWIN, otherTasks, onAddTask, onToggleTask, onRemoveTask,
    showLIS, setShowLIS, identityStatement, onSave, isSaving, 
    onToggleWIN, onSaveWIN,
    completedAt, winCompleted
}) => {
    const [newTaskText, setNewTaskText] = useState('');
    
    const handleAddClick = () => {
        if (newTaskText.trim()) { onAddTask(newTaskText); setNewTaskText(''); }
    };
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleAddClick(); };
    
    // FIX #7: Improved lock logic
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
                    <Sunrise className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                    <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                        ✅ Today's Plan
                    </h3>
                </div>
                
                {/* WIN Display with Checkbox */}
                <div className="p-3 rounded-lg border-2" 
                     style={{ 
                         backgroundColor: winCompleted ? `${COLORS.GREEN}10` : `${COLORS.TEAL}10`,
                         borderColor: winCompleted ? COLORS.GREEN : COLORS.TEAL
                     }}>
                    <div className="flex items-start gap-3">
                        <input 
                            type="checkbox"
                            checked={winCompleted || false}
                            onChange={onToggleWIN}
                            className="mt-1 w-5 h-5 flex-shrink-0"
                            style={{ accentColor: COLORS.TEAL }}
                        />
                        <div className="flex-1">
                            <p className="text-xs font-semibold mb-1" style={{ color: COLORS.MUTED }}>
                                🏆 TODAY'S WIN:
                            </p>
                            <p className={`text-sm font-bold ${winCompleted ? 'line-through opacity-60' : ''}`} 
                               style={{ color: COLORS.NAVY }}>
                                {dailyWIN || 'No WIN set'}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Tasks Display with Checkboxes - MIN-HEIGHT FIX APPLIED */}
                <div className="space-y-2" style={{ minHeight: '180px' }}> 
                    <p className="text-xs font-semibold" style={{ color: COLORS.MUTED }}>
                        📋 OTHER TASKS:
                    </p>
                    {otherTasks && otherTasks.length > 0 ? (
                        otherTasks.map((task, idx) => (
                            <div key={task.id || idx} 
                                 className="flex items-center gap-3 p-2 border rounded-lg"
                                 style={{ borderColor: task.completed ? COLORS.GREEN : COLORS.SUBTLE }}>
                                
                                {/* MODIFIED: Render system tasks as clickable buttons/links */}
                                {task.isSystem ? (
                                    <button 
                                        onClick={task.onClick}
                                        className="text-sm flex-1 text-left font-medium hover:text-teal-600 transition-colors"
                                        style={{ color: COLORS.NAVY }}
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
                                        className="w-4 h-4"
                                        style={{ accentColor: COLORS.TEAL }}
                                    />
                                    <span className={`text-sm flex-1 ${task.completed ? 'line-through opacity-60' : ''}`}
                                        style={{ color: COLORS.TEXT }}>
                                        {task.text}
                                    </span>
                                  </>
                                )}
                                {/* Only show remove button for non-system, non-completed tasks in checklist mode */}
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
                        <p className="text-sm italic pt-2" style={{ color: COLORS.MUTED }}>No tasks were set for today.</p>
                    )}
                </div>
                
                {/* LIS Display (if enabled) */}
                {showLIS && identityStatement && (
                    <div className="p-3 rounded-lg border" 
                         style={{ backgroundColor: `${COLORS.TEAL}10`, borderColor: `${COLORS.TEAL}30` }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: COLORS.TEAL }}>
                            🎯 IDENTITY ANCHOR:
                        </p>
                        <p className="text-sm italic" style={{ color: COLORS.TEXT }}>
                            {identityStatement}
                        </p>
                    </div>
                )}
                
                {/* Completion Status */}
                <div className="pt-3 border-t text-center" style={{ borderColor: COLORS.SUBTLE }}>
                    <p className="text-xs font-semibold" style={{ color: COLORS.GREEN }}>
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
                <Sunrise className="w-5 h-5" style={{ color: COLORS.ORANGE }} />
                <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                    🌅 Plan Your Day
                </h3>
            </div>
            
            {/* FIX #7: Warning if past noon */}
            {showNoonWarning && (
                <div className="p-3 rounded-lg border-l-4" 
                     style={{ backgroundColor: `${COLORS.AMBER}10`, borderColor: COLORS.AMBER }}>
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.AMBER }} />
                        <div>
                            <p className="text-xs font-semibold" style={{ color: COLORS.AMBER }}>
                                ⚠️ LATE START ALERT
                            </p>
                            <p className="text-xs mt-1" style={{ color: COLORS.TEXT }}>
                                It's past noon! Set your WIN and lock in your plan to stay on track.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* FIX #7: Why It Matters Section */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS.BLUE}05`, border: `1px solid ${COLORS.BLUE}20` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: COLORS.BLUE }}>
                    💡 WHY IT MATTERS:
                </p>
                <p className="text-xs" style={{ color: COLORS.TEXT }}>
                    Leaders who plan their day intentionally are 3x more likely to achieve their goals. 
                    Your WIN keeps you focused on what truly matters.
                </p>
            </div>
            
            {/* WIN Input */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.TEXT }}>
                    <Target className="w-4 h-4 mr-1" style={{ color: COLORS.ORANGE }} />
                    Today's WIN (What's Important Now)
                </label>
                <textarea 
                    value={dailyWIN} onChange={(e) => setDailyWIN(e.target.value)}
                    placeholder="What is the ONE thing that must get done today?"
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: COLORS.SUBTLE }} rows={2}
                />
                {/* Separate Save WIN Button (Address user confusion) */}
                <Button 
                    onClick={onSaveWIN}
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                >
                    <Save className="w-4 h-4 mr-1" /> Save Today's WIN
                </Button>
            </div>

            {/* Tasks Input - MIN-HEIGHT FIX APPLIED */}
            <div style={{ minHeight: '180px' }}>
                <label className="text-sm font-semibold mb-2 flex items-center justify-between" style={{ color: COLORS.TEXT }}>
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" style={{ color: COLORS.TEAL }} />
                        Other Important Tasks ({otherTasks?.length || 0}/5)
                    </span>
                </label>
                
                {/* Existing Tasks */}
                {otherTasks && otherTasks.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {otherTasks.map((task, idx) => (
                            <div key={task.id || idx} 
                                 className="flex items-center gap-2 p-2 border rounded-lg"
                                 style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.LIGHT_GRAY }}>
                                
                                {/* MODIFIED: Render system tasks as clickable buttons/links */}
                                {task.isSystem ? (
                                    <button 
                                        onClick={task.onClick}
                                        className="text-sm flex-1 text-left font-medium hover:text-teal-600 transition-colors"
                                        style={{ color: COLORS.NAVY }}
                                    >
                                        <span className="mr-2 text-red-500">→</span>
                                        {task.text}
                                    </button>
                                ) : (
                                    <span className="text-sm flex-1" style={{ color: COLORS.TEXT }}>{task.text}</span>
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
                            className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 transition-all"
                            style={{ borderColor: COLORS.SUBTLE }}
                        />
                        <button 
                            onClick={handleAddClick}
                            disabled={!newTaskText.trim() || (otherTasks && otherTasks.length >= 5)}
                            className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                            style={{ backgroundColor: COLORS.TEAL }}
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
                    className="text-sm font-semibold flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ color: COLORS.TEAL }}
                >
                    {showLIS ? 'Hide' : 'Show'} Leadership Identity Statement
                    {showLIS ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showLIS && (
                    <div className="mt-3 p-4 rounded-lg border" 
                         style={{ backgroundColor: `${COLORS.TEAL}10`, borderColor: `${COLORS.TEAL}30` }}>
                        <p className="text-sm italic font-medium" style={{ color: COLORS.TEXT }}>
                            "I am the kind of leader who {identityStatement || '...'}"
                        </p>
                    </div>
                )}
            </div>

            {/* FIX #7: Validation - require WIN before completion */}
            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                {!dailyWIN && (
                    <p className="text-xs mb-2 text-center" style={{ color: COLORS.AMBER }}>
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
   EVENING BOOKEND COMPONENT (WITH LAYOUT FIX)
========================================================= */
export const EveningBookend = ({ 
    reflectionGood, setReflectionGood, reflectionBetter, setReflectionBetter,
    reflectionBest, setReflectionBest, habitsCompleted, onHabitToggle, onSave, isSaving,
    onNavigate, amWinCompleted, amTasksCompleted
}) => {
    // Determine the calculated stable height based on MorningBookend
    const minHeightStyle = { minHeight: '445px' }; // Height based on a stable MorningBookend height
    
    return (
        <div className="space-y-4" style={minHeightStyle}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Moon className="w-5 h-5" style={{ color: COLORS.NAVY }} />
                <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                    🌙 Evening Reflection
                </h3>
            </div>
            
            {/* Good */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.GREEN }}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Good - What went well today?
                </label>
                <textarea value={reflectionGood} onChange={(e) => setReflectionGood(e.target.value)}
                    placeholder="Celebrate your wins..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.GREEN}40` }} rows={2}
                />
            </div>

            {/* Better */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.AMBER }}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Better - What needs improvement?
                </label>
                <textarea value={reflectionBetter} onChange={(e) => setReflectionBetter(e.target.value)}
                    placeholder="Areas for growth..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.AMBER}40` }} rows={2}
                />
            </div>

            {/* Best */}
            <div>
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.BLUE }}>
                    <Star className="w-4 h-4 mr-1" />
                    Best - What do I need to do to show up as my best tomorrow?
                </label>
                <textarea value={reflectionBest} onChange={(e) => setReflectionBest(e.target.value)}
                    placeholder="Tomorrow's commitment..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.BLUE}40` }} rows={2}
                />
            </div>

            {/* Daily Habits Tracker */}
            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <p className="text-sm font-semibold mb-3" style={{ color: COLORS.TEXT }}>Daily Habits Tracker</p>
                
                {/* Auto-Tracked Habits (Matches user request) */}
                <div className="space-y-2 mb-3 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.TEAL}05` }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: COLORS.TEAL }}>
                        🔗 AUTO-TRACKED FROM MORNING:
                    </p>
                    
                    <label className="flex items-center gap-2 p-2 rounded opacity-75">
                        {/* MODIFIED (10/29/25): Use amWinCompleted prop */}
                        <input type="checkbox" checked={amWinCompleted || false}
                            disabled 
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Completed Morning WIN</span>
                    </label>
                    
                    <label className="flex items-center gap-2 p-2 rounded opacity-75">
                        {/* MODIFIED (10/29/25): Use amTasksCompleted prop */}
                        <input type="checkbox" checked={amTasksCompleted || false}
                            disabled
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Completed All Morning Tasks</span>
                    </label>
                </div>
                
                {/* Manual Tracking */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
                        ✍️ MANUAL TRACKING:
                    </p>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.readLIS || false}
                            onChange={(e) => onHabitToggle('readLIS', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Read LIS</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.completedDailyRep || false}
                            onChange={(e) => onHabitToggle('completedDailyRep', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Complete Daily Rep</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.eveningReflection || false}
                            onChange={(e) => onHabitToggle('eveningReflection', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Evening Reflection</span>
                    </label>
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <Button onClick={onSave} disabled={isSaving} variant="primary" size="md" className="w-full">
                    {isSaving ? <><Loader className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 
                               <><Save className="w-5 h-5 mr-2" />Save Reflection</>}
                </Button>
            </div>
            
            {/* View History Link */}
            {onNavigate && (
                <div className="pt-3">
                    <Button 
                        onClick={() => onNavigate('reflection-log')}
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
   SUGGESTION MODAL (FIX #4, #5)
========================================================= */
export const SuggestionModal = ({ title, prefix, suggestions, onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
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
            className="w-full text-left p-4 rounded-lg border-2 transition-all hover:border-teal-500 hover:bg-teal-50"
            style={{ borderColor: COLORS.SUBTLE }}
          >
            <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
              {prefix} <strong>{suggestion.value || suggestion.text || suggestion}</strong>
            </p>
            {suggestion.description && (
              <p className="text-xs mt-1" style={{ color: COLORS.MUTED }}>
                {suggestion.description}
              </p>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
        <Button onClick={onClose} variant="outline" size="sm" className="w-full">
          Close
        </Button>
      </div>
    </div>
  </div>
);

/* =========================================================
   FIX #6: SAVE INDICATOR
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
   FIX #3: BONUS EXERCISE MODAL
========================================================= */
export const BonusExerciseModal = ({ exercise, onComplete, onSkip }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
             style={{ backgroundColor: `${COLORS.ORANGE}20` }}>
          <Trophy className="w-8 h-8" style={{ color: COLORS.ORANGE }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
          🎉 Bonus Challenge!
        </h2>
        <p className="text-sm" style={{ color: COLORS.MUTED }}>
          Complete this 2-minute exercise to earn +50 coins
        </p>
      </div>

      <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: `${COLORS.TEAL}10` }}>
        <h3 className="font-bold mb-2" style={{ color: COLORS.NAVY }}>
          {exercise.name || exercise.title}
        </h3>
        <p className="text-sm mb-3" style={{ color: COLORS.TEXT }}>
          {exercise.description}
        </p>
        {exercise.instructions && (
          <div className="text-xs" style={{ color: COLORS.MUTED }}>
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
   FIX #8: ADDITIONAL REPS CARD (Enhanced)
========================================================= */
export const AdditionalRepsCard = ({ commitments, onToggle, repLibrary }) => {
  // Lookup full rep details from library
  const enrichedCommitments = commitments.map(commitment => {
    if (typeof commitment === 'string') {
      return { id: commitment, text: commitment, completed: false };
    }
    
    // If we have a repId, lookup details from library
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
               className="p-4 rounded-lg border-2 transition-all"
               style={{ 
                 borderColor: commitment.completed ? COLORS.GREEN : COLORS.SUBTLE,
                 backgroundColor: commitment.completed ? `${COLORS.GREEN}05` : COLORS.LIGHT_GRAY
               }}>
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                checked={commitment.completed || false}
                onChange={() => onToggle(commitment.id)}
                className="mt-1 w-5 h-5 flex-shrink-0"
                style={{ accentColor: COLORS.TEAL }}
              />
              <div className="flex-1">
                <p className={`text-sm font-bold mb-1 ${commitment.completed ? 'line-through opacity-60' : ''}`}
                   style={{ color: COLORS.NAVY }}>
                  {commitment.name || commitment.text || commitment.repId}
                </p>
                {commitment.description && (
                  <p className="text-xs mb-2" style={{ color: COLORS.MUTED }}>
                    {commitment.description}
                  </p>
                )}
                {commitment.category && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold"
                        style={{ backgroundColor: `${COLORS.BLUE}20`, color: COLORS.BLUE }}>
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
   FIX #8 & #9: SOCIAL POD CARD (with working Find Pod button)
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
    <Card title="🤝 Social Pod Feed" accent='PURPLE'>
      {/* Pod Members Section */}
      {podMembers && podMembers.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
              YOUR POD MEMBERS:
            </p>
            <div className="flex gap-2 flex-wrap">
              {podMembers.map((member, idx) => (
                <div key={idx} 
                     className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                     style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.LIGHT_GRAY }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: COLORS.PURPLE, color: 'white' }}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: COLORS.NAVY }}>
                      {member.name || 'Leader'}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.MUTED }}>
                      {member.streak || 0} day streak
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
              RECENT ACTIVITY:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activityFeed && activityFeed.length > 0 ? (
                activityFeed.map((activity, idx) => (
                  <div key={idx} 
                       className="p-3 rounded-lg border-l-4"
                       style={{ 
                         backgroundColor: COLORS.LIGHT_GRAY,
                         borderColor: COLORS.PURPLE
                       }}>
                    <div className="flex items-start gap-2">
                      <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.PURPLE }} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: COLORS.NAVY }}>
                          {activity.userName}
                        </p>
                        <p className="text-xs" style={{ color: COLORS.TEXT }}>
                          {activity.message}
                        </p>
                        <p className="text-xs mt-1" style={{ color: COLORS.MUTED }}>
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center py-4" style={{ color: COLORS.MUTED }}>
                  No recent activity. Be the first to share!
                </p>
              )}
            </div>
          </div>

          {/* Send Message */}
          <div className="pt-3 border-t" style={{ borderColor: COLORS.SUBTLE }}>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Share your progress..."
                className="flex-1 p-2 border rounded-lg text-sm"
                style={{ borderColor: COLORS.SUBTLE }}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: COLORS.PURPLE }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.MUTED }} />
          <p className="text-sm font-semibold mb-2" style={{ color: COLORS.NAVY }}>
            No Pod Members Yet
          </p>
          <p className="text-xs mb-4" style={{ color: COLORS.MUTED }}>
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
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
           style={{ backgroundColor: `${COLORS.PURPLE}20`, color: COLORS.PURPLE }}>
        <MessageSquare className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold mb-1" style={{ color: COLORS.NAVY }}>Need coaching support?</h3>
        <p className="text-sm mb-3" style={{ color: COLORS.TEXT }}>
          Practice scenarios, get feedback, or work through challenges with your AI coach.
        </p>
        <Button onClick={onOpenLab} variant="outline" size="sm" disabled={disabled}>
          <Zap className="w-4 h-4 mr-1" /> Open Coaching Lab
        </Button>
      </div>
    </div>
  </Card>
);

/* =========================================================
   DEV PLAN PROGRESS LINK (FIX #2)
========================================================= */
export const DevPlanProgressLink = ({ progress, focusArea, onNavigate }) => (
  <Card>
    <div className="flex items-center justify-between mb-3">
      <div className="flex-1">
        <p className="text-xs font-semibold mb-1" style={{ color: COLORS.MUTED }}>
          CURRENT DEVELOPMENT FOCUS
        </p>
        <p className="text-base font-bold" style={{ color: COLORS.NAVY }}>
          {focusArea || 'Not Set'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold" style={{ color: COLORS.TEAL }}>
          {progress || 0}%
        </p>
        <p className="text-xs" style={{ color: COLORS.MUTED }}>
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
  const bgColor = type === 'best' ? COLORS.TEAL : COLORS.AMBER;
  const emoji = type ==='best' ? '🌟' : '💡';
  const label = type === 'best' ? "YESTERDAY'S COMMITMENT:" : "AREA FOR IMPROVEMENT:";
  
  return (
    <div 
      className="p-4 rounded-lg border-l-4" 
      style={{ 
        backgroundColor: `${bgColor}10`, 
        borderColor: bgColor 
      }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold mb-1" style={{ color: bgColor }}>
            {emoji} {label}
          </p>
          <p className="text-sm" style={{ color: COLORS.NAVY }}>
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
   NEW: LEADERSHIP ANCHORS CARD (Exported)
========================================================= */
export const LeadershipAnchorsCard = ({ 
    identityStatement, 
    habitAnchor, 
    whyStatement, 
    onDefine, 
    onEdit
}) => {
    const isFullyDefined = !!identityStatement && !!habitAnchor && !!whyStatement;
    const itemsDefined = [identityStatement, habitAnchor, whyStatement].filter(Boolean).length;

    return (
        <Card title="⚓ Leadership Anchors" accent='TEAL' icon={Target}>
            {isFullyDefined ? (
                // Summary View (All 3 are set)
                <div className="space-y-3">
                    <p className="text-sm font-bold" style={{ color: COLORS.NAVY }}>
                        All 3 Anchors Set
                    </p>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS.TEAL}10` }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: COLORS.TEAL }}>
                            Identity:
                        </p>
                        <p className="text-sm italic" style={{ color: COLORS.TEXT }}>
                            "I am the kind of leader who {identityStatement}"
                        </p>
                    </div>
                    <Button onClick={onEdit} variant="outline" size="sm" className="w-full">
                        <Edit3 className="w-4 h-4 mr-1" /> Edit Anchors
                    </Button>
                </div>
            ) : (
                // Call to Action View (Missing one or more)
                <div className="text-center p-4 space-y-3 bg-gray-50 rounded-lg">
                    <p className="text-base font-semibold" style={{ color: COLORS.NAVY }}>
                        {itemsDefined}/3 Anchors Defined
                    </p>
                    <p className="text-sm" style={{ color: COLORS.MUTED }}>
                        Define your **Identity**, **Habit**, and **Why** to solidify your practice.
                    </p>
                    <Button onClick={onDefine} variant="primary" size="md" className="w-full">
                        <Zap className="w-4 h-4 mr-1" /> Define Your Anchors
                    </Button>
                </div>
            )}
        </Card>
    );
};


/* =========================================================
   NEW: UNIFIED ANCHOR EDITOR MODAL
========================================================= */
const AnchorInputSection = ({ 
    title, icon: Icon, description, value, setValue, 
    suggestions, onSelectSuggestion, isTextArea = false 
}) => {
    // Determine the text used for suggestions based on the anchor type
    const suggestionPrefix = title === '1. Identity Anchor' 
        ? '... ' // for "...prioritizes team well-being"
        : ''; 
        
    return (
        <div className="p-4 rounded-xl border" style={{ borderColor: COLORS.SUBTLE }}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                    {title}
                </h3>
            </div>
            <p className="text-xs mb-3" style={{ color: COLORS.MUTED }}>
                {description}
            </p>
            
            {isTextArea ? (
                <textarea 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter your anchor..."
                    className="w-full p-3 border rounded-lg mb-4"
                    style={{ borderColor: COLORS.SUBTLE }}
                    rows={3}
                />
            ) : (
                <input 
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter your anchor..."
                    className="w-full p-3 border rounded-lg mb-4"
                    style={{ borderColor: COLORS.SUBTLE }}
                />
            )}
            
            {suggestions && suggestions.length > 0 && (
                <>
                    <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
                        SUGGESTIONS:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {suggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectSuggestion(suggestion.text)}
                                className="w-full text-left p-2 rounded-lg text-sm transition-all bg-gray-50 hover:bg-teal-50"
                                style={{ color: COLORS.NAVY }}
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
    initialIdentity, initialHabit, initialWhy,
    identitySuggestions, habitSuggestions, whySuggestions,
    onSave, onClose
}) => {
    const [identity, setIdentity] = useState(initialIdentity);
    const [habit, setHabit] = useState(initialHabit);
    const [why, setWhy] = useState(initialWhy);

    const handleSave = () => {
        onSave({ identity, habit, why });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: COLORS.SUBTLE }}>
                    <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                        <Anchor className="w-6 h-6 inline-block mr-2" style={{ color: COLORS.TEAL }} />
                        Define Your Leadership Anchors
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" style={{ color: COLORS.MUTED }} />
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

                <div className="mt-4 pt-4 border-t flex gap-3" style={{ borderColor: COLORS.SUBTLE }}>
                    <Button onClick={handleSave} variant="primary" size="md" className="flex-1">
                        <Save className="w-4 h-4 mr-2" /> Save All Anchors
                    </Button>
                    <Button onClick={onClose} variant="outline" size="md" className="flex-1">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};


/* =========================================================
   PLACEHOLDER COMPONENTS (Required to fix build errors)
========================================================= */
// Exporting placeholder components to prevent errors in Dashboard.jsx when these are not used
export const IdentityAnchorCard = () => null;
export const HabitAnchorCard = () => null;
export const WhyAnchorCard = () => null;