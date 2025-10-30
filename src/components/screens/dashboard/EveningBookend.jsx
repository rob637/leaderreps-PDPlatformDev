// src/components/dashboard/EveningBookend.jsx
// Evening Bookend Component for PM Reflection
// Added 10/28/25 per boss feedback

import React from 'react';
import {
  CheckCircle, TrendingUp, Star, Save, Loader, Moon
} from 'lucide-react';

/* =========================================================
   COLORS & UI Components
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
   Evening Bookend Component
========================================================= */
export const EveningBookend = ({ 
    reflectionGood,
    setReflectionGood,
    reflectionBetter,
    setReflectionBetter,
    reflectionBest,
    setReflectionBest,
    habitsCompleted,
    onHabitToggle,
    onSave,
    isSaving
}) => {
    return (
        <Card title="Evening Bookend - Daily Reflection" icon={Moon} accent='NAVY' className="min-h-[620px]">
            {/* Good - What went well */}
            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.GREEN }}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Good - What went well today?
                </label>
                <textarea 
                    value={reflectionGood}
                    onChange={(e) => setReflectionGood(e.target.value)}
                    placeholder="Celebrate your wins..."
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ 
                        borderColor: `${COLORS.GREEN}40`,
                        outline: 'none'
                    }}
                    rows={2}
                />
            </div>

            {/* Better - What needs improvement */}
            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.AMBER }}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Better - What needs improvement?
                </label>
                <textarea 
                    value={reflectionBetter}
                    onChange={(e) => setReflectionBetter(e.target.value)}
                    placeholder="Areas for growth..."
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ 
                        borderColor: `${COLORS.AMBER}40`,
                        outline: 'none'
                    }}
                    rows={2}
                />
            </div>

            {/* Best - What to do tomorrow */}
            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.BLUE }}>
                    <Star className="w-4 h-4 mr-1" />
                    Best - What do I need to do to show up as my best tomorrow?
                </label>
                <textarea 
                    value={reflectionBest}
                    onChange={(e) => setReflectionBest(e.target.value)}
                    placeholder="Tomorrow's commitment..."
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ 
                        borderColor: `${COLORS.BLUE}40`,
                        outline: 'none'
                    }}
                    rows={2}
                />
            </div>

            {/* Daily Habits Tracker */}
            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <p className="text-sm font-semibold mb-3" style={{ color: COLORS.TEXT }}>Daily Habits Tracker</p>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={habitsCompleted.readLIS}
                            onChange={(e) => onHabitToggle('readLIS', e.target.checked)}
                            className="w-4 h-4"
                            style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Read LIS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={habitsCompleted.completedDailyRep}
                            onChange={(e) => onHabitToggle('completedDailyRep', e.target.checked)}
                            className="w-4 h-4"
                            style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Complete Daily Rep</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={habitsCompleted.eveningReflection}
                            onChange={(e) => onHabitToggle('eveningReflection', e.target.checked)}
                            className="w-4 h-4"
                            style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Evening Reflection</span>
                    </label>
                </div>
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
                            Save Reflection
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default EveningBookend;