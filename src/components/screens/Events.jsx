// src/components/screens/Events.jsx
//
// Ascent Revamp WS-2 — Unified Events screen.
// Replaces the legacy split between Coaching Hub + Community Hub.
//
// MVP scope (v1):
//   - List view only (no calendar). Group by day.
//   - Toggle: All / Registered / Past.
//   - Register / Cancel buttons (writes route through eventsService).
//   - Show source badge (Coaching | Community) so users can tell origin.
//   - "Join" link button when within 15min of start (or session is live).

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Clock, ExternalLink, Loader2, Users, Video,
  CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  X,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { PageLayout } from '../ui/PageLayout';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';
import {
  subscribeUpcomingEvents,
  registerForEvent,
  cancelRegistrationForEvent,
} from '../../services/eventsService';

const VIEW_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'my-events', label: 'My Events' },
  { key: 'calendar', label: 'Calendar' },
];

const UPCOMING_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'clinic', label: 'Clinic' },
  { key: 'open_gym', label: 'Open Gym' },
  { key: 'leader_circle', label: 'Leaders Circle' },
  { key: 'one_on_one', label: '1:1' },
  { key: 'this-week', label: 'This Week' },
];

const MY_EVENT_RANGES = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Map sessionType (from coaching_sessions / community_sessions) to a display
// label + Tailwind classes for the per-card badge. Falls back to a generic
// "Event" badge so unknown types still render something readable.
const SESSION_TYPE_BADGES = {
  clinic:             { label: 'Clinic',         cls: 'bg-corporate-orange/10 text-corporate-orange border-corporate-orange/30' },
  workshop:           { label: 'Clinic',         cls: 'bg-corporate-orange/10 text-corporate-orange border-corporate-orange/30' },
  open_gym:           { label: 'Open Gym',       cls: 'bg-corporate-teal/10 text-corporate-teal border-corporate-teal/30' },
  leader_circle:      { label: 'Leaders Circle', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
  one_on_one:         { label: '1:1',            cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  live_workout:       { label: 'Live Workout',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  community_event:    { label: 'Community',      cls: 'bg-corporate-orange/10 text-corporate-orange border-corporate-orange/30' },
  accountability_pod: { label: 'Pod',            cls: 'bg-teal-100 text-teal-800 border-teal-300' },
  mastermind:         { label: 'Mastermind',     cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  networking:         { label: 'Networking',     cls: 'bg-green-100 text-green-800 border-green-300' },
};

const sessionTypeBadge = (sessionType) =>
  SESSION_TYPE_BADGES[sessionType] || {
    label: 'Event',
    cls: 'bg-slate-100 text-slate-700 border-slate-200',
  };

// Maps a filter chip key to the underlying sessionType values it should match.
// Workshop is treated as a Clinic for filter purposes (legacy data).
const FILTER_TO_SESSION_TYPES = {
  clinic:        ['clinic', 'workshop'],
  open_gym:      ['open_gym'],
  leader_circle: ['leader_circle'],
  one_on_one:    ['one_on_one'],
};

const formatDayHeader = (date) => {
  if (!date) return 'TBD';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  const opts = { weekday: 'long', month: 'long', day: 'numeric' };
  if (diff === 0) return `Today · ${date.toLocaleDateString(undefined, opts)}`;
  if (diff === 1) return `Tomorrow · ${date.toLocaleDateString(undefined, opts)}`;
  return date.toLocaleDateString(undefined, opts);
};

const isJoinable = (event) => {
  if (event.status === 'live') return true;
  if (!event.startsAt) return false;
  const now = Date.now();
  const start = event.startsAt.getTime();
  const end = start + (event.durationMinutes || 60) * 60 * 1000;
  return now >= start - 15 * 60 * 1000 && now <= end;
};

const groupByDay = (events) => {
  const groups = new Map();
  events.forEach((e) => {
    const key = e.startsAt
      ? new Date(e.startsAt.getFullYear(), e.startsAt.getMonth(), e.startsAt.getDate()).toISOString()
      : 'tbd';
    if (!groups.has(key)) groups.set(key, { date: e.startsAt || null, events: [] });
    groups.get(key).events.push(e);
  });
  return Array.from(groups.values());
};

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isPastEvent = (event) => {
  const end = event.startsAt
    ? event.startsAt.getTime() + (event.durationMinutes || 60) * 60 * 1000
    : null;
  return end !== null && end < Date.now();
};

const buildCalendarCells = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = 0; i < startDay; i += 1) {
    const dayNum = daysInPrevMonth - startDay + i + 1;
    cells.push({
      date: new Date(year, month - 1, dayNum),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      inMonth: true,
    });
  }

  const tailCount = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= tailCount; day += 1) {
    cells.push({
      date: new Date(year, month + 1, day),
      inMonth: false,
    });
  }

  return cells;
};

const EventCard = ({ event, onRegister, onCancel, onOpenDetails, busy }) => {
  const badge = sessionTypeBadge(event.sessionType);
  const joinable = isJoinable(event);
  const past = event.startsAt && event.startsAt.getTime() + (event.durationMinutes || 60) * 60 * 1000 < Date.now();
  const cancelled = event.status === 'cancelled';

  const handleCardClick = (e) => {
    // Don't fire if the click came from a button or anchor inside the card.
    if (e.target.closest('button, a')) return;
    onOpenDetails?.(event);
  };

  const handleCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetails?.(event);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKey}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-card cursor-pointer hover:shadow-card-hover hover:border-corporate-teal/40 focus:outline-none focus:ring-2 focus:ring-corporate-teal/40 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.cls}`}>
            {badge.label}
          </span>
          {cancelled && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
              Cancelled
            </span>
          )}
          {event.isRegistered && !cancelled && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Registered
            </span>
          )}
        </div>
        {event.time && (
          <div className="text-sm text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {event.time}
          </div>
        )}
      </div>

      <h3 className="text-base font-semibold text-corporate-navy dark:text-white mb-1">
        {event.title}
      </h3>
      {event.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-3">
          {event.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
        {event.hostName && (
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {event.hostName}
          </span>
        )}
        {event.durationMinutes && (
          <span>{event.durationMinutes} min</span>
        )}
        {typeof event.spotsLeft === 'number' && !event.isRegistered && !past && (
          <span>
            {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : 'Full'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {past && event.replayUrl && (
          <a
            href={event.replayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-corporate-teal hover:underline"
          >
            <Video className="w-4 h-4" /> Watch Replay
          </a>
        )}

        {!past && !cancelled && joinable && event.link && (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-corporate-orange text-white hover:bg-corporate-orange/90"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Join Now
          </a>
        )}

        {!past && !cancelled && !event.isRegistered && (
          <button
            type="button"
            onClick={() => onRegister(event)}
            disabled={busy || (event.spotsLeft === 0)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Register
          </button>
        )}

        {!past && !cancelled && event.isRegistered && (
          <button
            type="button"
            onClick={() => onCancel(event)}
            disabled={busy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

// ---------- Event detail modal ----------
// Lightweight read-only-ish detail view. Register/Cancel/Join still routed
// through the parent's handlers so the underlying state stays in one place.
const EventDetailModal = ({ event, onClose, onRegister, onCancel, busy }) => {
  if (!event) return null;
  const badge = sessionTypeBadge(event.sessionType);
  const past = event.startsAt && event.startsAt.getTime() + (event.durationMinutes || 60) * 60 * 1000 < Date.now();
  const cancelled = event.status === 'cancelled';
  const joinable = isJoinable(event);
  const dateLabel = event.startsAt
    ? event.startsAt.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : event.date || 'TBD';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-elevated max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.cls}`}>
                {badge.label}
              </span>
              {cancelled && (
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                  Cancelled
                </span>
              )}
              {event.isRegistered && !cancelled && (
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Registered
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-corporate-navy dark:text-white">
              {event.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</dt>
              <dd className="text-slate-900 dark:text-white">{dateLabel}</dd>
            </div>
            {event.time && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time</dt>
                <dd className="text-slate-900 dark:text-white inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {event.time}
                  {event.timezone ? ` (${event.timezone})` : ''}
                </dd>
              </div>
            )}
            {event.durationMinutes && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Duration</dt>
                <dd className="text-slate-900 dark:text-white">{event.durationMinutes} min</dd>
              </div>
            )}
            {event.hostName && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Host</dt>
                <dd className="text-slate-900 dark:text-white inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {event.hostName}
                </dd>
              </div>
            )}
            {typeof event.spotsLeft === 'number' && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Capacity</dt>
                <dd className="text-slate-900 dark:text-white">
                  {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : 'Full'}
                </dd>
              </div>
            )}
          </dl>

          {event.description && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Overview</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {event.link && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Meeting link</h3>
              {!past && !cancelled && (event.isRegistered || joinable) ? (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-corporate-teal hover:underline break-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  {event.link}
                </a>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  {past ? 'Meeting link is no longer active.' : 'Register to receive the meeting link.'}
                </p>
              )}
            </div>
          )}

          {past && event.replayUrl && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Replay</h3>
              <a
                href={event.replayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-corporate-teal hover:underline"
              >
                <Video className="w-4 h-4" /> Watch replay
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Close
          </button>
          {!past && !cancelled && joinable && event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-corporate-orange text-white hover:bg-corporate-orange/90"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Join Now
            </a>
          )}
          {!past && !cancelled && !event.isRegistered && (
            <button
              type="button"
              onClick={() => onRegister(event)}
              disabled={busy || (event.spotsLeft === 0)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Register
            </button>
          )}
          {!past && !cancelled && event.isRegistered && (
            <button
              type="button"
              onClick={() => onCancel(event)}
              disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Cancel registration
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Events = () => {
  const { db, user, navigate } = useAppServices();
  const userId = user?.uid;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming');
  const [upcomingFilter, setUpcomingFilter] = useState('all');
  const [myRange, setMyRange] = useState('upcoming');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [detailEvent, setDetailEvent] = useState(null);

  useEffect(() => {
    if (!db || !userId) return undefined;
    setLoading(true);
    const unsub = subscribeUpcomingEvents(db, userId, (list) => {
      setEvents(list);
      setLoading(false);
    });
    return unsub;
  }, [db, userId]);

  const now = useMemo(() => Date.now(), [events]);
  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [events]);
  const endOfWeekWindow = useMemo(() => startOfToday + (7 * 24 * 60 * 60 * 1000), [startOfToday]);

  const upcomingBase = useMemo(
    () => events
      .filter((e) => !isPastEvent(e) && e.status !== 'cancelled')
      .sort((a, b) => (a.startsAt?.getTime?.() || 0) - (b.startsAt?.getTime?.() || 0)),
    [events]
  );

  const filteredUpcoming = useMemo(() => {
    return upcomingBase.filter((e) => {
      if (upcomingFilter === 'this-week') {
        const ts = e.startsAt?.getTime?.() || 0;
        return ts >= startOfToday && ts < endOfWeekWindow;
      }
      const allowedTypes = FILTER_TO_SESSION_TYPES[upcomingFilter];
      if (allowedTypes) return allowedTypes.includes(e.sessionType);
      return true;
    });
  }, [upcomingBase, upcomingFilter, startOfToday, endOfWeekWindow]);

  const upcomingRegistered = useMemo(
    () => filteredUpcoming.filter((e) => e.isRegistered),
    [filteredUpcoming]
  );

  const upcomingAvailable = useMemo(
    () => filteredUpcoming.filter((e) => !e.isRegistered),
    [filteredUpcoming]
  );

  const myEvents = useMemo(() => {
    return events
      .filter((e) => e.isRegistered)
      .filter((e) => {
        const isPast = isPastEvent(e);
        return myRange === 'past' ? isPast : !isPast;
      })
      .sort((a, b) => {
        const aTs = a.startsAt?.getTime?.() || 0;
        const bTs = b.startsAt?.getTime?.() || 0;
        return myRange === 'past' ? bTs - aTs : aTs - bTs;
      });
  }, [events, myRange]);

  const myGroups = useMemo(() => groupByDay(myEvents), [myEvents]);
  const upcomingRegisteredGroups = useMemo(() => groupByDay(upcomingRegistered), [upcomingRegistered]);
  const upcomingAvailableGroups = useMemo(() => groupByDay(upcomingAvailable), [upcomingAvailable]);

  const summaryCounts = useMemo(() => {
    return {
      registered: upcomingBase.filter((e) => e.isRegistered).length,
      available: upcomingBase.filter((e) => !e.isRegistered).length,
    };
  }, [upcomingBase]);

  const calendarCells = useMemo(() => buildCalendarCells(monthCursor), [monthCursor]);

  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);

  const eventCountByDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      if (!event.startsAt) return;
      const key = formatDateKey(event.startsAt);
      const current = map.get(key) || { total: 0, upcoming: 0 };
      current.total += 1;
      if (!isPastEvent(event)) current.upcoming += 1;
      map.set(key, current);
    });
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    const items = events
      .filter((event) => event.startsAt && formatDateKey(event.startsAt) === selectedDateKey)
      .sort((a, b) => (a.startsAt?.getTime?.() || 0) - (b.startsAt?.getTime?.() || 0));
    return items;
  }, [events, selectedDateKey]);

  const handleRegister = async (event) => {
    setBusyId(event.id);
    setError(null);
    try {
      await registerForEvent(db, userId, event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('register failed', err);
      const code = err?.message || '';
      if (code === 'SESSION_FULL') {
        setError('This session is now full. Please pick another time.');
      } else if (code === 'SESSION_NOT_FOUND') {
        setError('This session is no longer available.');
      } else {
        setError(err?.message || 'Could not register. Try again.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (event) => {
    setBusyId(event.id);
    setError(null);
    try {
      await cancelRegistrationForEvent(db, userId, event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('cancel failed', err);
      setError(err?.message || 'Could not cancel. Try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageLayout
      title="Events"
      icon={Calendar}
      subtitle="Live coaching, leader circles, and community sessions — all in one place."
      navigate={navigate}
      breadcrumbs={getBreadcrumbs('events')}
      maxWidth="max-w-[1080px]"
    >

      <div className="flex items-center gap-2 mb-5 border-b border-slate-200 dark:border-slate-700">
        {VIEW_TABS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setView(f.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              view === f.key
                ? 'border-corporate-teal text-corporate-teal'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!loading && view === 'upcoming' && (
        <section className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {UPCOMING_FILTERS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setUpcomingFilter(chip.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  upcomingFilter === chip.key
                    ? 'bg-corporate-teal/10 text-corporate-teal border-corporate-teal/30'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            {summaryCounts.registered} registered, {summaryCounts.available} available to join
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Your Registered Events
            </h2>
            {upcomingRegisteredGroups.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                No registered upcoming events in this view.
              </div>
            ) : (
              upcomingRegisteredGroups.map((g, i) => (
                <section key={`reg-${i}`} className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    {formatDayHeader(g.date)}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {g.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onRegister={handleRegister}
                        onCancel={handleCancel}
                        onOpenDetails={setDetailEvent}
                        busy={busyId === event.id}
                        />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Available to Join
            </h2>
            {upcomingAvailableGroups.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                No available upcoming events in this view.
              </div>
            ) : (
              upcomingAvailableGroups.map((g, i) => (
                <section key={`avail-${i}`} className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    {formatDayHeader(g.date)}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {g.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onRegister={handleRegister}
                        onCancel={handleCancel}
                        onOpenDetails={setDetailEvent}
                        busy={busyId === event.id}
                        />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </section>
      )}

      {!loading && view === 'my-events' && (
        <section className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
            {MY_EVENT_RANGES.map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() => setMyRange(range.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                  myRange === range.key
                    ? 'border-corporate-teal text-corporate-teal'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {myGroups.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {myRange === 'past'
                ? "You don't have any past registered events yet."
                : "You haven't registered for any upcoming events yet."}
            </div>
          ) : (
            myGroups.map((g, i) => (
              <section key={`my-${i}`} className="mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  {formatDayHeader(g.date)}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRegister={handleRegister}
                      onCancel={handleCancel}
                      onOpenDetails={setDetailEvent}
                      busy={busyId === event.id}
                      />
                  ))}
                </div>
              </section>
            ))
          )}
        </section>
      )}

      {!loading && view === 'calendar' && (
        <section className="space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-base sm:text-lg font-semibold text-corporate-navy dark:text-white">
                {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </div>

              <button
                type="button"
                onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center py-1"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map(({ date, inMonth }) => {
                const dateKey = formatDateKey(date);
                const counts = eventCountByDate.get(dateKey);
                const isSelected = dateKey === selectedDateKey;
                const isToday = dateKey === formatDateKey(new Date());
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`h-14 sm:h-16 rounded-lg border p-1.5 text-left transition ${
                      isSelected
                        ? 'border-corporate-teal bg-corporate-teal/10'
                        : inMonth
                          ? 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                          : 'border-transparent text-slate-400 hover:bg-slate-50/40'
                    }`}
                  >
                    <div className={`text-xs font-semibold ${isToday ? 'text-corporate-orange' : ''}`}>
                      {date.getDate()}
                    </div>
                    {counts?.total > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-corporate-teal" />
                        <span className="text-[10px] text-slate-500">
                          {counts.total}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              {formatDayHeader(selectedDate)}
            </h2>

            {selectedDateEvents.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                No events on this day.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedDateEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRegister={handleRegister}
                    onCancel={handleCancel}
                    onOpenDetails={setDetailEvent}
                    busy={busyId === event.id}
                    />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sync detailEvent with the latest event data so register/cancel
          updates from inside the modal reflect immediately. */}
      <EventDetailModal
        event={detailEvent ? events.find((e) => e.id === detailEvent.id) || detailEvent : null}
        onClose={() => setDetailEvent(null)}
        onRegister={handleRegister}
        onCancel={handleCancel}
        busy={detailEvent && busyId === detailEvent.id}
      />
    </PageLayout>
  );
};

export default Events;
