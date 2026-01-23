import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../App';
import { getPhase, getSessionContent, SESSION_TYPES } from '../data/curriculum';
import { getBookByTheme } from '../data/books';
import { getQuoteByTheme } from '../data/quotes';

// Session phases
const SESSION_PHASES = ['welcome', 'content', 'practice', 'reflection', 'complete'];

export default function SessionScreen() {
  const navigate = useNavigate();
  const { progress, completeSession } = useProgress();
  
  const [phase, setPhase] = useState('welcome');
  const [sessionContent, setSessionContent] = useState(null);
  const [reflection, setReflection] = useState('');
  const [startTime] = useState(Date.now());
  
  const currentSession = progress?.currentSession || 1;
  const currentPhase = getPhase(currentSession);
  const name = progress?.profile?.name || 'Leader';

  // Load session content
  useEffect(() => {
    const content = getSessionContent(currentSession, progress?.profile);
    
    // If content is dynamic, enhance it with library content
    if (content.dynamic) {
      if (content.type === SESSION_TYPES.QUOTE) {
        const quote = getQuoteByTheme(content.theme);
        content.content = {
          quote: quote.quote,
          author: quote.author,
          context: quote.context,
          themes: quote.themes,
        };
      } else if (content.type === SESSION_TYPES.BOOK_BITE) {
        const book = getBookByTheme(content.theme);
        content.content = { book };
        content.title = book.title;
      }
    }
    
    setSessionContent(content);
  }, [currentSession, progress?.profile]);

  // Handle session completion
  const handleComplete = async () => {
    const duration = Math.round((Date.now() - startTime) / 60000); // minutes
    
    await completeSession(currentSession, {
      type: sessionContent?.type,
      theme: sessionContent?.theme,
      duration: Math.max(duration, 5), // Minimum 5 minutes
      reflection: reflection || null,
    });
    
    navigate('/');
  };

  // Render content based on session type
  const renderContent = () => {
    if (!sessionContent) return null;

    const content = sessionContent.content || {};

    switch (sessionContent.type) {
      case SESSION_TYPES.QUOTE:
        return (
          <div className="space-y-6 animate-fade-in">
            <blockquote className="content-quote">
              "{content.quote}"
            </blockquote>
            <p className="text-reppy-navy/60">— {content.author}</p>
            {content.context && (
              <p className="text-sm text-reppy-navy/50 italic">{content.context}</p>
            )}
            {content.reflection && (
              <div className="content-insight mt-6">
                <p>{content.reflection}</p>
              </div>
            )}
          </div>
        );

      case SESSION_TYPES.MICRO_LESSON:
        return (
          <div className="space-y-6 animate-fade-in">
            {content.opening && (
              <p className="text-lg text-reppy-navy font-medium">{content.opening}</p>
            )}
            {content.lesson && (
              <p className="text-reppy-navy/80 leading-relaxed">{content.lesson}</p>
            )}
            {content.insight && (
              <div className="content-insight">
                <p className="text-sm font-medium mb-1">Key Insight</p>
                <p>{content.insight}</p>
              </div>
            )}
          </div>
        );

      case SESSION_TYPES.BOOK_BITE:
        const book = content.book || content;
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-16 h-24 bg-gradient-to-br from-reppy-teal to-reppy-navy rounded-lg flex items-center justify-center text-white text-2xl">
                📚
              </div>
              <div>
                <h3 className="text-lg font-semibold text-reppy-navy">{book.title}</h3>
                <p className="text-reppy-navy/60">by {book.author}</p>
                {book.year && <p className="text-sm text-reppy-navy/40">{book.year}</p>}
              </div>
            </div>
            {book.synopsis && (
              <p className="text-reppy-navy/80 leading-relaxed">{book.synopsis}</p>
            )}
            {book.keyInsight && (
              <div className="content-insight">
                <p className="text-sm font-medium mb-1">Key Insight</p>
                <p className="font-medium">{book.keyInsight}</p>
              </div>
            )}
            {book.leadershipConnection && (
              <div className="bg-white rounded-xl p-4 border border-reppy-teal-light">
                <p className="text-sm font-medium mb-1 text-reppy-teal">For Leaders</p>
                <p className="text-reppy-navy/80">{book.leadershipConnection}</p>
              </div>
            )}
          </div>
        );

      case SESSION_TYPES.SCENARIO:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-reppy-navy-light rounded-xl p-5">
              <p className="text-sm font-medium text-reppy-navy/60 mb-2">The Situation</p>
              <p className="text-reppy-navy leading-relaxed">{content.setup}</p>
            </div>
            {content.context && (
              <p className="text-reppy-navy/60 text-sm">{content.context}</p>
            )}
            {content.options && (
              <div className="space-y-3">
                <p className="font-medium text-reppy-navy">What would you do?</p>
                {content.options.map((option, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-reppy-teal-light">
                    <p className="font-medium text-reppy-navy mb-2">{String.fromCharCode(65 + i)}. {option.choice}</p>
                    <p className="text-sm text-reppy-navy/60">{option.analysis}</p>
                  </div>
                ))}
              </div>
            )}
            {content.principle && (
              <div className="content-insight">
                <p className="text-sm font-medium mb-1">The Principle</p>
                <p>{content.principle}</p>
              </div>
            )}
          </div>
        );

      case SESSION_TYPES.REFLECTION:
        return (
          <div className="space-y-6 animate-fade-in">
            {content.opening && (
              <p className="text-lg text-reppy-navy font-medium">{content.opening}</p>
            )}
            {content.prompt && (
              <div className="bg-white rounded-xl p-5 border-l-4 border-reppy-teal">
                <p className="text-reppy-navy leading-relaxed">{content.prompt}</p>
              </div>
            )}
            {content.deeperPrompt && (
              <div className="bg-reppy-teal-light/50 rounded-xl p-5">
                <p className="text-reppy-navy/80">{content.deeperPrompt}</p>
              </div>
            )}
            {content.insight && (
              <div className="content-insight">
                <p>{content.insight}</p>
              </div>
            )}
          </div>
        );

      case SESSION_TYPES.CHALLENGE:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-reppy-orange/10 rounded-xl p-5 border-l-4 border-reppy-orange">
              <p className="text-sm font-medium text-reppy-orange mb-2">Today's Challenge</p>
              <p className="text-reppy-navy font-medium">{content.challenge}</p>
            </div>
            {content.rules && (
              <div className="space-y-2">
                <p className="font-medium text-reppy-navy">Guidelines:</p>
                <ul className="space-y-2">
                  {content.rules.map((rule, i) => (
                    <li key={i} className="flex gap-3 text-reppy-navy/80">
                      <span className="text-reppy-teal">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {content.why && (
              <div className="content-insight">
                <p className="text-sm font-medium mb-1">Why This Matters</p>
                <p>{content.why}</p>
              </div>
            )}
          </div>
        );

      case SESSION_TYPES.VIDEO_INSIGHT:
        return (
          <div className="space-y-6 animate-fade-in">
            {content.video && (
              <div className="bg-reppy-navy rounded-xl p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{content.video.title}</p>
                    <p className="text-sm text-white/70">{content.video.speaker} • {content.video.duration}</p>
                  </div>
                </div>
                <p className="text-sm text-white/60">{content.video.platform}</p>
              </div>
            )}
            {content.preview && (
              <p className="text-reppy-navy/80 leading-relaxed">{content.preview}</p>
            )}
            {content.keyMoment && (
              <div className="content-insight">
                <p className="text-sm font-medium mb-1">Key Moment</p>
                <p>{content.keyMoment}</p>
              </div>
            )}
            {content.leadershipApplication && (
              <div className="bg-white rounded-xl p-4 border border-reppy-teal-light">
                <p className="text-sm font-medium mb-1 text-reppy-teal">Apply It</p>
                <p className="text-reppy-navy/80">{content.leadershipApplication}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="content-insight animate-fade-in">
            <p>Session content loading...</p>
          </div>
        );
    }
  };

  // Render practice prompt
  const renderPractice = () => {
    const content = sessionContent?.content || {};
    const practice = content.practice || content.challenge || content.takeaway;
    
    if (!practice) {
      return (
        <p className="text-reppy-navy/80 leading-relaxed">
          Take a moment to think about how you can apply today's learning. 
          What's one small action you could take?
        </p>
      );
    }
    
    return <p className="text-reppy-navy/80 leading-relaxed">{practice}</p>;
  };

  return (
    <div className="min-h-screen bg-reppy-cream safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="sticky top-0 bg-reppy-cream/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between z-10">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-reppy-navy/60"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2">
          <img 
            src="/lr_logo_mark_teal__1_.png" 
            alt="LeaderReps" 
            className="h-5 w-5 object-contain"
          />
          <span className="text-sm font-medium text-reppy-navy">
            {currentPhase.id === 'daily' ? 'Daily' : `Session ${currentSession}`}
          </span>
        </div>
        
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Progress indicator */}
      <div className="px-6 pb-4">
        <div className="flex gap-1.5">
          {SESSION_PHASES.map((p, i) => (
            <div
              key={p}
              className={`h-1 flex-1 rounded-full transition-colors ${
                SESSION_PHASES.indexOf(phase) >= i ? 'bg-reppy-teal' : 'bg-reppy-navy/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-32">
        {/* Welcome phase */}
        {phase === 'welcome' && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{currentPhase.icon}</div>
              <h1 className="text-2xl font-bold text-reppy-navy mb-2">
                {sessionContent?.title || `Session ${currentSession}`}
              </h1>
              <p className="text-reppy-navy/60">
                {currentPhase.subtitle}
              </p>
            </div>
            
            <div className="session-card mb-6">
              <p className="text-reppy-navy/80 leading-relaxed">
                Hey {name}! Ready for today's leadership moment? 
                This session focuses on <span className="font-medium text-reppy-teal">{sessionContent?.theme?.replace(/-/g, ' ') || 'growth'}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Content phase */}
        {phase === 'content' && (
          <div className="session-card">
            <div className="flex items-center gap-2 mb-4">
              <span 
                className="phase-badge"
                style={{ backgroundColor: `${currentPhase.color}20`, color: currentPhase.color }}
              >
                {sessionContent?.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-reppy-navy mb-6">
              {sessionContent?.title}
            </h2>
            {renderContent()}
          </div>
        )}

        {/* Practice phase */}
        {phase === 'practice' && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎯</div>
              <h2 className="text-xl font-semibold text-reppy-navy">Put It Into Practice</h2>
            </div>
            
            <div className="session-card">
              {renderPractice()}
            </div>
          </div>
        )}

        {/* Reflection phase */}
        {phase === 'reflection' && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">✍️</div>
              <h2 className="text-xl font-semibold text-reppy-navy">Quick Reflection</h2>
              <p className="text-reppy-navy/60 text-sm mt-1">Optional, but powerful</p>
            </div>
            
            <div className="session-card">
              <p className="text-reppy-navy/80 mb-4">
                What's one thing from today's session you want to remember or try?
              </p>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Your thoughts..."
                className="input-journal h-32"
              />
            </div>
          </div>
        )}

        {/* Complete phase */}
        {phase === 'complete' && (
          <div className="animate-slide-up text-center">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-reppy-navy mb-2">Session Complete!</h2>
            <p className="text-reppy-navy/60 mb-8">
              Another step forward in your leadership journey.
            </p>
            
            <div className="session-card text-left mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-reppy-teal-light rounded-full flex items-center justify-center">
                  <span className="text-xl">🏆</span>
                </div>
                <div>
                  <p className="font-medium text-reppy-navy">
                    {progress?.streakCount ? `${progress.streakCount + 1} Day Streak!` : 'Streak Started!'}
                  </p>
                  <p className="text-sm text-reppy-navy/60">
                    Session {currentSession} • {sessionContent?.theme?.replace(/-/g, ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 bg-reppy-cream/95 backdrop-blur-sm px-6 py-4 safe-area-bottom">
        {phase === 'complete' ? (
          <button onClick={handleComplete} className="btn-primary w-full">
            Return Home
          </button>
        ) : (
          <button
            onClick={() => {
              const currentIndex = SESSION_PHASES.indexOf(phase);
              if (currentIndex < SESSION_PHASES.length - 1) {
                setPhase(SESSION_PHASES[currentIndex + 1]);
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {phase === 'welcome' ? 'Begin' : 
             phase === 'reflection' ? 'Complete Session' : 'Continue'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
