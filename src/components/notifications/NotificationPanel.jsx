// src/components/notifications/NotificationPanel.jsx
//
// Slide-over panel that lists all of the current user's notifications.
// Opened from the dashboard widget's "View all" link and from the global
// NotificationBell. Tabs: Unread / All / Snoozed. Items grouped by day.

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCheck, Inbox, Archive } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import useUserNotifications from '../../hooks/useUserNotifications';
import { markAllRead, dismissMany } from '../../services/notificationActionsService';
import NotificationRow from './NotificationRow';

const TABS = [
  { id: 'unread', label: 'Unread' },
  { id: 'all', label: 'All' },
  { id: 'snoozed', label: 'Snoozed' },
];

const Section = ({ title, items }) => {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-1 mb-1">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((n) => <NotificationRow key={n.id} notif={n} />)}
      </div>
    </div>
  );
};

const NotificationPanel = ({ open, onClose }) => {
  const { db, user } = useAppServices();
  const { all, unread, snoozed, groups, loading } = useUserNotifications();
  const [tab, setTab] = useState('unread');

  const items = useMemo(() => {
    if (tab === 'unread') return unread;
    if (tab === 'snoozed') return snoozed;
    return all;
  }, [tab, unread, snoozed, all]);

  const grouped = useMemo(() => {
    if (tab === 'all') return groups;
    // For Unread / Snoozed we still group by day for consistency.
    const todayStart = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const today = []; const yesterday = []; const earlier = [];
    items.forEach((n) => {
      const ms = n.createdAt?.toMillis?.() || (n.createdAt instanceof Date ? n.createdAt.getTime() : 0);
      if (ms >= todayStart) today.push(n);
      else if (ms >= yesterdayStart) yesterday.push(n);
      else earlier.push(n);
    });
    return { today, yesterday, earlier };
  }, [items, groups, tab]);

  // IDs of every already-read item currently in the panel. Computed before
  // any early return so the hook order stays stable between open/closed
  // renders (React error #310 otherwise).
  const readIds = useMemo(() => all.filter((n) => n.read).map((n) => n.id), [all]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const handleMarkAllRead = () => {
    markAllRead(db, user?.uid, unread.map((n) => n.id));
  };

  // Bulk-dismiss every already-read item currently in the panel. Keeps
  // unread + snoozed visible. Confirms first because it's destructive (the
  // user can still recover via undismiss, but the inbox view will hide
  // them).
  const handleArchiveRead = () => {
    if (readIds.length === 0) return;
    const ok = window.confirm(
      `Archive ${readIds.length} read notification${readIds.length === 1 ? '' : 's'}? They'll be removed from your inbox.`
    );
    if (!ok) return;
    dismissMany(db, user?.uid, readIds);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Notifications"
        className="ml-auto relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-slide-in-right"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-corporate-navy dark:text-white">Notifications</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unread.length === 0}
              className="text-xs font-medium px-2 py-1 rounded text-corporate-teal-ink dark:text-corporate-teal hover:bg-corporate-teal/10 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
            <button
              type="button"
              onClick={handleArchiveRead}
              disabled={readIds.length === 0}
              className="text-xs font-medium px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed inline-flex items-center gap-1"
              title="Remove all already-read notifications from your inbox"
            >
              <Archive size={13} /> Archive read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-2" role="tablist">
          {TABS.map((t) => {
            const active = t.id === tab;
            const count = t.id === 'unread' ? unread.length : t.id === 'snoozed' ? snoozed.length : all.length;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`relative px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'text-corporate-navy dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-corporate-teal/15 text-corporate-teal-ink dark:text-corporate-teal' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-corporate-teal rounded-t" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {loading ? (
            <div className="text-xs text-slate-400 px-2 py-6 text-center">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-slate-500 dark:text-slate-400">
              <div className="w-10 h-10 rounded-full bg-corporate-teal/10 flex items-center justify-center mb-3">
                <Inbox size={18} className="text-corporate-teal" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {tab === 'unread' ? "You're all caught up." : tab === 'snoozed' ? 'Nothing snoozed.' : 'No notifications yet.'}
              </p>
              <p className="text-xs mt-1">
                {tab === 'unread' ? 'Updates from your trainer and cohort will appear here.' : ''}
              </p>
            </div>
          ) : (
            <>
              <Section title="Today" items={grouped.today} />
              <Section title="Yesterday" items={grouped.yesterday} />
              <Section title="Earlier" items={grouped.earlier} />
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
};

export default NotificationPanel;
