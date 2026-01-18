import React, { useState, useCallback } from 'react';
import { Trophy, CheckCircle, Check, Loader, Save } from 'lucide-react';
import { Card, Button } from '../ui';

const WinTheDayWidget = ({ scope, helpText }) => {
  const { 
    morningWins, 
    handleUpdateWin, 
    handleToggleWinComplete,
    handleSaveAllWins
  } = scope;

  // Save status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState('idle');

  // Explicit save function
  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    
    try {
      if (handleSaveAllWins) {
        await handleSaveAllWins({ silent: true });
      }
      setSaveStatus('saved');
      
      // Hide "Saved" after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('[WinTheDay] Save failed:', error);
      setSaveStatus('idle');
    }
  }, [handleSaveAllWins]);

  // Handle checkbox toggle (still saves immediately for completion)
  const handleToggleWithSave = useCallback((index) => {
    const win = morningWins[index];
    const hasText = win.text && win.text.trim().length > 0;
    
    if (hasText) {
      handleToggleWinComplete(index);
    }
  }, [morningWins, handleToggleWinComplete]);

  return (
    <Card title="Win the Day" icon={Trophy} accent="TEAL" helpText={helpText}>
      <div className="space-y-1">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
          Identify 3 High-Impact Actions
        </p>
        
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

        {/* Save Button */}
        <div className="flex items-center justify-start mt-3 pt-2 border-t border-slate-100">
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            size="sm"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${
              saveStatus === 'saved' 
                ? 'bg-green-500 hover:bg-green-500' 
                : 'bg-corporate-teal hover:bg-corporate-teal/90'
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

export default WinTheDayWidget;
