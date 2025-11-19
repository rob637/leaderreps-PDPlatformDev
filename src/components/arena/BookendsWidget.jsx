import React, { useState, useEffect } from 'react';
import { Sun, Moon, CheckCircle2, Save } from 'lucide-react';

const BookendsWidget = ({ 
  pmData, 
  onUpdatePM, 
  onAddWin,
  stats,
  wins = [],
  mode,
  setMode
}) => {
  // Local state for inputs to prevent excessive re-renders/writes
  const [winInput, setWinInput] = useState('');
  const [priorityInput, setPriorityInput] = useState('');
  
  // PM Reflection State
  const [reflection, setReflection] = useState({
    good: '',
    work: '',
    tomorrow: ''
  });

  // Filter completed wins for PM view
  const completedWins = wins.filter(w => w.completed);

  // Sync props to local state when they change (initial load)
  useEffect(() => {
    if (pmData) {
      setReflection({
        good: pmData.reflectionGood || '',
        work: pmData.reflectionWork || '',
        tomorrow: pmData.reflectionTomorrow || ''
      });
    }
  }, [pmData]);

  const handleAddWin = () => {
    if (!winInput.trim()) return;
    onAddWin(winInput, 'win');
    setWinInput('');
  };

  const handleAddPriority = () => {
    if (!priorityInput.trim()) return;
    onAddWin(priorityInput, 'priority');
    setPriorityInput('');
  };

  const handleReflectionChange = (field, value) => {
    const newReflection = { ...reflection, [field]: value };
    setReflection(newReflection);
  };

  const handleReflectionBlur = () => {
    // Save on blur
    onUpdatePM({
      reflectionGood: reflection.good,
      reflectionWork: reflection.work,
      reflectionTomorrow: reflection.tomorrow
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-300 h-full flex flex-col overflow-hidden">
      {/* Header / Toggle */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setMode('AM')}
          className={`flex-1 py-4 text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-colors
            ${mode === 'AM' ? 'bg-orange-50 text-corporate-orange' : 'text-gray-400 hover:bg-gray-50'}
          `}
        >
          <Sun className="w-4 h-4" />
          AM BOOKEND
        </button>
        <button
          onClick={() => setMode('PM')}
          className={`flex-1 py-4 text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-colors
            ${mode === 'PM' ? 'bg-corporate-navy text-white' : 'text-gray-400 hover:bg-gray-50'}
          `}
        >
          <Moon className="w-4 h-4" />
          PM BOOKEND
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {mode === 'AM' ? (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-corporate-navy uppercase tracking-wider mb-2">
                Today's WIN (What's Important Now)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={winInput}
                  onChange={(e) => setWinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWin()}
                  placeholder="One big thing..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 transition-all"
                />
                <button 
                  onClick={handleAddWin}
                  disabled={!winInput.trim()}
                  className="px-4 bg-corporate-teal text-white rounded-xl font-bold disabled:opacity-50 hover:bg-corporate-teal/90 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 italic">
                Adding this moves it to your main list.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-corporate-navy uppercase tracking-wider mb-2">
                Additional Priorities
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
                  placeholder="Another task..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 transition-all"
                />
                <button 
                  onClick={handleAddPriority}
                  disabled={!priorityInput.trim()}
                  className="px-4 bg-gray-200 text-gray-600 rounded-xl font-bold disabled:opacity-50 hover:bg-gray-300 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* Stats Summary List */}
            <div className="space-y-3 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-corporate-navy font-medium font-serif">WIN/Tasks</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-corporate-navy">{stats.completedTasks}/{stats.totalTasks}</span>
                  {stats.completedTasks === stats.totalTasks && stats.totalTasks > 0 && (
                    <CheckCircle2 className="w-5 h-5 text-corporate-teal" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-corporate-navy font-medium font-serif">Daily Reps</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-corporate-navy">{stats.dailyReps ? '1/1' : '0/1'}</span>
                  {stats.dailyReps && <CheckCircle2 className="w-5 h-5 text-corporate-teal" />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-corporate-navy font-medium font-serif">Grounding Rep (LIS)</span>
                <button 
                  onClick={() => onUpdatePM({ groundingRep: !pmData?.groundingRep })}
                  className={`
                    w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
                    ${pmData?.groundingRep ? 'bg-corporate-navy border-corporate-navy text-white' : 'border-gray-300'}
                  `}
                >
                  {pmData?.groundingRep && <CheckCircle2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-corporate-navy font-serif mb-4">Reflection</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-corporate-navy mb-2">
                    What went well?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reflection.good}
                      onChange={(e) => handleReflectionChange('good', e.target.value)}
                      onBlur={handleReflectionBlur}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-navy/20"
                    />
                    <button className="px-4 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-colors">
                      +
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-corporate-navy mb-2">
                    What needs work?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reflection.work}
                      onChange={(e) => handleReflectionChange('work', e.target.value)}
                      onBlur={handleReflectionBlur}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-navy/20"
                    />
                    <button className="px-4 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-colors">
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-corporate-navy mb-2">
                    What needs to happen to show up as your best tomorrow?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reflection.tomorrow}
                      onChange={(e) => handleReflectionChange('tomorrow', e.target.value)}
                      onBlur={handleReflectionBlur}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-navy/20"
                    />
                    <button className="px-4 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-colors">
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer - Only show in AM mode since PM has stats at top */}
      {mode === 'AM' && (
        <div className="bg-gray-50 p-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-400 uppercase">WIN/Tasks</div>
              <div className="font-bold text-corporate-navy">{stats.completedTasks}/{stats.totalTasks}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase">Daily Reps</div>
              <div className="font-bold text-corporate-navy">{stats.dailyReps ? '1/1' : '0/1'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase">Grounding</div>
              <div className="font-bold text-corporate-navy">{stats.grounding ? '1/1' : '0/1'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookendsWidget;
