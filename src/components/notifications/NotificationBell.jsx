// src/components/notifications/NotificationBell.jsx
//
// Floating bell that surfaces unread count and opens the NotificationPanel.
// Renders fixed in the top-right of the viewport (above the main content
// area). Self-hosts the panel so consumers only need to mount this once.

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import useUserNotifications from '../../hooks/useUserNotifications';
import NotificationPanel from './NotificationPanel';
import { subscribeToOpenRequests } from './notificationPanelBus';

const NotificationBell = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const { unreadCount, critical } = useUserNotifications();

  // Allow other components (dashboard "View all", deep links, etc.) to
  // open the panel via a window event — keeps surfaces decoupled.
  useEffect(() => subscribeToOpenRequests(() => setOpen(true)), []);
  const hasUnread = unreadCount > 0;
  const hasCritical = critical.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/95 dark:bg-slate-800/95 shadow-card hover:shadow-card-hover border border-slate-200 dark:border-slate-700 text-corporate-navy dark:text-slate-200 hover:text-corporate-teal-ink dark:hover:text-corporate-teal transition-colors ${className}`}
        aria-label={hasUnread ? `Notifications (${unreadCount} unread)` : 'Notifications'}
      >
        <Bell size={18} />
        {hasUnread && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 ${
              hasCritical ? 'bg-corporate-orange' : 'bg-corporate-teal'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default NotificationBell;
