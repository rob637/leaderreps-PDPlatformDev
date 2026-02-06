// src/components/rep/GazooOverlay.jsx
// The Great Gazoo - Active AI Coach that guides users through the app
// Proactively tells users what to do based on current screen + context

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, ChevronRight, Sparkles, CheckCircle2, 
  ArrowRight, Play, Target, BookOpen,
  ClipboardCheck, MessageSquare, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';

// Screen-specific guidance that Gazoo provides
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
  leadershipRoadmap: {
    icon: Award,
    title: "Leadership Roadmap",
    getInstructions: () => [
      { text: "Track your overall progress here", highlight: true },
      { text: "Each completed phase unlocks new capabilities" },
      { text: "Focus on depth, not speed" }
    ]
  },
  conditioning: {
    icon: Target,
    title: "Arena Conditioning",
    getInstructions: (ctx) => {
      if (ctx.needsWeeklyRep) {
        return [
          { text: "You need to complete a rep this week!", highlight: true },
          { text: "Tap 'Log a Rep' to record a leadership moment" },
          { text: "Be specific about the situation and your action" }
        ];
      }
      return [
        { text: "You're on track with your conditioning", highlight: true },
        { text: "Keep documenting your leadership moments" },
        { text: "Quality reps build lasting skills" }
      ];
    }
  },
  reflection: {
    icon: MessageSquare,
    title: "Reflection Time",
    getInstructions: () => [
      { text: "Reflect on your leadership today", highlight: true },
      { text: "What went well? What would you do differently?" },
      { text: "Honest reflection accelerates growth" }
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
  },
  coaching: {
    icon: MessageSquare,
    title: "Coaching Sessions",
    getInstructions: () => [
      { text: "Review your coaching schedule", highlight: true },
      { text: "Prepare questions before each session" },
      { text: "Take notes on key insights" }
    ]
  }
};

// Gazoo's personality phrases
const GAZOO_INTROS = [
  "Alright, dum-dum, here's what to do:",
  "Listen up! Your next steps:",
  "Pay attention now:",
  "Here's your mission:",
  "Focus on this:"
];

const GAZOO_ENCOURAGEMENT = [
  "You've got this!",
  "One step at a time!",
  "Leaders take action!",
  "Stay focused!",
  "Make it happen!"
];

const GazooOverlay = ({ onClose }) => {
  const { user, navigate, currentScreen } = useAppServices();
  const { 
    currentDayData, 
    currentPhase, 
    prepRequirementsComplete,
    cohortData 
  } = useDailyPlan();

  const [isExpanded, setIsExpanded] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] || 'Leader';

  // Build context for guidance
  const context = useMemo(() => ({
    isPrep: currentPhase?.id === 'pre-start',
    prepComplete: prepRequirementsComplete?.allComplete,
    incompleteActions: (currentDayData?.actions || []).filter(a => !a.isCompleted).length,
    completedActions: (currentDayData?.actions || []).filter(a => a.isCompleted).length,
    dayNumber: currentDayData?.dayNumber || 1,
    cohortName: cohortData?.name,
    needsWeeklyRep: true // Could be calculated from conditioning data
  }), [currentPhase, prepRequirementsComplete, currentDayData, cohortData]);

  // Get current screen guidance
  const screenKey = useMemo(() => {
    const screen = (currentScreen || 'dashboard').toLowerCase();
    // Map screen names to guidance keys
    if (screen.includes('dashboard')) return 'dashboard';
    if (screen.includes('daily') || screen.includes('practice')) return 'dailyPractice';
    if (screen.includes('develop') || screen.includes('devplan')) return 'developmentplan';
    if (screen.includes('roadmap')) return 'leadershipRoadmap';
    if (screen.includes('condition') || screen.includes('arena')) return 'conditioning';
    if (screen.includes('reflect')) return 'reflection';
    if (screen.includes('library') || screen.includes('content')) return 'library';
    if (screen.includes('coach')) return 'coaching';
    return 'dashboard';
  }, [currentScreen]);

  const guidance = SCREEN_GUIDANCE[screenKey] || SCREEN_GUIDANCE.dashboard;
  const instructions = guidance.getInstructions(context);
  const GuidanceIcon = guidance.icon;

  // Random intro phrase - changes when screen changes
  const intro = GAZOO_INTROS[Math.floor(Math.random() * GAZOO_INTROS.length)];
  const encouragement = GAZOO_ENCOURAGEMENT[Math.floor(Math.random() * GAZOO_ENCOURAGEMENT.length)];

  // Track screen changes to show new guidance
  useEffect(() => {
    if (hasInteracted) {
      setIsExpanded(true); // Auto-expand on screen change
    }
  }, [screenKey, hasInteracted]);

  // Minimized floating button
  if (!isExpanded) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => { setIsExpanded(true); setHasInteracted(true); }}
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
      className="fixed bottom-6 right-6 z-[90] w-80 max-w-[calc(100vw-3rem)]"
    >
      {/* Main guidance card */}
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-lime-500/20 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-lime-500 to-emerald-600 p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">The Great Gazoo</h3>
                <p className="text-xs text-white/80 mt-0.5">Guiding {firstName}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors -mr-1 -mt-1"
              title="Dismiss Gazoo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current screen indicator */}
        <div className="px-4 py-2.5 bg-lime-50 border-b border-lime-100 flex items-center gap-2">
          <GuidanceIcon className="w-4 h-4 text-lime-600" />
          <span className="text-sm font-medium text-lime-700">{guidance.title}</span>
          <div className="ml-auto flex items-center gap-1 text-xs text-lime-600">
            <Play className="w-3 h-3" />
            <span>Active</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 space-y-3">
          {/* Gazoo's intro */}
          <p className="text-sm font-semibold text-corporate-navy">
            {intro}
          </p>

          {/* Step-by-step instructions */}
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
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
            <span>{encouragement}</span>
          </div>
        </div>

        {/* Action footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(false)}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Minimize
          </button>
          <button
            onClick={() => {
              // Navigate to most relevant action based on context
              if (screenKey === 'dashboard' && context.incompleteActions > 0) {
                navigate('dailyPractice');
              } else if (screenKey !== 'dashboard') {
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
      </div>

      {/* Floating tip bubble */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg"
      >
        💡 TIP
      </motion.div>
    </motion.div>
  );
};

export default GazooOverlay;
