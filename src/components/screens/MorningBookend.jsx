// src/components/dashboard/MorningBookend.jsx
// Morning Bookend Component for AM Planning
// Added 10/28/25 per boss feedback

import React, { useState } from 'react';
import {
  Target, Clock, User, Save, Loader, ChevronDown, ChevronUp, Plus, X
} from 'lucide-react';

/* =========================================================
   COLORS & UI Components (imported from parent or defined here)
========================================================= */
const COLORS = { 
    NAVY: '#002E47', TEAL: '#47A88D', ORANGE: '#E04E1B', 
    GREEN: '#10B981', BLUE: '#2563EB', AMBER: '#F5A800', 
    RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', 
    SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', 
    PURPLE: '#7C3AED', BG: '#F9FAFB' 
};

// --- Standardized Button Component ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;

  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm';
  else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg';
  else baseStyle += ' px-6 py-3 text-base';

  if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
  else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
  
  if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';

  return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

// --- Standardized Card Component ---
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => {
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

      <div className={Icon || title ? '' : ''}> 
         {children}
      </div>
    </Tag>
  );
};

/* =========================================================
   Morning Bookend Component
========================================================= */
export const MorningBookend = ({ 
    dailyWIN, 
    setDailyWIN,
    otherTasks,
    onAddTask,
    onToggleTask,
    onRemoveTask,
    showLIS,
    setShowLIS,
    identityStatement,
    onSave,
    isSaving
}) => {
    const [newTaskText, setNewTaskText] = useState('');
    
    const handleAddClick = () => {
        if (newTaskText.trim()) {
            onAddTask(newTaskText);
            setNewTaskText('');
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddClick();
        }
    };
    
    return (
        <Card title="Morning Bookend" icon={Target} accent='ORANGE'>
            {/* Daily WIN */}
            <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.TEXT }}>
                    <Target className="w-4 h-4 mr-1" style={{ color: COLORS.ORANGE }} />
                    Today's WIN (What's Important Now - #1 Priority)
                </label>
                <textarea 
                    value={dailyWIN}
                    onChange={(e) => setDailyWIN(e.target.value)}
                    placeholder="What is the ONE thing that must get done today?"
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ 
                        borderColor: COLORS.SUBTLE,
                        outline: 'none'
                    }}
                    rows={2}
                />
            </div>

            {/* Other Important Tasks */}
            <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center justify-between" style={{ color: COLORS.TEXT }}>
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" style={{ color: COLORS.TEAL }} />
                        Other Important Tasks ({otherTasks.length}/5)
                    </span>
                </label>
                
                {/* Task List */}
                <div className="space-y-2 mb-3">
                    {otherTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 border" style={{ borderColor: COLORS.SUBTLE }}>
                            <input 
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => onToggleTask(task.id)}
                                className="w-4 h-4 flex-shrink-0"
                                style={{ accentColor: COLORS.TEAL }}
                            />
                            <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                {task.text}
                            </span>
                            <button
                                onClick={() => onRemoveTask(task.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove task"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                
                {/* Add Task Input */}
                {otherTasks.length < 5 && (
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add another task..."
                            className="flex-1 p-2 text-sm border rounded-lg focus:ring-2 transition-all"
                            style={{ 
                                borderColor: COLORS.SUBTLE,
                                outline: 'none'
                            }}
                        />
                        <Button 
                            onClick={handleAddClick}
                            variant="outline"
                            size="sm"
                            disabled={!newTaskText.trim()}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Leadership Identity Statement (Expandable) */}
            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <button 
                    onClick={() => setShowLIS(!showLIS)}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80 w-full"
                    style={{ color: COLORS.TEAL }}
                >
                    <User className="w-4 h-4" />
                    {showLIS ? 'Hide' : 'Read'} Leadership Identity Statement
                    {showLIS ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showLIS && (
                    <div className="mt-3 p-4 rounded-lg border" 
                         style={{ 
                             backgroundColor: `${COLORS.TEAL}10`,
                             borderColor: `${COLORS.TEAL}30`
                         }}>
                        <p className="text-sm italic" style={{ color: COLORS.TEXT }}>{identityStatement}</p>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    variant="primary"
                    size="md"
                    className="w-full"
                >
                    {isSaving ? (
                        <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Morning Plan
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default MorningBookend;
