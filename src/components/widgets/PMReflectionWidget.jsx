import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Check, Loader } from 'lucide-react';
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

const PMReflectionWidget = ({ 
  reflectionGood, 
  setReflectionGood, 
  reflectionBetter, 
  setReflectionBetter, 
  reflectionBest,
  setReflectionBest,
  handleSaveEveningBookend
}) => {
  // Auto-save status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState('idle');
  const debounceTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  
  // Track the serialized reflections to detect changes
  const reflectionsRef = useRef(JSON.stringify({ reflectionGood, reflectionBetter, reflectionBest }));

  // Debounced auto-save function
  const triggerAutoSave = useCallback(async () => {
    setSaveStatus('saving');
    
    try {
      if (handleSaveEveningBookend) {
        await handleSaveEveningBookend({ silent: true });
      }
      setSaveStatus('saved');
      
      // Hide "Saved" after 2 seconds
      hideTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('[PMReflection] Auto-save failed:', error);
      setSaveStatus('idle');
    }
  }, [handleSaveEveningBookend]);

  // Effect to detect changes and trigger debounced save
  useEffect(() => {
    const currentReflections = JSON.stringify({ reflectionGood, reflectionBetter, reflectionBest });
    
    // Skip if no actual change
    if (currentReflections === reflectionsRef.current) return;
    
    reflectionsRef.current = currentReflections;
    
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
  }, [reflectionGood, reflectionBetter, reflectionBest, triggerAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <Card title="PM Reflection" icon={MessageSquare} accent="NAVY">
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Daily Reflection
          </span>
          <AutoSaveStatus status={saveStatus} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            1. What went well?
          </label>
          <textarea 
            value={reflectionGood}
            onChange={(e) => setReflectionGood(e.target.value)}
            className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={2}
            placeholder="Celebrate a win..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            2. What needs work?
          </label>
          <textarea 
            value={reflectionBetter}
            onChange={(e) => setReflectionBetter(e.target.value)}
            className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={2}
            placeholder="Identify an improvement..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            3. Closing thought
          </label>
          <textarea 
            value={reflectionBest}
            onChange={(e) => setReflectionBest(e.target.value)}
            className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={1}
            placeholder="What will I do 1% better tomorrow?"
          />
        </div>

        <p className="text-xs text-center text-slate-400 mt-3 italic">
          Changes save automatically • Archives to your locker each night
        </p>
      </div>
    </Card>
  );
};

export default PMReflectionWidget;
