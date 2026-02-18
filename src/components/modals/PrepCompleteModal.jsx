import React from 'react';
import { BookOpen, CheckCircle, X, Unlock, Library } from 'lucide-react';

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
              <p className="text-sm text-slate-500 dark:text-slate-400">New features are now available</p>
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
          {/* Content Library */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-corporate-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-corporate-teal" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Content Library</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Your prep videos and documents are in the Content section. Use the left navigation to access them anytime.
              </p>
            </div>
          </div>

          {/* Progressive Unlocks */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Unlock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">More Content Unlocking</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Additional videos, exercises, and resources will unlock as you progress through the program.
              </p>
            </div>
          </div>

          {/* Foundation Starts */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Library className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Foundation Begins Soon</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Explore the content library while you wait for Session 1 to begin.
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
