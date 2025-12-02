import React, { createContext, useContext, useState, useEffect } from 'react';
import { timeService, timeChange$ } from '../services/timeService';

const TimeContext = createContext();

export const useTime = () => {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
};

export const TimeProvider = ({ children }) => {
  const [now, setNow] = useState(timeService.getNow());
  const [isTimeTravelActive, setIsTimeTravelActive] = useState(timeService.isActive());

  useEffect(() => {
    // Subscribe to time offset changes
    const sub = timeChange$.subscribe(() => {
      setNow(timeService.getNow());
      setIsTimeTravelActive(timeService.isActive());
    });

    // Update "now" every minute to keep UI fresh (optional, but good for clocks)
    const interval = setInterval(() => {
      setNow(timeService.getNow());
    }, 60000);

    return () => {
      sub.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const value = {
    now,
    isTimeTravelActive,
    travelTo: timeService.travelTo,
    resetTime: timeService.reset,
    getTodayStr: timeService.getTodayStr
  };

  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  );
};
