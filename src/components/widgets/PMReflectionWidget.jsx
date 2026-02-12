import React, { useState, useCallback, useMemo } from 'react';
import { MessageSquare, Check, Loader, Save, RefreshCw } from 'lucide-react';
import { Card, Button } from '../ui';

const PMReflectionWidget = ({ 
  reflectionGood, 
  setReflectionGood, 
  reflectionBetter, 
  setReflectionBetter, 
  reflectionBest,
  setReflectionBest,
  handleSaveEveningBookend,
  dailyPracticeData,
  helpText
}) => {
  // Save status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState('idle');

  // Check if any reflection fields have content
  const hasAnyContent = useMemo(() => {
    return (reflectionGood && reflectionGood.trim().length > 0) ||
           (reflectionBetter && reflectionBetter.trim().length > 0) ||
           (reflectionBest && reflectionBest.trim().length > 0);
  }, [reflectionGood, reflectionBetter, reflectionBest]);

  // Check if reflection has been saved today (eveningBookend has completedAt)
  const hasSavedToday = useMemo(() => {
    const eb = dailyPracticeData?.eveningBookend;
    return eb?.completedAt != null || 
           (eb?.good && eb.good.trim().length > 0) ||
           (eb?.better && eb.better.trim().length > 0) ||
           (eb?.best && eb.best.trim().length > 0);
  }, [dailyPracticeData?.eveningBookend]);

  // Explicit save function
  const handleSave = useCallback(async () => {
    // Don't save if nothing entered
    if (!hasAnyContent) {
      return;
    }

    setSaveStatus('saving');
    
    try {
      if (handleSaveEveningBookend) {
        await handleSaveEveningBookend({ silent: true });
      }
      setSaveStatus('saved');
      
      // Hide "Saved" after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('[PMReflection] Save failed:', error);
      setSaveStatus('idle');
    }
  }, [handleSaveEveningBookend, hasAnyContent]);

  // Determine button text
  const getButtonText = () => {
    if (saveStatus === 'saving') return 'Saving...';
    if (saveStatus === 'saved') return 'Saved!';
    if (hasSavedToday) return 'Update';
    return 'Save';
  };

  // Determine button icon
  const getButtonIcon = () => {
    if (saveStatus === 'saving') return <Loader className="w-3 h-3 animate-spin" />;
    if (saveStatus === 'saved') return <Check className="w-3 h-3" />;
    if (hasSavedToday) return <RefreshCw className="w-3 h-3" />;
    return <Save className="w-3 h-3" />;
  };

  return (
    <Card title="PM Reflection" icon={MessageSquare} accent="NAVY" helpText={helpText}>
      <div className="space-y-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
          Daily Reflection
        </span>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
            1. What went well?
          </label>
          <textarea 
            value={reflectionGood}
            onChange={(e) => setReflectionGood(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={1}
            placeholder="Celebrate a win..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
            2. What needs work?
          </label>
          <textarea 
            value={reflectionBetter}
            onChange={(e) => setReflectionBetter(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={1}
            placeholder="Identify an improvement..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
            3. Closing thought
          </label>
          <textarea 
            value={reflectionBest}
            onChange={(e) => setReflectionBest(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={1}
            placeholder="What will I do 1% better tomorrow?"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-start mt-3 pt-2 border-t border-slate-100">
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || !hasAnyContent}
            size="sm"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${
              saveStatus === 'saved' 
                ? 'bg-green-500 hover:bg-green-500' 
                : !hasAnyContent
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-corporate-teal hover:bg-corporate-teal/90'
            }`}
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PMReflectionWidget;
