import { useNavigate } from 'react-router-dom';
import { useProgress, useAuth } from '../App';
import { getCurrentSession, getFocusProgress } from '../data/focuses';

// Admin emails
const ADMIN_EMAILS = ['rob@sagecg.com', 'rob@leaderreps.com'];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { user } = useAuth();
  
  const completedSessions = progress?.completedSessions?.length || 0;
  const streakCount = progress?.streakCount || 0;
  const name = progress?.profile?.name || 'Leader';
  
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  
  // Get current focus and session
  const { focus, session, sessionInFocus } = getCurrentSession(completedSessions);
  const focusProgress = getFocusProgress(completedSessions);
  
  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-full gradient-focus">
      {/* Floating orbs for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-6 pt-12 pb-32 safe-area-top safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-white/60 text-sm font-medium">{greeting}</p>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <span className="text-xl font-bold text-white">
              {name?.[0]?.toUpperCase() || 'L'}
            </span>
          </button>
        </div>

        {/* Streak Badge */}
        {streakCount > 0 && (
          <div className="flex justify-center mb-8 animate-scale-in">
            <div className="streak-badge">
              <span className="text-xl">🔥</span>
              <span>{streakCount} Day Streak</span>
            </div>
          </div>
        )}

        {/* Current Focus Card */}
        <div className="mb-8 animate-slide-up">
          <div className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${focus.gradient}`}>
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="badge-glass mb-2">
                    <span>{focus.icon}</span>
                    <span>Current Focus</span>
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-2">{focus.title}</h2>
                  <p className="text-white/70">{focus.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs uppercase tracking-wider">Session</p>
                  <p className="text-3xl font-bold text-white">{sessionInFocus}</p>
                  <p className="text-white/60 text-sm">of {focus.sessions.length}</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/80 rounded-full transition-all duration-500"
                    style={{ width: `${focusProgress.percentage}%` }}
                  />
                </div>
                <p className="text-white/60 text-xs mt-2">{focusProgress.percentage}% complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Session Preview */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3">Today's Session</h3>
          <div className="glass-card p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-xl">{getSessionIcon(session.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">{formatSessionType(session.type)}</p>
                <h4 className="text-white font-semibold text-lg leading-tight">{session.title}</h4>
                <p className="text-white/60 text-sm mt-1 line-clamp-2">
                  {getSessionPreview(session)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card-subtle p-4 text-center">
            <p className="text-2xl font-bold text-white">{completedSessions}</p>
            <p className="text-white/50 text-xs">Sessions</p>
          </div>
          <div className="glass-card-subtle p-4 text-center">
            <p className="text-2xl font-bold text-white">{focus.order}</p>
            <p className="text-white/50 text-xs">Focus #{focus.order}</p>
          </div>
          <button 
            onClick={() => navigate('/progress')}
            className="glass-card-subtle p-4 text-center hover:bg-white/30 transition-colors"
          >
            <p className="text-2xl font-bold text-white">📊</p>
            <p className="text-white/50 text-xs">Progress</p>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom bg-black/40 backdrop-blur-xl border-t border-white/10">
        <div className="md:max-w-[430px] md:mx-auto">
          {/* Start Session Button */}
          <div className="px-4 pt-3">
            <button
              onClick={() => navigate('/session')}
              className="w-full btn-primary flex items-center justify-center gap-3"
            >
              <span>Begin Session</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          
          {/* Nav Icons */}
          <div className="flex items-center justify-around py-3">
            <button className="flex flex-col items-center gap-1 text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <span className="text-xs">Home</span>
            </button>
            
            <button 
              onClick={() => navigate('/progress')}
              className="flex flex-col items-center gap-1 text-white/50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs">Progress</span>
            </button>
            
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="flex flex-col items-center gap-1 text-amber-400/80"
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
              className="flex flex-col items-center gap-1 text-white/50"
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

// Helper functions
function getSessionIcon(type) {
  const icons = {
    quote: '💬',
    lesson: '📚',
    scenario: '🎭',
    book: '📖',
    video: '🎬',
    reflection: '🪞',
    challenge: '🎯',
    integration: '✨',
    win: '🏆',
    pm: '🌙',
  };
  return icons[type] || '📍';
}

function formatSessionType(type) {
  const labels = {
    quote: 'Quote',
    lesson: 'Micro-Lesson',
    scenario: 'Scenario',
    book: 'Book Bite',
    video: 'Video Insight',
    reflection: 'Reflection',
    challenge: 'Challenge',
    integration: 'Integration',
    win: 'Win the Day',
    pm: 'Evening Reflection',
  };
  return labels[type] || 'Session';
}

function getSessionPreview(session) {
  const c = session.content || {};
  if (c.quote) return `"${c.quote.substring(0, 80)}..."`;
  if (c.opening) return c.opening.substring(0, 100);
  if (c.lesson) return c.lesson.substring(0, 100);
  if (c.book?.title) return `Exploring "${c.book.title}" by ${c.book.author}`;
  if (c.challenge) return c.challenge.substring(0, 100);
  if (c.setup) return c.setup.substring(0, 100);
  return session.theme?.replace(/-/g, ' ') || 'Leadership growth';
}
