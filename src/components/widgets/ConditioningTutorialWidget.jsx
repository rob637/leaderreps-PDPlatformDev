// src/components/widgets/ConditioningTutorialWidget.jsx
// Interactive tutorial walkthrough for the Conditioning (Real Reps) system
// Used during prep phase to familiarize leaders with the core practice

import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { 
  X, ChevronRight, ChevronLeft, CheckCircle2, 
  Dumbbell, Target, ClipboardCheck, MessageSquare,
  AlertTriangle, Star, Trophy, Play, Clock, User, 
  Calendar, Shield, CheckCircle, XCircle
} from 'lucide-react';

// =====================================================
// MOCKUP COMPONENTS - Show real examples of Conditioning Reps
// =====================================================

// Sample Rep Card showing a committed rep
const MockupRepCard = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-600 p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">Give Feedback on Missed Deadline</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">Scheduled</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Sarah M.</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Tomorrow @ 2pm</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
          "Sarah, I wanted to talk about the Henderson report deadline. It came in two days late and impacted the client presentation..."
        </p>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
      <span className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md">Prepared Redirect</span>
      <span className="px-2 py-1 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md">Medium Risk</span>
    </div>
  </div>
);

// Commit Form Preview showing the commitment process
const MockupCommitForm = () => (
  <div className="mt-4 bg-gradient-to-br from-corporate-navy to-corporate-navy/90 rounded-xl p-4 text-white shadow-lg">
    <div className="flex items-center gap-2 mb-3">
      <ClipboardCheck className="w-5 h-5 text-corporate-teal" />
      <span className="font-semibold text-sm">Commit to a Real Rep</span>
    </div>
    <div className="space-y-3">
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-xs text-white/60 mb-1">Rep Type</p>
        <p className="text-sm font-medium">Prepared Redirect — Give constructive feedback after prep</p>
      </div>
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-xs text-white/60 mb-1">Who is this Rep with?</p>
        <p className="text-sm font-medium">Sarah (Direct Report)</p>
      </div>
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-xs text-white/60 mb-1">What's the situation?</p>
        <p className="text-sm">Sarah missed the Henderson report deadline by 2 days, impacting our client presentation. This is the second time this quarter.</p>
      </div>
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-xs text-white/60 mb-1">Outcome I'm going for</p>
        <p className="text-sm">Sarah understands the impact and commits to a system for meeting deadlines.</p>
      </div>
    </div>
  </div>
);

// Prep Phase Checklist showing prep for high-risk reps
const MockupPrepChecklist = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-orange-200 dark:border-orange-700 p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <Shield className="w-5 h-5 text-orange-500" />
      <span className="font-semibold text-gray-900 dark:text-white text-sm">Prep Checklist — High-Risk Rep</span>
    </div>
    <div className="space-y-2">
      {[
        { done: true, text: 'Identified the specific behavior to address' },
        { done: true, text: 'Clarified the impact (on team, project, or business)' },
        { done: true, text: 'Anticipated their likely reaction' },
        { done: true, text: 'Prepared my opening statement' },
        { done: false, text: 'Planned my response if they push back' }
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {item.done ? (
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 mt-0.5 flex-shrink-0" />
          )}
          <span className={`text-sm ${item.done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <span className="text-orange-500 font-medium">4 of 5</span> prep items complete
      </div>
    </div>
  </div>
);

// Active Rep showing execution state
const MockupActiveRep = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-green-300 dark:border-green-700 p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-semibold text-green-700 dark:text-green-400 text-sm">Rep Active — In Progress</span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Started 10 min ago
      </span>
    </div>
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3">
      <p className="text-sm text-green-800 dark:text-green-300 font-medium">Give Feedback on Missed Deadline</p>
      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Meeting with Sarah — discussing the Henderson report</p>
    </div>
    <div className="flex gap-2">
      <button className="flex-1 py-2 px-3 bg-green-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
        <CheckCircle className="w-4 h-4" />
        Rep Complete
      </button>
      <button className="py-2 px-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg">
        Pause
      </button>
    </div>
  </div>
);

// Debrief Form showing what to capture after executing
const MockupDebrief = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-purple-200 dark:border-purple-700 p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      <span className="font-semibold text-gray-900 dark:text-white text-sm">Debrief Your Rep</span>
    </div>
    <div className="space-y-3">
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">What happened?</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">I addressed the missed deadline directly. Sarah initially got defensive, saying she had too much on her plate. I acknowledged her workload but held the line on the impact.</p>
      </div>
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">How did they respond?</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">After I validated her feelings but stayed firm, she took ownership. She suggested using calendar blocks for major deliverables.</p>
      </div>
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">What was the outcome?</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">We agreed on a deadline tracking system. She committed to flagging risks 48 hours early. Follow-up in 2 weeks.</p>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Quality Score:</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
          ))}
        </div>
      </div>
      <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Completed</span>
    </div>
  </div>
);

// Milestone Progress Tracker
const MockupProgressTracker = () => (
  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-600 p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-corporate-orange" />
        <span className="font-semibold text-gray-900 dark:text-white text-sm">Your Milestone Progress</span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">Milestone 3 of 5</span>
    </div>
    <div className="grid grid-cols-5 gap-2 mb-3">
      {[
        { milestone: 1, status: 'completed', count: 3, label: 'Foundation' },
        { milestone: 2, status: 'completed', count: 2, label: 'Feedback' },
        { milestone: 3, status: 'active', count: 1, label: 'Boundaries' },
        { milestone: 4, status: 'future', count: 0, label: 'Delegation' },
        { milestone: 5, status: 'future', count: 0, label: 'Mastery' },
      ].map((m) => (
        <div 
          key={m.milestone}
          className={`rounded-lg flex flex-col items-center justify-center py-3 px-2 text-xs ${
            m.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
            m.status === 'active' ? 'bg-corporate-teal/20 text-corporate-teal ring-2 ring-corporate-teal' :
            'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
          }`}
        >
          <span className="font-bold text-base">{m.milestone}</span>
          <span className="text-[10px] truncate max-w-full">{m.label}</span>
          {m.count > 0 && <span className="text-[10px] mt-0.5">{m.count} reps</span>}
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-300"><strong>6</strong> completed</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-corporate-teal" />
          <span className="text-gray-600 dark:text-gray-300"><strong>1</strong> active</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">On track! 🔥</span>
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
    content: 'Conditioning is the core practice of the Foundation program. Just like athletes do reps to build muscle, you\'ll do leadership reps to build your leadership muscles.',
    highlight: 'One Real Rep per week is your minimum commitment.',
    tip: null,
    screenshot: null
  },
  {
    id: 'what-is-rep',
    title: 'What is a Real Rep?',
    icon: Target,
    iconColor: 'text-blue-600',
    content: 'A Real Rep is a challenging leadership moment you commit to executing. It\'s not a hypothetical exercise — it\'s a real conversation or action with a real person at work.',
    highlight: 'Examples include: giving difficult feedback, setting a boundary, having a tough 1:1, or addressing a performance issue.',
    tip: 'The key word is "real" — you\'re practicing leadership in actual situations.',
    screenshot: MockupRepCard
  },
  {
    id: 'commit-flow',
    title: 'Step 1: Commit',
    icon: ClipboardCheck,
    iconColor: 'text-amber-600',
    content: 'Each week, you\'ll commit to at least one Real Rep. You\'ll choose from 16 different rep types covering feedback, difficult conversations, delegation, and more.',
    highlight: 'When you commit, you\'ll describe: the situation, your intended outcome, and what you plan to say or do.',
    tip: 'Be specific. "Give Sarah feedback on her report" beats "give feedback to someone."',
    screenshot: MockupCommitForm
  },
  {
    id: 'prep-phase',
    title: 'Step 2: Prepare (High-Risk Reps)',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    content: 'For higher-stakes reps, you\'ll complete a prep checklist. This helps you anticipate reactions, plan your words, and go in confident.',
    highlight: 'Prep is required for high-risk reps like addressing patterns, holding the line after pushback, or transitioning to consequences.',
    tip: 'Don\'t skip prep for tough conversations — it dramatically improves outcomes.',
    screenshot: MockupPrepChecklist
  },
  {
    id: 'execute',
    title: 'Step 3: Execute',
    icon: Play,
    iconColor: 'text-green-600',
    content: 'This is where the growth happens. You go have the conversation or take the action you committed to. Your rep moves from "Scheduled" to "Active."',
    highlight: 'After hitting the "Rep is Live" moment, come back to debrief.',
    tip: 'Don\'t wait for perfect conditions. Most leadership reps happen in imperfect moments.',
    screenshot: MockupActiveRep
  },
  {
    id: 'debrief',
    title: 'Step 4: Debrief',
    icon: MessageSquare,
    iconColor: 'text-purple-600',
    content: 'After executing your rep, you\'ll capture evidence: What happened? How did they respond? What was the outcome?',
    highlight: 'Quality matters more than quantity. One thoughtfully debriefed rep beats three rushed ones.',
    tip: 'Your trainer reviews your debriefs and may offer coaching nudges.',
    screenshot: MockupDebrief
  },
  {
    id: 'progression',
    title: 'Track Your Progress',
    icon: Trophy,
    iconColor: 'text-corporate-orange',
    content: 'As you progress through the 5 milestones, you\'ll build a track record of completed reps. The app tracks your milestone status, patterns, and growth areas.',
    highlight: 'Miss a rep? No guilt — but you\'ll do a quick debrief to learn from it and recommit.',
    tip: 'Leaders who consistently complete their reps see the biggest growth in their 360 assessments.',
    screenshot: MockupProgressTracker
  },
  {
    id: 'ready',
    title: 'You\'re Ready!',
    icon: Star,
    iconColor: 'text-corporate-teal',
    content: 'That\'s the conditioning system. When you start the program, you\'ll see the Conditioning card on your dashboard. Click it to commit to your first Real Rep.',
    highlight: 'Remember: One real rep per week. Specific commitment. Honest debrief. That\'s how leaders are made.',
    tip: null,
    screenshot: null
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
        },
        'prepStatus.conditioningTutorial': true
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
          },
          'prepStatus.conditioningTutorial': true
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-h-[70dvh] sm:max-h-[85vh] overflow-y-auto">
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-h-[70dvh] sm:max-h-[85vh] overflow-y-auto">
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-h-[70dvh] sm:max-h-[85vh] overflow-y-auto">
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
        
        {/* Screenshot mockup - shows real example data */}
        {step.screenshot && <step.screenshot />}
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
