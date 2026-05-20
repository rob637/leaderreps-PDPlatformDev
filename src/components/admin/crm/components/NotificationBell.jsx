// src/components/admin/crm/components/NotificationBell.jsx

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useAuthStore } from '../stores/authStore';
import { useCRMNavigation } from '../CRMApp';

export default function NotificationBell() {
  const { user } = useAuthStore();
  const { navigate } = useCRMNavigation();
  const {
    notifications,
    subscribeToNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user?.email) return undefined;
    return subscribeToNotifications(user.email);
  }, [user?.email, subscribeToNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id);
    if (n.link?.tab) navigate(`/${n.link.tab}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[480px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${
                    !n.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex-shrink-0">
                          {n.createdAt
                            ? formatDistanceToNow(new Date(n.createdAt), {
                                addSuffix: true,
                              })
                            : ''}
                        </span>
                      </div>
                      {n.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                    </div>
                    {n.read && (
                      <Check className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
