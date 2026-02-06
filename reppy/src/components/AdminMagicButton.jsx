import { useState } from 'react';
import { useProgress, useAuth, useTheme } from '../App';
import { getThemeClasses } from '../theme';

// Admin emails that can access magic features
const ADMIN_EMAILS = ['rob@sagecg.com', 'rob@leaderreps.com'];

export default function AdminMagicButton() {
  const { user } = useAuth();
  const { progress, updateProgress } = useProgress();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState(null);
  
  const theme = getThemeClasses(isDark);
  
  // Check if user is admin (either by email or profile flag)
  const isAdmin = (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) || progress?.profile?.isAdmin === true;
  
  // Don't render if not admin
  if (!isAdmin) return null;
  
  // Check if No Time mode is active
  const noTimeMode = progress?.settings?.noTimeLimit === true;
  
  // Reset user to beginning (full clean start including onboarding)
  const handleReset = async () => {
    if (!confirm('⚠️ This will reset EVERYTHING - you\'ll go back through onboarding like a brand new user. Are you sure?')) return;
    
    setProcessing('reset');
    try {
      await updateProgress({
        completedSessions: [],
        streakCount: 0,
        totalMinutes: 0,
        currentDay: 1,
        lastSessionDate: null,
        dailyTouchpoints: {},
        journalEntries: [],
        totalMorningSessions: 0,
        totalEveningSessions: 0,
        onboardingComplete: false, // Go back through onboarding
        // Keep profile name but reset other profile fields
        profile: {
          name: progress?.profile?.name || 'Leader',
          isAdmin: progress?.profile?.isAdmin || false, // Keep admin status
          // Reset onboarding choices so they can re-select
          challenge: null,
          coachingStyle: null,
          goal: null,
        },
      });
      alert('✅ Full reset complete! Redirecting to onboarding...');
      setIsOpen(false);
      // Reload page to trigger redirect to onboarding
      window.location.reload();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };
  
  // Advance to next day
  const handleNextDay = async () => {
    setProcessing('nextDay');
    try {
      const currentDay = progress?.currentDay || 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Create a fake "yesterday" date for the last session
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await updateProgress({
        currentDay: currentDay + 1,
        lastSessionDate: yesterday.toISOString(),
        // Clear today's touchpoints so they appear fresh
        dailyTouchpoints: {
          ...progress?.dailyTouchpoints,
          [today]: null // Clear today
        }
      });
      alert(`✅ Advanced to Day ${currentDay + 1}!`);
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };
  
  // Toggle no time limits
  const handleNoTime = async () => {
    setProcessing('noTime');
    try {
      const newNoTimeLimit = !noTimeMode;
      await updateProgress({
        settings: {
          ...(progress?.settings || {}),
          noTimeLimit: newNoTimeLimit
        }
      });
      alert(newNoTimeLimit 
        ? '✅ No Time mode ENABLED - All sessions unlocked!' 
        : '✅ No Time mode DISABLED - Normal time restrictions apply');
      setIsOpen(false);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };
  
  return (
    <>
      {/* Floating Magic Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-24 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-110 transition-transform"
        title="Admin Magic"
      >
        <span className="text-xl">🪄</span>
      </button>
      
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className={`relative w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪄</span>
                <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Admin Magic</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Status Info */}
            <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <div className={`text-xs ${theme.textSecondary} space-y-1`}>
                <p>📅 Current Day: <span className="font-semibold">{progress?.currentDay || 1}</span></p>
                <p>🏆 Sessions: <span className="font-semibold">{progress?.completedSessions?.length || 0}</span></p>
                <p>⏱️ No Time Mode: <span className={`font-semibold ${noTimeMode ? 'text-green-500' : 'text-red-400'}`}>{noTimeMode ? 'ON' : 'OFF'}</span></p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Reset Button */}
              <button
                onClick={handleReset}
                disabled={processing !== null}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                  processing === 'reset'
                    ? 'bg-gray-500 cursor-wait'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                } text-white`}
              >
                {processing === 'reset' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-lg">🔄</span>
                    <span>Reset to Beginning</span>
                  </>
                )}
              </button>
              
              {/* Next Day Button */}
              <button
                onClick={handleNextDay}
                disabled={processing !== null}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                  processing === 'nextDay'
                    ? 'bg-gray-500 cursor-wait'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                } text-white`}
              >
                {processing === 'nextDay' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-lg">⏭️</span>
                    <span>Skip to Next Day</span>
                  </>
                )}
              </button>
              
              {/* No Time Button */}
              <button
                onClick={handleNoTime}
                disabled={processing !== null}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                  processing === 'noTime'
                    ? 'bg-gray-500 cursor-wait'
                    : noTimeMode
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      : 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600'
                } text-white`}
              >
                {processing === 'noTime' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-lg">{noTimeMode ? '⏰' : '🚫'}</span>
                    <span>{noTimeMode ? 'Restore Time Limits' : 'Remove Time Limits'}</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Warning Footer */}
            <p className={`text-xs text-center mt-4 ${theme.textMuted}`}>
              ⚠️ Testing tools only - affects your real data
            </p>
          </div>
        </div>
      )}
    </>
  );
}
