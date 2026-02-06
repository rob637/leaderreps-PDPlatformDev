import { useState, useRef, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useProgress } from '../App';

// Quick prompt suggestions
const QUICK_PROMPTS = [
  { icon: '�', text: "I'm struggling today" },
  { icon: '�🔥', text: 'Difficult conversation coming up' },
  { icon: '💡', text: 'Need help with feedback' },
  { icon: '🎯', text: 'Struggling with delegation' },
  { icon: '⚡', text: 'Team motivation issue' },
];

export default function AskReppyModal({ isOpen, onClose, isDark }) {
  const { progress } = useProgress();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const profile = progress?.profile || {};
  const name = profile.name || 'Leader';
  const coachingStyle = profile.coachingStyle || 'challenge';

  // Get coaching style instructions for AI
  const getCoachingStyleInstructions = () => {
    switch (coachingStyle) {
      case 'guide':
        return `COACHING STYLE: GUIDE ME - Give suggestions and examples quickly. Lead with options, then ask how to apply them.`;
      case 'coach':
        return `COACHING STYLE: COACH ME - Balance questions with guidance. Ask first, then help if they need it.`;
      case 'challenge':
      default:
        return `COACHING STYLE: CHALLENGE ME - Push them to think deeply. Ask probing questions, rarely give direct answers.`;
    }
  };

  // Theme colors
  const bg = isDark ? 'bg-gray-900' : 'bg-white';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-gray-100';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const border = isDark ? 'border-gray-700' : 'border-gray-200';

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages.length]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      // Keep messages for the session, but reset loading state
      setIsLoading(false);
    }
  }, [isOpen]);

  // Build context from user's journey
  const buildCoachContext = () => {
    const parts = [];
    
    if (profile.name) parts.push(`Name: ${profile.name}`);
    if (profile.role) parts.push(`Role: ${profile.role}`);
    if (profile.challenge) parts.push(`Primary Challenge: "${profile.challenge}"`);
    if (profile.goal) parts.push(`Leadership Goal: "${profile.goal}"`);
    
    const completedSessions = progress?.completedSessions?.length || 0;
    parts.push(`Sessions Completed: ${completedSessions}`);
    
    if (progress?.streakCount > 0) {
      parts.push(`Current Streak: ${progress.streakCount} days`);
    }
    
    // Today's intention if set
    const today = progress?.dailyTouchpoints?.[new Date().toISOString().split('T')[0]];
    if (today?.morning?.responses?.intention) {
      parts.push(`Today's intention: "${today.morning.responses.intention}"`);
    }
    
    return parts.join('\n');
  };

  // Start conversation with a quick prompt
  const startWithPrompt = (promptText) => {
    const greeting = {
      role: 'assistant',
      content: `Hey ${name}! 👋 I'm here to help. Tell me more about what's going on.`
    };
    
    setMessages([greeting, { role: 'user', content: promptText }]);
    setIsLoading(true);
    
    // Send to AI
    sendToAI([greeting, { role: 'user', content: promptText }], promptText);
  };

  // Send message
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    
    await sendToAI(newMessages, userMessage);
  };

  // Send to AI
  const sendToAI = async (conversationMessages) => {
    try {
      const functions = getFunctions();
      const reppyCoach = httpsCallable(functions, 'reppyCoach');
      
      const journeyContext = buildCoachContext();
      const styleInstructions = getCoachingStyleInstructions();

      const coachingContext = `This is an ON-DEMAND coaching conversation. The user has a question, issue, or situation they want help with RIGHT NOW.

${styleInstructions}

=== USER'S LEADERSHIP CONTEXT ===
${journeyContext}

=== YOUR ROLE ===
You are Reppy, their personal leadership coach in their pocket.
${coachingStyle === 'guide' 
  ? `- Lead with suggestions and options\n- Give practical advice quickly\n- Ask how they'd apply your ideas`
  : coachingStyle === 'coach'
    ? `- Balance questions with guidance\n- Start with a question, then help if needed\n- Be warm AND useful`
    : `- Push them to think\n- Ask probing questions\n- Only give direct advice after they've wrestled with it`
}
- Empathetic (acknowledge their feelings)
- Keep responses focused (2-4 paragraphs max unless they need more detail)

This is NOT a scheduled session - it's a quick coaching moment. Help them work through their immediate challenge.

If they describe a specific situation, help them:
1. See it clearly (what's really happening?)
2. Understand their options
3. Choose an approach
4. Practice what to say (if relevant)`;

      const context = {
        userName: name,
        userRole: profile.role || 'leader',
        userChallenge: profile.challenge || '',
        userGoal: profile.goal || '',
        sessionType: 'on-demand',
        customContext: coachingContext,
      };
      
      const result = await reppyCoach({
        messages: conversationMessages,
        context,
      });
      
      const aiResponse = result.data.message;
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
    } catch (error) {
      console.error('Error calling reppyCoach:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Try again in a moment?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear conversation
  const clearChat = () => {
    setMessages([]);
    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - positioned above bottom nav */}
      <div className={`relative w-full max-w-[430px] ${bg} rounded-t-3xl flex flex-col overflow-hidden shadow-2xl`}
           style={{ height: 'calc(85vh - 80px)', marginBottom: '80px' }}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${border}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h3 className={`font-semibold ${textPrimary}`}>Ask Reppy</h3>
              <p className={`text-xs ${textSecondary}`}>Your leadership coach</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} ${textSecondary}`}
                title="New conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} ${textSecondary}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages or Quick Prompts */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            // Initial state - show quick prompts
            <div className="h-full flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>
                  What's on your mind?
                </h3>
                <p className={`text-sm ${textSecondary}`}>
                  I'm here to help with any leadership challenge
                </p>
              </div>
              
              {/* Quick prompts */}
              <div className="space-y-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => startWithPrompt(prompt.text)}
                    className={`w-full p-3 rounded-xl ${cardBg} text-left flex items-center gap-3 hover:ring-2 hover:ring-blue-500/50 transition-all`}
                  >
                    <span className="text-xl">{prompt.icon}</span>
                    <span className={`font-medium ${textPrimary}`}>{prompt.text}</span>
                  </button>
                ))}
              </div>
              
              <p className={`text-center text-xs ${textSecondary} mt-6`}>
                Or type your own question below
              </p>
            </div>
          ) : (
            // Chat messages
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : `${cardBg} ${textPrimary}`
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`rounded-2xl px-4 py-3 ${cardBg}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${border}`}>
          <div className={`flex items-center gap-2 p-2 rounded-xl ${cardBg}`}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className={`flex-1 bg-transparent px-2 py-2 outline-none text-sm ${textPrimary} placeholder:${textSecondary}`}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={`p-2 rounded-lg transition-colors ${
                inputValue.trim() && !isLoading
                  ? 'bg-blue-600 text-white'
                  : `${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${textSecondary}`
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
