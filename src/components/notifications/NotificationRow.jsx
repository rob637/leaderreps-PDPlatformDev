// src/components/notifications/NotificationRow.jsx
//
// Single-row presentation used by both the dashboard NotificationsWidget
// and the bell panel. All interactions (mark read, snooze, dismiss, deep
// link) live here so the two surfaces stay visually identical.

import React, { useRef, useState, useEffect } from 'react';
import { ExternalLink, ArrowRight, MoreHorizontal, Clock, CheckCheck, X } from 'lucide-react';
import { useSafeNavigation } from '../../providers/NavigationProvider';
import { useAppServices } from '../../services/useAppServices';
import { markRead, snoozeBy, dismiss } from '../../services/notificationActionsService';
import { getTier, formatRelative } from './notificationStyles';

const AUTOREAD_MS = 3000; // Read-on-view convention (Gmail/Linear style).

const NotificationRow = ({
  notif,
  compact = false,
  autoReadOnView = false,
}) => {
  const { db, user } = useAppServices();
  const nav = useSafeNavigation();
  const navigate = nav?.navigate;
  const rowRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const tier = getTier(notif);
  const { Icon } = tier;

  // Auto-mark-read after the row has been on screen for AUTOREAD_MS.
  useEffect(() => {
    if (!autoReadOnView || notif.read) return undefined;
    if (typeof IntersectionObserver === 'undefined' || !rowRef.current) return undefined;
    let timer = null;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !timer) {
        timer = setTimeout(() => {
          markRead(db, user?.uid, notif.id);
        }, AUTOREAD_MS);
      } else if (!entry.isIntersecting && timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { threshold: 0.6 });
    obs.observe(rowRef.current);
    return () => {
      if (timer) clearTimeout(timer);
      obs.disconnect();
    };
  }, [autoReadOnView, notif.id, notif.read, db, user?.uid]);

  // Close overflow menu on outside click.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => {
      if (!rowRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  // Resolve the primary link/action target.
  const link = notif.link;
  const linkTarget = notif.linkTarget;
  const legacyHref = typeof link === 'string' ? link.trim() : '';
  const kind = linkTarget?.kind || (legacyHref ? 'external' : null);
  const linkLabel = linkTarget?.label || (kind === 'external' ? 'Open' : 'View');

  const handlePrimary = () => {
    // Always mark read on explicit click.
    if (!notif.read) markRead(db, user?.uid, notif.id);
    if (!kind) return;
    if (kind === 'external') {
      const url = linkTarget?.url || legacyHref;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!navigate) return;
    if (kind === 'screen' && linkTarget?.screen) {
      const params = linkTarget?.targetId ? { targetId: linkTarget.targetId } : {};
      navigate(linkTarget.screen, params);
    } else if (kind === 'content' && linkTarget?.targetId) {
      navigate('library', { contentItemId: linkTarget.targetId });
    } else if (kind === 'event' && linkTarget?.targetId) {
      navigate('community-hub', { sessionId: linkTarget.targetId });
    }
  };

  return (
    <div
      ref={rowRef}
      className={`group relative flex gap-3 ${compact ? 'py-2.5 px-3' : 'py-3 px-3.5'} rounded-lg border transition-colors ${
        notif.read
          ? 'border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40'
          : 'border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60'
      }`}
    >
      {/* Tier rail */}
      <div className={`flex-shrink-0 w-0.5 rounded-full ${tier.rail}`} aria-hidden="true" />

      <div className="flex-shrink-0 pt-0.5">
        <Icon size={16} className={tier.iconText} aria-hidden="true" />
      </div>

      {/* Unread dot */}
      <div className="flex-shrink-0 pt-1.5">
        {!notif.read && (
          <span className="block w-1.5 h-1.5 rounded-full bg-corporate-teal" aria-label="Unread" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className={`text-sm truncate ${notif.read ? 'font-normal text-slate-700 dark:text-slate-300' : 'font-semibold text-corporate-navy dark:text-white'}`}>
            {notif.title || 'Notification'}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
            {formatRelative(notif.createdAt)}
          </span>
        </div>
        {notif.body && (
          <p className={`text-xs mt-0.5 ${compact ? 'line-clamp-1' : 'line-clamp-2'} text-slate-600 dark:text-slate-400`}>
            {notif.body}
          </p>
        )}
        {kind && (
          <button
            type="button"
            onClick={handlePrimary}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-corporate-teal-ink dark:text-corporate-teal hover:underline"
          >
            {linkLabel}
            {kind === 'external' ? <ExternalLink size={11} /> : <ArrowRight size={11} />}
          </button>
        )}
      </div>

      {/* Overflow menu */}
      <div className="flex-shrink-0 self-start">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label="Notification options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-2 top-9 z-10 w-44 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1"
          >
            {!notif.read && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { markRead(db, user?.uid, notif.id); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <CheckCheck size={12} /> Mark as read
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => { snoozeBy(db, user?.uid, notif.id, '1h'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Clock size={12} /> Snooze 1 hour
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => { snoozeBy(db, user?.uid, notif.id, 'tomorrow'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Clock size={12} /> Snooze until tomorrow
            </button>
            {notif.dismissible !== false && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { dismiss(db, user?.uid, notif.id); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400"
              >
                <X size={12} /> Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationRow;
