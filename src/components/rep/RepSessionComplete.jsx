// src/components/rep/RepSessionComplete.jsx
// Celebration screen when session is complete

import React from 'react';
import { Sparkles, Flame, ArrowRight, Users } from 'lucide-react';
import RepAvatar from './RepAvatar';

/**
 * RepSessionComplete - End of session celebration
 * Shows progress, streak, and community connection
 */
const RepSessionComplete = ({ 
  userName = 'Leader',
  streak = 1,
  sessionMinutes = 8,
  cohortPosition = null, // e.g., "You're in the top 20% of your cohort today"
  nextSessionPreview = null,
  onContinue,
  onViewApp
}) => {
  const streakMessages = {
    1: "First step taken! 🌱",
    7: "One week strong! 💪",
    14: "Two weeks of growth! 🌟",
    30: "30 days! You're transforming! 🔥",
    default: `${streak} days and counting!`
  };

  const streakMessage = streakMessages[streak] || streakMessages.default;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      {/* Success Animation Container */}
      <div className="relative mb-6">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-corporate-teal/20 rounded-full blur-2xl scale-150" />
        
        {/* Avatar with celebration ring */}
        <div className="relative">
          <div className="absolute inset-0 border-4 border-corporate-teal/30 rounded-full animate-ping" />
          <RepAvatar size="xl" />
        </div>
      </div>

      {/* Main Message */}
      <h1 className="text-2xl md:text-3xl font-bold text-corporate-navy mb-2">
        Nice work, {userName}! ✨
      </h1>
      
      <p className="text-rep-text-secondary text-lg mb-6">
        Session complete in {sessionMinutes} minutes
      </p>

      {/* Streak Card */}
      <div className="bg-gradient-to-r from-rep-coral-light to-rep-teal-light rounded-2xl p-4 mb-6 w-full max-w-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
            <Flame className="w-6 h-6 text-corporate-orange" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-corporate-navy">{streak} Day Streak</div>
            <div className="text-sm text-rep-text-secondary">{streakMessage}</div>
          </div>
        </div>
      </div>

      {/* Cohort Position (if available) */}
      {cohortPosition && (
        <div className="flex items-center gap-2 text-sm text-rep-text-secondary bg-rep-navy-light rounded-full px-4 py-2 mb-6">
          <Users className="w-4 h-4 text-corporate-teal" />
          <span>{cohortPosition}</span>
        </div>
      )}

      {/* Next Session Preview */}
      {nextSessionPreview && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 w-full max-w-sm text-left">
          <div className="text-xs text-rep-text-secondary uppercase tracking-wide mb-1">Tomorrow</div>
          <div className="text-sm font-medium text-rep-text-primary">{nextSessionPreview}</div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 w-full max-w-sm">
        <button
          onClick={onContinue}
          className="w-full py-3 bg-corporate-teal text-white rounded-xl font-medium 
                     hover:bg-corporate-teal-dark transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          See You Tomorrow
        </button>
        
        <button
          onClick={onViewApp}
          className="w-full py-3 bg-white dark:bg-slate-800 text-rep-text-primary border border-gray-200 dark:border-gray-700 rounded-xl font-medium 
                     hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          Explore the App
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Motivational Quote */}
      <p className="mt-8 text-sm text-rep-text-secondary italic max-w-xs">
        "Leadership is not about being in charge. It's about taking care of those in your charge."
        <span className="block mt-1 not-italic text-xs">— Simon Sinek</span>
      </p>
    </div>
  );
};

export default RepSessionComplete;
