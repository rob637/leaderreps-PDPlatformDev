import React from 'react';
import { X, Mountain, BookOpen, Sparkles, ArrowRight } from 'lucide-react';

/**
 * AscentWelcomeModal
 * ==================
 * Shown the first time a leader enters the Ascent phase after their trainer
 * signs off the final Foundation milestone (milestone 5).
 *
 * The modal:
 *  - Welcomes the leader to Ascent
 *  - Reframes Foundation completion as a beginning, not an end
 *  - Points the leader to the Content section in the navigation, where all
 *    Foundation resources remain available
 *
 * Dismissal is persisted on the user document via `ascentWelcomeShown: true`
 * (handled by the parent — Dashboard).
 */
const AscentWelcomeModal = ({ isOpen, onClose, onGoToContent, onOpenAscentArena, userName }) => {
  if (!isOpen) return null;

  const firstName = (userName || '').split(' ')[0] || 'Leader';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Hero header */}
        <div className="relative bg-gradient-to-br from-corporate-navy via-slate-700 to-corporate-teal p-6 text-white">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">
                Foundation Complete
              </p>
              <h2 className="text-xl font-bold">Welcome to Ascent, {firstName}!</h2>
            </div>
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            Your trainer has signed off your Foundation work. Foundation isn&apos;t the
            end — it&apos;s the beginning. Ascent is where your leadership practice
            becomes a way of being.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-corporate-teal/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-corporate-teal" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                All your Foundation resources live in Content
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                Every video, reading, workbook, and tool from Foundation is in the
                <span className="font-semibold"> Content </span>
                section of the navigation. Revisit anything, any time.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-corporate-orange/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-corporate-orange" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                A clean dashboard for your next chapter
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                We&apos;ve cleared your Foundation carry-over items so you can focus
                on what&apos;s next. Your history and certificates remain in your Locker.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-2">
          {onOpenAscentArena && (
            <button
              onClick={onOpenAscentArena}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-corporate-orange hover:bg-corporate-orange/90 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Mountain className="w-4 h-4" />
              Enter Ascent Arena
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {onGoToContent && (
            <button
              onClick={onGoToContent}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-corporate-teal hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Open Content
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default AscentWelcomeModal;
