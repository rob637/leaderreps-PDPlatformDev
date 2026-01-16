import React, { useState, useCallback } from 'react';
import { MessageSquare, Check, Loader, Save } from 'lucide-react';
import { Card, Button } from '../ui';

const PMReflectionWidget = ({ 
  reflectionGood, 
  setReflectionGood, 
  reflectionBetter, 
  setReflectionBetter, 
  reflectionBest,
  setReflectionBest,
  handleSaveEveningBookend
}) => {
  // Save status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState('idle');

  // Explicit save function
  const handleSave = useCallback(async () => {
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
  }, [handleSaveEveningBookend]);

  return (
    <Card title="PM Reflection" icon={MessageSquare} accent="NAVY">
      <div className="space-y-2">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
          Daily Reflection
        </span>

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

        {/* Save Button */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400 italic">
            Archives to your locker each night
          </p>
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            size="sm"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${
              saveStatus === 'saved' 
                ? 'bg-green-500 hover:bg-green-500' 
                : 'bg-corporate-navy hover:bg-corporate-navy/90'
            }`}
          >
            {saveStatus === 'saving' && <Loader className="w-3 h-3 animate-spin" />}
            {saveStatus === 'saved' && <Check className="w-3 h-3" />}
            {saveStatus === 'idle' && <Save className="w-3 h-3" />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PMReflectionWidget;
