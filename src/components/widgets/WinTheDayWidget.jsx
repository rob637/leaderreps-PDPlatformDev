import React, { useState, useCallback, useMemo } from 'react';
import { Trophy, CheckCircle, Check, Loader, Save, RefreshCw } from 'lucide-react';
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

  // Check if any wins have text entered
  const hasAnyContent = useMemo(() => {
    return morningWins.some(win => win.text && win.text.trim().length > 0);
  }, [morningWins]);

  // Check if wins have been saved today (any win has saved: true)
  const hasSavedToday = useMemo(() => {
    return morningWins.some(win => win.saved === true);
  }, [morningWins]);

  // Explicit save function
  const handleSave = useCallback(async () => {
    // Don't save if nothing entered
    if (!hasAnyContent) {
      return;
    }

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
  }, [handleSaveAllWins, hasAnyContent]);

  // Handle checkbox toggle (still saves immediately for completion)
  const handleToggleWithSave = useCallback((index) => {
    const win = morningWins[index];
    const hasText = win.text && win.text.trim().length > 0;
    
    if (hasText) {
      handleToggleWinComplete(index);
    }
  }, [morningWins, handleToggleWinComplete]);

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

export default WinTheDayWidget;
