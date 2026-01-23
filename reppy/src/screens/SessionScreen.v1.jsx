import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress, useAuth } from '../App';
import { getCurrentSession, SESSION_TYPES } from '../data/focuses';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function SessionScreen() {
  const navigate = useNavigate();
  const { progress, completeSession } = useProgress();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [startTime] = useState(Date.now());
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const completedSessions = progress?.completedSessions?.length || 0;
  const profile = progress?.profile || {};
  const name = profile.name || 'Leader';
  
  // Get current session from focus-based curriculum
  const { focus, session, sessionInFocus } = getCurrentSession(completedSessions);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start conversation with session content
  useEffect(() => {
    const openingMessage = buildOpeningMessage(session, focus, name);
    setMessages([{ role: 'assistant', content: openingMessage }]);
  }, [session, focus, name]);

  // Build opening message based on session type
  const buildOpeningMessage = (session, focus, userName) => {
    const c = session.content || {};
    const type = session.type;
    
    let opening = `Hey ${userName}! 👋\n\n`;
    opening += `*${focus.title}: Session ${sessionInFocus} of ${focus.sessions.length}*\n\n`;
    
    switch (type) {
      case SESSION_TYPES.QUOTE:
        opening += `I have a powerful quote for you today:\n\n`;
        opening += `**"${c.quote}"**\n— ${c.author}\n\n`;
        if (c.context) opening += `*${c.context}*\n\n`;
        if (c.reflection) opening += `${c.reflection}\n\n`;
        opening += `What comes up for you when you read this?`;
        break;
        
      case SESSION_TYPES.LESSON:
        opening += `**${session.title}**\n\n`;
        if (c.opening) opening += `${c.opening}\n\n`;
        if (c.lesson) opening += `${c.lesson}\n\n`;
        if (c.framework) {
          opening += `**${c.framework.name}:**\n`;
          if (c.framework.steps) {
            c.framework.steps.forEach((step, i) => {
              if (step.letter) {
                opening += `• **${step.letter} - ${step.name}:** ${step.description}\n`;
              } else {
                opening += `${i + 1}. ${step}\n`;
              }
            });
          }
          opening += `\n`;
        }
        if (c.insight) opening += `*${c.insight}*\n\n`;
        opening += `What resonates most with you here?`;
        break;
        
      case SESSION_TYPES.SCENARIO:
        opening += `**Scenario: ${session.title}**\n\n`;
        opening += `*${c.setup}*\n\n`;
        if (c.context) opening += `${c.context}\n\n`;
        opening += `Put yourself in this situation. What would you do, and why?`;
        break;
        
      case SESSION_TYPES.BOOK:
        const book = c.book || c;
        opening += `**Book Bite: ${book.title}**\n`;
        opening += `*by ${book.author}*\n\n`;
        if (book.synopsis) opening += `${book.synopsis}\n\n`;
        if (book.keyInsight) opening += `**Key Insight:** ${book.keyInsight}\n\n`;
        if (book.leadershipConnection) opening += `*For Leaders:* ${book.leadershipConnection}\n\n`;
        opening += `How does this connect to your leadership experience?`;
        break;
        
      case SESSION_TYPES.REFLECTION:
        opening += `**Reflection: ${session.title}**\n\n`;
        if (c.opening) opening += `${c.opening}\n\n`;
        if (c.prompt) opening += `*${c.prompt}*\n\n`;
        if (c.deeperPrompt) opening += `And going deeper: ${c.deeperPrompt}\n\n`;
        opening += `Take a moment to really sit with this. What emerges?`;
        break;
        
      case SESSION_TYPES.CHALLENGE:
        opening += `**Today's Challenge: ${session.title}**\n\n`;
        if (c.challenge) opening += `🎯 **${c.challenge}**\n\n`;
        if (c.rules) {
          opening += `Guidelines:\n`;
          c.rules.forEach(rule => opening += `• ${rule}\n`);
          opening += `\n`;
        }
        if (c.why) opening += `*Why this matters:* ${c.why}\n\n`;
        opening += `What's your first reaction? Does this feel doable?`;
        break;
        
      case SESSION_TYPES.INTEGRATION:
        opening += `**Integration: ${session.title}**\n\n`;
        if (c.opening) opening += `${c.opening}\n\n`;
        if (c.prompts) {
          opening += `Let's bring together what you've learned:\n\n`;
          c.prompts.forEach((prompt, i) => opening += `${i + 1}. ${prompt}\n`);
          opening += `\n`;
        }
        opening += `Take your time. This is where insights become action.`;
        break;
        
      case SESSION_TYPES.WIN_THE_DAY:
        opening += `**Win the Day: ${session.title}**\n\n`;
        if (c.opening) opening += `${c.opening}\n\n`;
        opening += `Let's set your intention for today. What's your ONE Thing—the single most important thing that would make today a success?`;
        break;
        
      case SESSION_TYPES.PM_REFLECTION:
        opening += `**Evening Reflection: ${session.title}**\n\n`;
        if (c.opening) opening += `${c.opening}\n\n`;
        opening += `Let's close the day with intention. What went well today?`;
        break;
        
      default:
        opening += `**${session.title}**\n\n`;
        opening += `Today we're exploring ${session.theme?.replace(/-/g, ' ')}. What's on your mind about this topic?`;
    }
    
    return opening;
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    try {
      const functions = getFunctions();
      const reppyCoach = httpsCallable(functions, 'reppyCoach');
      
      // Build context
      const context = {
        userName: name,
        userRole: profile.role || 'leader',
        userChallenge: profile.challenge || '',
        userGoal: profile.goal || '',
        sessionType: session.type,
        sessionTheme: session.theme || focus.title.toLowerCase(),
        sessionTitle: session.title,
        sessionContent: getSessionContentSummary(session),
        focusTitle: focus.title,
        focusDescription: focus.description,
      };
      
      const conversationMessages = [...messages, { role: 'user', content: userMessage }];
      
      const result = await reppyCoach({
        messages: conversationMessages,
        context,
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: result.data.message }]);
      
    } catch (error) {
      console.error('Error calling reppyCoach:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. But I'm still here—tell me more about what you're thinking." 
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Get session content summary for AI context
  const getSessionContentSummary = (session) => {
    const c = session.content || {};
    if (c.quote) return `Quote: "${c.quote}" - ${c.author}`;
    if (c.book?.title) return `Book: ${c.book.title} by ${c.book.author}`;
    if (c.setup) return `Scenario: ${c.setup}`;
    if (c.challenge) return `Challenge: ${c.challenge}`;
    if (c.lesson) return `Lesson: ${c.lesson.substring(0, 200)}`;
    return session.title || '';
  };

  // Handle session completion
  const handleComplete = async () => {
    const duration = Math.round((Date.now() - startTime) / 60000);
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
    
    await completeSession(completedSessions, {
      sessionId: session.id,
      focusId: focus.id,
      type: session.type,
      theme: session.theme,
      duration: Math.max(duration, 1),
      reflection: userMessages.substring(0, 500),
      conversationLength: messages.length,
    });
    
    navigate('/');
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format message content
  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      // Italic
      line = line.replace(/\*(.+?)\*/g, '<em class="text-white/80 italic">$1</em>');
      
      if (!line.trim()) return <div key={i} className="h-3" />;
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <div className="h-full flex flex-col gradient-focus safe-area-top safe-area-bottom">
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 -right-10 w-40 h-40 rounded-full blur-3xl bg-gradient-to-br ${focus.gradient} opacity-30`} />
        <div className={`absolute bottom-20 -left-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${focus.gradient} opacity-20`} />
      </div>
      
      {/* Header */}
      <div className="relative z-10 px-5 py-4 flex items-center justify-between border-b border-white/10">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-lg">{focus.icon}</span>
          <span className="text-white/60 text-sm font-medium">{focus.title}</span>
          <span className="text-white/40 text-sm">•</span>
          <span className="text-white text-sm font-medium">{sessionInFocus}/{focus.sessions.length}</span>
        </div>
        
        <button
          onClick={() => setShowCompletion(true)}
          className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium"
        >
          Done
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'glass-card-subtle text-white/90'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${focus.gradient} flex items-center justify-center`}>
                      <span className="text-xs text-white font-bold">R</span>
                    </div>
                    <span className="text-xs font-medium text-white/50">Reppy</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed">
                  {formatMessage(message.content)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass-card-subtle rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${focus.gradient} flex items-center justify-center`}>
                    <span className="text-xs text-white font-bold">R</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 px-4 py-4 border-t border-white/10 bg-black/20 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts..."
            rows={1}
            className="flex-1 input-glass rounded-2xl resize-none text-sm"
            style={{ maxHeight: '100px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="glass-card p-8 max-w-sm w-full animate-scale-in">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br ${focus.gradient} flex items-center justify-center`}>
                <span className="text-4xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
              <p className="text-white/60">
                {focus.title} • Session {sessionInFocus} of {focus.sessions.length}
              </p>
              {progress?.streakCount > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium">
                  <span>🔥</span>
                  <span>{progress.streakCount + 1} Day Streak</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleComplete}
                className="w-full btn-primary"
              >
                Complete Session
              </button>
              <button
                onClick={() => setShowCompletion(false)}
                className="w-full btn-glass"
              >
                Keep Chatting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
