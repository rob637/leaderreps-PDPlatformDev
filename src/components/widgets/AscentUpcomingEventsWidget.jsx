// src/components/widgets/AscentUpcomingEventsWidget.jsx
//
// Ryan's revamped Dashboard — "Upcoming Events" section.
// Shows AVAILABLE (not yet registered) events the user can register for, with
// a one-tap Register CTA. Tap-through opens the full Events screen.

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices.jsx';
import {
  subscribeUpcomingEvents,
  registerForEvent,
} from '../../services/eventsService';

const formatWhen = (event) => {
  if (!event.startsAt) return event.date || 'TBD';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(event.startsAt);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  const dateLabel =
    diff === 0
      ? 'Today'
      : diff === 1
        ? 'Tomorrow'
        : event.startsAt.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
  const timeLabel = event.time ? ` · ${event.time}` : '';
  const dur = event.durationMinutes ? ` · ${event.durationMinutes}m` : '';
  return `${dateLabel}${timeLabel}${dur}`;
};

const AscentUpcomingEventsWidget = () => {
  const { db, user, navigate } = useAppServices();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !user?.uid) return undefined;
    setLoading(true);
    const unsub = subscribeUpcomingEvents(db, user.uid, (items) => {
      setEvents(items || []);
      setLoading(false);
    });
    return unsub;
  }, [db, user?.uid]);

  const available = useMemo(() => {
    const now = Date.now();
    return (events || [])
      .filter((e) => !e.isRegistered)
      .filter((e) => e.status !== 'cancelled')
      .filter((e) => e.spotsLeft !== 0)
      .filter((e) => {
        if (!e.startsAt) return true;
        return e.startsAt.getTime() >= now;
      })
      .sort(
        (a, b) =>
          (a.startsAt?.getTime?.() || 0) - (b.startsAt?.getTime?.() || 0),
      )
      .slice(0, 5);
  }, [events]);

  const handleRegister = async (event) => {
    setBusyId(event.id);
    setError(null);
    try {
      await registerForEvent(db, user.uid, event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AscentUpcomingEvents] register failed', {
        code: err?.code,
        message: err?.message,
        event,
        err,
      });
      const code = err?.message || '';
      if (code === 'SESSION_FULL') {
        setError(`"${event.title}" is now full.`);
      } else if (err?.code === 'permission-denied') {
        setError('Registration was blocked by a permissions check.');
      } else {
        setError(err?.message || 'Could not register. Try again.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const goToEvents = () =>
    navigate?.('events') || navigate?.('community-hub');

  return (
    <Card
      className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-orange relative overflow-hidden p-4 sm:p-5"
      aria-labelledby="ascent-upcoming-events-heading"
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-corporate-orange" aria-hidden="true" />
          <h2
            id="ascent-upcoming-events-heading"
            className="text-base font-semibold text-corporate-navy dark:text-white"
          >
            Upcoming Events
          </h2>
        </div>
        <button
          type="button"
          onClick={goToEvents}
          className="text-xs font-semibold text-corporate-teal-ink hover:underline inline-flex items-center gap-1"
        >
          View all <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </header>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" />
        </div>
      ) : available.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 py-3">
          No upcoming events available right now.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {available.map((event) => (
            <li
              key={event.id}
              className="py-2.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-corporate-navy dark:text-white truncate">
                  {event.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {formatWhen(event)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRegister(event)}
                disabled={busyId === event.id}
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busyId === event.id && (
                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                )}
                Register
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default AscentUpcomingEventsWidget;
