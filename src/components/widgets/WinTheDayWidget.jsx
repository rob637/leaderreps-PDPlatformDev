import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, CheckCircle, Check, Loader } from 'lucide-react';
import { Card } from '../ui';

/**
 * AutoSaveStatus - Small indicator showing save state
 */
const AutoSaveStatus = ({ status }) => {
  if (status === 'idle') return null;
  
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-opacity duration-300 ${
      status === 'saved' ? 'text-green-600' : 'text-slate-400'
    }`}>
      {status === 'saving' && (
        <>
          <Loader className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3 h-3" />
          <span>Saved</span>
        </>
      )}
    </div>
  );
};

const WinTheDayWidget = ({ scope }) => {
  const { 
    morningWins, 
    handleUpdateWin, 
    handleToggleWinComplete,
    handleSaveAllWins
  } = scope;

  // Auto-save status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState('idle');
  const debounceTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  
  // Track the serialized wins to detect changes
  const winsRef = useRef(JSON.stringify(morningWins));

  // Debounced auto-save function
  const triggerAutoSave = useCallback(async () => {
    setSaveStatus('saving');
    
    try {
      if (handleSaveAllWins) {
        await handleSaveAllWins({ silent: true });
      }
      setSaveStatus('saved');
      
      // Hide "Saved" after 2 seconds
      hideTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('[WinTheDay] Auto-save failed:', error);
      setSaveStatus('idle');
    }
  }, [handleSaveAllWins]);

  // Effect to detect changes and trigger debounced save
  useEffect(() => {
    const currentWins = JSON.stringify(morningWins);
    
    // Skip if no actual change
    if (currentWins === winsRef.current) return;
    
    winsRef.current = currentWins;
    
    // Clear existing timers
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    
    // Set up debounced save (800ms after last change)
    debounceTimerRef.current = setTimeout(() => {
      triggerAutoSave();
    }, 800);
    
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [morningWins, triggerAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Handle checkbox toggle with immediate save
  const handleToggleWithSave = useCallback((index) => {
    const win = morningWins[index];
    const hasText = win.text && win.text.trim().length > 0;
    
    if (hasText) {
      handleToggleWinComplete(index);
      // Immediate save for checkbox changes
      setTimeout(() => triggerAutoSave(), 100);
    }
  }, [morningWins, handleToggleWinComplete, triggerAutoSave]);

  return (
    <Card title="Win the Day" icon={Trophy} accent="TEAL">
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Identify 3 High-Impact Actions
          </p>
          <AutoSaveStatus status={saveStatus} />
        </div>
        
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
                onClick={() => handleToggleWithSave(index)}
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

        <p className="text-xs text-center text-slate-400 mt-3 italic">
          Changes save automatically • Archives to your locker each night
        </p>
      </div>
    </Card>
  );
};

export default WinTheDayWidget;
