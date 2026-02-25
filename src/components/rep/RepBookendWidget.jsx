// src/components/rep/RepBookendWidget.jsx
// Embedded bookend experience within Rep conversation
// UPDATED: Now saves to Firestore via useAppServices - syncs with Dashboard

import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Sparkles, Check, ChevronRight, Loader } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { timeService } from '../../services/timeService';

/**
 * RepBookendWidget - Morning/Evening bookend embedded in Rep flow
 * 
 * IMPORTANT: This saves to the SAME Firestore location as Dashboard widgets:
 * - Morning: dailyPracticeData.morningBookend.wins[]
 * - Evening: dailyPracticeData.eveningBookend.{good, better, best}
 * 
 * When user closes Rep and returns to Dashboard, their data is already there!
 */
const RepBookendWidget = ({ 
  type = 'morning', // 'morning' | 'evening'
  onComplete
  // userName prop available if needed for personalization
}) => {
  const { dailyPracticeData, updateDailyPracticeData } = useAppServices();
  
  // Form state
  const [intentions, setIntentions] = useState(['', '', '']);
  const [reflectionGood, setReflectionGood] = useState('');
  const [reflectionBetter, setReflectionBetter] = useState('');
  const [reflectionBest, setReflectionBest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const isMorning = type === 'morning';

  // Load existing data from Firestore on mount
  useEffect(() => {
    if (!dailyPracticeData) return;
    
    if (isMorning) {
      // Load existing morning wins
      const existingWins = dailyPracticeData?.morningBookend?.wins;
      if (existingWins && Array.isArray(existingWins)) {
        setIntentions(existingWins.map(w => w.text || ''));
        // Check if already completed today
        if (existingWins.some(w => w.text?.trim())) {
          // Has data but don't auto-complete - let them add more if they want
        }
      }
    } else {
      // Load existing evening reflection
      const eb = dailyPracticeData?.eveningBookend;
      if (eb) {
        if (eb.good) setReflectionGood(eb.good);
        if (eb.better) setReflectionBetter(eb.better);
        if (eb.best) setReflectionBest(eb.best);
        // Check if already completed today
        if (eb.completedAt) {
          // Has been completed - could show different UI
        }
      }
    }
  }, [dailyPracticeData, isMorning]);

  // Check if already completed today
  const alreadyCompleted = useMemo(() => {
    if (!dailyPracticeData) return false;
    
    if (isMorning) {
      const mb = dailyPracticeData?.morningBookend;
      // Check if we have wins with text for today
      return mb?.wins?.some(w => w.text?.trim() && w.saved);
    } else {
      const eb = dailyPracticeData?.eveningBookend;
      // Check if evening bookend has been saved today
      return !!(eb?.completedAt && (eb?.good || eb?.better || eb?.best));
    }
  }, [dailyPracticeData, isMorning]);

  const prompts = isMorning 
    ? {
        title: 'Morning Intentions',
        icon: Sun,
        iconColor: 'text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        subtitle: "Set your intentions for today",
        fields: [
          { label: 'What will you focus on today?', placeholder: 'My main focus today is...' },
          { label: 'What leadership skill will you practice?', placeholder: 'I will practice...' },
          { label: 'Who will you serve today?', placeholder: 'I will help...' },
        ]
      }
    : {
        title: 'Evening Reflection',
        icon: Moon,
        iconColor: 'text-indigo-500',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        subtitle: "Reflect on your day",
        fields: [
          { key: 'good', label: 'What went well today?', placeholder: 'Today I...' },
          { key: 'better', label: 'What could have been better?', placeholder: 'I could improve...' },
          { key: 'best', label: "What will you do differently tomorrow?", placeholder: 'Tomorrow I will...' },
        ]
      };

  const Icon = prompts.icon;

  const handleIntentionChange = (index, value) => {
    const newIntentions = [...intentions];
    newIntentions[index] = value;
    setIntentions(newIntentions);
  };

  const handleReflectionChange = (key, value) => {
    if (key === 'good') setReflectionGood(value);
    else if (key === 'better') setReflectionBetter(value);
    else if (key === 'best') setReflectionBest(value);
  };

  const handleComplete = async () => {
    if (!updateDailyPracticeData) {
      console.error('[RepBookend] updateDailyPracticeData not available');
      return;
    }

    setIsSaving(true);
    
    try {
      const todayDate = timeService.getTodayStr();
      
      if (isMorning) {
        // Save morning intentions in same format as Dashboard
        const newWins = intentions.map((text, idx) => ({
          id: `win-${idx + 1}`,
          text: text.trim(),
          completed: false,
          saved: true
        }));

        // Build winsList for Locker history (same logic as DashboardHooks)
        const existingWinsList = (dailyPracticeData?.winsList || []).filter(w => w.date !== todayDate);
        const todaysWins = newWins.map((w, idx) => ({
          id: `win-${todayDate}-${idx}`,
          text: w.text || '',
          completed: w.completed || false,
          date: todayDate,
          slot: idx + 1,
          timestamp: timeService.getISOString()
        }));
        const updatedWinsList = [...existingWinsList, ...todaysWins];

        await updateDailyPracticeData({
          morningBookend: {
            ...dailyPracticeData?.morningBookend,
            wins: newWins,
            completedAt: new Date().toISOString()
          },
          winsList: updatedWinsList,
          date: todayDate
        });

        console.log('[RepBookend] ✅ Morning intentions saved to Firestore');
        
      } else {
        // Save evening reflection in same format as Dashboard
        const updates = {
          eveningBookend: {
            ...dailyPracticeData?.eveningBookend,
            good: reflectionGood.trim(),
            better: reflectionBetter.trim(),
            best: reflectionBest.trim(),
            completedAt: new Date().toISOString()
          },
          date: todayDate
        };

        // Also save to winsList if there's a "good" reflection
        if (reflectionGood.trim()) {
          const existingWinsList = dailyPracticeData?.winsList || [];
          const newWin = {
            id: Date.now(),
            text: reflectionGood.trim(),
            date: todayDate,
            timestamp: timeService.getISOString()
          };
          updates.winsList = [...existingWinsList, newWin];
        }

        // Save reflection history for Locker
        const existingReflectionHistory = dailyPracticeData?.reflectionHistory || [];
        const reflectionHistoryWithoutToday = existingReflectionHistory.filter(h => h.date !== todayDate);
        if (reflectionGood || reflectionBetter || reflectionBest) {
          const newReflectionEntry = {
            id: `ref-${todayDate}`,
            date: todayDate,
            reflectionGood: reflectionGood.trim(),
            reflectionWork: reflectionBetter.trim(),
            reflectionTomorrow: reflectionBest.trim(),
            timestamp: timeService.getISOString()
          };
          updates.reflectionHistory = [newReflectionEntry, ...reflectionHistoryWithoutToday];
        }

        await updateDailyPracticeData(updates);
        
        console.log('[RepBookend] ✅ Evening reflection saved to Firestore');
      }

      setIsComplete(true);
      
      // Notify parent component
      if (onComplete) {
        onComplete({
          type,
          intentions: isMorning ? intentions : undefined,
          reflectionGood: !isMorning ? reflectionGood : undefined,
          reflectionBetter: !isMorning ? reflectionBetter : undefined,
          reflectionBest: !isMorning ? reflectionBest : undefined,
          completedAt: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('[RepBookend] Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = isMorning 
    ? intentions.some(i => i.trim().length > 0)
    : reflectionGood.trim().length > 0 || reflectionBetter.trim().length > 0 || reflectionBest.trim().length > 0;

  // Show completion state
  if (isComplete || (alreadyCompleted && !isMorning)) {
    return (
      <div className={`${prompts.bgColor} rounded-xl p-6 text-center border ${prompts.borderColor}`}>
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-3 shadow-sm">
          <Check className="w-6 h-6 text-corporate-teal" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {isMorning ? 'Intentions Set!' : 'Day Complete!'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isMorning 
            ? "Your intentions are saved to your Dashboard." 
            : "Your reflection is saved. Great work today!"}
        </p>
      </div>
    );
  }

  return (
    <div className={`${prompts.bgColor} rounded-xl overflow-hidden border ${prompts.borderColor}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/50 flex items-center gap-3">
        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
          <Icon className={`w-5 h-5 ${prompts.iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{prompts.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{prompts.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isMorning ? (
          // Morning intentions - 3 text fields
          prompts.fields.map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                {field.label}
              </label>
              <input
                type="text"
                value={intentions[index]}
                onChange={(e) => handleIntentionChange(index, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm 
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-corporate-teal/30
                           focus:border-corporate-teal transition-all"
              />
            </div>
          ))
        ) : (
          // Evening reflection - 3 specific fields
          prompts.fields.map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                {field.label}
              </label>
              <textarea
                value={field.key === 'good' ? reflectionGood : field.key === 'better' ? reflectionBetter : reflectionBest}
                onChange={(e) => handleReflectionChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm 
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-corporate-teal/30
                           focus:border-corporate-teal transition-all resize-none"
              />
            </div>
          ))
        )}

        {/* Complete Button */}
        <button
          onClick={handleComplete}
          disabled={!isValid || isSaving}
          className={`
            w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2
            transition-all duration-200
            ${isValid && !isSaving
              ? 'bg-corporate-teal text-white hover:bg-corporate-teal-dark shadow-sm' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          {isSaving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {isMorning ? 'Set My Intentions' : 'Complete Reflection'}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RepBookendWidget;
