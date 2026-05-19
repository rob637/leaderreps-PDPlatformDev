/**
 * EmptyState — reusable empty/zero-data placeholder for CRM pages.
 *
 * Usage:
 *   <EmptyState
 *     icon={Users}
 *     title="No prospects yet"
 *     message="Add your first prospect to get started."
 *     action={{ label: 'Add Prospect', onClick: () => openModal('addProspect') }}
 *   />
 */

import React from 'react';

const EmptyState = ({
  icon: Icon,
  title = 'Nothing here yet',
  message = '',
  action = null,
  secondary = null,
  compact = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${
      compact ? 'py-8' : 'py-16'
    } px-6`}
  >
    {Icon && (
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-700/50 mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
      {title}
    </h3>
    {message && (
      <p className="text-sm text-slate-500 max-w-md mb-4">{message}</p>
    )}
    <div className="flex items-center gap-2">
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-medium hover:bg-corporate-teal/90"
        >
          {action.label}
        </button>
      )}
      {secondary && (
        <button
          onClick={secondary.onClick}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          {secondary.label}
        </button>
      )}
    </div>
  </div>
);

export default EmptyState;
