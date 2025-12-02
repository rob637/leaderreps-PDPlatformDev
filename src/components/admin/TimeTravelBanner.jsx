import React, { useState, useEffect } from 'react';
import { useTime } from '../../providers/TimeProvider';
import { Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { timeService } from '../../services/timeService';

/**
 * TimeTravelBanner - Shows a visible indicator when time travel is active
 * Only visible to admins during testing
 */
const TimeTravelBanner = ({ isAdmin, onMidnightRollover }) => {
  const { now, isTimeTravelActive, resetTime } = useTime();
  const [displayTime, setDisplayTime] = useState(now);
  const [lastDate, setLastDate] = useState(timeService.getTodayStr());

  // Update the display time every second when time travel is active
  useEffect(() => {
    if (!isTimeTravelActive) return;
    
    const interval = setInterval(() => {
      const currentNow = timeService.getNow();
      setDisplayTime(currentNow);
      
      // Check for midnight rollover
      const currentDate = timeService.getTodayStr();
      if (currentDate !== lastDate) {
        console.log('[TimeTravelBanner] Midnight rollover detected!', {
          from: lastDate,
          to: currentDate
        });
        setLastDate(currentDate);
        
        // Trigger the rollover callback
        if (onMidnightRollover) {
          onMidnightRollover(lastDate, currentDate);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimeTravelActive, lastDate, onMidnightRollover]);

  // Don't show if not admin or time travel not active
  if (!isAdmin || !isTimeTravelActive) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white py-2 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <span className="font-bold text-yellow-300 uppercase text-sm tracking-wider">
              ⏰ Time Traveler Active
            </span>
          </div>
          
          <div className="h-4 w-px bg-white/30" />
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-300" />
            <span className="font-mono text-lg font-bold">
              {displayTime.toLocaleTimeString()}
            </span>
            <span className="text-sm text-indigo-200">
              {displayTime.toLocaleDateString(undefined, { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        <button
          onClick={resetTime}
          className="flex items-center gap-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/40 border border-red-400/50 rounded-lg text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Real Time
        </button>
      </div>
    </div>
  );
};

export default TimeTravelBanner;
