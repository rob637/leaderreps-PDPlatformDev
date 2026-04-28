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
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import {
  subscribeUpcomingEvents,
  registerForEvent,
  cancelRegistrationForEvent,
} from '../../services/eventsService';

const FILTERS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'registered', label: 'My Events' },
  { key: 'past', label: 'Past' },
];

const sourceBadge = (sourceType) =>
  sourceType === 'coaching'
    ? { label: 'Coaching', cls: 'bg-corporate-teal/10 text-corporate-teal border-corporate-teal/30' }
    : { label: 'Community', cls: 'bg-corporate-orange/10 text-corporate-orange border-corporate-orange/30' };

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

const EventCard = ({ event, onRegister, onCancel, busy }) => {
  const badge = sourceBadge(event.sourceType);
  const joinable = isJoinable(event);
  const past = event.startsAt && event.startsAt.getTime() + (event.durationMinutes || 60) * 60 * 1000 < Date.now();
  const cancelled = event.status === 'cancelled';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-card">
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

const Events = () => {
  const { db, user } = useAppServices();
  const userId = user?.uid;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !userId) return undefined;
    setLoading(true);
    const unsub = subscribeUpcomingEvents(db, userId, (list) => {
      setEvents(list);
      setLoading(false);
    });
    return unsub;
  }, [db, userId]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      const end = e.startsAt
        ? e.startsAt.getTime() + (e.durationMinutes || 60) * 60 * 1000
        : null;
      const isPast = end !== null && end < now;
      if (filter === 'past') return isPast;
      if (filter === 'registered') return e.isRegistered && !isPast;
      // upcoming
      return !isPast;
    });
  }, [events, filter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const handleRegister = async (event) => {
    setBusyId(event.id);
    setError(null);
    try {
      await registerForEvent(db, userId, event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('register failed', err);
      setError(err?.message || 'Could not register. Try again.');
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
    <div className="max-w-[1080px] mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-7 h-7 text-corporate-teal" />
          <h1
            className="text-3xl font-bold text-corporate-navy dark:text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Events
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Live coaching, leader circles, and community sessions — all in one place.
        </p>
      </header>

      <div className="flex items-center gap-2 mb-5 border-b border-slate-200 dark:border-slate-700">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              filter === f.key
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

      {!loading && groups.length === 0 && (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          {filter === 'registered'
            ? "You haven't registered for any upcoming events yet."
            : filter === 'past'
              ? 'No past events to show.'
              : 'No upcoming events scheduled.'}
        </div>
      )}

      {!loading && groups.map((g, i) => (
        <section key={i} className="mb-8">
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
                busy={busyId === event.id}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Events;
