// src/components/rep/RepUpCoach.jsx
// Standalone AI Coach for RepUp PWA
// Full-screen version of the coach functionality

import React, { useState, useRef } from 'react';
import { 
  MessageSquare, Send, Loader2, AlertCircle, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';

// Quick prompts for different scenarios
const QUICK_PROMPTS = [
  { label: 'Prep for a rep', prompt: 'How do I prep for a leadership rep?' },
  { label: 'Tough feedback', prompt: 'How do I give tough feedback to a team member?' },
  { label: 'Nervous about conversation', prompt: "I'm nervous about an upcoming difficult conversation" },
  { label: 'Running 1:1s', prompt: 'How can I run better 1:1 meetings?' },
  { label: 'Team conflict', prompt: 'How do I handle conflict between team members?' },
  { label: 'Underperformance', prompt: 'How do I address underperformance on my team?' }
];

// CLEAR-based coaching responses (fallback when AI unavailable)
const generateCLEARResponse = (question) => {
  const q = question.toLowerCase();
  
  if (q.includes('prep') || q.includes('prepare') || q.includes('before the conversation')) {
    return {
      intro: "Here's how to prep for your leadership rep:",
      steps: [
        { letter: 'C', text: "Context: Write down the SPECIFIC situation you need to address (facts only, no judgment)" },
        { letter: 'L', text: "Listen first: Plan an opening question to understand their perspective before you speak" },
        { letter: 'E', text: "Explore: What behavior do you want to address? Be specific about what you observed" },
        { letter: 'A', text: "Action: What commitment will you ask for? Make it measurable and time-bound" },
        { letter: 'R', text: "Review: When will you follow up to check on the commitment?" }
      ],
      guardrail: "Remember: This prep is for thinking, not scripting. The real rep happens in person."
    };
  }
  
  if (q.includes('nervous') || q.includes('scared') || q.includes('anxious') || q.includes('worried')) {
    return {
      intro: "It's normal to feel nervous. Here's how to move forward:",
      steps: [
        { letter: 'C', text: "Context: Name what you're afraid of. Say it out loud: 'I'm worried that...'" },
        { letter: 'L', text: "Listen: Often we fear their reaction. But what if they actually want this feedback?" },
        { letter: 'E', text: "Explore: What's the cost of NOT having this conversation? It's usually higher than the risk" },
        { letter: 'A', text: "Action: Start small. Your opening doesn't have to be perfect. 'I wanted to talk about...' works" },
        { letter: 'R', text: "Review: After the rep, you'll realize it wasn't as bad as you imagined. This builds confidence" }
      ],
      guardrail: "Courage isn't the absence of fear. It's action despite fear. You've got this."
    };
  }
  
  if (q.includes('feedback') || q.includes('difficult conversation') || q.includes('give feedback')) {
    return {
      intro: "Use the CLEAR method for this:",
      steps: [
        { letter: 'C', text: "Context: Start by describing the specific situation you observed" },
        { letter: 'L', text: "Listen: Ask them how they perceived the situation first" },
        { letter: 'E', text: "Explore: 'What do you think led to this outcome?'" },
        { letter: 'A', text: "Action: Agree on 1-2 specific changes they'll make" },
        { letter: 'R', text: "Review: Set a time to check in on progress" }
      ]
    };
  }
  
  if (q.includes('1:1') || q.includes('one on one') || q.includes('coaching')) {
    return {
      intro: "Structure your 1:1 with CLEAR:",
      steps: [
        { letter: 'C', text: "Context: Start with their wins and recent work" },
        { letter: 'L', text: "Listen: Ask 'What's on your mind today?'" },
        { letter: 'E', text: "Explore: Dig into challenges with curious questions" },
        { letter: 'A', text: "Action: End with clear commitments from both sides" },
        { letter: 'R', text: "Review: Note follow-ups for next 1:1" }
      ]
    };
  }
  
  if (q.includes('conflict') || q.includes('disagree') || q.includes('tension')) {
    return {
      intro: "Navigate conflict with CLEAR:",
      steps: [
        { letter: 'C', text: "Context: Describe the situation objectively, no blame" },
        { letter: 'L', text: "Listen: Meet with each person separately first" },
        { letter: 'E', text: "Explore: 'What does a good outcome look like for you?'" },
        { letter: 'A', text: "Action: Find common ground, agree on working norms" },
        { letter: 'R', text: "Review: Check back in 1 week to assess progress" }
      ]
    };
  }
  
  if (q.includes('performance') || q.includes('underperform')) {
    return {
      intro: "Address performance using CLEAR:",
      steps: [
        { letter: 'C', text: "Context: 'I've noticed [specific examples] over the past [time]'" },
        { letter: 'L', text: "Listen: 'Help me understand what's happening from your perspective'" },
        { letter: 'E', text: "Explore: 'What barriers are you facing? What support do you need?'" },
        { letter: 'A', text: "Action: Co-create a specific improvement plan with deadlines" },
        { letter: 'R', text: "Review: 'Let's meet weekly to track progress together'" }
      ]
    };
  }
  
  // Default response
  return {
    intro: "Apply the CLEAR method to this situation:",
    steps: [
      { letter: 'C', text: "Context: Ground the conversation in specific facts" },
      { letter: 'L', text: "Listen: Seek to understand before being understood" },
      { letter: 'E', text: "Explore: Use open questions to uncover root causes" },
      { letter: 'A', text: "Action: Define clear, measurable next steps" },
      { letter: 'R', text: "Review: Set a follow-up to ensure accountability" }
    ]
  };
};

const RepUpCoach = ({ userId: _userId }) => {
  const { user } = useAppServices();
  const { cohortData, currentDayData } = useDailyPlan();
  
  const [userQuestion, setUserQuestion] = useState('');
  const [coachResponse, setCoachResponse] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const inputRef = useRef(null);

  const firstName = user?.displayName?.split(' ')[0] || 'Leader';

  // Handle asking a question
  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;
    
    const question = userQuestion.trim();
    setIsTyping(true);
    setUserQuestion('');
    
    // Add user message to chat history
    const newHistory = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(newHistory);
    
    try {
      const functions = getFunctions();
      const reppyCoach = httpsCallable(functions, 'reppyCoach');
      
      const coachingContext = `You are "RepUp" - a professional AI leadership coach and your partner in developing leadership skills.
      
Your personality:
- Confident, direct, and supportive
- Professional yet approachable
- Reference the CLEAR method (Context, Listen, Explore, Action, Review) when giving feedback advice
- Keep responses concise (2-4 paragraphs max)
- End with an actionable suggestion or thought-provoking question

The user is in the RepUp standalone app focused on leadership conditioning.

Today's context:
- Day ${currentDayData?.dayNumber || 1} of their program
${cohortData?.name ? `- Cohort: ${cohortData.name}` : ''}

Help them with their question. Be practical and actionable.`;

      const result = await reppyCoach({
        messages: newHistory,
        context: {
          userName: firstName,
          userRole: 'leader',
          sessionType: 'repup-standalone',
          customContext: coachingContext,
        },
      });
      
      const aiResponse = result.data.message;
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setCoachResponse({ 
        question, 
        aiResponse,
        isAI: true 
      });
      
    } catch (error) {
      console.error('RepUp AI error:', error);
      // Fallback to CLEAR method response
      const fallback = generateCLEARResponse(question);
      setCoachResponse({ question, ...fallback, isFallback: true });
    } finally {
      setIsTyping(false);
    }
  };

  // Reset conversation
  const handleNewConversation = () => {
    setCoachResponse(null);
    setChatHistory([]);
    setUserQuestion('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-[calc(100vh-108px)] p-4 bg-slate-50">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Welcome state - no conversation yet */}
        {!coachResponse && !isTyping && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-corporate-navy to-corporate-teal rounded-full flex items-center justify-center mb-4 shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-corporate-navy mb-2">Ask Me Anything</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              I'm your AI leadership coach. Ask me about difficult conversations, 
              giving feedback, running 1:1s, or any leadership challenge.
            </p>
            
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {QUICK_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setUserQuestion(item.prompt)}
                  className="text-sm px-4 py-2 bg-white border border-slate-200 
                             text-slate-700 rounded-full hover:bg-corporate-teal/10 
                             hover:border-corporate-teal hover:text-corporate-navy
                             transition-colors shadow-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-corporate-navy to-corporate-teal rounded-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div>
                <p className="font-medium text-corporate-navy">RepUp is thinking...</p>
                <p className="text-sm text-slate-500">Preparing your coaching response</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Coach Response */}
        {coachResponse && !isTyping && (
          <div className="space-y-4">
            {/* User's question */}
            <div className="bg-slate-100 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1 font-medium">You asked:</p>
              <p className="text-corporate-navy font-medium">{coachResponse.question}</p>
            </div>
            
            {/* AI Response */}
            {coachResponse.isAI && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-corporate-teal/30">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-corporate-navy to-corporate-teal rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-corporate-navy">RepUp</p>
                    <p className="text-xs text-slate-500">AI Leadership Coach</p>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {coachResponse.aiResponse}
                  </p>
                </div>
              </div>
            )}
            
            {/* Fallback CLEAR response */}
            {!coachResponse.isAI && coachResponse.steps && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                {coachResponse.isFallback && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>AI unavailable - showing framework response</span>
                  </div>
                )}
                
                <p className="font-semibold text-corporate-navy mb-4">{coachResponse.intro}</p>
                
                <div className="space-y-3">
                  {coachResponse.steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-corporate-navy to-corporate-teal text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        {step.letter}
                      </div>
                      <p className="text-sm text-slate-700 pt-1">{step.text}</p>
                    </motion.div>
                  ))}
                </div>
                
                {coachResponse.guardrail && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {coachResponse.guardrail}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* New conversation button */}
            <button
              onClick={handleNewConversation}
              className="w-full py-3 text-corporate-teal font-medium hover:bg-corporate-teal/10 rounded-xl transition-colors"
            >
              ← Ask another question
            </button>
          </div>
        )}
        
        {/* Input area - always visible */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAskQuestion()}
              placeholder="Ask me anything about leadership..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
                         text-base focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleAskQuestion}
              disabled={!userQuestion.trim() || isTyping}
              className="px-5 py-3 bg-gradient-to-r from-corporate-navy to-corporate-teal 
                         text-white rounded-xl hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Spacer for fixed input */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default RepUpCoach;
