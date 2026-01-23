// src/components/screens/RepCoach.jsx
// Main Rep AI Coach screen - orchestrates the coaching experience

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Sparkles } from 'lucide-react';
import RepAvatar from '../rep/RepAvatar';
import RepMessage from '../rep/RepMessage';
import RepCohortPulse from '../rep/RepCohortPulse';
import RepBookendWidget from '../rep/RepBookendWidget';
import RepSessionComplete from '../rep/RepSessionComplete';
import { useAppServices } from '../../services/useAppServices';

/**
 * RepCoach - The AI Leadership Coach experience
 * 
 * This is a prototype demonstrating the Rep concept:
 * - Conversational interface that orchestrates widgets
 * - Community awareness (cohort pulse)
 * - Personalized greeting and guidance
 * - Session completion celebration
 * 
 * Currently uses static/scripted content to demonstrate the flow.
 * Phase 2 will integrate Claude API for dynamic responses.
 */
const RepCoach = () => {
  const { user, navigate } = useAppServices();
  const [sessionState, setSessionState] = useState('intro'); // intro | cohort | bookend | complete
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [sessionStartTime] = useState(new Date());
  const messagesEndRef = useRef(null);

  const firstName = user?.displayName?.split(' ')[0] || 'Leader';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Simulate Rep typing delay
  const addRepMessage = (content, delay = 1000, widget = null) => {
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
  };

  // Initialize conversation
  useEffect(() => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    
    // Initial greeting
    setTimeout(() => {
      setMessages([{
        sender: 'rep',
        content: `${greeting}, ${firstName}! 👋\n\nI'm Rep, your leadership development guide. Ready for today's session?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 500);

    // Follow-up with cohort info after delay
    setTimeout(() => {
      addRepMessage(
        "Before we start, here's how your cohort is doing today. You're not in this alone!",
        1500,
        'cohort-pulse'
      );
      setSessionState('cohort');
    }, 2500);
  }, [firstName]);

  // Handle widget completion
  const handleCohortContinue = () => {
    addRepMessage(
      "Let's set your intentions for today. These small commitments shape how you lead.",
      1000,
      'morning-bookend'
    );
    setSessionState('bookend');
  };

  const handleBookendComplete = (data) => {
    addRepMessage(
      `Beautiful intentions, ${firstName}! 🌟\n\nI'll check in with you tonight to see how they went. For now, go lead with purpose.`,
      1500
    );

    setTimeout(() => {
      setSessionState('complete');
    }, 3000);
  };

  // Handle user text input (for future LLM integration)
  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    setMessages(prev => [...prev, {
      sender: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    const input = userInput.toLowerCase();
    setUserInput('');

    // Simple scripted responses for prototype
    if (input.includes('help') || input.includes('confused')) {
      addRepMessage(
        "I'm here to guide you through your daily leadership development. Right now, we're working on setting your morning intentions. Just fill in what comes to mind - there are no wrong answers!",
        1500
      );
    } else if (input.includes('skip') || input.includes('not today')) {
      addRepMessage(
        "I understand - some days are harder than others. But even one small intention can shift your day. Want to try just one?",
        1500
      );
    } else if (input.includes('thank')) {
      addRepMessage(
        `You're welcome, ${firstName}! That's what I'm here for. 💪`,
        1000
      );
    } else {
      addRepMessage(
        "I hear you. Let's keep going with today's session - you've got this!",
        1200
      );
    }
  };

  // Calculate session duration
  const getSessionMinutes = () => {
    return Math.round((new Date() - sessionStartTime) / 60000) || 1;
  };

  // Show completion screen
  if (sessionState === 'complete') {
    return (
      <div className="min-h-screen bg-rep-warm-white">
        <RepSessionComplete
          userName={firstName}
          streak={7} // TODO: Get from user data
          sessionMinutes={getSessionMinutes()}
          cohortPosition="You're in the top 30% of your cohort for consistency!"
          nextSessionPreview="Day 24: The Art of Delegation"
          onContinue={() => navigate('dashboard')}
          onViewApp={() => navigate('dashboard')}
        />
      </div>
    );
  }

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
          {/* System message */}
          <RepMessage 
            sender="system" 
            content={`Day 23 • ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`} 
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
                    cohortName="January 2026 Cohort"
                    activeLeaders={8}
                    totalLeaders={15}
                    todayCompletions={4}
                    weeklyWins={23}
                    topFocus="Delegation"
                    nextEvent="Thursday 2pm - Community Call"
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
              placeholder="Type a message to Rep..."
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
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-center text-rep-text-secondary mt-2">
            Rep is here to guide your leadership journey
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RepCoach;
