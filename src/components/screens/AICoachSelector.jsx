// src/components/screens/AICoachSelector.jsx
// Choose between Rep (Dashboard Guide) and Reppy (Standalone Curriculum)

import React from 'react';
import { ArrowLeft, Sparkles, Bot, ArrowRight, CheckCircle2, Clock, Users, BookOpen, Flame, Target } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { useReppyProgress } from '../../hooks/useReppyProgress';

/**
 * AICoachSelector - Choose your AI coach experience
 * 
 * Rep: Guides you through your existing Dashboard curriculum
 * Reppy: Standalone 52-week leadership program with memory
 */
const AICoachSelector = () => {
  const { navigate } = useAppServices();
  const { progress, streak, loading } = useReppyProgress();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate('dashboard')}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 className="font-semibold text-gray-900 dark:text-gray-100">Choose Your AI Coach</h1>

          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {/* Intro */}
        <div className="text-center mb-8 pt-4">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">AI Leadership Coaching</h2>
          <p className="text-gray-600 dark:text-gray-300">Two ways to develop your leadership skills</p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Rep Card */}
          <button
            onClick={() => navigate('rep')}
            className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-gray-100 hover:border-teal-300 
                       transition-all text-left group shadow-sm hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl 
                            flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rep</h3>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">
                  Your guide to the Dashboard curriculum
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span>Guides you to complete Dashboard items</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4 text-teal-500" />
                    <span>Connected to your cohort curriculum</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 text-teal-500" />
                    <span>Quick check-ins throughout the day</span>
                  </div>
                </div>
              </div>
            </div>
          </button>

          {/* Reppy Card */}
          <button
            onClick={() => navigate('reppy')}
            className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-gray-100 hover:border-violet-300 
                       transition-all text-left group shadow-sm hover:shadow-md relative overflow-hidden"
          >
            {/* New badge */}
            <div className="absolute top-4 right-4 px-2 py-0.5 bg-violet-100 text-violet-600 text-xs font-medium rounded-full">
              NEW
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl 
                            flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between pr-12">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reppy</h3>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">
                  Standalone AI Leadership Coach
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-4 h-4 text-violet-500" />
                    <span>52-week leadership curriculum</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Target className="w-4 h-4 text-violet-500" />
                    <span>~10 minute daily sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>Conversation memory & personalization</span>
                  </div>
                </div>

                {/* Progress indicator if user has started */}
                {!loading && progress.completed > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Your progress</span>
                      <span className="flex items-center gap-1 text-violet-600 font-medium">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {streak.current} day streak
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-violet-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {progress.completed} of {progress.total} sessions completed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Comparison */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Which is right for me?</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Choose Rep if...</p>
                <p className="text-gray-600 dark:text-gray-300">You're enrolled in a cohort and want guidance completing your Dashboard activities.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Choose Reppy if...</p>
                <p className="text-gray-600 dark:text-gray-300">You want a self-paced leadership program you can do anytime, with AI memory that learns about you.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6 pb-8">
          You can switch between coaches anytime
        </p>
      </main>
    </div>
  );
};

export default AICoachSelector;
