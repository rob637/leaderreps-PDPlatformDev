import React from 'react';
import { PlayCircle, CheckCircle, X, Bell, Dumbbell, BookOpen, FileText, Trophy } from 'lucide-react';

/**
 * PrepCompleteModal - Shows milestone celebrations for prep phase completion
 * 
 * Two modes:
 * - "onboarding" — When all 5 onboarding items are complete (intro to Session 1 prep)
 * - "all-prep" — When all 9 items (onboarding + session 1) are complete (fully ready)
 */
const PrepCompleteModal = ({ isOpen, onClose, milestone = 'all-prep' }) => {
  if (!isOpen) return null;

  const isOnboarding = milestone === 'onboarding';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isOnboarding 
                ? 'bg-corporate-teal/10' 
                : 'bg-amber-50 dark:bg-amber-900/20'
            }`}>
              {isOnboarding 
                ? <CheckCircle className="w-4 h-4 text-corporate-teal" />
                : <Trophy className="w-4 h-4 text-amber-600" />
              }
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {isOnboarding ? 'Onboarding Complete!' : 'You\'re All Set!'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isOnboarding 
                  ? 'Great start — now prepare for Session 1' 
                  : 'You\'re fully prepared for Session 1'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isOnboarding ? (
            <>
              {/* Onboarding milestone — introduce Session 1 prep */}
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You&apos;ve completed your onboarding items. Next up: get ready for Session 1 with these steps.
              </p>

              {/* Download Session 1 Guide */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-corporate-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-corporate-teal" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Download Session 1 Guide</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Review the guide so you know what to expect in your first session.
                  </p>
                </div>
              </div>

              {/* Watch Session 1 Video */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-corporate-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-4 h-4 text-corporate-teal" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Watch Session 1 Video</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Get a preview of what&apos;s coming in Foundation.
                  </p>
                </div>
              </div>

              {/* Conditioning Tutorial */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Complete Conditioning Tutorial</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Learn how Conditioning works — daily practice that builds leadership habits.
                  </p>
                </div>
              </div>

              {/* Setup Notifications */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Setup Notifications</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure reminders to stay on track with daily practices.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* All prep complete — celebrate and explain what's unlocked */}
              <p className="text-sm text-slate-600 dark:text-slate-300">
                All prep items are done! You&apos;re ready to go. Here&apos;s what&apos;s available while you wait for Session 1.
              </p>

              {/* Explore Content */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-corporate-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-corporate-teal" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Explore Content Library</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Browse leadership readings, videos, and resources at your own pace.
                  </p>
                </div>
              </div>

              {/* Start Conditioning */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Start Conditioning</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Begin building leadership habits with daily conditioning reps.
                  </p>
                </div>
              </div>

              {/* Win the Day */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Win the Day</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Use daily tools to set priorities, practice reps, and reflect on your day.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-corporate-teal hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isOnboarding ? 'Let\u0027s Go' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrepCompleteModal;
