import { useNavigate } from 'react-router-dom';
import { useAuth, useProgress } from '../App';
import { getPhase, PHASES } from '../data/curriculum';
import { getQuoteOfTheDay } from '../data/quotes';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress } = useProgress();
  
  const currentSession = progress?.currentSession || 1;
  const phase = getPhase(currentSession);
  const quote = getQuoteOfTheDay();
  const name = progress?.profile?.name || 'Leader';
  
  // Calculate progress within current phase
  const phaseProgress = phase.id === 'daily' 
    ? 100 
    : Math.round(((currentSession - phase.startSession) / (phase.endSession - phase.startSession + 1)) * 100);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-reppy-cream safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="bg-gradient-to-br from-reppy-teal to-reppy-navy px-6 pt-6 pb-12 text-white">
        {/* LeaderReps Logo */}
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/leaderreps-logo.svg" 
            alt="LeaderReps" 
            className="h-6 opacity-90"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm">{getGreeting()},</p>
            <h1 className="text-2xl font-bold">{name}</h1>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

        {/* Streak card */}
        {progress?.streakCount > 0 && (
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="text-3xl">🔥</div>
            <div>
              <div className="text-lg font-semibold">{progress.streakCount} Day Streak</div>
              <div className="text-sm text-white/70">Keep it going!</div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="px-6 -mt-6 pb-24">
        {/* Today's session card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{phase.icon}</span>
              <span 
                className="text-sm font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${phase.color}20`, color: phase.color }}
              >
                {phase.name}
              </span>
            </div>
            
            <h2 className="text-xl font-semibold text-reppy-navy mb-2">
              {phase.id === 'daily' ? "Today's Leadership Moment" : `Session ${currentSession}`}
            </h2>
            
            <p className="text-reppy-navy/60 text-sm mb-6">
              {phase.description}
            </p>

            {/* Phase progress */}
            {phase.id !== 'daily' && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-reppy-navy/60 mb-1">
                  <span>{phase.name} Progress</span>
                  <span>{phaseProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${phaseProgress}%`, backgroundColor: phase.color }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/session')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {currentSession === 1 ? 'Start First Session' : 'Begin Session'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quote of the day */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💭</span>
            <span className="text-sm font-medium text-reppy-navy/60">Quote of the Day</span>
          </div>
          <blockquote className="content-quote mb-4">
            "{quote.quote}"
          </blockquote>
          <p className="text-sm text-reppy-navy/60">— {quote.author}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/progress')}
            className="bg-white rounded-xl p-4 text-left shadow-sm"
          >
            <div className="text-2xl font-bold text-reppy-teal">{(progress?.completedSessions?.length || 0)}</div>
            <div className="text-sm text-reppy-navy/60">Sessions Complete</div>
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="bg-white rounded-xl p-4 text-left shadow-sm"
          >
            <div className="text-2xl font-bold text-reppy-teal">{progress?.totalMinutes || 0}</div>
            <div className="text-sm text-reppy-navy/60">Minutes Invested</div>
          </button>
        </div>

        {/* Journey overview */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-reppy-navy mb-4">Your Journey</h3>
          <div className="space-y-3">
            {Object.values(PHASES).map((p, i) => {
              const isCurrentPhase = p.id === phase.id;
              const isCompleted = currentSession > p.endSession;
              
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      isCompleted ? 'bg-reppy-teal text-white' :
                      isCurrentPhase ? 'border-2' : 'bg-gray-100 text-gray-400'
                    }`}
                    style={isCurrentPhase ? { borderColor: p.color, color: p.color } : {}}
                  >
                    {isCompleted ? '✓' : p.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      isCurrentPhase ? 'text-reppy-navy' : 'text-reppy-navy/60'
                    }`}>
                      {p.name}
                    </div>
                    <div className="text-xs text-reppy-navy/40">{p.subtitle}</div>
                  </div>
                  {isCurrentPhase && (
                    <div 
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${p.color}20`, color: p.color }}
                    >
                      Current
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 safe-area-bottom">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1 text-reppy-teal">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            onClick={() => navigate('/progress')}
            className="flex flex-col items-center gap-1 text-reppy-navy/40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">Progress</span>
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
