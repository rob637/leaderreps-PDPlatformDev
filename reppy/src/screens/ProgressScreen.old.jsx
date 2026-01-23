import { useNavigate } from 'react-router-dom';
import { useProgress } from '../App';
import { getPhase, PHASES } from '../data/curriculum';

export default function ProgressScreen() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  
  const currentSession = progress?.currentSession || 1;
  const completedSessions = progress?.completedSessions || [];
  const totalMinutes = progress?.totalMinutes || 0;
  
  // Group sessions by theme
  const themeStats = {};
  completedSessions.forEach(session => {
    if (session.theme) {
      themeStats[session.theme] = (themeStats[session.theme] || 0) + 1;
    }
  });
  
  // Get top themes
  const topThemes = Object.entries(themeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-reppy-cream safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="bg-gradient-to-br from-reppy-teal to-reppy-navy px-6 pt-8 pb-12 text-white">
        {/* LeaderReps Logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="/lr_logo_teal__1_.png" 
            alt="LeaderReps" 
            className="h-8 invert brightness-0 filter"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Your Progress</h1>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{completedSessions.length}</div>
            <div className="text-xs text-white/70">Sessions</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{progress?.streakCount || 0}</div>
            <div className="text-xs text-white/70">Day Streak</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{totalMinutes}</div>
            <div className="text-xs text-white/70">Minutes</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-6 pb-24">
        {/* Phase progress */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-reppy-navy mb-4">Journey Progress</h2>
          
          <div className="space-y-4">
            {Object.values(PHASES).map((phase) => {
              const isCurrentPhase = phase.id === getPhase(currentSession).id;
              const isCompleted = currentSession > phase.endSession;
              const sessionsInPhase = phase.endSession - phase.startSession + 1;
              const completedInPhase = isCompleted 
                ? sessionsInPhase 
                : isCurrentPhase 
                  ? currentSession - phase.startSession 
                  : 0;
              const percentage = Math.round((completedInPhase / sessionsInPhase) * 100);
              
              return (
                <div key={phase.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{phase.icon}</span>
                      <span className={`text-sm font-medium ${
                        isCurrentPhase ? 'text-reppy-navy' : 'text-reppy-navy/60'
                      }`}>
                        {phase.name}
                      </span>
                    </div>
                    <span className="text-xs text-reppy-navy/40">
                      {phase.id === 'daily' ? '∞' : `${completedInPhase}/${sessionsInPhase}`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: phase.id === 'daily' ? '100%' : `${percentage}%`, 
                        backgroundColor: phase.color,
                        opacity: isCurrentPhase || isCompleted ? 1 : 0.3,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topics explored */}
        {topThemes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-reppy-navy mb-4">Topics Explored</h2>
            <div className="flex flex-wrap gap-2">
              {topThemes.map(([theme, count]) => (
                <div 
                  key={theme}
                  className="px-3 py-1.5 bg-reppy-teal-light rounded-full text-sm text-reppy-teal"
                >
                  {theme.replace(/-/g, ' ')} ({count})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-reppy-navy mb-4">Recent Sessions</h2>
          
          {completedSessions.length === 0 ? (
            <p className="text-reppy-navy/60 text-center py-8">
              Complete your first session to see your history
            </p>
          ) : (
            <div className="space-y-3">
              {[...completedSessions].reverse().slice(0, 10).map((session, i) => {
                const phase = getPhase(session.session);
                const date = new Date(session.completedAt);
                
                return (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 bg-reppy-cream rounded-xl"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${phase.color}20` }}
                    >
                      <span>{phase.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-reppy-navy">
                        Session {session.session}
                      </p>
                      <p className="text-xs text-reppy-navy/60">
                        {session.theme?.replace(/-/g, ' ') || phase.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-reppy-navy/60">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-reppy-navy/40">
                        {session.duration}m
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 safe-area-bottom">
        <div className="flex justify-around">
          <button 
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-reppy-navy/40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-reppy-teal">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span className="text-xs font-medium">Progress</span>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 text-reppy-navy/40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
