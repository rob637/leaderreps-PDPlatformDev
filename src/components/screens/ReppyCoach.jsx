// src/components/screens/ReppyCoach.jsx
// Reppy AI Leadership Coach - Standalone Curriculum-Driven Experience
// Designed as a coaching journal/worksheet, not a chatbot

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, BookOpen, Target, Award, Send,
  ChevronRight, Play, ExternalLink, Bookmark,
  BookmarkCheck, CheckCircle2, Flame, Heart, User
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { useReppyProgress } from '../../hooks/useReppyProgress';

/**
 * ReppyCoach - Leadership Development Journal
 * 
 * Designed to feel like a personal coaching session, not an AI chatbot.
 * - Card-based content presentation
 * - Guided prompts and exercises
 * - Journal-style reflection inputs
 */
const ReppyCoach = () => {
  const { navigate } = useAppServices();
  const {
    loading,
    currentSessionData,
    progress,
    // profile - available for personalization
    onboardingComplete,
    streak,
    completeSession,
    completeOnboarding,
    toggleBookmark,
    bookmarks,
  } = useReppyProgress();

  // Flow states
  const [phase, setPhase] = useState('welcome');
  const [userInput, setUserInput] = useState('');
  const [sessionResponses, setSessionResponses] = useState({});
  const [onboardingData, setOnboardingData] = useState({});
  const [showResources, setShowResources] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const inputRef = useRef(null);
  const hasInitialized = useRef(false);

  const session = currentSessionData?.session;
  const weekData = currentSessionData;

  // Initialize
  useEffect(() => {
    if (loading || hasInitialized.current) return;
    hasInitialized.current = true;
    
    if (!onboardingComplete) {
      setPhase('onboarding-intro');
    } else {
      setPhase('welcome');
    }
  }, [loading, onboardingComplete]);

  // Focus input when phase changes
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [phase]);

  // Transition helper
  const transitionTo = useCallback((nextPhase, delay = 400) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setPhase(nextPhase);
      setUserInput('');
      setIsTransitioning(false);
    }, delay);
  }, []);

  // Handle text submission
  const handleSubmit = useCallback(async () => {
    if (!userInput.trim()) return;
    const value = userInput.trim();

    // Onboarding flow
    if (phase === 'onboarding-name') {
      setOnboardingData(prev => ({ ...prev, preferredName: value }));
      transitionTo('onboarding-role');
    } else if (phase === 'onboarding-role') {
      setOnboardingData(prev => ({ ...prev, role: value }));
      transitionTo('onboarding-context');
    } else if (phase === 'onboarding-context') {
      setOnboardingData(prev => ({ ...prev, context: value }));
      transitionTo('onboarding-challenge');
    } else if (phase === 'onboarding-challenge') {
      setOnboardingData(prev => ({ ...prev, biggestChallenge: value }));
      transitionTo('onboarding-goals');
    } else if (phase === 'onboarding-goals') {
      const finalData = { ...onboardingData, goals: value };
      try {
        await completeOnboarding(finalData);
        transitionTo('onboarding-complete');
      } catch (err) {
        console.error('[Reppy] Error saving:', err);
      }
    }
    // Session flow
    else if (phase === 'checkin') {
      setSessionResponses(prev => ({ ...prev, checkInResponse: value }));
      transitionTo('learning');
    } else if (phase === 'reflection') {
      const sessionData = { ...sessionResponses, reflectionResponse: value };
      try {
        await completeSession(sessionData);
        transitionTo('complete');
      } catch (err) {
        console.error('[Reppy] Error:', err);
      }
    }
  }, [userInput, phase, onboardingData, sessionResponses, completeOnboarding, completeSession, transitionTo]);

  const handleToggleBookmark = useCallback(() => {
    if (currentSessionData) {
      toggleBookmark(currentSessionData.sessionNumber);
    }
  }, [currentSessionData, toggleBookmark]);

  const isBookmarked = bookmarks.includes(currentSessionData?.sessionNumber);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-rep-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-corporate-teal rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-rep-text-secondary">Preparing your session...</p>
        </div>
      </div>
    );
  }

  // Journey complete
  if (!session && onboardingComplete) {
    return (
      <div className="min-h-screen bg-rep-warm-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-corporate-teal to-corporate-navy rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-corporate-navy mb-2">Congratulations!</h2>
          <p className="text-rep-text-secondary mb-6">You've completed all available sessions. More content coming soon.</p>
          <button
            onClick={() => navigate('dashboard')}
            className="px-8 py-3 bg-corporate-teal text-white rounded-xl font-medium hover:bg-corporate-teal-dark transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isOnboarding = phase.startsWith('onboarding-');
  const needsInput = ['onboarding-name', 'onboarding-role', 'onboarding-context', 'onboarding-challenge', 'onboarding-goals', 'checkin', 'reflection'].includes(phase);

  return (
    <div className="min-h-screen bg-rep-warm-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <button 
            onClick={() => navigate('ai-coach')}
            className="p-2 -ml-2 text-rep-text-secondary hover:text-corporate-navy transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h1 className="font-semibold text-corporate-navy">
              {isOnboarding ? 'Welcome to Reppy' : `Week ${weekData?.week || 1}`}
            </h1>
            {!isOnboarding && session && (
              <p className="text-xs text-rep-text-secondary">{weekData?.weekTheme}</p>
            )}
          </div>

          {!isOnboarding ? (
            <button 
              onClick={handleToggleBookmark}
              className="p-2 -mr-2 text-rep-text-secondary hover:text-corporate-teal transition-colors"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-corporate-teal" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* Progress - only for sessions */}
        {!isOnboarding && (
          <div className="px-4 pb-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-between text-xs text-rep-text-secondary mb-1.5">
              <span>Session {progress.completed + 1} of {progress.total}</span>
              {streak.current > 0 && (
                <span className="flex items-center gap-1 text-corporate-orange">
                  <Flame className="w-3.5 h-3.5" />
                  {streak.current} day streak
                </span>
              )}
            </div>
            <div className="h-1.5 bg-rep-teal-light rounded-full overflow-hidden">
              <div 
                className="h-full bg-corporate-teal rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${needsInput ? 'pb-32' : 'pb-8'}`}>
        <div className={`max-w-2xl mx-auto px-4 py-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          
          {/* ==================== ONBOARDING PHASES ==================== */}
          
          {phase === 'onboarding-intro' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-corporate-teal to-corporate-navy rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-corporate-navy">Hi, I'm Reppy</h2>
                    <p className="text-sm text-rep-text-secondary">Your leadership coach</p>
                  </div>
                </div>
                
                <p className="text-rep-text-primary leading-relaxed mb-4">
                  I'm here to guide you through a personalized leadership development journey. 
                  Over the coming weeks, we'll work together through short daily sessions focused on 
                  building the skills that matter most to you.
                </p>
                
                <div className="bg-rep-teal-light/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-corporate-teal/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🧠</span>
                    </div>
                    <div>
                      <p className="font-medium text-corporate-navy text-sm">I remember our conversations</p>
                      <p className="text-xs text-rep-text-secondary">Building on what we learn together</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-corporate-teal/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">⏱️</span>
                    </div>
                    <div>
                      <p className="font-medium text-corporate-navy text-sm">~10 minutes per session</p>
                      <p className="text-xs text-rep-text-secondary">Quick, focused, and practical</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-corporate-teal/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎯</span>
                    </div>
                    <div>
                      <p className="font-medium text-corporate-navy text-sm">52 weeks of growth</p>
                      <p className="text-xs text-rep-text-secondary">Go at your own pace, no pressure</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => transitionTo('onboarding-name')}
                className="w-full py-4 bg-corporate-teal text-white rounded-xl font-medium
                           hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
              >
                Let's Get Started
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {phase === 'onboarding-name' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-rep-teal-light rounded-xl flex items-center justify-center mb-4">
                  <User className="w-5 h-5 text-corporate-teal" />
                </div>
                <h2 className="text-xl font-semibold text-corporate-navy mb-2">What should I call you?</h2>
                <p className="text-rep-text-secondary">
                  First name or nickname — whatever feels right.
                </p>
              </div>
            </div>
          )}

          {phase === 'onboarding-role' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-corporate-teal font-medium mb-2">Nice to meet you, {onboardingData.preferredName}! 👋</p>
                <h2 className="text-xl font-semibold text-corporate-navy mb-2">Tell me about your role</h2>
                <p className="text-rep-text-secondary">
                  Are you a manager, team lead, executive, individual contributor, or something else? 
                  This helps me tailor examples to your world.
                </p>
              </div>
            </div>
          )}

          {phase === 'onboarding-context' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-corporate-teal font-medium mb-2">Got it — {onboardingData.role}</p>
                <h2 className="text-xl font-semibold text-corporate-navy mb-2">A bit more context</h2>
                <p className="text-rep-text-secondary">
                  How many people do you work with or lead? And roughly how much leadership experience do you have?
                </p>
                <p className="text-xs text-rep-text-secondary mt-2 italic">
                  (e.g., "Team of 8, about 3 years" or "New to leadership")
                </p>
              </div>
            </div>
          )}

          {phase === 'onboarding-challenge' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-corporate-teal font-medium mb-2">Thanks for sharing</p>
                <h2 className="text-xl font-semibold text-corporate-navy mb-2">What's your biggest challenge right now?</h2>
                <p className="text-rep-text-secondary">
                  Difficult conversations? Delegation? Building trust? Time management? 
                  What keeps you up at night as a leader?
                </p>
              </div>
            </div>
          )}

          {phase === 'onboarding-goals' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-corporate-teal font-medium mb-2">"{onboardingData.biggestChallenge}" — we'll work on that</p>
                <h2 className="text-xl font-semibold text-corporate-navy mb-2">What does success look like?</h2>
                <p className="text-rep-text-secondary">
                  After going through this program, what do you hope to achieve? 
                  How do you want to grow as a leader?
                </p>
              </div>
            </div>
          )}

          {phase === 'onboarding-complete' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-rep-teal-light rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-corporate-teal" />
                </div>
                <h2 className="text-xl font-semibold text-corporate-navy mb-4">
                  I've got a picture of you, {onboardingData.preferredName}
                </h2>
                
                <div className="bg-rep-navy-light rounded-xl p-4 space-y-2 mb-4">
                  <p className="text-sm"><span className="font-medium text-corporate-navy">Role:</span> <span className="text-rep-text-secondary">{onboardingData.role}</span></p>
                  <p className="text-sm"><span className="font-medium text-corporate-navy">Context:</span> <span className="text-rep-text-secondary">{onboardingData.context}</span></p>
                  <p className="text-sm"><span className="font-medium text-corporate-navy">Focus:</span> <span className="text-rep-text-secondary">{onboardingData.biggestChallenge}</span></p>
                  <p className="text-sm"><span className="font-medium text-corporate-navy">Goals:</span> <span className="text-rep-text-secondary">{onboardingData.goals}</span></p>
                </div>
                
                <p className="text-rep-text-primary">
                  I'll keep all this in mind as we work together. When topics relate to your challenges, 
                  I'll make the connection. Let's start building!
                </p>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-corporate-teal text-white rounded-xl font-medium
                           hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                Begin First Session
              </button>
            </div>
          )}

          {/* ==================== SESSION PHASES ==================== */}
          
          {phase === 'welcome' && session && (
            <div className="space-y-6">
              {/* Session Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-corporate-teal font-medium mb-3">
                  <span className="px-2 py-0.5 bg-rep-teal-light rounded-full">{weekData?.phase?.name}</span>
                  <span>•</span>
                  <span>Session {currentSessionData?.dayInWeek}</span>
                </div>
                
                <h2 className="text-xl font-semibold text-corporate-navy mb-2">{session.title}</h2>
                <p className="text-rep-text-secondary text-sm mb-4">{weekData?.weekTheme}</p>
                
                {weekData?.keyInsight && (
                  <div className="bg-rep-navy-light rounded-xl p-4 border-l-4 border-corporate-navy">
                    <p className="text-sm text-rep-text-primary italic">"{weekData.keyInsight}"</p>
                  </div>
                )}
              </div>

              {/* Resources */}
              {weekData?.resources?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100">
                  <button
                    onClick={() => setShowResources(!showResources)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-corporate-navy">
                      <BookOpen className="w-4 h-4" />
                      Recommended Resources
                    </span>
                    <ChevronRight className={`w-4 h-4 text-rep-text-secondary transition-transform ${showResources ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {showResources && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                      {weekData.resources.map((resource, i) => (
                        <div key={i} className="flex items-start gap-3">
                          {resource.type === 'video' ? (
                            <Play className="w-4 h-4 text-corporate-teal mt-0.5" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-corporate-teal mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-corporate-navy">{resource.title}</p>
                            {resource.author && (
                              <p className="text-xs text-rep-text-secondary">by {resource.author}</p>
                            )}
                            {resource.url && (
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-corporate-teal hover:underline mt-1"
                              >
                                Watch <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => transitionTo('checkin')}
                className="w-full py-4 bg-corporate-teal text-white rounded-xl font-medium
                           hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
              >
                Start Session
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {phase === 'checkin' && session && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-corporate-orange font-medium mb-3">
                  <span className="w-6 h-6 bg-rep-coral-light rounded-full flex items-center justify-center text-xs">1</span>
                  Check-In
                </div>
                <h2 className="text-xl font-semibold text-corporate-navy mb-3">{session.checkIn}</h2>
                <p className="text-sm text-rep-text-secondary">
                  Take a moment to reflect before we dive in.
                </p>
              </div>
            </div>
          )}

          {phase === 'learning' && session && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-corporate-teal font-medium mb-3">
                  <span className="w-6 h-6 bg-rep-teal-light rounded-full flex items-center justify-center text-xs">2</span>
                  Today's Insight
                </div>
                <div className="prose prose-sm max-w-none text-rep-text-primary">
                  {session.content.split('\n\n').map((para, i) => (
                    <p key={i} className={i > 0 ? 'mt-3' : ''}>{para}</p>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => transitionTo('practice')}
                className="w-full py-4 bg-corporate-teal text-white rounded-xl font-medium
                           hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
              >
                Continue to Practice
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {phase === 'practice' && session && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-corporate-navy font-medium mb-3">
                  <span className="w-6 h-6 bg-rep-navy-light rounded-full flex items-center justify-center text-xs">3</span>
                  Your Practice
                </div>
                <div className="bg-rep-navy-light rounded-xl p-4 mb-4">
                  <p className="text-rep-text-primary font-medium">{session.practice}</p>
                </div>
                <p className="text-sm text-rep-text-secondary">
                  Real growth happens when you apply what you learn. Commit to this before moving on.
                </p>
              </div>
              
              <button
                onClick={() => transitionTo('reflection')}
                className="w-full py-4 bg-corporate-teal text-white rounded-xl font-medium
                           hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
              >
                I'll Do This — Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {phase === 'reflection' && session && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-corporate-orange font-medium mb-3">
                  <span className="w-6 h-6 bg-rep-coral-light rounded-full flex items-center justify-center text-xs">4</span>
                  Reflection
                </div>
                <h2 className="text-xl font-semibold text-corporate-navy mb-3">{session.reflection}</h2>
                <p className="text-sm text-rep-text-secondary">
                  Capture your thoughts. This is for you — there's no wrong answer.
                </p>
              </div>
            </div>
          )}

          {phase === 'complete' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-rep-teal-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-corporate-teal" />
                </div>
                <h2 className="text-xl font-semibold text-corporate-navy mb-2">Session Complete!</h2>
                <p className="text-rep-text-secondary mb-4">
                  You've completed session {currentSessionData?.sessionNumber} of {currentSessionData?.totalSessions}.
                </p>
                
                {weekData?.keyInsight && (
                  <div className="bg-rep-navy-light rounded-xl p-4 mb-4 text-left">
                    <p className="text-xs text-rep-text-secondary uppercase tracking-wide mb-1">Key Takeaway</p>
                    <p className="text-sm text-rep-text-primary italic">"{weekData.keyInsight}"</p>
                  </div>
                )}

                {streak.current > 1 && (
                  <div className="flex items-center justify-center gap-2 text-corporate-orange mb-4">
                    <Flame className="w-5 h-5" />
                    <span className="font-medium">{streak.current} day streak!</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => navigate('ai-coach')}
                className="w-full py-4 bg-corporate-teal text-white rounded-xl font-medium
                           hover:bg-corporate-teal-dark transition-colors"
              >
                Done for Today
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Input Footer - Journal style */}
      {needsInput && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-100 p-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={
                    phase === 'onboarding-name' ? "Your name..." :
                    phase === 'onboarding-role' ? "e.g., Engineering Manager, Team Lead..." :
                    phase === 'onboarding-context' ? "e.g., Team of 6, 2 years experience..." :
                    phase === 'onboarding-challenge' ? "What's challenging you most..." :
                    phase === 'onboarding-goals' ? "What do you want to achieve..." :
                    phase === 'checkin' ? "Share your thoughts..." : 
                    "Write your reflection..."
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-rep-navy-light rounded-xl text-sm text-rep-text-primary
                             placeholder:text-rep-text-secondary/60 resize-none
                             focus:outline-none focus:ring-2 focus:ring-corporate-teal/30 focus:bg-white
                             transition-all"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                  userInput.trim() 
                    ? 'bg-corporate-teal text-white hover:bg-corporate-teal-dark' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-center text-rep-text-secondary mt-2">
              Press Enter to submit
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default ReppyCoach;
