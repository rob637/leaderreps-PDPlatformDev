import React from 'react';
import { Sun, Moon, BookOpen, CheckCircle, X } from 'lucide-react';

/**
 * PrepCompleteModal - Informs user about new features after completing prep
 */
const PrepCompleteModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-corporate-teal/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-corporate-teal" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Prep Complete</h2>
              <p className="text-sm text-slate-500">New features are now available</p>
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
          {/* AM Bookend */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sun className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800">Win the Day</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Set your top 3 priorities each morning.
              </p>
            </div>
          </div>

          {/* PM Bookend */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Moon className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800">Daily Reflection</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Review your day and plan for tomorrow.
              </p>
            </div>
          </div>

          {/* Content Library */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-corporate-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-corporate-teal" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800">Content Library</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Videos, articles, and exercises are now accessible.
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
