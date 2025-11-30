import React from 'react';
import { Trophy, CheckSquare } from 'lucide-react';
import { Card } from '../ui';

const WinTheDayWidget = ({ scope }) => {
  const { 
    morningWins, 
    handleUpdateWin, 
    handleToggleWinComplete 
  } = scope;

  return (
    <Card title="Win the Day" icon={Trophy} accent="TEAL">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
          Identify 3 High-Impact Actions
        </p>
        
        {morningWins.map((win, index) => (
          <div key={win.id} className="flex gap-3 items-center">
            <button 
              onClick={() => handleToggleWinComplete(index)}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                win.completed 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'bg-slate-50 text-slate-300 hover:bg-green-50 hover:text-green-500 border border-slate-200'
              }`}
              title={win.completed ? "Mark Incomplete" : "Mark Complete"}
            >
              <CheckSquare className="w-6 h-6" />
            </button>

            <div className="flex-1">
              <input 
                type="text"
                value={win.text}
                onChange={(e) => handleUpdateWin(index, e.target.value)}
                placeholder={`Enter Priority #${index + 1}`}
                className={`w-full p-3 border rounded-xl outline-none transition-all text-sm font-medium ${
                  win.completed
                    ? 'bg-slate-50 border-slate-200 text-slate-400 line-through' 
                    : 'bg-white border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-700'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default WinTheDayWidget;
