// src/components/conditioning/BehaviorFocusReminder.jsx
// Displays the behavior focus reminder for a rep type
// Used at commit time and on active rep cards

import React from 'react';
import { Focus, AlertCircle } from 'lucide-react';
import { getBehaviorFocusReminder, getActiveRepReminder } from '../../services/repTaxonomy';

// ============================================
// BEHAVIOR FOCUS REMINDER (Commit-time)
// ============================================
export const BehaviorFocusReminder = ({ repTypeId, className = '' }) => {
  const reminder = getBehaviorFocusReminder(repTypeId);
  
  if (!reminder) return null;
  
  return (
    <div className={`p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl ${className}`}>
      <div className="flex items-start gap-2">
        <Focus className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Behavior Focus
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
            {reminder}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ACTIVE REP REMINDER (On committed rep cards)
// Shows additional context for 5 specific rep types
// ============================================
export const ActiveRepReminder = ({ repTypeId, className = '' }) => {
  const reminder = getActiveRepReminder(repTypeId);
  
  if (!reminder) return null;
  
  return (
    <div className={`p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl ${className}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Important
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
            {reminder}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMBINED REMINDER (Shows both if applicable)
// ============================================
const CombinedReminder = ({ repTypeId, showBehaviorFocus = true, showActiveReminder = true, className = '' }) => {
  const behaviorFocus = getBehaviorFocusReminder(repTypeId);
  const activeReminder = getActiveRepReminder(repTypeId);
  
  const hasBehavior = showBehaviorFocus && behaviorFocus;
  const hasActive = showActiveReminder && activeReminder;
  
  if (!hasBehavior && !hasActive) return null;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {hasBehavior && <BehaviorFocusReminder repTypeId={repTypeId} />}
      {hasActive && <ActiveRepReminder repTypeId={repTypeId} />}
    </div>
  );
};

export default CombinedReminder;
