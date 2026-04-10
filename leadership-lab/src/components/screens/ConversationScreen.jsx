import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { sendMessage } from '../../services/aiService.js';
import { getConversation } from '../../services/conversationService.js';

export default function ConversationScreen({
  mode: initialMode = 'coach',
  conversationId: existingConversationId = null,
  firstMessage = null,
}) {
  const { goBack, canGoBack } = useNavigation();
  const { user, userProfile } = useAuth();
  const userId = userProfile?._docId || user?.uid;
  const currentWeek = userProfile?.currentWeek || 1;

  const [mode, setMode] = useState(initialMode);
  const [conversationId, setConversationId] = useState(existingConversationId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(!!existingConversationId);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);

  // Load existing conversation if resuming
  useEffect(() => {
    if (!existingConversationId || !userId) return;

    let cancelled = false;
    (async () => {
      try {
        const convo = await getConversation(userId, existingConversationId);
        if (cancelled) return;
        if (convo) {
          setMessages(
            convo.messages.map((m, i) => ({
              id: `${existingConversationId}-${i}`,
              role: m.role === 'user' ? 'user' : 'ai',
              content: m.content,
              timestamp: m.timestamp,
            })),
          );
          setMode(convo.mode || initialMode);
        }
      } catch {
        if (!cancelled) setError('Failed to load conversation.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [existingConversationId, userId, initialMode]);

  // Add opening AI message for new conversations
  useEffect(() => {
    if (existingConversationId || messages.length > 0) return;
    // Don't add a local opening message — the first sendMessage call
    // with the opening exchange will create the conversation server-side.
    // Instead, show a contextual prompt.
  }, [existingConversationId, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const handleSend = useCallback(async (directText) => {
    const text = (directText || input).trim();
    if (!text || sendingRef.current) return;

    sendingRef.current = true;
    setError(null);

    // Optimistic: show user message immediately
    const tempId = Date.now().toString();
    const userMessage = {
      id: tempId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await sendMessage(text, {
        conversationId,
        mode,
        weekNumber: currentWeek,
      });

      // Store the conversation ID for subsequent messages
      if (!conversationId && result.conversationId) {
        setConversationId(result.conversationId);
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: result.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // If onboarding just completed, refresh profile and navigate to Feed
      if (result.onboardingComplete) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      const msg =
        err?.code === 'functions/unauthenticated'
          ? 'Please sign in again.'
          : err?.code === 'functions/internal'
            ? 'The AI service is temporarily unavailable. Please try again.'
            : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsTyping(false);
      sendingRef.current = false;
    }
  }, [input, conversationId, mode, currentWeek]);

  // Auto-send first message if passed from FeedScreen
  const firstMessageSent = useRef(false);
  useEffect(() => {
    if (firstMessage && !firstMessageSent.current && !isLoading) {
      firstMessageSent.current = true;
      handleSend(firstMessage);
    }
  }, [firstMessage, isLoading, handleSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    // Start a new conversation with the new mode
    setMode(newMode);
    setConversationId(null);
    setMessages([]);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-lab-cream items-center justify-center">
        <p className="text-stone-400 text-sm">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-lab-cream">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200">
        {canGoBack && (
          <button onClick={goBack} className="text-stone-500 hover:text-lab-navy">
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h2 className="font-semibold text-lab-navy text-sm">
            {MODE_LABELS[mode]}
          </h2>
          <p className="text-xs text-stone-400">Your leadership coach</p>
        </div>
        <div className="ml-auto">
          <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none">
        {/* Empty state prompt */}
        {messages.length === 0 && !isTyping && (
          <div className="flex justify-start">
            <div className="bubble-ai">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {getOpeningPrompt(mode)}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] ${
                msg.role === 'user' ? 'bubble-user' : 'bubble-ai'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bubble-ai">
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-stone-200 pb-safe">
        <div className="flex items-end gap-2 max-w-lg mx-auto">

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={isTyping}
              className="w-full resize-none rounded-2xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:border-lab-teal focus:ring-1 focus:ring-lab-teal/20 placeholder-stone-400 bg-stone-50 disabled:opacity-50"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-lab-teal text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lab-teal-dark transition-colors"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

const MODE_LABELS = {
  coach: 'Coach Mode',
  practice: 'Practice Mode',
  mirror: 'Mirror Mode',
  debrief: 'Debrief Mode',
  onboarding: 'Getting to Know You',
};

function ModeSelector({ currentMode, onModeChange }) {
  const modes = [
    { key: 'coach', label: 'Coach', emoji: '🧭' },
    { key: 'practice', label: 'Practice', emoji: '🎯' },
    { key: 'mirror', label: 'Mirror', emoji: '🪞' },
    { key: 'debrief', label: 'Debrief', emoji: '📝' },
  ];

  // Don't show mode selector during onboarding
  if (currentMode === 'onboarding') return null;

  return (
    <div className="flex gap-1">
      {modes.map((m) => (
        <button
          key={m.key}
          title={m.label}
          onClick={() => onModeChange(m.key)}
          className={`text-xs px-2 py-1 rounded-lg transition-colors ${
            currentMode === m.key
              ? 'bg-lab-teal/10 text-lab-teal font-medium'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {m.emoji}
        </button>
      ))}
    </div>
  );
}

function getOpeningPrompt(mode) {
  const prompts = {
    coach: "What's on your mind? I'm here to help you think through whatever you're facing as a leader right now.",
    practice: "Let's rehearse a real situation. Tell me about a conversation or moment coming up that you want to prepare for — I'll play the other person.",
    mirror: "I've been noticing some patterns in our conversations. Want me to share what I'm seeing?",
    debrief: "Let's look back at your week. What happened with your experiment? Walk me through it.",
    onboarding: "Welcome to Leadership Lab. I'm your coach — and I'll be with you for the long haul. Before we start, I'd like to get to know you. Not through a form, but through a conversation.\n\nTell me about yourself — what do you do, and what's your role?",
  };
  return prompts[mode] || prompts.coach;
}
