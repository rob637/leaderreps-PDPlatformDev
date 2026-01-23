// src/components/screens/RepCoach.jsx
// Rep AI Coach - Intelligent overlay that guides users through their dashboard
// V4: Simplified - guides to dashboard instead of duplicating widgets

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, MoreVertical, Sparkles, Sun, Moon, Coffee, 
  MessageCircle, ExternalLink, CheckCircle2
} from 'lucide-react';
import RepAvatar from '../rep/RepAvatar';
import RepMessage from '../rep/RepMessage';
import RepCohortPulse from '../rep/RepCohortPulse';
import RepSessionComplete from '../rep/RepSessionComplete';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';

/**
 * RepCoach - The AI Leadership Coach experience (V4 - Simplified)
 * 
 * Rep is an INTELLIGENT OVERLAY that:
 * - Greets users with context (time of day, phase, progress)
 * - Shows cohort pulse (community awareness)  
 * - Guides users on WHAT to do next
 * - NAVIGATES them to Dashboard to complete items
 * - Offers coaching reflections and Q&A
 * 
 * Rep does NOT duplicate dashboard widgets - it guides TO them.
 */
const RepCoach = () => {
  const { user, navigate, dailyPracticeData } = useAppServices();
  
  const {
    loading: dailyPlanLoading,
    currentDayData,
    currentPhase,
    phaseDayNumber,
    prepRequirementsComplete,
    cohortData
  } = useDailyPlan();

  // Session flow states
  const [sessionState, setSessionState] = useState('intro');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [sessionStartTime] = useState(new Date());
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const firstName = user?.displayName?.split(' ')[0] || 'Leader';
  
  // Time-of-day awareness
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'midday';
    if (hour >= 17 && hour < 23) return 'evening';
    return 'night';
  }, []);
  
  const greeting = useMemo(() => {
    switch (timeOfDay) {
      case 'morning': return 'Good morning';
      case 'midday': return 'Good afternoon';
      case 'evening': return 'Good evening';
      default: return "Hey there, night owl";
    }
  }, [timeOfDay]);

  // Phase info
  const isPrep = currentPhase?.id === 'pre-start';
  const prepComplete = prepRequirementsComplete?.allComplete;
  
  // Get incomplete items count
  const allActions = currentDayData?.actions || [];
  const incompleteCount = allActions.filter(a => !a.isCompleted).length;
  const dailyReps = allActions.filter(a => a.type === 'daily_rep');
  const incompleteDailyReps = dailyReps.filter(r => !r.isCompleted).length;

  // Check bookend completion
  const amBookendComplete = useMemo(() => {
    const mb = dailyPracticeData?.morningBookend;
    return mb?.wins?.some(w => w.text?.trim() && w.saved);
  }, [dailyPracticeData]);

  const pmBookendComplete = useMemo(() => {
    const eb = dailyPracticeData?.eveningBookend;
    return !!(eb?.completedAt && (eb?.good || eb?.better || eb?.best));
  }, [dailyPracticeData]);
  
  // Phase display
  const phaseDisplay = useMemo(() => {
    if (!currentPhase) return { name: 'Loading...', day: '' };
    
    if (isPrep) {
      return {
        name: 'Preparation Phase',
        day: prepComplete 
          ? 'Ready to Start!' 
          : `${prepRequirementsComplete?.completedCount || 0}/${prepRequirementsComplete?.totalCount || 0} Complete`
      };
    }
    
    return {
      name: currentPhase.displayName || currentPhase.name,
      day: `Day ${phaseDayNumber}`
    };
  }, [currentPhase, phaseDayNumber, prepRequirementsComplete, isPrep, prepComplete]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Add Rep message with typing delay
  const addRepMessage = useCallback((content, delay = 1000, widget = null, data = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        sender: 'rep', 
        content,
        widget,
        data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, delay);
  }, []);

  // Build the "what to do" message based on state
  const getNextStepMessage = useCallback(() => {
    if (isPrep && !prepComplete) {
      const remaining = prepRequirementsComplete?.remaining?.length || 0;
      return {
        message: `You have **${remaining} prep item${remaining !== 1 ? 's' : ''}** to complete before your cohort begins.\n\nHead to your Dashboard to complete your **Leader Profile** and **Baseline Assessment**.`,
        cta: 'Go to Dashboard'
      };
    }

    // Foundation phase - time-based guidance
    if (timeOfDay === 'morning') {
      if (!amBookendComplete) {
        return {
          message: `Perfect time to set your intentions! Complete your **AM Bookend** in the Dashboard - it takes about 2 minutes and sets your leadership focus for the day.`,
          cta: 'Complete AM Bookend'
        };
      }
      if (incompleteDailyReps > 0) {
        return {
          message: `Great job on your morning intentions! You have **${incompleteDailyReps} daily rep${incompleteDailyReps !== 1 ? 's' : ''}** to complete. Head to your Dashboard to check them off.`,
          cta: 'View Daily Reps'
        };
      }
    }

    if (timeOfDay === 'midday') {
      if (incompleteDailyReps > 0) {
        return {
          message: `Good afternoon check-in! You have **${incompleteDailyReps} daily rep${incompleteDailyReps !== 1 ? 's' : ''}** remaining. Your Dashboard has all your action items ready.`,
          cta: 'View Dashboard'
        };
      }
      if (incompleteCount > 0) {
        return {
          message: `You're making great progress! **${incompleteCount} action${incompleteCount !== 1 ? 's' : ''}** remaining for this week. Check your Dashboard to keep the momentum going.`,
          cta: 'View Actions'
        };
      }
    }

    if (timeOfDay === 'evening' || timeOfDay === 'night') {
      if (!pmBookendComplete) {
        return {
          message: `Evening is perfect for reflection. Complete your **PM Bookend** in the Dashboard to capture what went well, what could be better, and your best moment.`,
          cta: 'Complete PM Bookend'
        };
      }
    }

    // All done!
    if (incompleteCount === 0 && amBookendComplete && (timeOfDay !== 'evening' || pmBookendComplete)) {
      return {
        message: `Amazing work, ${firstName}! 🎉 You've completed all your items for today. Your Dashboard shows your full progress.`,
        cta: 'View Dashboard',
        allDone: true
      };
    }

    // Default
    return {
      message: `Your Dashboard has everything you need for today's leadership development. Check your **This Week's Actions** to see what's up next.`,
      cta: 'Go to Dashboard'
    };
  }, [isPrep, prepComplete, prepRequirementsComplete, timeOfDay, amBookendComplete, pmBookendComplete, incompleteDailyReps, incompleteCount, firstName]);

  // Initialize conversation
  useEffect(() => {
    if (dailyPlanLoading || hasInitialized.current) return;
    hasInitialized.current = true;
    
    let contextMessage = "";
    if (isPrep) {
      contextMessage = prepComplete
        ? `You've completed all your prep work! 🎉 While you wait for your cohort to begin, keep exploring your Dashboard.`
        : `You're in the preparation phase. Let's get you ready for your leadership journey!`;
    } else {
      contextMessage = `It's ${phaseDisplay.day} of your ${phaseDisplay.name} journey.`;
    }
    
    setTimeout(() => {
      setMessages([{
        sender: 'rep',
        content: `${greeting}, ${firstName}! 👋\n\n${contextMessage}\n\nReady for today's check-in?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 500);

    setTimeout(() => {
      addRepMessage(
        "Here's how your community is doing. You're part of a team of leaders growing together!",
        1500,
        'cohort-pulse'
      );
      setSessionState('cohort');
    }, 2500);
  }, [dailyPlanLoading, firstName, greeting, phaseDisplay, isPrep, prepComplete, addRepMessage]);

  // Handle cohort continue - show next step guidance
  const handleCohortContinue = useCallback(() => {
    const nextStep = getNextStepMessage();
    addRepMessage(nextStep.message, 1000, 'next-step', { cta: nextStep.cta, allDone: nextStep.allDone });
    setSessionState('guidance');
  }, [getNextStepMessage, addRepMessage]);

  // Handle going to dashboard
  const handleGoToDashboard = useCallback(() => {
    navigate('dashboard');
  }, [navigate]);

  // Handle "stay and chat" after guidance
  const handleStayAndChat = useCallback(() => {
    setSessionState('questions');
    addRepMessage(
      `Happy to chat! Do you have any leadership questions or challenges you're working through?\n\nI can help with delegation, feedback, time management, team motivation, and more.\n\nOr say "done" when you're ready to go.`,
      1000
    );
  }, [addRepMessage]);

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

    if (sessionState === 'questions') {
      if (input.includes('delegation') || input.includes('delegate')) {
        addRepMessage(`Great question about delegation! Here's a quick framework:\n\n1. **What** - Be crystal clear on the outcome\n2. **Who** - Match task to person's strengths\n3. **Why** - Share context, not just tasks\n4. **When** - Set clear deadlines\n5. **How** - Agree on check-in points\n\nWhat specific delegation challenge are you facing?`, 2000);
      } else if (input.includes('feedback') || input.includes('difficult conversation')) {
        addRepMessage(`Difficult conversations are a core leadership skill. Try the SBI model:\n\n• **Situation** - "In yesterday's meeting..."\n• **Behavior** - "I noticed you interrupted twice"\n• **Impact** - "This made the team hesitant to share"\n\nWould you like to practice with a specific scenario?`, 2000);
      } else if (input.includes('time') || input.includes('busy') || input.includes('overwhelmed')) {
        addRepMessage(`Feeling overwhelmed is common for leaders. Remember:\n\n• Your calendar reflects your priorities\n• "No" to one thing means "Yes" to another\n• Leadership isn't about doing more, it's about doing what matters\n\nWhat's taking up most of your time right now?`, 2000);
      } else if (input.includes('done') || input.includes('finish') || input.includes('go') || input.includes('dashboard')) {
        addRepMessage(`Perfect! Head to your Dashboard to continue your leadership development.\n\nI'll be here whenever you need coaching! 💪`, 1500);
        setTimeout(() => setSessionState('complete'), 3000);
      } else if (input.length > 10) {
        addRepMessage(`That's a thoughtful question. Here's what I'd suggest:\n\n1. Start with curiosity, not judgment\n2. Focus on behaviors you can observe\n3. Remember that most people want to do good work\n\nWant to explore this more, or head to your Dashboard?`, 2000);
      } else {
        addRepMessage(`I'm here to help with leadership challenges. Try asking about delegation, feedback, time management, or team motivation.\n\nOr say "done" to go to your Dashboard.`, 1500);
      }
    } else {
      if (input.includes('dashboard') || input.includes('go')) {
        navigate('dashboard');
      } else {
        addRepMessage("Let me know if you have questions, or head to your Dashboard to continue!", 1000);
      }
    }
  }, [userInput, sessionState, addRepMessage, navigate]);

  // Session duration
  const getSessionMinutes = useCallback(() => {
    return Math.round((new Date() - sessionStartTime) / 60000) || 1;
  }, [sessionStartTime]);

  // Loading
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

  // Complete screen
  if (sessionState === 'complete') {
    return (
      <div className="min-h-screen bg-rep-warm-white">
        <RepSessionComplete
          userName={firstName}
          streak={7}
          sessionMinutes={getSessionMinutes()}
          cohortPosition={cohortData ? "You're part of an active cohort!" : "Building strong habits!"}
          nextSessionPreview={`Continue on your Dashboard`}
          onContinue={() => navigate('dashboard')}
          onViewApp={() => navigate('dashboard')}
        />
      </div>
    );
  }

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

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* System message */}
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
              {/* Cohort Pulse */}
              {msg.widget === 'cohort-pulse' && (
                <div className="mt-3">
                  <RepCohortPulse
                    cohortName={cohortData?.name || "Leadership Community"}
                    activeLeaders={cohortData?.memberCount || 12}
                    totalLeaders={cohortData?.memberCount || 15}
                    todayCompletions={5}
                    weeklyWins={23}
                    topFocus={isPrep ? "Preparation" : "Leadership Foundations"}
                    nextEvent={cohortData?.nextSession || "Community learning ongoing"}
                  />
                  <button
                    onClick={handleCohortContinue}
                    className="mt-3 w-full py-2.5 bg-corporate-teal text-white rounded-lg font-medium text-sm
                               hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    What Should I Do Today?
                  </button>
                </div>
              )}

              {/* Next Step Guidance - Navigate to Dashboard */}
              {msg.widget === 'next-step' && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={handleGoToDashboard}
                    className="w-full py-3 bg-corporate-teal text-white rounded-lg font-medium text-sm
                               hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {msg.data?.cta || 'Go to Dashboard'}
                  </button>
                  {!msg.data?.allDone && (
                    <button
                      onClick={handleStayAndChat}
                      className="w-full py-2.5 bg-gray-100 text-rep-text-primary rounded-lg font-medium text-sm
                                 hover:bg-gray-200 transition-colors"
                    >
                      Ask Rep a Question Instead
                    </button>
                  )}
                  {msg.data?.allDone && (
                    <button
                      onClick={handleStayAndChat}
                      className="w-full py-2.5 bg-gray-100 text-rep-text-primary rounded-lg font-medium text-sm
                                 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Chat About Leadership
                    </button>
                  )}
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

      {/* Input */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={sessionState === 'questions' 
                ? "Ask a leadership question..." 
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
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-center text-rep-text-secondary mt-2">
            Rep guides you to your Dashboard curriculum
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RepCoach;
