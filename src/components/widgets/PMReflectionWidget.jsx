import React from 'react';
import { MessageSquare, Save, Loader } from 'lucide-react';
import { Card } from '../ui';

const PMReflectionWidget = ({ 
  reflectionGood, 
  setReflectionGood, 
  reflectionBetter, 
  setReflectionBetter, 
  handleSaveEveningBookend, 
  isSavingBookend 
}) => {
  return (
    <Card title="PM Reflection" icon={MessageSquare} accent="INDIGO">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            1. What went well?
          </label>
          <textarea 
            value={reflectionGood}
            onChange={(e) => setReflectionGood(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={2}
            placeholder="Celebrate a win..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            2. What needs work?
          </label>
          <textarea 
            value={reflectionBetter}
            onChange={(e) => setReflectionBetter(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={2}
            placeholder="Identify an improvement..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            3. Closing thought
          </label>
          <textarea 
            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            rows={1}
            placeholder="One word to describe today..."
          />
        </div>

        <button 
          onClick={() => handleSaveEveningBookend()}
          disabled={isSavingBookend || (!reflectionGood && !reflectionBetter)}
          className="w-full py-3 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSavingBookend ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Journal
        </button>
      </div>
    </Card>
  );
};

export default PMReflectionWidget;
