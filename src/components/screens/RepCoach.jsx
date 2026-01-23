// src/components/screens/RepCoach.jsx
// Main Rep AI Coach screen - orchestrates the coaching experience
// UPDATED: Now integrates with real useDailyPlan data and time-aware flow

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, MoreVertical, Sparkles, Sun, Moon, CheckCircle2, Coffee, Book, MessageCircle } from 'lucide-react';
import RepAvatar from '../rep/RepAvatar';
import RepMessage from '../rep/RepMessage';
import RepCohortPulse from '../rep/RepCohortPulse';
import RepBookendWidget from '../rep/RepBookendWidget';
import RepSessionComplete from '../rep/RepSessionComplete';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';

/**
 * RepCoach - The AI Leadership Coach experience
 * 
 * REAL DATA INTEGRATION (v2):
 * - Uses useDailyPlan hook for actual curriculum data
 * - Time-aware: AM Bookend (morning), Daily Reps (midday), PM Bookend (evening)
 * - Shows what's actually due today
 * - Coaches on user responses after completion
 * - Leadership questions phase before releasing to app
 * 
 * SESSION FLOW:
 * 1. Greeting (time-aware)
 * 2. Cohort pulse (community awareness)
 * 3. Guide through what's due:
 *    - Morning (5am-11am): AM Bookend focus
 *    - Midday (11am-5pm): Daily Reps focus  
 *    - Evening (5pm-11pm): PM Bookend focus
 * 4. Coaching reflection after completion
 * 5. Leadership questions opportunity
 * 6. Release to explore app
 */
const RepCoach = () => {
  const { user, navigate } = useAppServices();
  
  // Real data from useDailyPlan
  const {
    loading: dailyPlanLoading,
    currentDayData,
    currentPhase,
    phaseDayNumber,
    prepRequirementsComplete,
    toggleItemComplete,
    cohortData
  } = useDailyPlan();

  // Session flow states
  // intro -> cohort -> guidance -> am_bookend -> daily_reps -> pm_bookend -> coaching -> questions -> complete
  const [sessionState, setSessionState] = useState('intro');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [sessionStartTime] = useState(new Date());
  const messagesEndRef = useRef(null);
  
  // Track what's been completed in this session
  const [sessionCompletions, setSessionCompletions] = useState({
    amBookend: false,
    dailyReps: false,
    pmBookend: false
  });

  const firstName = user?.displayName?.split(' ')[0] || 'Leader';
  
  // Time-of-day awareness
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'midday';
    if (hour >= 17 && hour < 23) return 'evening';
    return 'night'; // 11pm-5am
  }, []);
  
  const greeting = useMemo(() => {
    switch (timeOfDay) {
      case 'morning': return 'Good morning';
      case 'midday': return 'Good afternoon';
      case 'evening': return 'Good evening';
      default: return "Hey there, night owl";
    }
  }, [timeOfDay]);
  
  // Determine what's most relevant based on time (for future use)
  // const currentFocus = useMemo(() => {
  //   if (timeOfDay === 'morning') return 'am_bookend';
  //   if (timeOfDay === 'midday') return 'daily_reps';
  //   if (timeOfDay === 'evening') return 'pm_bookend';
  //   return 'daily_reps'; // Default for night owls
  // }, [timeOfDay]);
  
  // Get daily reps from currentDayData
  const dailyReps = useMemo(() => {
    if (!currentDayData?.actions) return [];
    return currentDayData.actions.filter(a => a.type === 'daily_rep');
  }, [currentDayData]);
  
  // Phase display info
  const phaseDisplay = useMemo(() => {
    if (!currentPhase) return { name: 'Loading...', day: '' };
    
    if (currentPhase.id === 'pre-start') {
      const complete = prepRequirementsComplete?.allComplete;
      return {
        name: 'Preparation Phase',
        day: complete ? 'Ready to Start!' : `${prepRequirementsComplete?.completedCount || 0}/${prepRequirementsComplete?.totalCount || 0} Complete`,
        isPrep: true,
        prepComplete: complete
      };
    }
    
    return {
      name: currentPhase.displayName || currentPhase.name,
      day: `Day ${phaseDayNumber}`,
      isPrep: false
    };
  }, [currentPhase, phaseDayNumber, prepRequirementsComplete]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Simulate Rep typing delay
  const addRepMessage = useCallback((content, delay = 1000, widget = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        sender: 'rep', 
        content,
        widget,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, delay);
  }, []);

  // Get coaching message based on what was just completed
  const getCoachingMessage = useCallback((completedItem) => {
    const messages = {
      am_bookend: [
        `Powerful intentions, ${firstName}! 🌟 Setting your focus for the day is what separates reactive managers from proactive leaders.`,
        `I love those morning wins you've set. Remember: small daily commitments compound into transformational change.`,
        `Great start to your day! These intentional moments of clarity are building your leadership muscle.`
      ],
      daily_reps: [
        `Excellent work on your reps today! Each one is strengthening your leadership capacity.`,
        `Those daily reps might seem small, but they're rewiring how you show up as a leader.`,
        `Nice! Consistency with your reps is what builds lasting leadership habits.`
      ],
      pm_bookend: [
        `What a thoughtful reflection. Learning from each day is how leaders evolve.`,
        `Capturing those insights is gold. You're building a leadership journal that will be invaluable.`,
        `Beautiful way to close your day. Rest well - you've earned it.`
      ]
    };
    
    const options = messages[completedItem] || messages.daily_reps;
    return options[Math.floor(Math.random() * options.length)];
  }, [firstName]);

  // Initialize conversation based on time of day and current state
  useEffect(() => {
    if (dailyPlanLoading) return;
    
    // Time-aware greeting with context
    let contextMessage = "";
    if (currentPhase?.id === 'pre-start') {
      if (prepRequirementsComplete?.allComplete) {
        contextMessage = `You've completed all your prep work! While you wait for your cohort to begin, let's keep building those leadership habits.`;
      } else {
        contextMessage = `You're in the preparation phase. Let's get you ready for your leadership journey!`;
      }
    } else {
      contextMessage = `It's ${phaseDisplay.day} of your ${phaseDisplay.name} journey.`;
    }
    
    setTimeout(() => {
      setMessages([{
        sender: 'rep',
        content: `${greeting}, ${firstName}! 👋\n\n${contextMessage}\n\nReady for today's session?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 500);

    // Follow-up with cohort info after delay
    setTimeout(() => {
      addRepMessage(
        "Before we dive in, here's how your cohort is doing. You're part of a community of leaders growing together!",
        1500,
        'cohort-pulse'
      );
      setSessionState('cohort');
    }, 2500);
  }, [dailyPlanLoading, firstName, greeting, phaseDisplay, currentPhase, prepRequirementsComplete, addRepMessage]);

  // Proceed to leadership questions phase
  const proceedToQuestions = useCallback(() => {
    setSessionState('questions');
    addRepMessage(
      `Great progress, ${firstName}! 🙌\n\nBefore I let you go, do you have any leadership questions or challenges you're facing? I'm here to help.`,
      1500
    );
  }, [firstName, addRepMessage]);

  // Handle widget completion and guide to next item
  const handleCohortContinue = useCallback(() => {
    // Determine what to guide them to based on time of day
    let nextWidget = null;
    let message = "";
    
    if (timeOfDay === 'morning') {
      message = "Perfect time to set your intentions for the day. Let's do your AM Bookend - this takes about 2 minutes.";
      nextWidget = 'morning-bookend';
      setSessionState('am_bookend');
    } else if (timeOfDay === 'midday') {
      if (dailyReps.length > 0) {
        const incompleteReps = dailyReps.filter(r => !r.isCompleted);
        if (incompleteReps.length > 0) {
          message = `Let's check in on your daily reps. You have ${incompleteReps.length} rep${incompleteReps.length > 1 ? 's' : ''} to complete today.`;
          nextWidget = 'daily-reps';
          setSessionState('daily_reps');
        } else {
          message = "Amazing - you've already completed your daily reps! 🎉 Let's see if there's anything else to work on.";
          setSessionState('coaching');
          setTimeout(() => proceedToQuestions(), 2000);
        }
      } else {
        message = "No specific reps scheduled for today. Let's check on your bookends instead.";
        nextWidget = 'morning-bookend';
        setSessionState('am_bookend');
      }
    } else if (timeOfDay === 'evening') {
      message = "Evening is perfect for reflection. Let's capture your wins and learnings from today.";
      nextWidget = 'evening-bookend';
      setSessionState('pm_bookend');
    } else {
      // Night owl - offer both options
      message = "Night owl session! Let's make sure your day is properly closed out.";
      nextWidget = 'evening-bookend';
      setSessionState('pm_bookend');
    }
    
    addRepMessage(message, 1000, nextWidget);
  }, [timeOfDay, dailyReps, addRepMessage, proceedToQuestions]);

  const handleBookendComplete = useCallback(() => {
    const isAM = sessionState === 'am_bookend';
    
    // Mark completion in session
    setSessionCompletions(prev => ({
      ...prev,
      [isAM ? 'amBookend' : 'pmBookend']: true
    }));
    
    // Get coaching message
    const coachingMsg = getCoachingMessage(isAM ? 'am_bookend' : 'pm_bookend');
    addRepMessage(coachingMsg, 1500);

    // Proceed to next stage
    setTimeout(() => {
      if (isAM && dailyReps.length > 0 && timeOfDay !== 'morning') {
        // After AM bookend, suggest daily reps if it's past morning
        const incompleteReps = dailyReps.filter(r => !r.isCompleted);
        if (incompleteReps.length > 0) {
          addRepMessage(
            `Now let's tackle your daily reps. You have ${incompleteReps.length} to complete.`,
            2000,
            'daily-reps'
          );
          setSessionState('daily_reps');
        } else {
          proceedToQuestions();
        }
      } else {
        proceedToQuestions();
      }
    }, 3000);
  }, [sessionState, dailyReps, timeOfDay, getCoachingMessage, addRepMessage, proceedToQuestions]);

  const handleDailyRepsComplete = useCallback(() => {
    setSessionCompletions(prev => ({ ...prev, dailyReps: true }));
    
    const coachingMsg = getCoachingMessage('daily_reps');
    addRepMessage(coachingMsg, 1500);
    
    setTimeout(() => {
      // If evening, suggest PM bookend
      if (timeOfDay === 'evening' && !sessionCompletions.pmBookend) {
        addRepMessage(
          "Since it's evening, let's also do your daily reflection.",
          2000,
          'evening-bookend'
        );
        setSessionState('pm_bookend');
      } else {
        proceedToQuestions();
      }
    }, 3000);
  }, [timeOfDay, sessionCompletions.pmBookend, getCoachingMessage, addRepMessage, proceedToQuestions]);

  // Handle user text input
  const handleSendMessage = useCallback(() => {
    if (!userInput.trim()) return;

    setMessages(prev => [...prev, {
      sender: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    const input = userInput.toLowerCase();
    setUserInput('');

    // Context-aware responses
    if (sessionState === 'questions') {
      // Leadership question handling
      if (input.includes('delegation') || input.includes('delegate')) {
        addRepMessage(
          `Great question about delegation! Here's a quick framework:\n\n1. **What** - Be crystal clear on the outcome\n2. **Who** - Match task to person's strengths\n3. **Why** - Share context, not just tasks\n4. **When** - Set clear deadlines\n5. **How** - Agree on check-in points\n\nWant me to add a delegation rep to your practice?`,
          2000
        );
      } else if (input.includes('feedback') || input.includes('difficult conversation')) {
        addRepMessage(
          `Difficult conversations are a core leadership skill. Try the SBI model:\n\n• **Situation** - "In yesterday's meeting..."\n• **Behavior** - "I noticed you interrupted twice"\n• **Impact** - "This made the team hesitant to share"\n\nWould you like to practice this before a real conversation?`,
          2000
        );
      } else if (input.includes('time') || input.includes('busy') || input.includes('overwhelmed')) {
        addRepMessage(
          `Feeling overwhelmed is common for leaders. Remember:\n\n• Your calendar reflects your priorities\n• "No" to one thing means "Yes" to another\n• Leadership isn't about doing more, it's about doing what matters\n\nWhat's one thing you could delegate or eliminate this week?`,
          2000
        );
      } else if (input.includes('skip') || input.includes('not today') || input.includes('no')) {
        addRepMessage(
          `No problem at all. Your app is ready whenever you want to explore more.\n\nRemember: even small daily actions compound into big results. I'll be here when you need me!`,
          1500
        );
        setTimeout(() => setSessionState('complete'), 3000);
      } else if (input.includes('done') || input.includes('finish') || input.includes('go') || input.includes('explore')) {
        addRepMessage(
          `Perfect! Your dashboard is all set. Go explore, complete your reps, and I'll check in later.\n\nRemember: you've got this! 💪`,
          1500
        );
        setTimeout(() => setSessionState('complete'), 3000);
      } else if (input.length > 10) {
        // Longer question - give thoughtful response
        addRepMessage(
          `That's a thoughtful question. Here's what I'd suggest:\n\n1. Start with curiosity, not judgment\n2. Focus on behaviors you can observe\n3. Remember that most people want to do good work\n\nWould you like to dive deeper into this topic, or are you ready to explore your dashboard?`,
          2000
        );
      } else {
        // Short or unclear input
        addRepMessage(
          `I'm here to help with any leadership challenges. You can ask about:\n\n• Delegation & empowerment\n• Difficult conversations\n• Time management\n• Team motivation\n• Or just say "I'm done" to explore your app!`,
          1500
        );
      }
    } else {
      // Non-questions state - simple acknowledgments
      if (input.includes('help') || input.includes('confused')) {
        addRepMessage(
          "I'm here to guide you through your daily leadership development. Let me know if anything is unclear!",
          1500
        );
      } else if (input.includes('thank')) {
        addRepMessage(
          `You're welcome, ${firstName}! That's what I'm here for. 💪`,
          1000
        );
      } else {
        addRepMessage(
          "I hear you. Let's keep going - you're making great progress!",
          1200
        );
      }
    }
  }, [userInput, sessionState, firstName, addRepMessage]);

  // Calculate session duration
  const getSessionMinutes = useCallback(() => {
    return Math.round((new Date() - sessionStartTime) / 60000) || 1;
  }, [sessionStartTime]);

  // Loading state
  if (dailyPlanLoading) {
    return (
      <div className="min-h-screen bg-rep-warm-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RepAvatar size="lg" />
          <p className="text-rep-text-secondary animate-pulse">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Show completion screen
  if (sessionState === 'complete') {
    return (
      <div className="min-h-screen bg-rep-warm-white">
        <RepSessionComplete
          userName={firstName}
          streak={7} // TODO: Get from user data via useDashboard
          sessionMinutes={getSessionMinutes()}
          cohortPosition={cohortData ? "You're part of an active cohort!" : "Solo journey - building strong habits!"}
          nextSessionPreview={phaseDisplay.isPrep 
            ? "Complete your prep items to unlock the full program" 
            : `Tomorrow: ${phaseDisplay.name} continues`}
          onContinue={() => navigate('dashboard')}
          onViewApp={() => navigate('dashboard')}
        />
      </div>
    );
  }

  // Get time-of-day icon
  const TimeIcon = timeOfDay === 'morning' ? Sun : timeOfDay === 'evening' ? Moon : Coffee;

  return (
    <div className="min-h-screen bg-rep-warm-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate('dashboard')}
            className="p-2 -ml-2 text-rep-text-secondary hover:text-rep-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <RepAvatar size="sm" />
            <div>
              <h1 className="font-semibold text-rep-text-primary text-sm">Rep</h1>
              <p className="text-xs text-rep-text-secondary">Your Leadership Coach</p>
            </div>
          </div>

          <button className="p-2 -mr-2 text-rep-text-secondary hover:text-rep-text-primary transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* System message with real day info */}
          <RepMessage 
            sender="system" 
            content={
              <span className="flex items-center gap-2">
                <TimeIcon className="w-4 h-4" />
                {phaseDisplay.day} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            } 
          />

          {/* Conversation */}
          {messages.map((msg, index) => (
            <RepMessage
              key={index}
              sender={msg.sender}
              content={msg.content}
              timestamp={msg.timestamp}
            >
              {/* Embedded Widgets */}
              {msg.widget === 'cohort-pulse' && (
                <div className="mt-3">
                  <RepCohortPulse
                    cohortName={cohortData?.name || "Leadership Community"}
                    activeLeaders={cohortData?.memberCount || 12}
                    totalLeaders={cohortData?.memberCount || 15}
                    todayCompletions={5}
                    weeklyWins={23}
                    topFocus={currentPhase?.id === 'pre-start' ? "Preparation" : "Leadership Foundations"}
                    nextEvent={cohortData?.nextSession || "Community learning ongoing"}
                  />
                  <button
                    onClick={handleCohortContinue}
                    className="mt-3 w-full py-2.5 bg-corporate-teal text-white rounded-lg font-medium text-sm
                               hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Let's Get Started
                  </button>
                </div>
              )}

              {msg.widget === 'morning-bookend' && (
                <div className="mt-3">
                  <RepBookendWidget
                    type="morning"
                    userName={firstName}
                    onComplete={handleBookendComplete}
                  />
                </div>
              )}

              {msg.widget === 'evening-bookend' && (
                <div className="mt-3">
                  <RepBookendWidget
                    type="evening"
                    userName={firstName}
                    onComplete={handleBookendComplete}
                  />
                </div>
              )}

              {msg.widget === 'daily-reps' && (
                <div className="mt-3 space-y-2">
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <h4 className="font-medium text-rep-text-primary mb-3 flex items-center gap-2">
                      <Book className="w-4 h-4 text-corporate-teal" />
                      Today's Leadership Reps
                    </h4>
                    {dailyReps.length > 0 ? (
                      <div className="space-y-2">
                        {dailyReps.map((rep) => (
                          <div 
                            key={rep.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              rep.isCompleted 
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                            }`}
                            onClick={() => !rep.isCompleted && toggleItemComplete(rep.id)}
                          >
                            <CheckCircle2 className={`w-5 h-5 ${
                              rep.isCompleted ? 'text-green-500' : 'text-gray-300'
                            }`} />
                            <span className={rep.isCompleted ? 'line-through opacity-75' : ''}>
                              {rep.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-rep-text-secondary text-sm">
                        No specific reps for today. Focus on your bookends!
                      </p>
                    )}
                    <button
                      onClick={handleDailyRepsComplete}
                      className="mt-4 w-full py-2.5 bg-corporate-teal text-white rounded-lg font-medium text-sm
                                 hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </RepMessage>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <RepMessage sender="rep" isTyping={true} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={sessionState === 'questions' 
                ? "Ask a leadership question or say 'done' to explore..." 
                : "Type a message to Rep..."}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-corporate-teal/30 focus:bg-white
                         transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim()}
              className={`p-3 rounded-xl transition-all ${
                userInput.trim() 
                  ? 'bg-corporate-teal text-white hover:bg-corporate-teal-dark' 
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {sessionState === 'questions' ? (
                <MessageCircle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-center text-rep-text-secondary mt-2">
            {sessionState === 'questions' 
              ? "Ask about delegation, feedback, time management, or any leadership challenge"
              : "Rep is here to guide your leadership journey"}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RepCoach;
