// src/components/rep/AICoachSelector.jsx
// Modal to choose AI coaching - now primarily for Rep (Reppy is separate PWA)

import React from 'react';
import { X, Sparkles, Target, Clock, ExternalLink } from 'lucide-react';

/**
 * AICoachSelector - Launch Rep AI coaching
 * 
 * REP: Uses the app's existing curriculum and data
 * - Guides you through your Dashboard content
 * - Uses your cohort's schedule and actions
 * - Syncs with your existing progress
 * 
 * REPPY is now a separate standalone PWA at leaderreps-reppy.web.app
 */
const AICoachSelector = ({ onClose, onSelectRep }) => {
  const handleOpenReppy = () => {
    window.open('https://leaderreps-reppy.web.app', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-corporate-teal to-corporate-navy p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 dark:bg-slate-800/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Rep AI Coach</h2>
                <p className="text-sm text-white/80">Your Dashboard guide</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Rep is your AI guide to the LeaderReps Dashboard. It helps you navigate your curriculum, 
            understand your actions, and stay on track with your cohort.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-corporate-teal" />
              Dashboard content
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-corporate-teal" />
              Your schedule
            </span>
          </div>

          <button
            onClick={onSelectRep}
            className="w-full py-3 bg-corporate-teal text-white font-semibold rounded-xl
                       hover:bg-corporate-teal/90 transition-colors"
          >
            Start Rep Coaching
          </button>
        </div>

        {/* Reppy link */}
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <button
            onClick={handleOpenReppy}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-corporate-teal transition-colors"
          >
            <span>Looking for Reppy? Open standalone app</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoachSelector;
