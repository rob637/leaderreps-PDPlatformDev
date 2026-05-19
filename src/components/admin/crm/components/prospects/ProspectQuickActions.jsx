// src/components/admin/crm/components/prospects/ProspectQuickActions.jsx
//
// Footer quick-action buttons extracted from ProspectDetailPanel.

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Phone,
  Send,
  Calendar,
  FileText,
  Plus,
  PlayCircle,
  Linkedin,
  Sparkles,
  Bell,
  Wand2,
} from 'lucide-react';

export default function ProspectQuickActions({
  prospect,
  enriching,
  isLinkedHelperSynced,
  hasLinkedInUrl,
  hasActiveSequence,
  onQuickLog,
  onOpenLog,
  onOpenSequence,
  onPushLinkedHelper,
  onEnrichApollo,
  onAddTask,
  onAICompose,
}) {
  const enrichTitle = !prospect.email && !prospect.linkedin
    ? 'Add email or LinkedIn first'
    : prospect.apolloEnrichedAt
    ? `Enriched ${formatDistanceToNow(new Date(prospect.apolloEnrichedAt))} ago`
    : 'Enrich with Apollo data';

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
      {/* Primary quick action buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onQuickLog('call')}
          className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-200 dark:hover:border-purple-700 transition"
        >
          <Phone className="w-4 h-4 text-purple-500" />
          <span>Call</span>
        </button>
        <button
          onClick={() => onQuickLog('email_sent')}
          className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700 transition"
        >
          <Send className="w-4 h-4 text-blue-500" />
          <span>Email</span>
        </button>
        <button
          onClick={() => onQuickLog('meeting')}
          className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-200 dark:hover:border-amber-700 transition"
        >
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>Meeting</span>
        </button>
        <button
          onClick={() => onQuickLog('note')}
          className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Note</span>
        </button>
      </div>

      {onAICompose && (
        <button
          onClick={onAICompose}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-2 border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
        >
          <Wand2 className="w-4 h-4" />
          <span>AI Draft Outreach</span>
        </button>
      )}

      {/* Secondary actions */}
      <div className="grid grid-cols-5 gap-2">
        <button
          onClick={onOpenLog}
          className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <Plus className="w-4 h-4 text-slate-500" />
          <span>Log</span>
        </button>
        <button
          onClick={onOpenSequence}
          disabled={!prospect.email}
          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition ${
            !prospect.email
              ? 'border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
              : hasActiveSequence
              ? 'border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
              : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-700'
          }`}
          title={
            !prospect.email
              ? 'Add email first'
              : hasActiveSequence
              ? 'In Sequence'
              : 'Add to Sequence'
          }
        >
          <PlayCircle className="w-4 h-4 text-emerald-500" />
          <span>Sequence</span>
        </button>
        <button
          onClick={onPushLinkedHelper}
          disabled={!hasLinkedInUrl}
          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition ${
            !hasLinkedInUrl
              ? 'border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
              : isLinkedHelperSynced
              ? 'border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
              : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700'
          }`}
          title={
            !hasLinkedInUrl
              ? 'Add LinkedIn URL first'
              : isLinkedHelperSynced
              ? 'Already in LinkedHelper'
              : 'Push to LinkedHelper'
          }
        >
          <Linkedin className="w-4 h-4 text-blue-600" />
          <span>LinkedIn</span>
        </button>
        <button
          onClick={onEnrichApollo}
          disabled={enriching || (!prospect.email && !prospect.linkedin)}
          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition ${
            !prospect.email && !prospect.linkedin
              ? 'border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
              : prospect.apolloEnrichedAt
              ? 'border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30'
              : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-200 dark:hover:border-amber-700'
          }`}
          title={enrichTitle}
        >
          <Sparkles className={`w-4 h-4 text-amber-500 ${enriching ? 'animate-pulse' : ''}`} />
          <span>{enriching ? '...' : 'Enrich'}</span>
        </button>
        <button
          onClick={onAddTask}
          className="flex flex-col items-center gap-1 px-2 py-2.5 bg-brand-teal text-white rounded-lg text-xs font-medium hover:bg-brand-teal/90 transition"
        >
          <Bell className="w-4 h-4" />
          <span>Task</span>
        </button>
      </div>
    </div>
  );
}
