import React from 'react';
import { PlayCircle, CheckCircle, X, Bell, Dumbbell } from 'lucide-react';

/**
 * PrepCompleteModal - Informs user about new features after completing prep
 */
const PrepCompleteModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-corporate-teal/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-corporate-teal" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Prep Complete</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">You're ready to explore</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Session 1 Preview */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-corporate-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <PlayCircle className="w-4 h-4 text-corporate-teal" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Session 1 Preview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Watch the Session 1 video to get a preview of what's coming in Foundation.
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Setup Notifications</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Configure your notification preferences to stay on track with daily reminders.
              </p>
            </div>
          </div>

          {/* Conditioning Tutorial */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Conditioning Tutorial</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Learn how Conditioning works — daily practice that builds leadership habits.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-corporate-teal hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrepCompleteModal;
