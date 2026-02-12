import React, { useState } from 'react';
import { useTime } from '../../providers/TimeProvider';
import { Clock, Calendar, RotateCcw, FastForward, Moon, Sun, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const TimeTraveler = () => {
  const { now, isTimeTravelActive, travelTo, resetTime } = useTime();
  const [targetDateStr, setTargetDateStr] = useState('');
  const [targetTimeStr, setTargetTimeStr] = useState('');

  const handleJump = () => {
    if (!targetDateStr || !targetTimeStr) return;
    const newDate = new Date(`${targetDateStr}T${targetTimeStr}`);
    travelTo(newDate);
  };

  const jumpToTomorrowMorning = () => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    travelTo(tomorrow);
  };

  const jumpToTonight = () => {
    const tonight = new Date(now);
    tonight.setHours(23, 58, 0, 0);
    travelTo(tonight);
  };
  
  const jumpToNextWeek = () => {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    travelTo(nextWeek);
  };

  // Day-by-Day Navigation
  const jumpDays = (days) => {
    const newDate = new Date(now);
    newDate.setDate(newDate.getDate() + days);
    newDate.setHours(9, 0, 0, 0);
    travelTo(newDate);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-2xl border-2 transition-all duration-300 ${isTimeTravelActive ? 'bg-indigo-900 border-indigo-400 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'}`}>
      <div className="flex items-center gap-2 mb-3 border-b border-white/20 pb-2">
        <Clock className={`w-5 h-5 ${isTimeTravelActive ? 'text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
        <h3 className="font-bold text-sm uppercase tracking-wider">Time Traveler</h3>
        {isTimeTravelActive && (
          <span className="ml-auto text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full animate-pulse">ACTIVE</span>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-center">
          <div className="text-xs opacity-70 uppercase">Current App Time</div>
          <div className="font-mono text-xl font-bold tracking-tight">
            {now.toLocaleTimeString()}
          </div>
          <div className="font-mono text-sm opacity-90">
            {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Day-by-Day Navigation */}
        <div className={`p-2 rounded-lg ${isTimeTravelActive ? 'bg-indigo-800/50' : 'bg-slate-50 dark:bg-slate-800'}`}>
          <div className="text-[10px] uppercase font-bold opacity-70 mb-1 text-center">Day-by-Day Navigation</div>
          <div className="flex items-center justify-center gap-1">
            <button 
              onClick={() => jumpDays(-7)}
              className={`p-1.5 rounded text-xs font-bold transition-colors ${isTimeTravelActive ? 'hover:bg-indigo-700' : 'hover:bg-slate-200'}`}
              title="-7 Days"
            >
              <ChevronLeft className="w-3 h-3" /><ChevronLeft className="w-3 h-3 -ml-2" />
            </button>
            <button 
              onClick={() => jumpDays(-1)}
              className={`p-1.5 rounded text-xs font-bold transition-colors ${isTimeTravelActive ? 'hover:bg-indigo-700' : 'hover:bg-slate-200'}`}
              title="-1 Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold">DAY</span>
            <button 
              onClick={() => jumpDays(1)}
              className={`p-1.5 rounded text-xs font-bold transition-colors ${isTimeTravelActive ? 'hover:bg-indigo-700' : 'hover:bg-slate-200'}`}
              title="+1 Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => jumpDays(7)}
              className={`p-1.5 rounded text-xs font-bold transition-colors ${isTimeTravelActive ? 'hover:bg-indigo-700' : 'hover:bg-slate-200'}`}
              title="+7 Days"
            >
              <ChevronRight className="w-3 h-3" /><ChevronRight className="w-3 h-3 -ml-2" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={jumpToTonight}
            className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors ${isTimeTravelActive ? 'bg-indigo-800 hover:bg-indigo-700' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'}`}
          >
            <Moon className="w-4 h-4" />
            Tonight 11:58 PM
          </button>
          <button 
            onClick={jumpToTomorrowMorning}
            className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors ${isTimeTravelActive ? 'bg-indigo-800 hover:bg-indigo-700' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'}`}
          >
            <Sun className="w-4 h-4" />
            Tomorrow 6 AM
          </button>
        </div>
        
        <button 
            onClick={jumpToNextWeek}
            className={`w-full p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${isTimeTravelActive ? 'bg-indigo-800 hover:bg-indigo-700' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'}`}
          >
            <FastForward className="w-4 h-4" />
            Jump +1 Week
          </button>

        <div className="pt-2 border-t border-white/20">
          <div className="flex gap-2 mb-2">
            <input 
              type="date" 
              className={`flex-1 p-1 text-xs rounded border ${isTimeTravelActive ? 'bg-indigo-800 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}
              onChange={(e) => setTargetDateStr(e.target.value)}
            />
            <input 
              type="time" 
              className={`w-20 p-1 text-xs rounded border ${isTimeTravelActive ? 'bg-indigo-800 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}
              onChange={(e) => setTargetTimeStr(e.target.value)}
            />
          </div>
          <button 
            onClick={handleJump}
            disabled={!targetDateStr || !targetTimeStr}
            className="w-full py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Warp to Date
          </button>
        </div>

        {isTimeTravelActive && (
          <button 
            onClick={resetTime}
            className="w-full py-2 mt-2 bg-red-500/20 text-red-200 border border-red-500/50 rounded-lg text-xs font-bold hover:bg-red-500/30 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to Real Time
          </button>
        )}
      </div>
    </div>
  );
};

export default TimeTraveler;
