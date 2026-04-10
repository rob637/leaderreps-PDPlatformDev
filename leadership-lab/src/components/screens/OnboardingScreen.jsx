import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowUp, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { sendMessage, completeOnboarding } from '../../services/aiService.js';

export default function OnboardingScreen() {
  const [step, setStep] = useState('welcome');

  return (
    <div className="min-h-screen bg-lab-navy text-white">
      {step === 'welcome' && <WelcomeStep onNext={() => setStep('intro')} />}
      {step === 'intro' && <IntroStep onNext={() => setStep('conversation')} />}
      {step === 'conversation' && <OnboardingConversation onComplete={() => setStep('complete')} />}
      {step === 'complete' && <CompleteStep />}
    </div>
  );
}

function WelcomeStep({ onNext }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Leadership Lab</h1>
        <p className="text-stone-300 leading-relaxed mb-8">
          See yourself. Change yourself.
        </p>
        <p className="text-stone-400 text-sm leading-relaxed mb-12">
          Through this program, you will work with an AI coach who learns who you
          really are as a leader — not who you think you are. It starts with a
          conversation.
        </p>
        <button
          onClick={onNext}
          className="w-full py-3 bg-lab-teal text-white font-semibold rounded-2xl hover:bg-lab-teal-dark transition-colors flex items-center justify-center gap-2"
        >
          Let&apos;s begin
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function IntroStep({ onNext }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full">
        <p className="text-stone-300 text-sm mb-4">
          Before we start, I'd like to get to know you — not through a form,
          but through a conversation.
        </p>
        <p className="text-stone-400 text-sm mb-8">
          This will take about 10 minutes. Your answers shape every interaction
          we will have throughout the program.
        </p>
        <button
          onClick={onNext}
          className="w-full py-3 bg-lab-teal text-white font-semibold rounded-2xl hover:bg-lab-teal-dark transition-colors"
        >
          Start the conversation
        </button>
      </div>
    </div>
  );
}

function OnboardingConversation({ onComplete }) {
  const [messages, setMessages] = useState([
    {
      id: 'opening',
      role: 'ai',
      content:
        "Welcome to Leadership Lab. I'm your coach for this journey — but before we start, I'd like to get to know you. Not through a form, but through a conversation.\n\nTell me about yourself — what do you do, and what's your role?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);
  const exchangeCount = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sendingRef.current) return;

    sendingRef.current = true;
    setError(null);
    exchangeCount.current += 1;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await sendMessage(text, {
        conversationId,
        mode: 'onboarding',
        weekNumber: 0,
      });

      if (!conversationId && result.conversationId) {
        setConversationId(result.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', content: result.response },
      ]);
    } catch {
      setError('Connection issue — please try again.');
    } finally {
      setIsTyping(false);
      sendingRef.current = false;
    }
  }, [input, conversationId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFinish = async () => {
    if (!conversationId || isFinishing) return;
    setIsFinishing(true);
    setError(null);
    try {
      await completeOnboarding(conversationId);
      onComplete();
    } catch {
      setError('Failed to save your profile. Please try again.');
      setIsFinishing(false);
    }
  };

  const showFinishButton = exchangeCount.current >= 4 && !isTyping;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10">
        <h2 className="font-semibold text-white text-sm">Getting to Know You</h2>
        <p className="text-xs text-stone-400">Onboarding conversation</p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-lab-teal text-white rounded-2xl rounded-tr-sm px-4 py-3'
                  : 'bg-white/10 text-stone-200 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3'
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
            <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
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

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Finish button */}
      {showFinishButton && (
        <div className="px-4 py-2">
          <button
            onClick={handleFinish}
            disabled={isFinishing}
            className="w-full py-2.5 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isFinishing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Building your leadership profile...
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                I&apos;m ready — let&apos;s start Foundation
              </>
            )}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 pb-safe">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              rows={1}
              disabled={isTyping || isFinishing}
              className="w-full resize-none rounded-2xl border border-white/20 px-4 py-2.5 text-sm bg-white/5 text-white placeholder-stone-500 focus:outline-none focus:border-lab-teal disabled:opacity-50"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || isFinishing}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-lab-teal text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lab-teal-dark transition-colors"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteStep() {
  const { refreshProfile } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-lab-teal/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-lab-teal" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-3">You&apos;re in.</h2>
        <p className="text-stone-300 text-sm leading-relaxed mb-3">
          Your leadership profile has been created. Your coach now has a foundation
          to work from — and it will only get sharper over time.
        </p>
        <p className="text-stone-400 text-xs leading-relaxed mb-10">
          Every conversation, every experiment, every honest moment adds to what
          your coach understands about you.
        </p>
        <button
          onClick={refreshProfile}
          className="w-full py-3 bg-lab-teal text-white font-semibold rounded-2xl hover:bg-lab-teal-dark transition-colors"
        >
          Enter Leadership Lab
        </button>
      </div>
    </div>
  );
}
