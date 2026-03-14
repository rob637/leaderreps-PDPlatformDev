import re

new_content = """// src/components/widgets/ConditioningTutorialWidget.jsx
// Interactive tutorial walkthrough for the Conditioning (Real Reps) system
// Focused on Set Clear Expectations (SCE) and Deliver Reinforcing Feedback (DRF)

import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { 
  X, ChevronRight, ChevronLeft, CheckCircle2, 
  Dumbbell, Target, ClipboardCheck, MessageSquare,
  AlertTriangle, Star, Trophy, Play, Clock, User, 
  Calendar, Shield, CheckCircle, XCircle, ArrowUpRight,
  ThumbsUp
} from 'lucide-react';

// =====================================================
// MOCKUP COMPONENTS - Show real examples of Conditioning Reps
// =====================================================

// Sample DRF Rep
const MockupDRFRep = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-700/50 p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
        <ThumbsUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">Reinforcing Feedback</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Michael P.</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
          "Michael, the way you handled that client escalation yesterday was excellent. You stayed calm and clearly outlined the next steps..."
        </p>
      </div>
    </div>
  </div>
);

// Sample SCE Rep
const MockupSCERep = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-blue-200 dark:border-blue-700/50 p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">Set Clear Expectations</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Elena D.</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
          "Elena, for the Q3 pitch deck, success looks like having the initial shell completed by Thursday EOD, with data verified against our main dashboard."
        </p>
      </div>
    </div>
  </div>
);

// Commit Form Preview showing the commitment process
const MockupCommitForm = () => (
  <div className="mt-4 bg-gradient-to-br from-corporate-navy to-corporate-navy/90 rounded-xl p-4 text-white shadow-lg">
    <div className="flex items-center gap-2 mb-3">
      <ClipboardCheck className="w-5 h-5 text-corporate-teal" />
      <span className="font-semibold text-sm">Drafting Your Rep</span>
    </div>
    <div className="space-y-3">
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-xs text-white/60 mb-1">Rep Type</p>
        <p className="text-sm font-medium">Set Clear Expectations (SCE)</p>
      </div>
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-xs text-white/60 mb-1">What expectation are you setting?</p>
        <p className="text-sm">Delegating the weekly sync agenda to David. He needs to gather updates from all team leads by Tuesday at 3pm.</p>
      </div>
    </div>
  </div>
);

// Active Rep showing execution state
const MockupActiveRep = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-green-300 dark:border-green-700/50 p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-semibold text-green-700 dark:text-green-400 text-sm">Rep Active — Go do it!</span>
      </div>
    </div>
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3">
      <p className="text-sm text-green-800 dark:text-green-300 font-medium">Set Expectation with David</p>
      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Reviewing the weekly sync agenda hand-off requirements.</p>
    </div>
    <div className="flex gap-2">
      <button className="flex-1 py-2 px-3 bg-green-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2" disabled>
        <MessageSquare className="w-4 h-4" />
        Debrief Rep
      </button>
    </div>
  </div>
);

// Debrief Form showing what to capture after executing
const MockupDebrief = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-purple-200 dark:border-purple-700/50 p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      <span className="font-semibold text-gray-900 dark:text-white text-sm">Debrief Your Rep</span>
    </div>
    <div className="space-y-3">
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Did you check for understanding?</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">Yes, David confirmed he understood the Tuesday 3pm deadline and the format needed.</p>
      </div>
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">What went well? What could be better?</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">I was very clear on the "what" and "when". Next time, I could provide more context on the "why" to build more buy-in.</p>
      </div>
    </div>
  </div>
);

// Level Progress Tracker
const MockupProgressTracker = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-600/50 p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-corporate-orange" />
        <span className="font-semibold text-gray-900 dark:text-white text-sm">Real Reps Progress</span>
      </div>
    </div>
    <div className="space-y-3 mt-4">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-300 font-medium">Clear Expectations</span>
          <span className="text-gray-900 dark:text-white font-bold">2/3 Done</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: '66%' }}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-300 font-medium">Reinforcing Feedback</span>
          <span className="text-gray-900 dark:text-white font-bold">1/3 Done</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '33%' }}></div>
        </div>
      </div>
    </div>
  </div>
);

// Tutorial steps defining the conditioning system
const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: 'Welcome to Conditioning',
    icon: Dumbbell,
    iconColor: 'text-corporate-teal',
    content: 'Conditioning is where the real work happens. It is not an academic exercise—it is how we actively build leadership muscle through daily, real-world application.',
    highlight: 'You will practice Real Reps during your workday with your real team.',
    tip: null,
    screenshot: MockupProgressTracker
  },
  {
    id: 'the-core-reps',
    title: 'The Two Core Reps',
    icon: Star,
    iconColor: 'text-corporate-orange',
    content: 'In your foundation, we focus entirely on two fundamental, high-impact practices: Setting Clear Expectations (SCE) and Delivering Reinforcing Feedback (DRF).',
    highlight: 'Mastering these two will eliminate 80% of communication friction on your team.',
    tip: 'These are your bread and butter. Everything else builds on top of them.',
    screenshot: null
  },
  {
    id: 'sce',
    title: 'Set Clear Expectations (SCE)',
    icon: Target,
    iconColor: 'text-blue-600',
    content: 'Clarity prevents confusion. An SCE Rep involves clearly defining what success looks like for a task, project, or role before the work begins.',
    highlight: 'A great SCE defines: Who does what, by when, and to what standard?',
    tip: 'Always ask the other person to echo back their understanding to verify alignment.',
    screenshot: MockupSCERep
  },
  {
    id: 'drf',
    title: 'Deliver Reinforcing Feedback (DRF)',
    icon: ThumbsUp,
    iconColor: 'text-emerald-600',
    content: 'What gets recognized gets repeated. A DRF Rep involves giving specific, highly contextual feedback when someone does something well.',
    highlight: 'Highlight the specific behavior and the positive impact it created.',
    tip: 'Skip the generic "good job". Instead: "When you did X, it caused Y, which helped us achieve Z."',
    screenshot: MockupDRFRep
  },
  {
    id: 'commit-flow',
    title: 'The Conditioning Loop',
    icon: CheckCircle2,
    iconColor: 'text-corporate-teal',
    content: 'To grow efficiently, you must follow the Conditioning Loop for every rep you complete.',
    highlight: '1. Commit to the Rep\n2. Execute the Rep\n3. Debrief the Rep',
    tip: 'The magic happens in the reflection phase.',
    screenshot: null
  },
  {
    id: 'step-commit',
    title: 'Step 1: Commit',
    icon: ClipboardCheck,
    iconColor: 'text-amber-600',
    content: 'First, you draft your rep. Pick whether it will be an SCE or a DRF, identify who it involves, and outline what you plan to say.',
    highlight: 'Taking 2 minutes to commit and plan drastically improves the quality of the interaction.',
    tip: 'Be specific about the situation and your intended outcome.',
    screenshot: MockupCommitForm
  },
  {
    id: 'step-execute',
    title: 'Step 2: Execute',
    icon: Play,
    iconColor: 'text-green-600',
    content: 'This is where you step into the Arena. You go have the actual conversation or take the action you committed to.',
    highlight: 'Your rep moves from Draft to Active as a reminder to go do it.',
    tip: 'Don\'t wait for perfect conditions. Leadership happens in the messy, imperfect moments.',
    screenshot: MockupActiveRep
  },
  {
    id: 'step-debrief',
    title: 'Step 3: Debrief',
    icon: MessageSquare,
    iconColor: 'text-purple-600',
    content: 'After executing your rep, you return to the app to capture evidence. What happened? How did they respond?',
    highlight: 'Our AI Coach analyzes your debrief to grade your rep quality and provide actionable coaching.',
    tip: 'Honest debriefs yield the greatest growth.',
    screenshot: MockupDebrief
  },
  {
    id: 'ready',
    title: 'You\'re Ready!',
    icon: Run, // We will replace with ArrowUpRight since Run isn't imported
    iconColor: 'text-corporate-teal',
    content: 'That\'s the conditioning system. Set Clear Expectations, Deliver Reinforcing Feedback, and follow the loop.',
    highlight: 'To complete your level, you must fulfill the required number of quality reps shown on your dashboard.',
    tip: null,
    screenshot: null
  }
];

// Fix for missing icon
TUTORIAL_STEPS[8].icon = ArrowUpRight;

const ConditioningTutorialWidget = ({ onComplete, onClose }) => {
  const { user, db } = useAppServices();
  const [currentStep, setCurrentStep] = useState(0);
  const [, setCompletedSteps] = useState(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  
  useEffect(() => {
    const checkCompletion = async () => {
      if (!db || !user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const ct = userSnap.data().conditioningTutorial;
          if (ct?.completed) {
            setAlreadyCompleted(true);
            setIsCompleted(true);
          }
        }
      } catch (error) {
        console.warn('Could not check tutorial status:', error);
      }
    };
    checkCompletion();
  }, [db, user?.uid]);
  
  const totalSteps = TUTORIAL_STEPS.length;
  const step = TUTORIAL_STEPS[currentStep];
  const StepIcon = step.icon;
  
  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      setCompletedSteps(prev => new Set(prev).add(currentStep));
    }
  };
  
  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleComplete = async () => {
    if (alreadyCompleted) {
      if (onComplete) onComplete();
      return;
    }
    
    setIsSaving(true);
    try {
      if (db && user?.uid) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'conditioningTutorial.completed': true,
          'conditioningTutorial.completedAt': serverTimestamp()
        }).catch(err => {
          if (err.code === 'not-found') {
            return setDoc(userRef, {
              conditioningTutorial: {
                completed: true,
                completedAt: serverTimestamp()
              }
            }, { merge: true });
          }
          throw err;
        });
      }
      setIsCompleted(true);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error saving tutorial completion:', error);
      if (onComplete) onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] w-[90vw] max-w-2xl mx-auto my-auto ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 ${step.iconColor}`}>
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Step {currentStep + 1} of {totalSteps}</span>
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">{step.title}</h2>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
              {step.content}
            </p>
            
            {step.highlight && (
              <div className="bg-corporate-teal/5 dark:bg-corporate-teal/10 border-l-2 border-corporate-teal p-4 rounded-r-lg">
                <p className="text-corporate-navy dark:text-teal-100 font-medium whitespace-pre-line text-sm leading-relaxed">
                  {step.highlight}
                </p>
              </div>
            )}
            
            {step.screenshot && (
              <div className="my-6">
                <step.screenshot />
              </div>
            )}
            
            {step.tip && (
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 rounded-xl text-sm">
                <Star className="w-5 h-5 flex-shrink-0 text-amber-500" />
                <p><strong>Pro Tip:</strong> {step.tip}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Navigation */}
      <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
        <div className="flex justify-between items-center">
          <button
            onClick={goPrev}
            className={`px-4 py-2 flex items-center gap-2 font-medium font-heading transition-colors ${
              currentStep === 0 
                ? 'opacity-0 pointer-events-none' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          
          {/* Progress dots */}
          <div className="hidden sm:flex gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentStep 
                    ? `w-6 bg-corporate-teal` 
                    : i < currentStep 
                      ? 'bg-corporate-teal/40 dark:bg-corporate-teal/60'
                      : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          
          {currentStep < totalSteps - 1 ? (
            <button
              onClick={goNext}
              className="px-6 py-2.5 bg-corporate-teal hover:bg-teal-600 text-white rounded-lg flex items-center gap-2 font-semibold font-heading transition-all active:scale-95 shadow-sm shadow-corporate-teal/20"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSaving}
              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold font-heading transition-all ${
                isCompleted 
                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-corporate-orange hover:bg-orange-600 text-white active:scale-95 shadow-md shadow-corporate-orange/20'
              }`}
            >
              {isSaving ? 'Completing...' : isCompleted ? 'Completed' : 'Got it!'}
              {!isSaving && !isCompleted && <CheckCircle2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConditioningTutorialWidget;
"""

with open('src/components/widgets/ConditioningTutorialWidget.jsx', 'w') as f:
    f.write(new_content)

