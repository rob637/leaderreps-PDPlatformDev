import { useNavigate } from 'react-router-dom';
import { useProgress, useAuth, useTheme } from '../App';
import { getCurrentSession, getFocusProgress } from '../data/focuses';
import { getDailyStatus, getNextAction } from '../data/dailyTouchpoints';

// Admin emails
const ADMIN_EMAILS = ['rob@sagecg.com', 'rob@leaderreps.com'];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const completedSessions = progress?.completedSessions?.length || 0;
  const streakCount = progress?.streakCount || 0;
  const name = progress?.profile?.name || 'Leader';
  
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  
  // Get current focus and session
  const { focus, session, sessionInFocus } = getCurrentSession(completedSessions);
  const focusProgress = getFocusProgress(completedSessions);
  
  // Get daily touchpoint status
  const dailyStatus = getDailyStatus(progress);
  const nextAction = getNextAction(progress);
  
  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const startSession = (type) => {
    navigate(`/session?type=${type}`);
  };

  // Theme colors - consistent blue accent
  const bg = isDark ? 'bg-gray-900' : 'bg-white';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const border = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`min-h-full ${bg}`}>
      {/* Content - adjusted padding for bottom nav (needs ~140px for nav + safe area) */}
      <div className="relative z-10 px-5 pt-10 pb-40 safe-area-top">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className={`text-sm font-medium ${textSecondary}`}>{greeting}</p>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>{name}</h1>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center"
          >
            <span className="text-xl font-bold text-white">
              {name?.[0]?.toUpperCase() || 'L'}
            </span>
          </button>
        </div>

        {/* Streak Badge */}
        {streakCount > 0 && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-orange-100 text-orange-700">
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
                stroke={isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
                strokeWidth="6"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="#2563eb"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(dailyStatus.completedCount / 3) * 302} 302`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${textPrimary}`}>{dailyStatus.completedCount}/3</span>
              <span className={`text-xs ${textSecondary}`}>Today</span>
            </div>
          </div>
        </div>

        {/* Daily Journey - Clean Cards */}
        <div className="space-y-3 mb-6">
          <h3 className={`text-xs uppercase tracking-wider font-semibold ${textSecondary}`}>Today's Journey</h3>
          
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
            isDark={isDark}
          />
        </div>

        {/* Current Focus - Simple */}
        <div className={`rounded-xl p-4 ${cardBg} border ${border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{focus.icon}</span>
              <div>
                <h4 className={`font-semibold ${textPrimary}`}>{focus.title}</h4>
                <p className={`text-sm ${textSecondary}`}>Session {sessionInFocus} of {focus.sessions.length}</p>
              </div>
            </div>
            <div className={`text-sm font-medium ${textSecondary}`}>
              {focusProgress.percentage}%
            </div>
          </div>
          <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${focusProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* All Done */}
        {dailyStatus.allDone && (
          <div className={`mt-4 rounded-xl p-4 text-center ${cardBg} border ${border}`}>
            <span className="text-2xl">🎉</span>
            <span className={`font-semibold ml-2 ${textPrimary}`}>You're all done! See you tomorrow.</span>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 safe-area-bottom ${bg} border-t ${border}`}>
        <div className="md:max-w-[430px] md:mx-auto">
          {/* Action Button - only show if there's something available to do */}
          {!dailyStatus.allDone && nextAction.type !== 'wait' && nextAction.type !== 'done' && (
            <div className="px-4 pt-3">
              <button
                onClick={() => {
                  if (nextAction.type === 'morning') startSession('morning');
                  else if (nextAction.type === 'growth') startSession('growth');
                  else if (nextAction.type === 'evening') startSession('evening');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <span>
                  {nextAction.type === 'morning' && '☀️'}
                  {nextAction.type === 'growth' && '📚'}
                  {nextAction.type === 'evening' && '🌙'}
                </span>
                <span>{nextAction.message}</span>
              </button>
            </div>
          )}
          
          {/* Nav Icons */}
          <div className="flex items-center justify-around py-3">
            <button className="flex flex-col items-center gap-1 text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </button>
            
            <button 
              onClick={() => navigate('/community')}
              className={`flex flex-col items-center gap-1 ${textSecondary}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs">Community</span>
            </button>
            
            <button 
              onClick={() => navigate('/progress')}
              className={`flex flex-col items-center gap-1 ${textSecondary}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs">Progress</span>
            </button>
            
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="flex flex-col items-center gap-1 text-orange-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs">Admin</span>
              </button>
            )}
            
            <button 
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center gap-1 ${textSecondary}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Clean Touchpoint Card
function TouchpointCard({ icon, title, subtitle, completed, available, onClick, completedTime, locked, isDark }) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const cardBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const completedBg = isDark ? 'bg-blue-900/30' : 'bg-blue-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  // Not clickable if completed or locked
  const isClickable = available && !locked && !completed;
  
  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`w-full p-4 rounded-xl text-left transition-all border ${
        completed 
          ? `${completedBg} border-blue-500`
          : locked
            ? `${cardBg} border-gray-300 opacity-50`
            : available
              ? `${cardBg} border-gray-200 hover:border-blue-400`
              : `${cardBg} border-gray-200 opacity-60`
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          completed ? 'bg-blue-600' : isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'
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
          <h4 className={`font-medium ${completed ? 'text-blue-600' : textPrimary}`}>
            {title}
          </h4>
          <p className={`text-sm ${textSecondary}`}>{subtitle}</p>
        </div>
        
        {completed && completedTime && (
          <span className="text-xs text-blue-600 font-medium">{formatTime(completedTime)}</span>
        )}
      </div>
    </button>
  );
}
