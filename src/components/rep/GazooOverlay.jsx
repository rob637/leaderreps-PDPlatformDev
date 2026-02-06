// src/components/rep/GazooOverlay.jsx
// The Great Gazoo - Persistent AI Coach overlay that hovers above the app
// Stays visible while navigating, can be minimized/expanded

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Minus, Maximize2, Send, Sparkles, 
  MessageCircle, ArrowRight, Loader2
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';

// Gazoo's personality and responses
const GAZOO_RESPONSES = {
  greeting: {
    morning: "Good morning, dum-dum! Ready to lead today?",
    afternoon: "Hello there! Let's make progress this afternoon.",
    evening: "Evening check-in time! How did leadership go today?",
    night: "Burning the midnight oil? I'm here to help!"
  },
  encouragement: [
    "You're doing great, dum-dum! Keep it up!",
    "That's the spirit! Leaders never stop growing.",
    "Excellent progress! Your team is lucky to have you.",
    "Remember: small daily reps build leadership muscles!",
    "Every completed action moves you closer to mastery!"
  ],
  guidance: {
    prep: "Focus on completing your preparation items first. They'll set you up for success!",
    actions: "Check your Dashboard for today's actions. I'll guide you through them!",
    complete: "Fantastic! You've completed today's items. Take a moment to reflect on your wins."
  }
};

const GazooOverlay = ({ onClose }) => {
  const { user, navigate, currentScreen } = useAppServices();
  const { 
    currentDayData, 
    currentPhase, 
    prepRequirementsComplete,
    cohortData 
  } = useDailyPlan();

  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const _firstName = user?.displayName?.split(' ')[0] || 'Leader';

  // Time of day
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }, []);

  // Initial greeting
  useEffect(() => {
    const greeting = GAZOO_RESPONSES.greeting[timeOfDay];
    const phaseContext = currentPhase?.id === 'pre-start' 
      ? "I see you're in the preparation phase. Let's get you ready!" 
      : `You're on Day ${currentDayData?.dayNumber || 1} of your journey.`;
    
    setMessages([
      { 
        type: 'gazoo', 
        text: `${greeting}\n\n${phaseContext}`,
        timestamp: new Date()
      }
    ]);
  }, [timeOfDay, currentPhase, currentDayData?.dayNumber]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get current context for smart responses
  const getContextualResponse = () => {
    const isPrep = currentPhase?.id === 'pre-start';
    const prepComplete = prepRequirementsComplete?.allComplete;
    const incompleteActions = (currentDayData?.actions || []).filter(a => !a.isCompleted);

    if (isPrep && !prepComplete) {
      return GAZOO_RESPONSES.guidance.prep;
    } else if (incompleteActions.length > 0) {
      return `You have ${incompleteActions.length} action${incompleteActions.length > 1 ? 's' : ''} to complete. ${GAZOO_RESPONSES.guidance.actions}`;
    } else {
      return GAZOO_RESPONSES.guidance.complete;
    }
  };

  // Handle user messages
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage, timestamp: new Date() }]);
    setUserInput('');
    setIsTyping(true);

    // Simulate Gazoo thinking
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    // Generate response based on context
    let response = '';
    const lowerInput = userMessage.toLowerCase();

    if (lowerInput.includes('help') || lowerInput.includes('what should')) {
      response = getContextualResponse();
    } else if (lowerInput.includes('dashboard') || lowerInput.includes('actions')) {
      response = "Head to your Dashboard to see your daily actions. I'll be right here if you need guidance!";
    } else if (lowerInput.includes('stuck') || lowerInput.includes("don't know")) {
      response = "Every leader faces uncertainty, dum-dum! Start with one small action. Which item on your list feels most approachable?";
    } else if (lowerInput.includes('thanks') || lowerInput.includes('thank you')) {
      response = "You're welcome! Now go lead with intention. I believe in you!";
    } else if (lowerInput.includes('cohort') || lowerInput.includes('team')) {
      response = cohortData 
        ? `You're part of ${cohortData.name}. You're not alone on this journey!`
        : "You're building your leadership skills. Every rep counts!";
    } else {
      // Random encouragement
      response = GAZOO_RESPONSES.encouragement[Math.floor(Math.random() * GAZOO_RESPONSES.encouragement.length)];
    }

    setMessages(prev => [...prev, { type: 'gazoo', text: response, timestamp: new Date() }]);
    setIsTyping(false);
  };

  // Quick action buttons
  const quickActions = [
    { label: 'What should I do?', action: () => setUserInput("What should I do next?") },
    { label: 'Go to Dashboard', action: () => navigate('dashboard') },
    { label: "I'm stuck", action: () => setUserInput("I'm feeling stuck") },
  ];

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-8 right-8 z-[90] flex items-center gap-2 px-4 py-3 
                   bg-gradient-to-r from-lime-500 to-emerald-600 text-white
                   rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">Gazoo</span>
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-[90] w-96 max-w-[calc(100vw-2rem)] 
                    bg-white rounded-2xl shadow-2xl border border-slate-200
                    flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Header - Green gradient */}
      <div className="bg-gradient-to-r from-lime-500 to-emerald-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">The Great Gazoo</h3>
              <p className="text-xs text-white/80">Your AI Leadership Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Close Gazoo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Current screen indicator */}
        <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
          <MessageCircle className="w-3 h-3" />
          <span>Watching: {currentScreen || 'Dashboard'}</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 max-h-[300px] overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.type === 'user' 
                ? 'bg-corporate-navy text-white rounded-br-md' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
            }`}>
              <p className="text-sm whitespace-pre-line">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 py-2 border-t border-slate-100 bg-white">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={qa.action}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium 
                         bg-slate-100 hover:bg-lime-100 text-slate-600 hover:text-lime-700
                         rounded-full transition-colors whitespace-nowrap"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Gazoo anything..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl
                       text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isTyping}
            className="px-4 py-2.5 bg-gradient-to-r from-lime-500 to-emerald-600 
                       text-white rounded-xl hover:opacity-90 transition-opacity
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GazooOverlay;
