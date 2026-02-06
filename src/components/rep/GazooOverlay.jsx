// src/components/rep/GazooOverlay.jsx
// The Great Gazoo - Active AI Coach that guides users AND answers questions
// Uses CLEAR feedback method for coaching responses

import React, { useState, useMemo, useRef } from 'react';
import { 
  X, Minus, Sparkles, CheckCircle2, Send,
  ArrowRight, Play, Target, BookOpen, Loader2,
  ClipboardCheck, MessageSquare, Award, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import GazooSpotlight from './GazooSpotlight';

// CLEAR Feedback Method framework
const CLEAR_METHOD = {
  C: { label: 'Context', desc: 'Set the scene - what happened?' },
  L: { label: 'Listen', desc: 'Understand their perspective first' },
  E: { label: 'Explore', desc: 'Ask questions to dig deeper' },
  A: { label: 'Action', desc: 'Agree on specific next steps' },
  R: { label: 'Review', desc: 'Schedule follow-up to check progress' }
};

// Screen-specific guidance
const SCREEN_GUIDANCE = {
  dashboard: {
    icon: Target,
    title: "Your Command Center",
    getInstructions: (ctx) => {
      if (!ctx.prepComplete && ctx.isPrep) {
        return [
          { text: "First, complete your preparation items below", highlight: true },
          { text: "Tap each item to mark it complete" },
          { text: "Once done, your daily journey begins!" }
        ];
      }
      if (ctx.incompleteActions > 0) {
        return [
          { text: `You have ${ctx.incompleteActions} action${ctx.incompleteActions > 1 ? 's' : ''} to complete`, highlight: true },
          { text: "Start with the first one - build momentum!" },
          { text: "Each completed action strengthens your leadership" }
        ];
      }
      return [
        { text: "Outstanding! You've completed today's actions", highlight: true },
        { text: "Check your Leadership Roadmap for overall progress" },
        { text: "Consider reviewing content in the Library" }
      ];
    }
  },
  dailyPractice: {
    icon: ClipboardCheck,
    title: "Daily Practice",
    getInstructions: () => [
      { text: "Set your intention for today", highlight: true },
      { text: "Be specific - what leadership skill will you practice?" },
      { text: "Write it down, then commit to it" }
    ]
  },
  developmentplan: {
    icon: BookOpen,
    title: "Development Plan",
    getInstructions: (ctx) => [
      { text: `You're on Day ${ctx.dayNumber} of your journey`, highlight: true },
      { text: "Review your current skill focus" },
      { text: "Complete each module in order for best results" }
    ]
  },
  conditioning: {
    icon: Target,
    title: "Arena Conditioning",
    getInstructions: () => [
      { text: "Log your leadership reps here", highlight: true },
      { text: "Document real moments from your work" },
      { text: "Quality over quantity - be specific!" }
    ]
  },
  library: {
    icon: BookOpen,
    title: "Content Library",
    getInstructions: () => [
      { text: "Browse curated leadership content", highlight: true },
      { text: "Videos, readings, and tools await" },
      { text: "Pick something aligned with your current focus" }
    ]
  }
};

// CLEAR-based coaching responses
const generateCLEARResponse = (question) => {
  const q = question.toLowerCase();
  
  // Feedback-related questions
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
  
  // Performance issues
  if (q.includes('performance') || q.includes('underperform') || q.includes('not meeting')) {
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
  
  // Coaching / 1:1 questions
  if (q.includes('1:1') || q.includes('one on one') || q.includes('coaching') || q.includes('develop')) {
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
  
  // Team conflict
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
  
  // Default helpful response
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

// Gazoo's personality
const GAZOO_INTROS = [
  "Alright, dum-dum, here's what to do:",
  "Listen up! Your next steps:",
  "Pay attention now:",
  "Here's your mission:",
  "Focus on this:"
];

const GazooOverlay = ({ onClose }) => {
  const { user, navigate, currentScreen } = useAppServices();
  const { 
    currentDayData, 
    currentPhase, 
    prepRequirementsComplete,
    cohortData 
  } = useDailyPlan();

  const [mode, setMode] = useState('guide'); // 'guide' or 'coach'
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [coachResponse, setCoachResponse] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);

  const firstName = user?.displayName?.split(' ')[0] || 'Leader';

  // Build context
  const context = useMemo(() => ({
    isPrep: currentPhase?.id === 'pre-start',
    prepComplete: prepRequirementsComplete?.allComplete,
    incompleteActions: (currentDayData?.actions || []).filter(a => !a.isCompleted).length,
    dayNumber: currentDayData?.dayNumber || 1,
    cohortName: cohortData?.name,
  }), [currentPhase, prepRequirementsComplete, currentDayData, cohortData]);

  // Get current screen guidance
  const screenKey = useMemo(() => {
    const screen = (currentScreen || 'dashboard').toLowerCase();
    if (screen.includes('dashboard')) return 'dashboard';
    if (screen.includes('daily') || screen.includes('practice')) return 'dailyPractice';
    if (screen.includes('develop') || screen.includes('devplan')) return 'developmentplan';
    if (screen.includes('condition') || screen.includes('arena')) return 'conditioning';
    if (screen.includes('library') || screen.includes('content')) return 'library';
    return 'dashboard';
  }, [currentScreen]);

  const guidance = SCREEN_GUIDANCE[screenKey] || SCREEN_GUIDANCE.dashboard;
  const instructions = guidance.getInstructions(context);
  const GuidanceIcon = guidance.icon;

  const intro = GAZOO_INTROS[Math.floor(Math.random() * GAZOO_INTROS.length)];

  // Handle asking a question
  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;
    
    setIsTyping(true);
    setMode('coach');
    
    // Simulate thinking
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    
    const response = generateCLEARResponse(userQuestion);
    setCoachResponse({ question: userQuestion, ...response });
    setUserQuestion('');
    setIsTyping(false);
  };

  // Minimized state
  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 px-4 py-3 
                   bg-gradient-to-r from-lime-500 to-emerald-600 text-white
                   rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105
                   border-2 border-white/30"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-bold">Gazoo</span>
        <span className="flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 right-6 z-[90] w-96 max-w-[calc(100vw-3rem)]"
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-lime-500/20 overflow-hidden">
        
        {/* Header - with VISIBLE buttons */}
        <div className="bg-gradient-to-r from-lime-500 to-emerald-600 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight text-white">The Great Gazoo</h3>
                <p className="text-xs text-white/80 mt-0.5">Coaching {firstName}</p>
              </div>
            </div>
            {/* VISIBLE minimize and close buttons - solid backgrounds for visibility */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 flex items-center justify-center bg-white text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors shadow-md"
                title="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-white text-red-500 hover:bg-red-50 rounded-full transition-colors shadow-md"
                title="Close Gazoo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setMode('guide'); setCoachResponse(null); }}
            className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'guide' 
                ? 'bg-lime-50 text-lime-700 border-b-2 border-lime-500' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Guide Me</span>
          </button>
          <button
            onClick={() => setMode('coach')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'coach' 
                ? 'bg-lime-50 text-lime-700 border-b-2 border-lime-500' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ask Coach</span>
          </button>
        </div>

        {/* Content area */}
        <div className="max-h-[350px] overflow-y-auto">
          
          {/* GUIDE MODE */}
          {mode === 'guide' && (
            <div className="p-4 space-y-3">
              {/* Screen indicator */}
              <div className="flex items-center gap-2 text-xs text-lime-600 bg-lime-50 px-3 py-1.5 rounded-full w-fit">
                <GuidanceIcon className="w-3 h-3" />
                <span className="font-medium">{guidance.title}</span>
                <Play className="w-3 h-3" />
              </div>

              {/* Intro */}
              <p className="text-sm font-semibold text-corporate-navy">
                {intro}
              </p>

              {/* Instructions */}
              <div className="space-y-2">
                {instructions.map((instruction, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-start gap-3 p-2.5 rounded-lg ${
                      instruction.highlight 
                        ? 'bg-lime-50 border border-lime-200' 
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      instruction.highlight 
                        ? 'bg-lime-500 text-white' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <p className={`text-sm ${
                      instruction.highlight 
                        ? 'font-semibold text-lime-800' 
                        : 'text-slate-600'
                    }`}>
                      {instruction.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Encouragement */}
              <div className="flex items-center justify-center gap-2 pt-2 text-sm text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>You've got this!</span>
              </div>
            </div>
          )}

          {/* COACH MODE */}
          {mode === 'coach' && (
            <div className="p-4 space-y-4">
              {/* No response yet - show prompt */}
              {!coachResponse && !isTyping && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto bg-lime-100 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-lime-600" />
                  </div>
                  <h4 className="font-semibold text-corporate-navy mb-1">Ask Me Anything</h4>
                  <p className="text-sm text-slate-500 mb-3">
                    I'll use the CLEAR feedback method to coach you through any leadership challenge.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['How do I give tough feedback?', 'Handling underperformance', 'Running better 1:1s'].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setUserQuestion(q)}
                        className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-lime-100 text-slate-600 hover:text-lime-700 rounded-full transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-lime-500 animate-spin" />
                  <span className="text-sm text-slate-600">Gazoo is thinking...</span>
                </div>
              )}

              {/* CLEAR Response */}
              {coachResponse && !isTyping && (
                <div className="space-y-3">
                  {/* Question shown */}
                  <div className="bg-slate-100 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">You asked:</p>
                    <p className="text-sm font-medium text-corporate-navy">{coachResponse.question}</p>
                  </div>

                  {/* CLEAR response */}
                  <p className="text-sm font-semibold text-lime-700">{coachResponse.intro}</p>
                  
                  <div className="space-y-2">
                    {coachResponse.steps.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lime-500 to-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                          {step.letter}
                        </div>
                        <p className="text-sm text-slate-700">{step.text}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Ask another */}
                  <button
                    onClick={() => setCoachResponse(null)}
                    className="text-sm text-lime-600 hover:text-lime-700 font-medium"
                  >
                    ← Ask another question
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input area - always visible in coach mode */}
        {mode === 'coach' && !coachResponse && (
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="Describe your leadership challenge..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
              <button
                onClick={handleAskQuestion}
                disabled={!userQuestion.trim() || isTyping}
                className="px-4 py-2.5 bg-gradient-to-r from-lime-500 to-emerald-600 
                           text-white rounded-xl hover:opacity-90 transition-opacity
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Footer for guide mode */}
        {mode === 'guide' && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setMode('coach')}
              className="text-xs text-lime-600 hover:text-lime-700 font-medium flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              Need help?
            </button>
            <button
              onClick={() => {
                // Launch spotlight tour on dashboard
                if (screenKey === 'dashboard') {
                  setShowSpotlight(true);
                  setIsMinimized(true); // Minimize Gazoo while spotlight is active
                } else {
                  navigate('dashboard');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-lime-500 to-emerald-600 
                         text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <span>Let's Go</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Spotlight Tour */}
      <GazooSpotlight
        isOpen={showSpotlight}
        onClose={() => {
          setShowSpotlight(false);
          setIsMinimized(false);
        }}
        screenContext={screenKey}
        onComplete={() => {
          setShowSpotlight(false);
          setIsMinimized(false);
        }}
      />
    </motion.div>
  );
};

export default GazooOverlay;
