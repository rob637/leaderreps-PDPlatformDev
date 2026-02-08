// src/components/rep/RepUpOverlay.jsx
// RepUp - Two-feature coach: 1) Reps (Conditioning) and 2) Coach in your Pocket
// Uses REAL AI for coaching responses

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  X, Minus, Sparkles, CheckCircle2, Send,
  ArrowRight, Play, Target, BookOpen, Loader2,
  ClipboardCheck, MessageSquare, Award, HelpCircle,
  AlertCircle, Dumbbell, Plus, ChevronRight, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import conditioningService, { REP_STATUS, REP_TYPES } from '../../services/conditioningService';
// SPOTLIGHT TOUR - COMMENTED OUT FOR LATER USE
// import RepUpSpotlight from './RepUpSpotlight';

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
      { text: "Complete at least 1 rep per week" },
      { text: "Use Prep to plan, then Debrief after" }
    ],
    quickPrompts: [
      'How do I prep for a rep?',
      'Help me choose a rep',
      'Nervous about this conversation'
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
  
  // ====================
  // CONDITIONING-SPECIFIC: Rep Prep
  // ====================
  if (q.includes('prep') || q.includes('prepare') || q.includes('before the conversation') || q.includes('how do i start')) {
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
  
  // CONDITIONING-SPECIFIC: Debrief/Reflection
  if (q.includes('debrief') || q.includes('reflect') || q.includes('after the conversation') || q.includes('went well') || q.includes('went wrong')) {
    return {
      intro: "Let's debrief your leadership rep:",
      steps: [
        { letter: 'C', text: "Context: What did you actually SAY? (Try to remember your exact words)" },
        { letter: 'L', text: "Listen: How did they respond? What was their body language/tone?" },
        { letter: 'E', text: "Explore: What surprised you? What was harder/easier than expected?" },
        { letter: 'A', text: "Action: Did you get a commitment? If not, what blocked it?" },
        { letter: 'R', text: "Review: What would you do DIFFERENTLY next time? Be specific." }
      ],
      guardrail: "Submit this debrief today for Level 1 evidence credit!"
    };
  }
  
  // CONDITIONING-SPECIFIC: What rep to do
  if (q.includes('what rep') || q.includes('which rep') || q.includes('pick a rep') || q.includes('chose a rep') || q.includes('commit to')) {
    return {
      intro: "Choose a rep that challenges you:",
      steps: [
        { letter: 'C', text: "Context: Look for situations where you've been AVOIDING a conversation" },
        { letter: 'L', text: "Listen to your gut: The conversation you're dreading is probably the one you need" },
        { letter: 'E', text: "Explore different types: Feedback, 1:1, Tension - which have you avoided lately?" },
        { letter: 'A', text: "Action: Pick ONE specific person and situation - not 'someone on my team', but 'Maya about the deadline'" },
        { letter: 'R', text: "Review: Commit to a deadline. When will this conversation happen?" }
      ],
      guardrail: "Growth happens outside your comfort zone. Choose the rep that makes you a little nervous."
    };
  }
  
  // CONDITIONING-SPECIFIC: Scared/nervous about rep
  if (q.includes('nervous') || q.includes('scared') || q.includes('anxious') || q.includes('worried') || q.includes('avoid')) {
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

/* REPUP_INTROS - COMMENTED OUT FOR LATER USE
const REPUP_INTROS = [
  "Here's how to approach this:",
  "Let's break this down:",
  "Your next steps:",
  "Here's the game plan:",
  "Focus on this:"
];
*/

const RepUpOverlay = ({ onClose }) => {
  const { user, navigate, db, developmentPlanData } = useAppServices();
  const { currentScreen } = useNavigation();
  const { 
    currentDayData, 
    currentPhase, 
    prepRequirementsComplete,
    cohortData 
  } = useDailyPlan();

  // Mode: 'reps' (conditioning) or 'coach' (AI chat)
  const [mode, setMode] = useState('reps');
  const [isMinimized, setIsMinimized] = useState(false);
  // SPOTLIGHT TOUR - STATE COMMENTED OUT FOR LATER USE
  // const [showSpotlight, setShowSpotlight] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [coachResponse, setCoachResponse] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [_aiError, setAiError] = useState(null);
  const inputRef = useRef(null);

  // Conditioning state
  const userId = user?.uid;
  const cohortId = developmentPlanData?.cohortId || cohortData?.id || user?.cohortId;
  const [reps, setReps] = useState([]);
  const [weekStatus, setWeekStatus] = useState(null);
  const [repsLoading, setRepsLoading] = useState(true);

  const firstName = user?.displayName?.split(' ')[0] || 'Leader';

  // Load conditioning data
  const loadReps = useCallback(async () => {
    if (!userId || !cohortId || !db) {
      setRepsLoading(false);
      return;
    }
    try {
      const [active, status] = await Promise.all([
        conditioningService.getActiveReps(db, userId, cohortId),
        conditioningService.getWeeklyStatus(db, userId, null, cohortId)
      ]);
      setReps(active || []);
      setWeekStatus(status);
    } catch (err) {
      console.error('Error loading reps:', err);
    } finally {
      setRepsLoading(false);
    }
  }, [userId, cohortId, db]);

  useEffect(() => {
    loadReps();
  }, [loadReps]);

  // Build context
  const context = useMemo(() => ({
    isPrep: currentPhase?.id === 'pre-start',
    prepComplete: prepRequirementsComplete?.allComplete,
    incompleteActions: (currentDayData?.actions || []).filter(a => !a.isCompleted).length,
    dayNumber: currentDayData?.dayNumber || 1,
    cohortName: cohortData?.name,
  }), [currentPhase, prepRequirementsComplete, currentDayData, cohortData]);

  // Get current screen for context-aware coaching prompts
  const screenKey = useMemo(() => {
    const screen = (currentScreen || 'dashboard').toLowerCase();
    if (screen.includes('dashboard')) return 'dashboard';
    if (screen.includes('daily') || screen.includes('practice')) return 'dailyPractice';
    if (screen.includes('develop') || screen.includes('devplan')) return 'developmentplan';
    if (screen.includes('condition') || screen.includes('arena')) return 'conditioning';
    if (screen.includes('library') || screen.includes('content')) return 'library';
    return 'dashboard';
  }, [currentScreen]);

  // Used for quick prompts in Coach mode
  const guidance = SCREEN_GUIDANCE[screenKey] || SCREEN_GUIDANCE.dashboard;

  // Handle asking a question - REAL AI
  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;
    
    const question = userQuestion.trim();
    setIsTyping(true);
    setMode('coach');
    setAiError(null);
    setUserQuestion('');
    
    // Add user message to chat history
    const newHistory = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(newHistory);
    
    try {
      const functions = getFunctions();
      const reppyCoach = httpsCallable(functions, 'reppyCoach');
      
      // Build coaching context for RepUp
      const coachingContext = `You are "RepUp" - a professional AI leadership coach and your partner in developing leadership skills.
      
Your personality:
- Confident, direct, and supportive
- Professional yet approachable
- Reference the CLEAR method (Context, Listen, Explore, Action, Review) when giving feedback advice
- Keep responses concise (2-4 paragraphs max)
- End with an actionable suggestion or thought-provoking question

The user is a leader in a professional development program. They are currently on the ${screenKey} screen of the app.

Today's context:
- Day ${context.dayNumber} of their program
- Incomplete actions: ${context.incompleteActions}
- Phase: ${context.isPrep ? 'Preparation' : 'Development'}
${context.cohortName ? `- Cohort: ${context.cohortName}` : ''}

Help them with their question. Be practical and actionable.`;

      const result = await reppyCoach({
        messages: newHistory,
        context: {
          userName: firstName,
          userRole: 'leader',
          sessionType: 'repup-coach',
          customContext: coachingContext,
        },
      });
      
      const aiResponse = result.data.message;
      
      // Add AI response to history
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setCoachResponse({ 
        question, 
        aiResponse,
        isAI: true 
      });
      
    } catch (error) {
      console.error('RepUp AI error:', error);
      setAiError('Having trouble connecting to AI. Try again?');
      // Fallback to CLEAR method response
      const fallback = generateCLEARResponse(question);
      setCoachResponse({ question, ...fallback, isFallback: true });
    } finally {
      setIsTyping(false);
    }
  };

  // Minimized state
  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 px-4 py-3 
                   bg-gradient-to-r from-corporate-navy to-corporate-teal text-white
                   rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105
                   border-2 border-white/30"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-bold">RepUp</span>
        <span className="flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </span>
      </motion.button>
      /* SPOTLIGHT TOUR - COMMENTED OUT FOR LATER USE
      <RepUpSpotlight
        isOpen={showSpotlight}
        onClose={() => setShowSpotlight(false)}
        screenContext="dashboard"
        onComplete={() => setShowSpotlight(false)}
      />
      */
    );
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed z-[90] w-96 max-w-[calc(100vw-3rem)] bottom-6 right-6"
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-corporate-navy/20 overflow-hidden">
        
        {/* Header - sleek design */}
        <div className="bg-gradient-to-r from-corporate-navy to-corporate-teal p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight text-white">RepUp</h3>
              </div>
            </div>
            {/* Minimize and close buttons */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsMinimized(true)}
                className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white font-bold text-sm"
                title="Minimize"
              >
                –
              </button>
              <button 
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-red-500/80 rounded-full transition-colors text-white font-bold text-sm"
                title="Close RepUp"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Mode tabs - Reps and Coach */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setMode('reps'); setCoachResponse(null); loadReps(); }}
            className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'reps' 
                ? 'bg-corporate-teal/10 text-corporate-teal border-b-2 border-corporate-teal' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Reps</span>
          </button>
          <button
            onClick={() => setMode('coach')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'coach' 
                ? 'bg-corporate-teal/10 text-corporate-teal border-b-2 border-corporate-teal' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Coach</span>
          </button>
        </div>

        {/* Content area */}
        <div className="max-h-[350px] overflow-y-auto">
          
          {/* REPS MODE - Compact Conditioning */}
          {mode === 'reps' && (
            <div className="p-4 space-y-3">
              {/* Loading state */}
              {repsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-corporate-teal animate-spin" />
                </div>
              ) : !cohortId ? (
                /* No cohort enrolled */
                <div className="text-center py-6">
                  <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Join a cohort to start tracking reps
                  </p>
                </div>
              ) : (
                <>
                  {/* Week Status */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    weekStatus?.requiredRepCompleted 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-amber-50 border border-amber-200'
                  }`}>
                    {weekStatus?.requiredRepCompleted ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-green-800 text-sm">Weekly Rep Done!</p>
                          <p className="text-xs text-green-600">{weekStatus?.totalCompleted || 0} completed this week</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-amber-800 text-sm">1 Rep Required</p>
                          <p className="text-xs text-amber-600">
                            {reps.length > 0 
                              ? `${reps.length} active rep${reps.length !== 1 ? 's' : ''}`
                              : 'Commit to a rep to start'
                            }
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Active Reps List */}
                  {reps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Reps</p>
                      {reps.slice(0, 3).map((rep) => {
                        const repType = REP_TYPES.find(t => t.id === rep.repType);
                        return (
                          <motion.div
                            key={rep.id}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                            onClick={() => navigate('conditioning')}
                          >
                            <div className="w-8 h-8 bg-corporate-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Dumbbell className="w-4 h-4 text-corporate-teal" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-corporate-navy truncate">{rep.person}</p>
                              <p className="text-xs text-slate-500">{repType?.label || rep.repType}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </motion.div>
                        );
                      })}
                      {reps.length > 3 && (
                        <p className="text-xs text-slate-500 text-center">+{reps.length - 3} more</p>
                      )}
                    </div>
                  )}

                  {/* Quick Add Button */}
                  <button
                    onClick={() => navigate('conditioning')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                               bg-gradient-to-r from-corporate-navy to-corporate-teal
                               text-white text-sm font-medium rounded-lg
                               hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{reps.length === 0 ? 'Commit to a Rep' : 'Manage Reps'}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* COACH MODE */}
          {mode === 'coach' && (
            <div className="p-4 space-y-4">
              {/* No response yet - show prompt */}
              {!coachResponse && !isTyping && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto bg-corporate-teal/10 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-corporate-teal" />
                  </div>
                  <h4 className="font-semibold text-corporate-navy mb-1">Ask Me Anything</h4>
                  <p className="text-sm text-slate-500 mb-3">
                    I'll use the CLEAR feedback method to coach you through any leadership challenge.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(guidance.quickPrompts || ['How do I give tough feedback?', 'Handling underperformance', 'Running better 1:1s']).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setUserQuestion(q)}
                        className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-corporate-teal/10 text-slate-600 hover:text-corporate-navy rounded-full transition-colors"
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
                  <Loader2 className="w-5 h-5 text-corporate-teal animate-spin" />
                  <span className="text-sm text-slate-600">RepUp is thinking...</span>
                </div>
              )}

              {/* Coach Response */}
              {coachResponse && !isTyping && (
                <div className="space-y-3">
                  {/* Question shown */}
                  <div className="bg-slate-100 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">You asked:</p>
                    <p className="text-sm font-medium text-corporate-navy">{coachResponse.question}</p>
                  </div>

                  {/* AI Response */}
                  {coachResponse.isAI && (
                    <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-4 border border-corporate-teal/30">
                      <div className="prose prose-sm max-w-none text-slate-700">
                        <p className="whitespace-pre-wrap">{coachResponse.aiResponse}</p>
                      </div>
                    </div>
                  )}

                  {/* Fallback CLEAR response */}
                  {!coachResponse.isAI && coachResponse.steps && (
                    <>
                      {coachResponse.isFallback && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <AlertCircle className="w-3 h-3" />
                          <span>AI unavailable - showing framework response</span>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-corporate-navy">{coachResponse.intro}</p>
                      
                      <div className="space-y-2">
                        {coachResponse.steps.map((step, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-corporate-navy to-corporate-teal text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                              {step.letter}
                            </div>
                            <p className="text-sm text-slate-700">{step.text}</p>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Guardrail message for Conditioning context */}
                  {coachResponse.guardrail && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700 font-medium flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" />
                        {coachResponse.guardrail}
                      </p>
                    </div>
                  )}

                  {/* Ask another */}
                  <button
                    onClick={() => { setCoachResponse(null); setChatHistory([]); }}
                    className="text-sm text-corporate-teal hover:text-corporate-navy font-medium"
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
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              />
              <button
                onClick={handleAskQuestion}
                disabled={!userQuestion.trim() || isTyping}
                className="px-4 py-2.5 bg-gradient-to-r from-corporate-navy to-corporate-teal 
                           text-white rounded-xl hover:opacity-90 transition-opacity
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* GUIDE MODE FOOTER - COMMENTED OUT FOR LATER USE
        {mode === 'guide' && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setMode('coach')}
              className="text-xs text-corporate-teal hover:text-corporate-navy font-medium flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              Need help?
            </button>
            <button
              onClick={() => {
                const actualScreen = (currentScreen || 'dashboard').toLowerCase();
                if (!actualScreen.includes('dashboard')) {
                  navigate('dashboard');
                  setTimeout(() => setShowSpotlight(true), 600);
                } else {
                  setShowSpotlight(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-corporate-navy to-corporate-teal 
                         text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <span>Let's Go</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
        */}
      </div>

      {/* SPOTLIGHT TOUR - COMMENTED OUT FOR LATER USE
      <RepUpSpotlight
        isOpen={showSpotlight}
        onClose={() => {
          setShowSpotlight(false);
        }}
        screenContext="dashboard"
        onComplete={() => {
          setShowSpotlight(false);
        }}
      />
      */}
    </motion.div>
  );
};

export default RepUpOverlay;
