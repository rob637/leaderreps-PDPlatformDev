import React, { useState } from 'react';
import { Trophy, CheckCircle, Save, Loader } from 'lucide-react';
import { Card } from '../ui';

const WinTheDayWidget = ({ scope }) => {
  const { 
    morningWins, 
    handleUpdateWin, 
    handleToggleWinComplete,
    handleSaveSingleWin,
    handleSaveAllWins
  } = scope;

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async () => {
    setIsSaving(true);
    // Simulate save delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Save all wins
    if (handleSaveAllWins) {
      await handleSaveAllWins();
    } else if (handleSaveSingleWin) {
      // Fallback
      morningWins.forEach((_, index) => {
        handleSaveSingleWin(index);
      });
    }
    setIsSaving(false);
  };

  return (
    <Card title="Win the Day" icon={Trophy} accent="TEAL">
      <div className="space-y-1">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
          Identify 3 High-Impact Actions
        </p>
        
        {morningWins.map((win, index) => {
          const hasText = win.text && win.text.trim().length > 0;
          
          return (
            <div 
              key={win.id} 
              className={`flex items-center gap-2 p-2 rounded-xl transition-colors group ${
                win.completed ? 'bg-green-50 border border-green-200' : 'bg-slate-50 hover:bg-blue-50 border border-slate-100'
              }`}
            >
              <div 
                onClick={() => {
                  if (hasText) {
                    handleToggleWinComplete(index);
                  }
                }}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  hasText ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                } ${
                  win.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-slate-300 group-hover:border-blue-400'
                }`}
              >
                {win.completed && <CheckCircle className="w-3 h-3 text-white" />}
              </div>

              <div className="flex-1">
                <input 
                  type="text"
                  value={win.text}
                  onChange={(e) => handleUpdateWin(index, e.target.value)}
                  onBlur={() => handleSaveSingleWin && handleSaveSingleWin(index)}
                  placeholder={`Enter Priority #${index + 1}`}
                  className={`w-full bg-transparent outline-none text-sm font-bold ${
                    win.completed 
                      ? 'text-green-700 line-through placeholder:text-green-300' 
                      : 'text-slate-700 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>
          );
        })}

        <button 
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full mt-2 py-2 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Priorities
        </button>
        <p className="text-xs text-center text-slate-400 mt-2 italic">Autosaves to your locker each night at 11:59 PM</p>
      </div>
    </Card>
  );
};

export default WinTheDayWidget;
