// src/components/widgets/ConditioningTutorialWidget.jsx
// Interactive tutorial walkthrough for the Conditioning (Real Reps) system
// Used during prep phase to familiarize leaders with the core practice

import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { 
  X, ChevronRight, ChevronLeft, CheckCircle2, 
  Dumbbell, Target, ClipboardCheck, MessageSquare,
  AlertTriangle, Star, Trophy, Play, Pause
} from 'lucide-react';

// Tutorial steps defining the conditioning system
const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: 'Welcome to Conditioning',
    icon: Dumbbell,
    iconColor: 'text-corporate-teal',
    content: 'Conditioning is the core practice of the Foundation program. Just like athletes do reps to build muscle, you\'ll do leadership reps to build your leadership muscles.',
    highlight: 'One Real Rep per week is your minimum commitment.',
    tip: null
  },
  {
    id: 'what-is-rep',
    title: 'What is a Real Rep?',
    icon: Target,
    iconColor: 'text-blue-600',
    content: 'A Real Rep is a challenging leadership moment you commit to executing. It\'s not a hypothetical exercise — it\'s a real conversation or action with a real person at work.',
    highlight: 'Examples include: giving difficult feedback, setting a boundary, having a tough 1:1, or addressing a performance issue.',
    tip: 'The key word is "real" — you\'re practicing leadership in actual situations.'
  },
  {
    id: 'commit-flow',
    title: 'Step 1: Commit',
    icon: ClipboardCheck,
    iconColor: 'text-amber-600',
    content: 'Each week, you\'ll commit to at least one Real Rep. You\'ll choose from 16 different rep types covering feedback, difficult conversations, delegation, and more.',
    highlight: 'When you commit, you\'ll describe: the situation, your intended outcome, and what you plan to say or do.',
    tip: 'Be specific. "Give Sarah feedback on her report" beats "give feedback to someone."'
  },
  {
    id: 'prep-phase',
    title: 'Step 2: Prepare (High-Risk Reps)',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    content: 'For higher-stakes reps, you\'ll complete a prep checklist. This helps you anticipate reactions, plan your words, and go in confident.',
    highlight: 'Prep is required for high-risk reps like addressing patterns, holding the line after pushback, or transitioning to consequences.',
    tip: 'Don\'t skip prep for tough conversations — it dramatically improves outcomes.'
  },
  {
    id: 'execute',
    title: 'Step 3: Execute',
    icon: Play,
    iconColor: 'text-green-600',
    content: 'This is where the growth happens. You go have the conversation or take the action you committed to. Your rep moves from "Scheduled" to "Active."',
    highlight: 'After hitting the "Rep is Live" moment, come back to debrief.',
    tip: 'Don\'t wait for perfect conditions. Most leadership reps happen in imperfect moments.'
  },
  {
    id: 'debrief',
    title: 'Step 4: Debrief',
    icon: MessageSquare,
    iconColor: 'text-purple-600',
    content: 'After executing your rep, you\'ll capture evidence: What happened? How did they respond? What was the outcome?',
    highlight: 'Quality matters more than quantity. One thoughtfully debriefed rep beats three rushed ones.',
    tip: 'Your trainer reviews your debriefs and may offer coaching nudges.'
  },
  {
    id: 'progression',
    title: 'Track Your Progress',
    icon: Trophy,
    iconColor: 'text-corporate-orange',
    content: 'Over the 8-week program, you\'ll build a track record of completed reps. The app tracks your weekly status, patterns, and growth areas.',
    highlight: 'Miss a rep? No guilt — but you\'ll do a quick debrief to learn from it and recommit.',
    tip: 'Leaders who complete 8+ reps see the biggest growth in their 360 assessments.'
  },
  {
    id: 'ready',
    title: 'You\'re Ready!',
    icon: Star,
    iconColor: 'text-corporate-teal',
    content: 'That\'s the conditioning system. When you start the program, you\'ll see the Conditioning card on your dashboard. Click it to commit to your first Real Rep.',
    highlight: 'Remember: One real rep per week. Specific commitment. Honest debrief. That\'s how leaders are made.',
    tip: null
  }
];

const ConditioningTutorialWidget = ({ onComplete, onClose }) => {
  const { user, db } = useAppServices();
  const [currentStep, setCurrentStep] = useState(0);
  // Track completed steps for potential future use (progress indicator)
  const [, setCompletedSteps] = useState(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  
  // Check if tutorial was already completed
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
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = async () => {
    if (!db || !user?.uid) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        conditioningTutorial: {
          completed: true,
          completedAt: serverTimestamp(),
          stepsViewed: totalSteps
        }
      });
      
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setIsCompleted(true);
      
      // Slight delay for visual feedback
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    } catch (error) {
      console.error('Error saving tutorial completion:', error);
      // Try setDoc if updateDoc fails (doc might not exist)
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          conditioningTutorial: {
            completed: true,
            completedAt: serverTimestamp(),
            stepsViewed: totalSteps
          }
        }, { merge: true });
        
        setIsCompleted(true);
        setTimeout(() => {
          onComplete?.();
        }, 1500);
      } catch (err) {
        console.error('Fallback save also failed:', err);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handler to restart the tutorial
  const handleReviewAgain = () => {
    setAlreadyCompleted(false);
    setIsCompleted(false);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };
  
  // Already completed state
  if (alreadyCompleted && isCompleted && !isSaving) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Conditioning Tutorial</h2>
                <p className="text-sm text-white/80">Already Completed</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Completed Body */}
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Tutorial Complete! ✓
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've already learned about the conditioning system. You're ready to do Real Reps!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleReviewAgain}
              className="px-6 py-2 border-2 border-corporate-teal text-corporate-teal rounded-lg hover:bg-corporate-teal/10 transition-colors font-medium"
            >
              Review Tutorial Again
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-corporate-navy text-white rounded-lg hover:bg-corporate-navy/90 transition-colors font-medium"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Just completed state (celebration)
  if (isCompleted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Conditioning Tutorial</h2>
                <p className="text-sm text-white/80">Complete!</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Success Body */}
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-corporate-orange" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            You're Ready for Real Reps!
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            When the program starts, you'll commit to your first Real Rep.
          </p>
        </div>
      </div>
    );
  }
  
  // Main tutorial view
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Conditioning Tutorial</h2>
              <p className="text-sm text-white/80">Learn How Real Reps Work</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-2">
          {TUTORIAL_STEPS.map((s, idx) => (
            <div 
              key={s.id}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                idx < currentStep 
                  ? 'bg-corporate-teal' 
                  : idx === currentStep 
                    ? 'bg-white' 
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-white/70 mt-2">
          Step {currentStep + 1} of {totalSteps}
        </p>
      </div>
      
      {/* Step Content */}
      <div className="p-6">
        {/* Step Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            step.iconColor === 'text-corporate-teal' ? 'bg-teal-100 dark:bg-teal-900/30' :
            step.iconColor === 'text-blue-600' ? 'bg-blue-100 dark:bg-blue-900/30' :
            step.iconColor === 'text-amber-600' ? 'bg-amber-100 dark:bg-amber-900/30' :
            step.iconColor === 'text-orange-500' ? 'bg-orange-100 dark:bg-orange-900/30' :
            step.iconColor === 'text-green-600' ? 'bg-green-100 dark:bg-green-900/30' :
            step.iconColor === 'text-purple-600' ? 'bg-purple-100 dark:bg-purple-900/30' :
            step.iconColor === 'text-corporate-orange' ? 'bg-orange-100 dark:bg-orange-900/30' :
            'bg-gray-100 dark:bg-gray-700'
          }`}>
            <StepIcon className={`w-6 h-6 ${step.iconColor}`} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {step.title}
          </h3>
        </div>
        
        {/* Main content */}
        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {step.content}
        </p>
        
        {/* Highlight box */}
        {step.highlight && (
          <div className="bg-corporate-navy/5 dark:bg-corporate-navy/20 border-l-4 border-corporate-teal p-4 rounded-r-lg mb-4">
            <p className="text-gray-800 dark:text-gray-200 font-medium">
              {step.highlight}
            </p>
          </div>
        )}
        
        {/* Tip */}
        {step.tip && (
          <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <span className="font-semibold text-corporate-teal shrink-0">💡 Tip:</span>
            <span>{step.tip}</span>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          
          {/* Forward / Complete button */}
          {currentStep < totalSteps - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1 px-6 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Tutorial
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConditioningTutorialWidget;
