// src/components/screens/dashboard/DashboardComponents.jsx
// Extracted UI Components from Dashboard (10/28/25)

import React, { useState } from 'react';
import { 
  Target, Clock, User, Save, Loader, CheckCircle, TrendingUp, Star, 
  ChevronDown, ChevronUp, Plus, X, Sunrise, Moon, Flame, Anchor,
  ToggleLeft, ToggleRight, Zap, AlertTriangle, MessageSquare
} from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';

/* =========================================================
   COLORS & BASE COMPONENTS
========================================================= */
export const COLORS = { 
  NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', 
  GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', 
  OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5355', 
  PURPLE: '#7C3AED', BG: '#F9FAFB' 
};

// --- Standardized Button Component ---
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

// --- Standardized Card Component ---
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
   MODE SWITCH COMPONENT
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
   STREAK TRACKER COMPONENT
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
   MORNING BOOKEND COMPONENT
========================================================= */
export const MorningBookend = ({ 
    dailyWIN, setDailyWIN, otherTasks, onAddTask, onToggleTask, onRemoveTask,
    showLIS, setShowLIS, identityStatement, onSave, isSaving
}) => {
    const [newTaskText, setNewTaskText] = useState('');
    
    const handleAddClick = () => {
        if (newTaskText.trim()) { onAddTask(newTaskText); setNewTaskText(''); }
    };
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleAddClick(); };
    
    return (
        <Card title="☀️ Morning Bookend" icon={Sunrise} accent='ORANGE'>
            <div className="mb-6">
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
            </div>

            <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center justify-between" style={{ color: COLORS.TEXT }}>
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" style={{ color: COLORS.TEAL }} />
                        Other Important Tasks ({otherTasks.length}/5)
                    </span>
                </label>
                
                <div className="space-y-2 mb-3">
                    {otherTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 border" style={{ borderColor: COLORS.SUBTLE }}>
                            <input type="checkbox" checked={task.completed} onChange={() => onToggleTask(task.id)}
                                className="w-4 h-4 flex-shrink-0" style={{ accentColor: COLORS.TEAL }}
                            />
                            <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                {task.text}
                            </span>
                            <button onClick={() => onRemoveTask(task.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Remove task">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                
                {otherTasks.length < 5 && (
                    <div className="flex gap-2">
                        <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyPress={handleKeyPress} placeholder="Add another task..."
                            className="flex-1 p-2 text-sm border rounded-lg focus:ring-2 transition-all"
                            style={{ borderColor: COLORS.SUBTLE }}
                        />
                        <Button onClick={handleAddClick} variant="outline" size="sm" disabled={!newTaskText.trim()}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <button onClick={() => setShowLIS(!showLIS)}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80 w-full"
                    style={{ color: COLORS.TEAL }}>
                    <User className="w-4 h-4" />
                    {showLIS ? 'Hide' : 'Read'} Leadership Identity Statement
                    {showLIS ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showLIS && (
                    <div className="mt-3 p-4 rounded-lg border" 
                         style={{ backgroundColor: `${COLORS.TEAL}10`, borderColor: `${COLORS.TEAL}30` }}>
                        <p className="text-sm italic" style={{ color: COLORS.TEXT }}>{identityStatement}</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <Button onClick={onSave} disabled={isSaving} variant="primary" size="md" className="w-full">
                    {isSaving ? <><Loader className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 
                               <><Save className="w-5 h-5 mr-2" />Save Morning Plan</>}
                </Button>
            </div>
        </Card>
    );
};

/* =========================================================
   EVENING BOOKEND COMPONENT
========================================================= */
export const EveningBookend = ({ 
    reflectionGood, setReflectionGood, reflectionBetter, setReflectionBetter,
    reflectionBest, setReflectionBest, habitsCompleted, onHabitToggle, onSave, isSaving
}) => {
    return (
        <Card title="🌙 Evening Bookend" icon={Moon} accent='NAVY'>
            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.GREEN }}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Good - What went well today?
                </label>
                <textarea value={reflectionGood} onChange={(e) => setReflectionGood(e.target.value)}
                    placeholder="Celebrate your wins..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.GREEN}40` }} rows={2}
                />
            </div>

            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.AMBER }}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Better - What needs improvement?
                </label>
                <textarea value={reflectionBetter} onChange={(e) => setReflectionBetter(e.target.value)}
                    placeholder="Areas for growth..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.AMBER}40` }} rows={2}
                />
            </div>

            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.BLUE }}>
                    <Star className="w-4 h-4 mr-1" />
                    Best - What do I need to do to show up as my best tomorrow?
                </label>
                <textarea value={reflectionBest} onChange={(e) => setReflectionBest(e.target.value)}
                    placeholder="Tomorrow's commitment..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.BLUE}40` }} rows={2}
                />
            </div>

            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <p className="text-sm font-semibold mb-3" style={{ color: COLORS.TEXT }}>Daily Habits Tracker</p>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.readLIS}
                            onChange={(e) => onHabitToggle('readLIS', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Read LIS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.completedDailyRep}
                            onChange={(e) => onHabitToggle('completedDailyRep', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Complete Daily Rep</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.eveningReflection}
                            onChange={(e) => onHabitToggle('eveningReflection', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Evening Reflection</span>
                    </label>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <Button onClick={onSave} disabled={isSaving} variant="primary" size="md" className="w-full">
                    {isSaving ? <><Loader className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 
                               <><Save className="w-5 h-5 mr-2" />Save Reflection</>}
                </Button>
            </div>
        </Card>
    );
};

/* =========================================================
   WHY IT MATTERS CARD
========================================================= */
export const WhyItMattersCard = ({ whyStatement, onEdit }) => (
  <Card icon={Anchor} accent='RED'>
    <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.NAVY }}>
      <span>❤️</span> Why It Matters
    </h3>
    <p className="text-sm italic mb-4" style={{ color: COLORS.TEXT }}>"{whyStatement}"</p>
    <Button onClick={onEdit} variant="outline" size="sm" className="w-full">
      <span className="mr-1">✏️</span> Personalize Your "Why"
    </Button>
  </Card>
);

/* =========================================================
   HABIT ANCHOR CARD
========================================================= */
export const HabitAnchorCard = ({ habitAnchor, onEdit }) => (
  <Card icon={Clock} accent='BLUE'>
    <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.NAVY }}>
      <span>⚓</span> Habit Anchor
    </h3>
    <div className="mb-4">
      <p className="text-xs font-semibold mb-1" style={{ color: COLORS.MUTED }}>YOUR DAILY CUE:</p>
      <p className="text-sm" style={{ color: COLORS.TEXT }}>{habitAnchor}</p>
    </div>
    <Button onClick={onEdit} variant="outline" size="sm" className="w-full">
      <Clock className="w-4 h-4 mr-1" /> Edit Anchor
    </Button>
  </Card>
);

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
