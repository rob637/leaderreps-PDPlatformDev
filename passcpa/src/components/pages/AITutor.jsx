import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  Lightbulb,
  History,
  Trash2,
  Plus,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CPA_SECTIONS } from '../../config/examConfig';
import clsx from 'clsx';

// Suggested prompts for users
const SUGGESTED_PROMPTS = [
  {
    icon: HelpCircle,
    text: "Explain the difference between short-term and long-term capital gains",
    category: "Concept"
  },
  {
    icon: BookOpen,
    text: "Help me understand IRC Section 1031 like-kind exchanges",
    category: "Deep Dive"
  },
  {
    icon: Lightbulb,
    text: "Give me a mnemonic for remembering the filing deadlines",
    category: "Study Tip"
  },
  {
    icon: HelpCircle,
    text: "Walk me through calculating basis in a partnership interest",
    category: "Problem Solving"
  }
];

const AITutor = () => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentSection = userProfile?.examSection || 'REG';
  const sectionInfo = CPA_SECTIONS[currentSection];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: `Hi! I'm Penny, your AI tutor for the CPA exam. 🎓\n\nI see you're studying for the **${sectionInfo?.name}** section. I'm here to help you:\n\n• Understand complex accounting concepts\n• Work through practice problems step-by-step\n• Provide study tips and mnemonics\n• Answer any questions about the exam\n\nWhat would you like to learn about today?`,
        timestamp: new Date()
      }]);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (in production, this would call the API)
    setTimeout(() => {
      const aiResponse = generateMockResponse(input.trim());
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text, messageId) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: `Chat cleared! What would you like to learn about today?`,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Penny</h1>
              <p className="text-xs text-slate-500">Your AI Study Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={clsx(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              {/* Avatar */}
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                message.role === 'assistant' 
                  ? "bg-gradient-to-br from-violet-500 to-violet-600"
                  : "bg-primary-500"
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={clsx(
                "flex-1 max-w-[85%]",
                message.role === 'user' && "flex flex-col items-end"
              )}>
                <div className={clsx(
                  "px-4 py-3 rounded-2xl",
                  message.role === 'assistant' 
                    ? "bg-white border border-slate-200 rounded-tl-md"
                    : "bg-primary-500 text-white rounded-tr-md"
                )}>
                  <div 
                    className={clsx(
                      "prose prose-sm max-w-none",
                      message.role === 'assistant' ? "prose-slate" : "prose-invert"
                    )}
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessage(message.content) 
                    }}
                  />
                </div>
                
                {/* Message Actions */}
                {message.role === 'assistant' && message.id !== 'greeting' && (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 mb-3">Suggested questions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt.text)}
                  className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors text-left"
                >
                  <prompt.icon className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-violet-600 font-medium">{prompt.category}</span>
                    <p className="text-sm text-slate-700 mt-0.5">{prompt.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask Penny anything about the CPA exam..."
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={clsx(
                "p-3 rounded-xl transition-colors flex-shrink-0",
                input.trim() && !isLoading
                  ? "bg-violet-500 text-white hover:bg-violet-600"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Penny uses AI to help you learn. Always verify important information.
          </p>
        </form>
      </div>
    </div>
  );
};

// Format message content with markdown-like syntax
const formatMessage = (content) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '• ');
};

// Mock response generator
const generateMockResponse = (input) => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('capital gain')) {
    return `Great question! Let me break down **capital gains** for you:\n\n**Short-term vs Long-term:**\n• **Short-term capital gains** (held ≤ 1 year) are taxed at your ordinary income tax rate (10%-37%)\n• **Long-term capital gains** (held > 1 year) get preferential rates:\n  - 0% for taxable income up to $44,625 (single)\n  - 15% for income $44,625 - $492,300\n  - 20% for income above $492,300\n\n**Key Formula:**\nGain/Loss = Amount Realized - Adjusted Basis\n\n**Exam Tip:** Remember "MORE than one year" means at least 1 year + 1 day for long-term treatment!\n\nWould you like me to walk through a practice problem?`;
  }
  
  if (lowerInput.includes('1031') || lowerInput.includes('like-kind')) {
    return `**IRC Section 1031 - Like-Kind Exchanges** is a powerful tax deferral tool!\n\n**What it does:**\nAllows you to defer gain recognition when exchanging qualifying property for similar property.\n\n**Key Requirements:**\n• Must be **real property** (since 2018, no more personal property exchanges)\n• Must be held for **investment or business use**\n• Must be **like-kind** (real estate for real estate)\n• Strict **timeline requirements:**\n  - 45 days to identify replacement property\n  - 180 days to complete the exchange\n\n**What's NOT allowed:**\n• Primary residence (but see §121 exclusion)\n• Inventory or dealer property\n• Partnership interests\n\n**Exam Favorite:** Calculating boot and recognized gain. Boot = cash or non-like-kind property received. Gain recognized = LESSER of: (1) realized gain or (2) boot received.\n\nShall I show you an example calculation?`;
  }
  
  if (lowerInput.includes('mnemonic') || lowerInput.includes('remember')) {
    return `Here are some popular **mnemonics** for the CPA exam:\n\n**For Filing Deadlines - "3-4-5-6":**\n• S-Corps & Partnerships: **3**/15 (March 15)\n• C-Corps: **4**/15 (April 15)\n• Exempt Orgs: **5**/15 (May 15)\n• Extended Individuals: **10**/15 (6 months from 4/15)\n\n**For Circular 230 Rules - "DON'T":**\n• **D**elay IRS proceedings unreasonably\n• **O**verstate accuracy of documents\n• **N**eglect client communications\n• **T**ake contingent fees for returns\n\n**For Itemized Deductions - "MITTS":**\n• **M**edical expenses (>7.5% AGI)\n• **I**nterest (mortgage, investment)\n• **T**axes (SALT up to $10K)\n• **T**heft & casualty losses (limited)\n• Charitable **S**ontributions\n\nWant more mnemonics for a specific topic?`;
  }
  
  // Default response
  return `That's a great topic to explore! Let me help you understand this better.\n\n**Key Points:**\n• This is an important concept for the ${input.includes('REG') ? 'REG' : 'CPA'} exam\n• I'd recommend reviewing the related IRC sections\n• Practice problems are essential for mastery\n\nWould you like me to:\n1. Explain this concept in more detail?\n2. Walk through a practice problem?\n3. Provide study tips for this topic?\n\nJust let me know how I can help!`;
};

export default AITutor;
