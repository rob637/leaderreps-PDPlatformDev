// src/components/admin/crm/components/prospects/ProspectActivityTimeline.jsx
//
// Activity timeline panel extracted from ProspectDetailPanel. Pure
// presentational — receives data + handlers as props.

import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Phone,
  Send,
  Inbox,
  Calendar,
  Linkedin,
  MessageSquare,
  FileText,
  RefreshCw,
  Plus,
} from 'lucide-react';
import {
  ACTIVITY_TYPES,
  getActivityType,
  getCallOutcome,
  getMeetingOutcome,
} from '../../config/prospectMeta';

const isEmailType = (type) =>
  ['email_sent', 'email_received', 'sequence_email'].includes(type);

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'email', label: 'Email' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'call', label: 'Calls' },
  { id: 'other', label: 'Other' },
];

const toDate = (val) => {
  if (!val) return new Date(0);
  if (val.toDate) return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

export default function ProspectActivityTimeline({
  prospectEmail,
  allActivities,
  activities,
  expanded,
  activityFilter,
  showAddNote,
  newNote,
  noteType,
  syncingGmail,
  syncedEmails,
  daysSinceTouch,
  expandedActivityId,
  onSetActivityFilter,
  onSetShowAddNote,
  onSetNewNote,
  onSetNoteType,
  onAddNote,
  onSyncGmail,
  onSetSyncedEmails,
  onSetExpandedActivityId,
  SectionHeader,
}) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-1">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Activity Log"
          section="activity"
          icon={MessageSquare}
          badge={allActivities.length || null}
        />
        <div className="flex items-center gap-2">
          {prospectEmail && (
            <button
              onClick={onSyncGmail}
              disabled={syncingGmail}
              className="flex items-center gap-1.5 px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
              title="Sync Gmail history"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingGmail ? 'animate-spin' : ''}`} />
              <span>{syncingGmail ? 'Syncing...' : 'Sync Gmail'}</span>
            </button>
          )}
          {daysSinceTouch !== null && (
            <div
              className={`text-xs px-2 py-0.5 rounded-full ${
                daysSinceTouch === 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : daysSinceTouch <= 3
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : daysSinceTouch <= 7
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {daysSinceTouch === 0 ? 'Today' : `${daysSinceTouch}d ago`}
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 mt-2">
          {/* Channel Filter Tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSetActivityFilter(tab.id)}
                className={`px-2 py-1 text-xs rounded-full transition ${
                  activityFilter === tab.id
                    ? 'bg-brand-teal text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {tab.label}
                {tab.id !== 'all' && (
                  <span className="ml-1 opacity-70">
                    {
                      allActivities.filter((a) => {
                        if (tab.id === 'email') return isEmailType(a.type);
                        if (tab.id === 'linkedin') return a.type?.includes('linkedin');
                        if (tab.id === 'call') return a.type === 'call';
                        return (
                          !isEmailType(a.type) &&
                          a.type !== 'call' &&
                          !a.type?.includes('linkedin')
                        );
                      }).length
                    }
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Add Note Form */}
          {showAddNote ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-2">
              <select
                value={noteType}
                onChange={(e) => onSetNoteType(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-2 py-1.5 text-slate-900 dark:text-slate-100 outline-none"
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <textarea
                value={newNote}
                onChange={(e) => onSetNewNote(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none min-h-16 resize-none"
                placeholder="Add a note..."
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSetShowAddNote(false);
                    onSetNewNote('');
                  }}
                  className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-500 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={onAddNote}
                  className="flex-1 px-3 py-1.5 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90"
                >
                  Log Activity
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSetShowAddNote(true)}
              className="flex items-center gap-2 text-sm text-brand-teal hover:text-brand-teal/80"
            >
              <Plus className="w-4 h-4" />
              <span>Log Activity</span>
            </button>
          )}

          {/* Synced Gmail Emails */}
          {(syncedEmails.sent.length > 0 || syncedEmails.received.length > 0) && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Gmail History ({syncedEmails.sent.length + syncedEmails.received.length})
                </h4>
                <button
                  onClick={() => onSetSyncedEmails({ sent: [], received: [] })}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {[...syncedEmails.sent, ...syncedEmails.received]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((email) => (
                    <div
                      key={email.id}
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden"
                    >
                      <div className="flex">
                        <div
                          className={`w-1 flex-shrink-0 ${
                            email.type === 'email_sent' ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                        />
                        <div className="flex-1 p-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                email.type === 'email_sent'
                                  ? 'bg-blue-100 dark:bg-blue-800'
                                  : 'bg-green-100 dark:bg-green-800'
                              }`}
                            >
                              {email.type === 'email_sent' ? (
                                <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Inbox className="w-4 h-4 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                    email.type === 'email_sent'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300'
                                      : 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                                  }`}
                                >
                                  {email.type === 'email_sent' ? 'Sent' : 'Received'}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                  {email.date ? format(new Date(email.date), 'MMM d') : ''}
                                </span>
                              </div>
                              <p className="font-medium text-sm text-slate-800 dark:text-slate-200 mt-1 truncate">
                                {email.subject}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {email.snippet}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Activity List */}
          {activities.length > 0 && (
            <div className="space-y-2 mt-3">
              {activities.map((activity) => {
                const actType = getActivityType(activity.type);
                const callOutcome =
                  activity.outcome && activity.type === 'call'
                    ? getCallOutcome(activity.outcome)
                    : null;
                const meetingOutcome =
                  activity.outcome && activity.type === 'meeting'
                    ? getMeetingOutcome(activity.outcome)
                    : null;

                const IconComponent =
                  activity.type === 'call'
                    ? Phone
                    : activity.type === 'email_sent' || activity.type === 'sequence_email'
                    ? Send
                    : activity.type === 'email_received'
                    ? Inbox
                    : activity.type === 'meeting'
                    ? Calendar
                    : activity.type === 'linkedin_connect' ||
                      activity.type === 'linkedin_message' ||
                      activity.type === 'linkedin_inmail'
                    ? Linkedin
                    : activity.type === 'sms'
                    ? MessageSquare
                    : FileText;

                const isExpanded = expandedActivityId === activity.id;
                const displayContent =
                  activity.content ||
                  (activity.subject
                    ? `Subject: ${activity.subject}${
                        activity.contentPreview ? '\n' + activity.contentPreview : ''
                      }`
                    : activity.contentPreview || '');
                const contentLength = displayContent.length;
                const shouldTruncate = contentLength > 120 && !isExpanded;

                return (
                  <div
                    key={activity.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
                    onClick={() => onSetExpandedActivityId(isExpanded ? null : activity.id)}
                  >
                    <div className="flex">
                      <div className="w-1 flex-shrink-0" style={{ backgroundColor: actType.color }} />
                      <div className="flex-1 p-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${actType.color}15` }}
                          >
                            <IconComponent className="w-4 h-4" style={{ color: actType.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {actType.label}
                                </span>
                                {activity.type === 'sequence_email' && activity.stepNumber && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-medium">
                                    Step {activity.stepNumber}
                                  </span>
                                )}
                                {activity.sequenceName && (
                                  <span
                                    className="text-xs text-slate-400 truncate max-w-[120px]"
                                    title={activity.sequenceName}
                                  >
                                    {activity.sequenceName}
                                  </span>
                                )}
                                {activity.sentFrom && (
                                  <span className="text-xs text-slate-400">
                                    via {activity.sentFrom.split('@')[0]}
                                  </span>
                                )}
                                {callOutcome && (
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded font-medium text-white"
                                    style={{ backgroundColor: callOutcome.color }}
                                  >
                                    {callOutcome.label}
                                  </span>
                                )}
                                {meetingOutcome && (
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded font-medium text-white"
                                    style={{ backgroundColor: meetingOutcome.color }}
                                  >
                                    {meetingOutcome.label}
                                  </span>
                                )}
                                {activity.duration && (
                                  <span className="text-xs text-slate-400">
                                    {activity.duration} min
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                {formatDistanceToNow(toDate(activity.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            {displayContent && (
                              <p
                                className={`text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap ${
                                  shouldTruncate ? 'line-clamp-2' : ''
                                }`}
                              >
                                {displayContent}
                              </p>
                            )}
                            {shouldTruncate && (
                              <button className="text-xs text-brand-teal hover:text-brand-teal/80 mt-1 font-medium">
                                Show more
                              </button>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
                              <span className="font-medium">{activity.userName}</span>
                              <span>·</span>
                              <span>
                                {format(toDate(activity.createdAt), 'MMM d, yyyy \u2022 h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
