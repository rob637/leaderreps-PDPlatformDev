// src/components/widgets/NotificationsWidget.jsx
//
// Dashboard Notifications card — Phase B of the unified notifications
// redesign. Reads from the per-user inbox (`users/{uid}/notifications`)
// fanned out by the `onAnnouncementWritten` Cloud Function.
//
// Behavior:
//   • Shows the top N unread items (default 3), tier-sorted, with a
//     small tier rail and inline actions.
//   • "Read on view" — items auto-mark read after ~3s on screen.
//   • Empty state: single warm line, no orange, no big card. We've
//     earned the user's attention, we don't beg for it.
//   • "View all (N)" footer link opens the slide-over NotificationPanel
//     (handled by the global NotificationBell via a small event bus).
//
// Kickoff items live in their own KickoffProgressCard above this widget;
// this card is exclusively for trainer/system notifications.

import React from 'react';
import { Bell } from 'lucide-react';
import { Card } from '../ui';
import useUserNotifications from '../../hooks/useUserNotifications';
import NotificationRow from '../notifications/NotificationRow';
import { openNotificationPanel } from '../notifications/notificationPanelBus';

const PREVIEW_LIMIT = 3;

const NotificationsWidget = () => {
  const { all, unread, unreadCount, loading } = useUserNotifications();

  // Preview prefers unread; if all caught up, show the most recent few so
  // the card still has signal (vs. going to a sad empty state immediately).
  const preview = (unread.length > 0 ? unread : all).slice(0, PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, all.length - preview.length);

  return (
    <Card className="shadow-pop bg-white dark:bg-slate-800 relative overflow-hidden p-4 sm:p-5">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-corporate-teal flex-shrink-0" aria-hidden="true" />
          <h2 className="text-base font-semibold text-corporate-navy dark:text-white">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-corporate-teal/15 text-corporate-teal-ink dark:text-corporate-teal">
              {unreadCount} new
            </span>
          )}
        </div>
        {all.length > 0 && (
          <button
            type="button"
            onClick={openNotificationPanel}
            className="text-xs font-medium text-corporate-teal-ink dark:text-corporate-teal hover:underline"
          >
            View all{hiddenCount > 0 ? ` (${all.length})` : ''}
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-pulse flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      ) : preview.length === 0 ? (
        <div className="flex items-center gap-2 px-1 py-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="text-corporate-teal">✓</span>
          You&apos;re all caught up.
        </div>
      ) : (
        <div className="space-y-1">
          {preview.map((n) => (
            <NotificationRow key={n.id} notif={n} compact autoReadOnView />
          ))}
        </div>
      )}
    </Card>
  );
};

export default React.memo(NotificationsWidget);
