import { useNavigate } from 'react-router-dom';
import { useProgress } from '../App';
import { FOCUSES, getCurrentFocus, getFocusProgress } from '../data/focuses';

export default function ProgressScreen() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  
  const completedSessions = progress?.completedSessions || [];
  const totalMinutes = progress?.totalMinutes || 0;
  const totalCompleted = completedSessions.length;
  
  // Get current focus info
  const currentFocus = getCurrentFocus(totalCompleted);
  const focusProgress = getFocusProgress(totalCompleted);
  
  // Group sessions by focus
  const focusStats = {};
  completedSessions.forEach(session => {
    if (session.focusId) {
      focusStats[session.focusId] = (focusStats[session.focusId] || 0) + 1;
    }
  });
  
  // Get completed focuses
  const completedFocuses = FOCUSES.filter(focus => 
    (focusStats[focus.id] || 0) >= focus.sessions.length
  );
  
  // Get in-progress focuses
  const inProgressFocuses = FOCUSES.filter(focus =>
    focusStats[focus.id] > 0 && focusStats[focus.id] < focus.sessions.length
  );

  return (
    <div className="min-h-screen gradient-focus safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 -right-20 w-60 h-60 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-48 h-48 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Your Progress</h1>
          <div className="w-10" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card-subtle p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalCompleted}</div>
            <div className="text-xs text-white/50">Sessions</div>
          </div>
          <div className="glass-card-subtle p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {progress?.streakCount || 0}
              <span className="ml-1">🔥</span>
            </div>
            <div className="text-xs text-white/50">Streak</div>
          </div>
          <div className="glass-card-subtle p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalMinutes}</div>
            <div className="text-xs text-white/50">Minutes</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 pb-24 overflow-y-auto">
        {/* Current Focus */}
        {currentFocus && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">Current Focus</h2>
            <div className={`glass-card p-5 border-l-4`} style={{ borderLeftColor: `var(--tw-gradient-from)` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentFocus.gradient} flex items-center justify-center`}>
                  <span className="text-xl">{currentFocus.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{currentFocus.title}</h3>
                  <p className="text-sm text-white/50">
                    Session {focusProgress.currentSession} of {focusProgress.totalSessions}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${currentFocus.gradient}`}
                  style={{ width: `${(focusProgress.currentSession / focusProgress.totalSessions) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Completed Focuses */}
        {completedFocuses.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">
              Completed Focuses ({completedFocuses.length})
            </h2>
            <div className="space-y-3">
              {completedFocuses.map(focus => (
                <div key={focus.id} className="glass-card-subtle p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${focus.gradient} flex items-center justify-center`}>
                      <span className="text-lg">{focus.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{focus.title}</h3>
                      <p className="text-xs text-white/40">{focus.sessions.length} sessions completed</p>
                    </div>
                    <span className="text-emerald-400 text-lg">✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Focuses Journey Map */}
        <div className="mt-8">
          <h2 className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">Focus Journey</h2>
          <div className="glass-card p-5">
            <div className="space-y-4">
              {FOCUSES.map((focus, index) => {
                const completed = focusStats[focus.id] || 0;
                const isCurrentFocus = focus.id === currentFocus?.id;
                const isCompleted = completed >= focus.sessions.length;
                const percentage = (completed / focus.sessions.length) * 100;
                
                return (
                  <div key={focus.id} className="relative">
                    {/* Connecting line */}
                    {index < FOCUSES.length - 1 && (
                      <div className="absolute left-5 top-10 w-0.5 h-6 bg-white/10" />
                    )}
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? `bg-gradient-to-br ${focus.gradient}` :
                        isCurrentFocus ? `bg-gradient-to-br ${focus.gradient} ring-2 ring-white/30` :
                        'bg-white/10'
                      }`}>
                        <span className={isCompleted || isCurrentFocus ? 'text-lg' : 'text-lg opacity-50'}>{focus.icon}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium truncate ${
                            isCurrentFocus ? 'text-white' : 
                            isCompleted ? 'text-white/80' : 
                            'text-white/40'
                          }`}>
                            {focus.title}
                          </span>
                          <span className="text-xs text-white/40 ml-2 flex-shrink-0">
                            {completed}/{focus.sessions.length}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              isCompleted ? 'bg-emerald-500' :
                              isCurrentFocus ? `bg-gradient-to-r ${focus.gradient}` :
                              'bg-white/30'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Infinite indicator */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <p className="text-white/40 text-sm">
                ♾️ Your journey continues indefinitely
              </p>
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        {completedSessions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">Recent Sessions</h2>
            <div className="glass-card p-5">
              <div className="space-y-3">
                {[...completedSessions].reverse().slice(0, 7).map((session, i) => {
                  const focus = FOCUSES.find(f => f.id === session.focusId);
                  const date = new Date(session.completedAt);
                  
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        focus ? `bg-gradient-to-br ${focus.gradient}` : 'bg-white/10'
                      }`}>
                        <span className="text-sm">{focus?.icon || '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {focus?.title || 'Session'}
                        </p>
                        <p className="text-xs text-white/40">
                          {session.duration || 5} min • {session.theme?.replace(/-/g, ' ') || 'Growth'}
                        </p>
                      </div>
                      <span className="text-xs text-white/30">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
