import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress, useAuth, useTheme } from '../App';
import { getCurrentSession, getFocusProgress } from '../data/focuses';
import { getDailyStatus } from '../data/dailyTouchpoints';
import { getThemeClasses, SVG_COLORS, BADGES, BUTTON_PRIMARY, PROGRESS } from '../theme';
import AskReppyModal from '../components/AskReppyModal';
import AdminMagicButton from '../components/AdminMagicButton';

// Admin emails
const ADMIN_EMAILS = ['rob@sagecg.com', 'rob@leaderreps.com'];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [showAskReppy, setShowAskReppy] = useState(false);
  
  const completedSessions = progress?.completedSessions?.length || 0;
  const streakCount = progress?.streakCount || 0;
  const name = progress?.profile?.name || 'Leader';
  
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  
  // Get current focus and session
  const { focus, session, sessionInFocus } = getCurrentSession(completedSessions);
  const focusProgress = getFocusProgress(completedSessions);
  
  // Get daily touchpoint status
  const dailyStatus = getDailyStatus(progress);
  
  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const startSession = (type) => {
    navigate(`/session?type=${type}`);
  };

  // Theme classes from centralized theme
  const theme = getThemeClasses(isDark);

  return (
    <div className={`min-h-full page-enter-subtle ${theme.bg}`}>
      {/* Content - adjusted padding for bottom nav (needs ~140px for nav + safe area) */}
      <div className="relative z-10 px-5 pt-4 pb-40">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className={`text-sm font-medium ${theme.textSecondary}`}>{greeting}</p>
            <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>{name}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Go to profile"
            className={`w-12 h-12 rounded-full ${BUTTON_PRIMARY} flex items-center justify-center`}
          >
            <span className="text-xl font-bold text-white">
              {name?.[0]?.toUpperCase() || 'L'}
            </span>
          </button>
        </div>

        {/* Streak Badge */}
        {streakCount > 0 && (
          <div className="flex justify-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${BADGES.warning}`}>
              <span>🔥</span>
              <span>{streakCount} Day Streak</span>
            </div>
          </div>
        )}

        {/* Daily Progress Ring */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke={SVG_COLORS.track(isDark)}
                strokeWidth="6"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke={SVG_COLORS.primary}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(dailyStatus.completedCount / 3) * 302} 302`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${theme.textPrimary}`}>{dailyStatus.completedCount}/3</span>
              <span className={`text-xs ${theme.textSecondary}`}>Today</span>
            </div>
          </div>
        </div>

        {/* Daily Journey - Clean Cards */}
        <div className="space-y-3 mb-6">
          <h3 className={`text-xs uppercase tracking-wider font-semibold ${theme.textSecondary}`}>Today's Journey</h3>
          
          {/* Morning */}
          <TouchpointCard
            icon="☀️"
            title="Win the Day"
            subtitle="Set your intention"
            completed={dailyStatus.completed.morning}
            available={dailyStatus.available.morning}
            onClick={() => startSession('morning')}
            completedTime={dailyStatus.data.morning?.completedAt}
            isDark={isDark}
          />
          
          {/* Main Session */}
          <TouchpointCard
            icon="📚"
            title={session?.title || 'Today\'s Session'}
            subtitle={focus?.title}
            completed={dailyStatus.completed.growth}
            available={dailyStatus.available.growth}
            onClick={() => startSession('growth')}
            completedTime={dailyStatus.data.growth?.completedAt}
            isDark={isDark}
          />
          
          {/* Evening */}
          <TouchpointCard
            icon="🌙"
            title="Daily Reflection"
            subtitle="Review your day"
            completed={dailyStatus.completed.evening}
            available={dailyStatus.available.evening}
            onClick={() => startSession('evening')}
            completedTime={dailyStatus.data.evening?.completedAt}
            locked={!dailyStatus.available.evening}
            lockedMessage="Available after 6pm"
            isDark={isDark}
          />
        </div>

        {/* Current Focus - Simple */}
        <div className={`rounded-xl p-4 ${theme.card} border ${theme.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{focus.icon}</span>
              <div>
                <h4 className={`font-semibold ${theme.textPrimary}`}>{focus.title}</h4>
                <p className={`text-sm ${theme.textSecondary}`}>Session {sessionInFocus} of {focus.sessions.length}</p>
              </div>
            </div>
            <div className={`text-sm font-medium ${theme.textSecondary}`}>
              {focusProgress.percentage}%
            </div>
          </div>
          <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${PROGRESS.track(isDark)}`}>
            <div 
              className={`h-full ${PROGRESS.fill} rounded-full transition-all`}
              style={{ width: `${focusProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* All Done */}
        {dailyStatus.allDone && (
          <div className={`mt-4 rounded-xl p-4 text-center ${theme.card} border ${theme.border}`}>
            <span className="text-2xl">🎉</span>
            <span className={`font-semibold ml-2 ${theme.textPrimary}`}>You're all done! See you tomorrow.</span>
          </div>
        )}
        
        {/* Bad Day Option - show when nothing completed yet */}
        {dailyStatus.completedCount === 0 && (
          <button
            type="button"
            onClick={() => setShowAskReppy(true)}
            className={`mt-4 w-full py-3 px-4 rounded-xl text-sm transition-all ${
              isDark 
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-600'
            }`}
          >
            😓 Not feeling it today? Tap to talk to Reppy
          </button>
        )}
      </div>

      {/* Floating Ask Reppy Button */}
      <button
        type="button"
        onClick={() => setShowAskReppy(true)}
        className={`fixed bottom-24 right-4 z-40 w-14 h-14 ${BUTTON_PRIMARY} rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95`}
        aria-label="Ask Reppy for help"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Ask Reppy Modal */}
      <AskReppyModal 
        isOpen={showAskReppy} 
        onClose={() => setShowAskReppy(false)} 
        isDark={isDark}
      />
      
      {/* Admin Magic Button (only visible to admins) */}
      <AdminMagicButton />
    </div>
  );
}

// Clean Touchpoint Card
function TouchpointCard({ icon, title, subtitle, completed, available, onClick, completedTime, locked, lockedMessage, isDark }) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const theme = getThemeClasses(isDark);
  const completedBg = isDark ? 'bg-blue-900/30' : 'bg-blue-50';

  // Not clickable if completed or locked
  const isClickable = available && !locked && !completed;
  
  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      aria-label={`${title}: ${subtitle}${completed ? ' - completed' : locked ? ' - locked' : ''}`}
      className={`w-full p-4 rounded-xl text-left transition-all border ${
        completed 
          ? `${completedBg} border-blue-500`
          : locked
            ? `${theme.card} ${theme.border} opacity-50`
            : available
              ? `${theme.card} ${theme.border} hover:border-blue-400`
              : `${theme.card} ${theme.border} opacity-60`
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          completed ? 'bg-blue-600' : isDark ? 'bg-gray-700' : `bg-white border ${theme.border}`
        }`}>
          {completed ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-lg">{icon}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${completed ? 'text-blue-600' : theme.textPrimary}`}>
            {title}
          </h4>
          <p className={`text-sm ${theme.textSecondary}`}>
            {locked && lockedMessage ? lockedMessage : subtitle}
          </p>
        </div>
        
        {completed && completedTime && (
          <span className="text-xs text-blue-600 font-medium">{formatTime(completedTime)}</span>
        )}
        
        {locked && !completed && (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </div>
    </button>
  );
}
