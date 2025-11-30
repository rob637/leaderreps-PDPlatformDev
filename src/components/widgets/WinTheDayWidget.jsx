import React from 'react';
import { Trophy, CheckCircle } from 'lucide-react';
import { Card } from '../ui';

const WinTheDayWidget = ({ scope }) => {
  const { 
    morningWins, 
    handleUpdateWin, 
    handleToggleWinComplete 
  } = scope;

  return (
    <Card title="Win the Day" icon={Trophy} accent="TEAL">
      <div className="space-y-2">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
          Identify 3 High-Impact Actions
        </p>
        
        {morningWins.map((win, index) => (
          <div 
            key={win.id} 
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors group ${
              win.completed ? 'bg-green-50 border border-green-200' : 'bg-slate-50 hover:bg-blue-50 border border-slate-100'
            }`}
          >
            <div 
              onClick={() => handleToggleWinComplete(index)}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
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
                placeholder={`Enter Priority #${index + 1}`}
                className={`w-full bg-transparent outline-none text-sm font-bold ${
                  win.completed 
                    ? 'text-green-700 line-through placeholder:text-green-300' 
                    : 'text-slate-700 placeholder:text-slate-400'
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
